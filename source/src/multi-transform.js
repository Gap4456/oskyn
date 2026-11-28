/* A shared, editor-only pivot for a mixed Selection. Objects keep their own
   identities; tween spans store only the rotation anchor/delta they need. */
const MULTIX={doc:null,key:null,pivot:null,poses:null};
function multiTransformSelection(){
  if(S.tool!=='select')return [];
  const selected=selEval();return selected.length>1&&selected.every(s=>{const l=getLayer(s.lid);return l?.visible&&!l.locked&&!s.o.deformFrame&&!s.o.mirror&&!s.o.skel;})?selected:[];
}
function multiTransformBounds(selected){let b=null;for(const s of selected){const q=worldBounds(s.o);if(!q)return null;b=b?{x0:Math.min(b.x0,q.x0),y0:Math.min(b.y0,q.y0),x1:Math.max(b.x1,q.x1),y1:Math.max(b.y1,q.y1)}:{...q};}return b;}
function multiTransformState(){
  const selected=multiTransformSelection();if(!selected.length)return null;
  const bounds=multiTransformBounds(selected);if(!bounds)return null;
  const key=JSON.stringify([S.frame,S.edit.map(e=>e.sym),selected.map(s=>[s.lid,s.id]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))]),poses=selected.map(s=>({lid:s.lid,id:s.id,t:{...s.o.t}}));
  if(MULTIX.doc!==S.doc||MULTIX.key!==key){MULTIX.doc=S.doc;MULTIX.key=key;MULTIX.pivot=[(bounds.x0+bounds.x1)/2,(bounds.y0+bounds.y1)/2];MULTIX.poses=poses;}
  else if(!S.drag&&MULTIX.poses){
    const before=poses.map(p=>MULTIX.poses.find(q=>q.lid===p.lid&&q.id===p.id)),dx=poses[0].t.x-before[0]?.t.x,dy=poses[0].t.y-before[0]?.t.y;
    if(Number.isFinite(dx)&&Number.isFinite(dy)&&poses.every((p,i)=>{const a=before[i]?.t,b=p.t;return a&&Math.abs(b.x-a.x-dx)<1e-7&&Math.abs(b.y-a.y-dy)<1e-7&&b.r===a.r&&b.sx===a.sx&&b.sy===a.sy;})){MULTIX.pivot[0]+=dx;MULTIX.pivot[1]+=dy;}
    MULTIX.poses=poses;
  }
  if(!S.drag)MULTIX.poses=poses;
  return {selected,bounds,pivot:MULTIX.pivot.slice(),key};
}
function multiTransformHandles(state){const b=state.bounds;return {pivot:w2s(...state.pivot),rotate:w2s((b.x0+b.x1)/2,b.y0-26/S.view.z),edge:w2s((b.x0+b.x1)/2,b.y0)};}
function multiRotationPlan(original){
  const l=getLayer(original.lid),key=C.kfFor(l,S.frame),index=l.kfs.indexOf(key),next=l.kfs[index+1],here=key.objs.find(o=>o.id===original.id);
  const delta=(a,b,rot)=>{
    if(!a||!b||a.kind!==b.kind)return null;
    const explicit=rot?.deltas?.[original.id],coherent=Number.isFinite(explicit)&&Math.abs(Math.atan2(Math.sin((a.t.r+explicit-b.t.r)*Math.PI/180),Math.cos((a.t.r+explicit-b.t.r)*Math.PI/180)))<1e-7;
    return C.lerpAngleTween(a.t.r,b.t.r,1,coherent?{delta:explicit}:rot)-a.t.r;
  };
  if(key.f!==S.frame&&key.tween!=='none'&&next){const total=delta(here,next.objs.find(o=>o.id===original.id),key.rot),part=original.t.r-here.t.r;return {previous:part,next:total==null?null:total-part};}
  return {previous:delta(l.kfs[index-1]?.objs.find(o=>o.id===original.id),here,l.kfs[index-1]?.rot),next:delta(here,next?.objs.find(o=>o.id===original.id),key.rot)};
}
function multiTransformDown(e,p){
  if(e.button!==0||S.space||e.ctrlKey||e.metaKey||selectionControlsHidden())return false;
  const state=multiTransformState();if(!state)return false;
  const handles=multiTransformHandles(state),radius=window.matchMedia('(hover: none)').matches?17:10;
  const type=Math.hypot(handles.pivot[0]-p.sx,handles.pivot[1]-p.sy)<radius?'multi-pivot':Math.hypot(handles.rotate[0]-p.sx,handles.rotate[1]-p.sy)<radius?'multi-rotate':null;
  if(!type)return false;if(type==='multi-rotate'&&REC.armed){protest('Leave Record mode before rotating a multi-object selection.');return true;}
  if(S.playing)stopPlay();
  S.drag={type,doc:S.doc,frame:S.frame,scope:JSON.stringify(S.edit.map(e=>e.sym)),key:state.key,pivot:state.pivot,start:p.w,lastAngle:Math.atan2(p.w.y-state.pivot[1],p.w.x-state.pivot[0]),angle:0,degrees:0,started:false,originals:state.selected.map(s=>({lid:s.lid,id:s.id,t:clone(s.o.t)}))};for(const o of S.drag.originals)o.plan=multiRotationPlan(o);invalidate();return true;
}
function multiTransformMove(p,e){
  const d=S.drag;if(!d||!['multi-pivot','multi-rotate'].includes(d.type))return;
  if(d.doc!==S.doc||d.frame!==S.frame||d.scope!==JSON.stringify(S.edit.map(e=>e.sym))){S.drag=null;invalidate();return;}
  if(d.type==='multi-pivot'){MULTIX.pivot=[d.pivot[0]+p.w.x-d.start.x,d.pivot[1]+p.w.y-d.start.y];invalidate();return;}
  if(d.originals.some(s=>{const l=getLayer(s.lid);return !l?.visible||l.locked;}))return;
  const angle=Math.atan2(p.w.y-d.pivot[1],p.w.x-d.pivot[0]);d.angle+=Math.atan2(Math.sin(angle-d.lastAngle),Math.cos(angle-d.lastAngle));d.lastAngle=angle;
  let degrees=d.angle*180/Math.PI;if(e.shiftKey)degrees=Math.round(degrees/15)*15;
  if(!d.started&&Math.abs(degrees)*Math.PI/180*Math.hypot(d.start.x-d.pivot[0],d.start.y-d.pivot[1])*S.view.z<2)return;
  if(!d.started){
    d.rollback={doc:snap(),undo:H.stack.slice(),redo:H.redo.slice(),dirty:unsaved,serial:S.changeSerial||0,sel:clone(S.sel)};
    pushUndo();for(const lid of new Set(d.originals.map(s=>s.lid)))C.ensureEditable(getLayer(lid),S.frame);d.started=true;
  }
  const r=degrees*Math.PI/180,c=Math.cos(r),s=Math.sin(r);d.degrees=degrees;
  for(const original of d.originals){const o=findEditable(original.lid,original.id);if(!o)continue;const t=original.t,dx=t.x-d.pivot[0],dy=t.y-d.pivot[1];o.t={...t,x:d.pivot[0]+c*dx-s*dy,y:d.pivot[1]+s*dx+c*dy,r:t.r+degrees};if(o.bind||o.sbind)C.freeBind.add(o.id);}
  MULTIX.poses=d.originals.map(s=>({lid:s.lid,id:s.id,t:{...findEditable(s.lid,s.id).t}}));invalidate();refreshTransformFields();
}
function multiRotationChannels(d){
  const shortest=degrees=>Math.atan2(Math.sin(degrees*Math.PI/180),Math.cos(degrees*Math.PI/180))*180/Math.PI;
  for(const original of d.originals){
    const l=getLayer(original.lid),key=C.kfFor(l,S.frame),index=l.kfs.indexOf(key),local=mapply(minv(matOf(original.t)),...d.pivot);
    for(const [span,a,b,delta] of [[l.kfs[index-1],l.kfs[index-1]?.objs.find(o=>o.id===original.id),original,d.degrees],[key,original,l.kfs[index+1]?.objs.find(o=>o.id===original.id),-d.degrees]]){
      if(!span||!a||!b)continue;
      const rot=clone(span.rot||{}),planned=span===key?original.plan.next:original.plan.previous,base=planned??shortest(b.t.r-a.t.r);
      rot.deltas={...rot.deltas,[original.id]:base+delta};rot.sharedPivots={...rot.sharedPivots,[original.id]:local};span.rot=rot;
    }
  }
}
function multiTransformEnd(cancel=false){
  const d=S.drag;if(!d||!['multi-pivot','multi-rotate'].includes(d.type))return;
  S.drag=null;
  if(cancel&&d.rollback&&d.doc===S.doc){const r=d.rollback;restoreSnap(r.doc);H.stack=r.undo;H.redo=r.redo;unsaved=r.dirty;S.changeSerial=r.serial;S.sel=r.sel;$('#mFile').classList.toggle('dirty',unsaved);notifyDesktopDirty();MULTIX.doc=S.doc;MULTIX.key=d.key;MULTIX.pivot=d.pivot.slice();MULTIX.poses=null;refreshAll();}
  else if(cancel){MULTIX.pivot=d.pivot.slice();invalidate();}
  else if(d.started){multiRotationChannels(d);commit();refreshAll();}
  else invalidate();
  C.freeBind.clear();
}
function multiTransformDraw(ctx){
  const state=multiTransformState(),active=['multi-pivot','multi-rotate'].includes(S.drag?.type);if(!state||S.playing||selectionControlsHidden()&&!active)return;
  const h=multiTransformHandles(state);ctx.save();ctx.lineWidth=1.5;ctx.strokeStyle=CSSV.accent;ctx.fillStyle=CSSV.panel;
  ctx.beginPath();ctx.moveTo(...h.edge);ctx.lineTo(...h.rotate);ctx.stroke();
  for(const [point,radius] of [[h.rotate,6],[h.pivot,5]]){ctx.beginPath();ctx.arc(...point,radius,0,Math.PI*2);ctx.lineWidth=4;ctx.strokeStyle='#ffffff';ctx.stroke();ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=CSSV.accent;ctx.stroke();}
  ctx.beginPath();ctx.moveTo(h.pivot[0]-9,h.pivot[1]);ctx.lineTo(h.pivot[0]+9,h.pivot[1]);ctx.moveTo(h.pivot[0],h.pivot[1]-9);ctx.lineTo(h.pivot[0],h.pivot[1]+9);ctx.stroke();
  const cursor=S.cursorW?w2s(S.cursorW.x,S.cursorW.y):null;
  if(active||cursor&&Math.min(Math.hypot(cursor[0]-h.rotate[0],cursor[1]-h.rotate[1]),Math.hypot(cursor[0]-h.pivot[0],cursor[1]-h.pivot[1]))<14){ctx.font='11px sans-serif';ctx.fillStyle=CSSV.accent;const text=S.drag?.type==='multi-rotate'?Math.round(S.drag.degrees*10)/10+'°':cursor&&Math.hypot(cursor[0]-h.pivot[0],cursor[1]-h.pivot[1])<14?'Drag shared pivot · double-click to centre':'Rotate selection · Shift: 15°';ctx.fillText(text,Math.max(8,h.rotate[0]-100),Math.max(16,h.rotate[1]-12));}
  ctx.restore();
}
const multiTransformNativeDown=onDown;onDown=function(e){if(multiTransformDown(e,stagePt(e)))return;return multiTransformNativeDown(e);};
const multiTransformNativeMove=onMove;onMove=function(e){if(['multi-pivot','multi-rotate'].includes(S.drag?.type)){S.cursorW=stagePt(e).w;multiTransformMove(stagePt(e),e);return;}const result=multiTransformNativeMove(e),state=multiTransformState();if(state&&!S.draw&&!S.drag){const p=stagePt(e),h=multiTransformHandles(state);if(Math.min(Math.hypot(h.pivot[0]-p.sx,h.pivot[1]-p.sy),Math.hypot(h.rotate[0]-p.sx,h.rotate[1]-p.sy))<11)stage.style.cursor='grab';invalidate();}return result;};
const multiTransformNativeUp=onUp;onUp=function(e){if(['multi-pivot','multi-rotate'].includes(S.drag?.type)){multiTransformEnd(e.type==='pointercancel');return;}return multiTransformNativeUp(e);};
const multiTransformNativeDouble=onDbl;onDbl=function(e){const state=multiTransformState(),p=stagePt(e);if(state){const h=multiTransformHandles(state);if(Math.hypot(h.pivot[0]-p.sx,h.pivot[1]-p.sy)<11){MULTIX.pivot=[(state.bounds.x0+state.bounds.x1)/2,(state.bounds.y0+state.bounds.y1)/2];invalidate();e.preventDefault();return;}}return multiTransformNativeDouble(e);};
const multiTransformNativeOverlay=drawOverlay;drawOverlay=function(ctx){multiTransformNativeOverlay(ctx);multiTransformDraw(ctx);};
const multiTransformNativePinch=startPinch;startPinch=function(){if(['multi-pivot','multi-rotate'].includes(S.drag?.type))multiTransformEnd(true);return multiTransformNativePinch();};
const multiTransformNativeTool=setTool;setTool=function(id){if(['multi-pivot','multi-rotate'].includes(S.drag?.type)&&id!=='select')multiTransformEnd(false);return multiTransformNativeTool(id);};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&['multi-pivot','multi-rotate'].includes(S.drag?.type)){multiTransformEnd(true);e.preventDefault();e.stopImmediatePropagation();}},true);
