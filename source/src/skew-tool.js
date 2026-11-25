/* A dedicated affine skew tool. It bakes only into existing vector geometry;
   no new nodes, persistent effect or Selection-mode handles are introduced. */
const SKEW={pending:null,raf:0};
function skewSelection(){
  const selected=selEval();if(REC.armed||!selected.length)return [];
  return selected.every(s=>{const l=getLayer(s.lid);return l?.visible&&!l.locked&&deformWalk(s.o);})?selected:[];
}
function skewBounds(selected=skewSelection()){
  let bounds=null;
  for(const s of selected){const b=worldBounds(s.o);if(!b)return null;bounds=bounds?{x0:Math.min(bounds.x0,b.x0),x1:Math.max(bounds.x1,b.x1),y0:Math.min(bounds.y0,b.y0),y1:Math.max(bounds.y1,b.y1)}:{...b};}
  return bounds;
}
function skewHandles(b){
  if(!b)return [];
  const cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2,out=[];
  if(b.y1-b.y0>1e-8)out.push({id:'n',x:cx,y:b.y0,axis:'x',anchor:b.y1,span:b.y0-b.y1},{id:'s',x:cx,y:b.y1,axis:'x',anchor:b.y0,span:b.y1-b.y0});
  if(b.x1-b.x0>1e-8)out.push({id:'w',x:b.x0,y:cy,axis:'y',anchor:b.x1,span:b.x0-b.x1},{id:'e',x:b.x1,y:cy,axis:'y',anchor:b.x0,span:b.x1-b.x0});
  return out;
}
function skewProject(source,H){
  const copy=clone(source);
  function apply(o,parent){
    const world=mmul(parent,matOf(o.t)),local=mmul(minv(world),mmul(H,world));
    if(Array.isArray(o.pivot))o.pivot=mapply(local,...o.pivot);
    if(o.kind==='group'){for(const child of o.children)apply(child,world);return;}
    C.applyMatrixToNodes(o.contours,local);
    if(o.grad?.m)o.grad.m=mmul(local,o.grad.m);
    delete o.arc;delete o.star;delete o.ellipseFrame;
  }
  apply(copy,[1,0,0,1,0,0]);return copy;
}
function skewOriginal(s){
  const o=clone(s.o),seeds=[];
  const visit=(path,chain)=>{
    if(path.kind==='group'){for(const child of path.children)visit(child,[...chain,child.id]);return;}
    path.contours.forEach((c,ci)=>{
      if(!c.nodes.every(n=>!n.mid))return;
      const ids=c.nodes.map(n=>n.mid=uid());seeds.push({chain,ci,closed:c.closed,ids});
    });
  };visit(o,[]);return {lid:s.lid,id:s.id,o,seeds};
}
function skewSeedKeys(originals){
  // Establish correspondence before baking a later keyframe. Existing node IDs
  // stay intact; unnamed, matching contours receive the same IDs across keys.
  for(const s of originals)for(const key of getLayer(s.lid).kfs){
    const root=key.objs.find(o=>o.id===s.id);if(!root)continue;
    for(const seed of s.seeds){
      let path=root;for(const id of seed.chain)path=path?.children?.find(o=>o.id===id);
      const c=path?.contours?.[seed.ci];if(!c||c.closed!==seed.closed||c.nodes.length!==seed.ids.length||!c.nodes.every(n=>!n.mid))continue;
      const keep=path.ellipseFrame?.path===JSON.stringify(path.contours);
      c.nodes.forEach((n,i)=>n.mid=seed.ids[i]);if(keep)path.ellipseFrame.path=JSON.stringify(path.contours);
    }
  }
}
function skewDown(e,p){
  if(S.tool!=='skew'||e.button!==0||S.space)return false;
  if(REC.armed){protest('Skew: leave Record mode before changing vector geometry.');return true;}
  if(S.playing)stopPlay();
  const chosen=skewSelection(),bounds=skewBounds(chosen),handle=skewHandles(bounds).find(h=>{const [x,y]=w2s(h.x,h.y);return Math.hypot(x-p.sx,y-p.sy)<=15;});
  if(handle&&!e.ctrlKey&&!e.metaKey){
    S.drag={type:'skew',handle,bounds,start:p.w,originals:chosen.map(skewOriginal),started:false,doc:S.doc,frame:S.frame,scope:deformScope()};invalidate();return true;
  }
  const hit=hitAt(p.w.x,p.w.y,5,e.altKey),toggle=e.shiftKey||e.ctrlKey||e.metaKey;
  if(hit){const selected=S.sel.some(s=>s.lid===hit.lid&&s.id===hit.id);
    if(toggle)S.sel=selected?S.sel.filter(s=>s.lid!==hit.lid||s.id!==hit.id):[...S.sel,{lid:hit.lid,id:hit.id}];
    else if(!selected)S.sel=[{lid:hit.lid,id:hit.id}];
    selectLayer(hit.lid,true);
    if(S.sel.length&&!skewSelection().length)protest('Skew: select ordinary vector paths or vector-only groups on visible unlocked layers. Convert text to paths first.');
  }else if(!toggle)S.sel=[];
  S.nodeSel=null;S.kNodeSelection=[];S.multiNodeRefs=[];refreshProps();invalidate();return true;
}
function skewDrag(p){
  const d=S.drag;if(d?.type!=='skew')return;
  if(d.doc!==S.doc||d.frame!==S.frame||d.scope!==deformScope()){S.drag=null;return;}
  const h=d.handle,delta=p.w[h.axis]-d.start[h.axis];if(Math.abs(delta)*S.view.z<2&&!d.started)return;
  const k=clamp(delta/h.span,-20,20),matrix=h.axis==='x'?[1,0,k,1,-k*h.anchor,0]:[1,k,0,1,0,-k*h.anchor];
  if(d.originals.some(s=>{const l=getLayer(s.lid);return !l?.visible||l.locked;}))return;
  const changes=d.originals.map(s=>({...s,o:skewProject(s.o,matrix)}));
  if(!d.started){
    d.rollback={doc:snap(),undo:H.stack.slice(),redo:H.redo.slice(),dirty:unsaved,serial:S.changeSerial||0,sel:clone(S.sel)};
    pushUndo();skewSeedKeys(d.originals);for(const lid of new Set(d.originals.map(s=>s.lid)))C.insertKeyframe(getLayer(lid),S.frame,false);d.started=true;
  }
  for(const {lid,id,o} of changes){const key=C.kfAt(getLayer(lid),S.frame),i=key.objs.findIndex(o=>o.id===id);if(i>=0)key.objs[i]=o;}
  d.matrix=matrix;invalidate();
}
function skewQueue(p){
  SKEW.pending={drag:S.drag,p};
  if(!SKEW.raf)SKEW.raf=requestAnimationFrame(()=>{SKEW.raf=0;const next=SKEW.pending;SKEW.pending=null;if(next&&S.drag===next.drag)skewDrag(next.p);});
}
function skewEnd(cancel=false){
  if(SKEW.raf)cancelAnimationFrame(SKEW.raf);SKEW.raf=0;const pending=SKEW.pending;SKEW.pending=null;
  if(!cancel&&pending&&S.drag===pending.drag)skewDrag(pending.p);
  const d=S.drag;if(d?.type!=='skew')return;S.drag=null;
  if(cancel&&d.rollback&&d.doc===S.doc){const r=d.rollback;restoreSnap(r.doc);H.stack=r.undo;H.redo=r.redo;unsaved=r.dirty;S.changeSerial=r.serial;S.sel=r.sel;$('#mFile').classList.toggle('dirty',unsaved);notifyDesktopDirty();refreshAll();}
  else if(d.started){commit();refreshAll();}
  else invalidate();
}
function skewOverlay(ctx){
  if(S.tool!=='skew'||S.playing)return;
  const d=S.drag?.type==='skew'?S.drag:null,b=d?d.bounds:skewBounds();if(!b)return;
  const corners=[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]],matrix=d?.matrix;
  ctx.save();ctx.lineJoin='round';ctx.setLineDash([6,4]);ctx.beginPath();corners.forEach((p,i)=>{const q=w2s(...(matrix?mapply(matrix,...p):p));i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=CSSV.accent;ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);
  if(!d)for(const h of skewHandles(b)){
    const [x,y]=w2s(h.x,h.y);ctx.fillStyle=CSSV.panel;ctx.fillRect(x-5,y-5,10,10);ctx.strokeRect(x-5,y-5,10,10);
    ctx.beginPath();if(h.axis==='x'){ctx.moveTo(x-13,y);ctx.lineTo(x+13,y);ctx.moveTo(x-13,y);ctx.lineTo(x-10,y-3);ctx.moveTo(x-13,y);ctx.lineTo(x-10,y+3);ctx.moveTo(x+13,y);ctx.lineTo(x+10,y-3);ctx.moveTo(x+13,y);ctx.lineTo(x+10,y+3);}else{ctx.moveTo(x,y-13);ctx.lineTo(x,y+13);ctx.moveTo(x,y-13);ctx.lineTo(x-3,y-10);ctx.moveTo(x,y-13);ctx.lineTo(x+3,y-10);ctx.moveTo(x,y+13);ctx.lineTo(x-3,y+10);ctx.moveTo(x,y+13);ctx.lineTo(x+3,y+10);}ctx.stroke();
  }
  ctx.restore();
}
const skewNativeSetTool=setTool;setTool=function(id){if(S.drag?.type==='skew'&&id!=='skew')skewEnd(false);return skewNativeSetTool(id);};
const skewNativeDown=onDown;onDown=function(e){if(skewDown(e,stagePt(e)))return;return skewNativeDown(e);};
const skewNativeMove=onMove;onMove=function(e){if(S.drag?.type==='skew'){skewQueue(stagePt(e));return;}return skewNativeMove(e);};
const skewNativeUp=onUp;onUp=function(e){if(S.drag?.type==='skew'){skewEnd(e.type==='pointercancel');return;}return skewNativeUp(e);};
const skewNativePinch=startPinch;startPinch=function(){if(S.drag?.type==='skew')skewEnd(true);return skewNativePinch();};
const skewNativeOverlay=drawOverlay;drawOverlay=function(ctx){skewNativeOverlay(ctx);skewOverlay(ctx);};
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||S.tool!=='skew'||modalBg.classList.contains('on')||e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  if(S.drag?.type==='skew')skewEnd(true);setTool('select');invalidate();e.preventDefault();e.stopImmediatePropagation();
},true);
