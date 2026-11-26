/* Parametric shape controls. Only the theme preference is persisted; shape
   presets and Shaper switches belong to the current project session. */
const SHAPER={enabled:{rect:false,ellipse:false,star:true},star:null,rect:null,creating:null,hover:null};
function shapeGeometry(contours){return JSON.stringify(contours.map(c=>[!!c.closed,c.nodes.map(n=>['x','y','ix','iy','ox','oy'].map(k=>Math.round((n[k]||0)*1e7)/1e7))]));}
function shapeRectContour(shape){
  const {w,h}=shape,x=w/2,y=h/2,r=shape.r.map(v=>clamp(v,0,1)*Math.min(w,h)/2),k=.5522847498307936;
  // Two endpoints per quarter-circle, including zero-radius corners: stable topology.
  const points=[[-x+r[0],-y],[x-r[1],-y],[x,-y+r[1]],[x,y-r[2]],[x-r[2],y],[-x+r[3],y],[-x,y-r[3]],[-x,-y+r[0]]];
  const nodes=points.map(p=>C.node(...p));
  for(const [a,b,dx,dy,corner] of [[1,2,1,1,1],[3,4,-1,1,2],[5,6,-1,-1,3],[7,0,1,-1,0]]){
    const v=r[corner]*k;
    if(a===1||a===5){nodes[a].ox=dx*v;nodes[b].iy=-dy*v;}
    else {nodes[a].oy=dy*v;nodes[b].ix=-dx*v;}
  }
  return {closed:true,nodes};
}
function shapeRectData(o){
  if(o.shapeRect)return o.shapeRect;
  if(o.shapeFree||o.kind!=='path'||o.contours?.length!==1)return null;
  const nodes=o.contours[0].nodes;if(![4,8].includes(nodes.length))return null;
  const b=C.contoursBounds(o.contours),w=b.x1-b.x0,h=b.y1-b.y0;
  if(w<=0||h<=0||Math.abs(b.x0+b.x1)>1e-7||Math.abs(b.y0+b.y1)>1e-7)return null;
  const radius=nodes.length===8?nodes[0].x+w/2:0;
  if(radius<0||radius>Math.min(w,h)/2)return null;
  return shapeGeometry(o.contours)===shapeGeometry([C.rectContour(w,h,radius)])?{w,h,r:Array(4).fill(radius/(Math.min(w,h)/2))}:null;
}
function shapeExpected(o){if(o.star)return [C.starContour(o.star)];if(o.arc)return [C.mouthContour(o.arc)];if(o.shapeRect)return [shapeRectContour(o.shapeRect)];return null;}
function shapeKind(o){
  if(!o||o.kind!=='path'||o.skin||o.skel||o.deformFrame||o.mirror)return null;
  const kind=o.star?'star':o.arc?'ellipse':o.shapeRect?'rect':null;if(!kind)return shapeRectData(o)?'rect':null;
  try{return shapeGeometry(o.contours)===shapeGeometry(shapeExpected(o))?kind:null;}catch(_){return null;}
}
function shapePut(o,contour){
  const old=o.contours?.[0];if(old?.nodes.length===contour.nodes.length)contour.nodes.forEach((n,i)=>{if(old.nodes[i].mid)n.mid=old.nodes[i].mid;});
  o.contours=[contour];
}
function shapeChosen(){const one=singleSel();return one&&getLayer(one.lid)?.visible&&!getLayer(one.lid).locked&&shapeKind(one.o)?one:null;}
function shapeActiveKind(){return shapeKind(singleSel()?.o)||(['star','rect','ellipse'].includes(S.tool)?S.tool:null);}
function shapeRemember(o){const kind=shapeKind(o);if(kind==='star'){
  const star=clone(o.star),radius=star.outer;for(const k of ['outer','inner','clip'])star[k]/=radius;SHAPER.star=star;
}else if(kind==='rect')SHAPER.rect=shapeRectData(o).r.slice();}
function shapeResetSession(){SHAPER.enabled={rect:false,ellipse:false,star:true};SHAPER.star=null;SHAPER.rect=null;SHAPER.hover=null;}
function shapeToggle(){
  if(S.drag||S.draw||REC.armed){protest('Shaper: finish the current gesture and leave Record mode first.');return;}
  const one=shapeChosen(),kind=shapeActiveKind();if(!kind)return;
  if(singleSel()&&!one)return;
  const enabled=!SHAPER.enabled[kind];if(!enabled&&one)shapeRemember(one.o);SHAPER.enabled[kind]=enabled;
  if(enabled&&one)setTool(kind);shapeSync();invalidate();
}
function shapeReset(){
  if(S.drag||S.draw||REC.armed){protest('Reset shape: finish the current gesture and leave Record mode first.');return;}
  const one=shapeChosen(),kind=shapeActiveKind();if(!kind||singleSel()&&!one)return;
  if(kind==='star')SHAPER.star=null;if(kind==='rect')SHAPER.rect=null;
  if(one){pushUndo();C.ensureEditable(getLayer(one.lid),S.frame);const o=findEditable(one.lid,one.id);
    if(kind==='star'){o.star=C.starDefaults(o.star.outer);shapePut(o,C.starContour(o.star));}
    if(kind==='rect'){o.shapeRect=clone(shapeRectData(o));o.shapeRect.r=[0,0,0,0];shapePut(o,shapeRectContour(o.shapeRect));}
    if(kind==='ellipse'){o.arc.start=0;o.arc.mouth=0;shapePut(o,C.mouthContour(o.arc));}
    commit();
  }
  SHAPER.enabled[kind]=true;if(one)setTool(kind);shapeSync();invalidate();
}
function shapeSync(){
  const kind=shapeActiveKind(),one=singleSel(),eligible=!one||!!shapeChosen(),enabled=!!kind&&SHAPER.enabled[kind];
  for(const id of ['shapeToolbar','shapeEdit']){const b=document.getElementById(id);if(b){b.disabled=!kind||!eligible||REC.armed;b.setAttribute('aria-pressed',String(enabled&&eligible));}}
  const reset=document.getElementById('shapeReset');if(reset)reset.disabled=!kind||!eligible||REC.armed;
}
function shapeButtons(){
  const b=document.createElement('button');b.type='button';b.id='shapeToolbar';b.className='tool';b.title='Shaper / Edit shape · double-click to reset selected shape or drawing preset';b.setAttribute('aria-label','Shaper');b.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 2a6 6 0 1 0 5 8H7z"/><path d="M12 17v-3q0-3 3-3h3v6zM15 1l1 2 2 .3-1.5 1.5.4 2.2-1.9-1-1.9 1 .4-2.2L12 3.3l2-.3z"/></svg>';
  b.addEventListener('click',e=>{if(e.detail<2)shapeToggle();});b.addEventListener('dblclick',e=>{e.preventDefault();shapeReset();});$('#kToolLayout').before(b);
  const row=document.createElement('div');row.className='mini';row.style.marginBottom='8px';
  for(const [id,label,fn] of [['shapeEdit','Edit shape',shapeToggle],['shapeReset','Reset shape',shapeReset]]){const button=document.createElement('button');button.type='button';button.id=id;button.textContent=label;button.addEventListener('click',fn);row.appendChild(button);}
  $('#objConvert').parentElement.after(row);shapeSync();
}
const shapeBuildTools=buildTools;buildTools=function(){shapeBuildTools();shapeButtons();};
const shapeSetTool=setTool;setTool=function(id){
  if(['rect','ellipse','star'].includes(id)&&singleSel()&&shapeKind(singleSel().o)!==id){S.sel=[];S.nodeSel=null;S.kNodeSelection=[];}
  shapeSetTool(id);shapeSync();
};
const shapeRefreshProps=refreshProps;refreshProps=function(){shapeRefreshProps();shapeSync();};
const shapeSessions=new Map();
function shapeSaveSession(){const key=projectSession().active;if(key)shapeSessions.set(key,clone({enabled:SHAPER.enabled,star:SHAPER.star,rect:SHAPER.rect}));}
const shapeSwitchProject=switchProject;switchProject=function(id){shapeSaveSession();const result=shapeSwitchProject(id);shapeResetSession();const saved=shapeSessions.get(projectSession().active);if(saved)Object.assign(SHAPER,clone(saved));shapeSync();invalidate();return result;};
const shapeOpenProject=openProjectDoc;openProjectDoc=function(...args){shapeSaveSession();shapeResetSession();return shapeOpenProject(...args);};
const shapeNewDoc=newDoc;newDoc=function(){shapeResetSession();return shapeNewDoc();};
const shapeFinishShape=finishShape;finishShape=function(d){SHAPER.creating=d.type;try{return shapeFinishShape(d);}finally{SHAPER.creating=null;}};
const shapeAddObject=addObject;addObject=function(o){
  if(SHAPER.creating==='rect'){
    const b=C.localBounds(o);o.shapeRect={w:b.x1-b.x0,h:b.y1-b.y0,r:SHAPER.rect?.slice()||Array(4).fill(clamp(S.style.radius/(Math.min(b.x1-b.x0,b.y1-b.y0)/2||1),0,1))};shapePut(o,shapeRectContour(o.shapeRect));o.contours[0].nodes.forEach(n=>n.mid ||= uid());
  }else if(SHAPER.creating==='star'&&!SHAPER.enabled.star&&SHAPER.star){
    const radius=o.star.outer;o.star=clone(SHAPER.star);for(const k of ['outer','inner','clip'])o.star[k]*=radius;shapePut(o,C.starContour(o.star));
  }
  return shapeAddObject(o);
};
// Invalidate parametric metadata only after an actual geometry edit, inside its
// existing Undo transaction. Entering Node mode and changing paint are harmless.
function shapeDetachChanged(o){
  if(o.kind==='group'){o.children.forEach(shapeDetachChanged);return;}
  if((o.arc||o.star||o.shapeRect)&&!shapeKind(o)){delete o.arc;delete o.star;delete o.shapeRect;delete o.ellipseFrame;o.shapeFree=true;}
}
const shapeCommit=commit;commit=function(){for(const l of layers())for(const key of l.kfs)for(const o of key.objs)shapeDetachChanged(o);return shapeCommit();};
const shapeNodeDrag=nodeDrag;nodeDrag=function(...args){const result=shapeNodeDrag(...args),d=S.drag;if(d?.started){if(d.o)shapeDetachChanged(d.o);for(const item of d.items||[])shapeDetachChanged(item.o);}return result;};
const shapeCurveDrag=kCurveDrag;kCurveDrag=function(...args){const result=shapeCurveDrag(...args);if(S.drag?.started&&S.drag.o)shapeDetachChanged(S.drag.o);return result;};
const shapeArcSelection=arcSelection;arcSelection=function(){const one=shapeArcSelection();return one&&SHAPER.enabled.ellipse&&shapeKind(one.o)==='ellipse'&&S.tool!=='node'?one:null;};
const shapeStarSelection=starSelection;starSelection=function(){const one=shapeStarSelection();return one&&SHAPER.enabled.star&&shapeKind(one.o)==='star'?one:null;};
// Keep existing explicit double-click conversion available, independently of
// whether the special handles are displayed.
const shapeArcFinish=arcFinish;arcFinish=function(p){const enabled=SHAPER.enabled.ellipse;SHAPER.enabled.ellipse=true;try{return shapeArcFinish(p);}finally{SHAPER.enabled.ellipse=enabled;shapeSync();}};
function shapeRectHandles(one){
  const a=shapeRectData(one.o),M=matOf(one.o.t),scale=Math.hypot(M[0],M[1])*S.view.z||1,offset=16/scale,max=Math.min(a.w,a.h)/2;
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy],i)=>{const r=a.r[i]*max;return {i,sx,sy,p:w2s(...mapply(M,sx*(a.w/2-r-offset),sy*a.h/2)),corner:w2s(...mapply(M,sx*a.w/2,sy*a.h/2))};});
}
function shapeCornerSet(index,e){if(e.shiftKey&&e.ctrlKey)return [index,(index+2)%4];if(e.shiftKey)return [index];if(e.altKey)return index<2?[0,1]:[2,3];if(e.ctrlKey)return [index,index===0?3:index===3?0:index===1?2:1];return [0,1,2,3];}
function shapeRectSelection(){const one=shapeChosen();return one&&shapeKind(one.o)==='rect'&&SHAPER.enabled.rect&&['select','rect'].includes(S.tool)?one:null;}
function shapeRectDown(e,p){
  const one=shapeRectSelection();if(!one||e.button!==0||S.space)return false;
  const handles=shapeRectHandles(one),hit=handles.find(h=>Math.hypot(h.p[0]-p.sx,h.p[1]-p.sy)<(window.matchMedia('(hover: none)').matches?18:11));if(!hit)return false;
  if(REC.armed){protest('Leave Record mode before rounding corners.');return true;}
  const base=clone(one.o);base.shapeRect=clone(shapeRectData(one.o));
  S.drag={type:'shape-corner',lid:one.lid,id:one.id,start:p.w,base,handle:hit,inv:minv(matOf(one.o.t)),started:false,indices:shapeCornerSet(hit.i,e)};invalidate();return true;
}
function shapeRectMove(p,e){
  const d=S.drag;if(d?.type!=='shape-corner')return;
  const a=d.base.shapeRect,from=mapply(d.inv,d.start.x,d.start.y),to=mapply(d.inv,p.w.x,p.w.y),delta=-d.handle.sx*(to[0]-from[0]),max=Math.min(a.w,a.h)/2;
  d.indices=shapeCornerSet(d.handle.i,e);if(!d.started&&Math.abs(delta)*S.view.z<2){invalidate();return;}
  if(!d.started){d.rollback={doc:snap(),undo:H.stack.slice(),redo:H.redo.slice(),dirty:unsaved,serial:S.changeSerial||0,sel:clone(S.sel)};pushUndo();C.ensureEditable(getLayer(d.lid),S.frame);d.started=true;}
  const o=findEditable(d.lid,d.id);o.shapeRect=clone(a);for(const i of d.indices)o.shapeRect.r[i]=clamp(a.r[i]+delta/(max||1),0,1);shapePut(o,shapeRectContour(o.shapeRect));invalidate();
}
function shapeRectEnd(cancel){
  const d=S.drag;if(d?.type!=='shape-corner')return;S.drag=null;
  if(cancel&&d.rollback){const r=d.rollback;restoreSnap(r.doc);H.stack=r.undo;H.redo=r.redo;unsaved=r.dirty;S.changeSerial=r.serial;S.sel=r.sel;$('#mFile').classList.toggle('dirty',unsaved);notifyDesktopDirty();refreshAll();}
  else if(d.started){shapeRemember(findEditable(d.lid,d.id));commit();}else invalidate();
}
function shapeRectDraw(ctx){
  const one=shapeRectSelection();if(!one||S.playing)return;const drag=S.drag?.type==='shape-corner'?S.drag:null,handles=shapeRectHandles(one),cursor=S.cursorW?w2s(S.cursorW.x,S.cursorW.y):null;
  const touch=window.matchMedia('(hover: none)').matches;let active=drag?handles.find(h=>h.i===drag.handle.i):cursor?handles.filter(h=>Math.min(Math.hypot(h.corner[0]-cursor[0],h.corner[1]-cursor[1]),Math.hypot(h.p[0]-cursor[0],h.p[1]-cursor[1]))<42).sort((a,b)=>Math.hypot(a.p[0]-cursor[0],a.p[1]-cursor[1])-Math.hypot(b.p[0]-cursor[0],b.p[1]-cursor[1]))[0]:null;
  if(!active&&touch)active=handles[1];SHAPER.hover=active?.i??null;if(!active)return;
  ctx.save();ctx.fillStyle=CSSV.panel;ctx.strokeStyle=CSSV.accent;ctx.lineWidth=1.5;
  for(const h of handles)if(touch||h.i===active.i||drag?.indices.includes(h.i)){ctx.beginPath();ctx.arc(...h.p,6,0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.font='11px sans-serif';ctx.fillStyle=CSSV.fg||CSSV.accent;if(drag||!touch)ctx.fillText(drag?Math.round(shapeRectData(one.o).r[active.i]*100)+'%':'Round · Shift: one · Alt: row · Ctrl: column · Ctrl+Shift: diagonal',Math.max(8,Math.min(active.p[0]-100,stageW-410)),Math.max(16,active.p[1]-16));ctx.restore();
}
const shapeOnDown=onDown;onDown=function(e){if(shapeRectDown(e,stagePt(e)))return;return shapeOnDown(e);};
const shapeOnMove=onMove;onMove=function(e){if(S.drag?.type==='shape-corner'){shapeRectMove(stagePt(e),e);return;}const result=shapeOnMove(e),one=shapeRectSelection();if(one&&!S.draw&&!S.drag){const p=stagePt(e);if(shapeRectHandles(one).some(h=>Math.hypot(h.p[0]-p.sx,h.p[1]-p.sy)<11))stage.style.cursor='ew-resize';invalidate();}return result;};
const shapeOnUp=onUp;onUp=function(e){if(S.drag?.type==='shape-corner'){shapeRectEnd(e.type==='pointercancel');return;}return shapeOnUp(e);};
const shapeOverlay=drawOverlay;drawOverlay=function(ctx){shapeOverlay(ctx);shapeRectDraw(ctx);};
const shapeStartPinch=startPinch;startPinch=function(){if(S.drag?.type==='shape-corner')shapeRectEnd(true);return shapeStartPinch();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.drag?.type==='shape-corner'){shapeRectEnd(true);e.preventDefault();e.stopImmediatePropagation();}},true);

document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||S.drag||S.draw||S.pen||modalBg.classList.contains('on')||e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  const kind=shapeActiveKind();if(kind&&SHAPER.enabled[kind]){const one=shapeChosen();if(one)shapeRemember(one.o);SHAPER.enabled[kind]=false;setTool('select');invalidate();e.preventDefault();e.stopImmediatePropagation();}
},true);
