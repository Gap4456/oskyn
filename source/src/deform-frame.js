/* A persistent editor controller; only ordinary path nodes are exported.
   Confirmation flattens curves once. Dragging never changes node topology. */
const DEFORM={draft:null,active:null,palette:null,pending:null,raf:0};
const deformScope=()=>JSON.stringify(S.edit.map(e=>e.sym));
function deformDraft(){
  const d=DEFORM.draft;
  if(d&&(d.doc!==S.doc||d.scope!==deformScope()||d.frame!==S.frame||d.lid!==S.layerId))DEFORM.draft=null;
  return DEFORM.draft;
}
const deformRectQuad=r=>[[r.x0,r.y0],[r.x1,r.y0],[r.x1,r.y1],[r.x0,r.y1]];
function deformFrames(){
  return layers().filter(l=>l.visible!==false).flatMap(l=>C.evalLayerObjs(l,S.frame).filter(o=>o.deformFrame).map(o=>({lid:l.id,id:o.id,o})));
}
function deformFrameRef(){
  const frames=deformFrames();return frames.find(r=>r.id===DEFORM.active?.id&&r.lid===DEFORM.active.lid)||frames.find(r=>r.lid===S.layerId)||frames[0]||null;
}
function deformWalk(o,fn,M=[1,0,0,1,0,0]){
  const m=mmul(M,matOf(o.t));
  if(Math.abs(m[0]*m[3]-m[1]*m[2])<1e-10)return false;
  if(o.mirror||o.deformFrame||o.skel||o.rig||o.skin||o.bind||o.sbind||o._softParts)return false;
  if(o.kind==='group'){
    if(o.mask||!o.children?.length)return false;
    return o.children.every(ch=>deformWalk(ch,fn,m));
  }
  if(o.kind!=='path'||!o.contours?.length)return false;
  fn?.(o,m);return true;
}
function deformCandidates(d=deformDraft()){
  const l=d&&getLayer(d.lid);if(!l||l.locked||!l.visible||!d.rect)return [];
  const r=d.rect,eps=1e-6*Math.max(1,r.x1-r.x0,r.y1-r.y0);
  return C.evalLayerObjs(l,S.frame).filter(o=>{
    if(editorObjectHidden(l.id,o.id)||!deformWalk(o))return false;
    const b=worldBounds(o);return b&&b.x0>=r.x0-eps&&b.x1<=r.x1+eps&&b.y0>=r.y0-eps&&b.y1<=r.y1+eps;
  });
}
function deformBegin(){
  if(REC.armed){protest('Deform: leave Record mode first.');return false;}
  const l=curLayer();if(!l||l.locked||!l.visible){protest('Deform: choose a visible unlocked layer.');return false;}
  const existing=deformFrames().find(r=>r.lid===l.id);
  if(existing){DEFORM.draft=null;DEFORM.active={lid:l.id,id:existing.id};setTool('deform');invalidate();return true;}
  if(!deformDraft())DEFORM.draft={doc:S.doc,scope:deformScope(),frame:S.frame,lid:l.id,rect:null};
  setTool('deform');invalidate();return true;
}
function deformFlatten(o,budget){
  deformWalk(o,(path,M)=>{
    const scale=Math.max(Math.hypot(M[0],M[1]),Math.hypot(M[2],M[3])),step=2/Math.max(scale,.001);
    path.contours=path.contours.map(c=>{
      const nodes=[],n=c.nodes,edges=c.closed?n.length:n.length-1;
      if(!n.length)return {...c,nodes};
      const add=(x,y,mid)=>{if(++budget.count>50000)throw Error('Deform: this frame would exceed 50,000 nodes. Use a smaller frame.');const v=C.node(x,y);v.mid=mid||uid();v.s=false;nodes.push(v);};
      add(n[0].x,n[0].y,n[0].mid);
      for(let i=0;i<edges;i++){
        const a=n[i],b=n[(i+1)%n.length],curved=a.ox||a.oy||b.ix||b.iy;
        if(curved){
          const length=Math.hypot(a.ox,a.oy)+Math.hypot(b.ix,b.iy)+Math.hypot(b.x-a.x,b.y-a.y);
          const count=Math.min(8192,Math.max(4,Math.ceil(length/step)));
          for(let j=1;j<count;j++){const q=C.bezPt(a,b,j/count);add(q[0],q[1]);}
        }
        if(!c.closed||i<edges-1)add(b.x,b.y,b.mid);
      }
      return {closed:!!c.closed,nodes};
    });
    delete path.arc;delete path.star;delete path.ellipseFrame;
  });
}
function deformConfirm(){
  const d=deformDraft();if(!d?.rect||REC.armed)return;
  const sources=deformCandidates(d);
  if(!sources.length){protest('Deform: fully enclose ordinary vector paths or vector-only groups on this layer. Text, symbols, bitmaps and bone-bound artwork are not supported.');return;}
  let prepared;
  try{const budget={count:0};prepared=sources.map(o=>{const p=clone(o);deformFlatten(p,budget);return p;});}catch(e){protest(e.message);return;}
  pushUndo();const l=getLayer(d.lid),key=C.insertKeyframe(l,S.frame,false),byId=new Map(prepared.map(o=>[o.id,o]));
  key.objs=key.objs.map(o=>byId.get(o.id)||o);
  const controller={id:uid(),kind:'path',t:C.newT(),op:1,fill:null,stroke:null,contours:[],deformFrame:{rect:clone(d.rect),quad:deformRectQuad(d.rect),targets:prepared.map(o=>o.id)}};
  key.objs.push(controller);DEFORM.active={lid:l.id,id:controller.id};DEFORM.draft=null;
  S.sel=[];S.nodeSel=null;S.kNodeSelection=[];S.multiNodeRefs=[];
  commit();refreshAll();toast('Deform: nodes prepared. Drag the four corners; remove the frame to keep the result.');
}
function deformRemove(){
  if(deformDraft()){DEFORM.draft=null;setTool('select');invalidate();return;}
  const ref=deformFrameRef(),l=ref&&getLayer(ref.lid);if(!l||l.locked||REC.armed)return;
  pushUndo();for(const key of l.kfs)key.objs=key.objs.filter(o=>o.id!==ref.id);
  DEFORM.active=null;setTool('select');commit();refreshAll();
}
function deformConvex(q){
  if(q?.length!==4||q.some(p=>p.length!==2||p.some(v=>!Number.isFinite(v)||Math.abs(v)>1e8)))return false;
  let area=0;
  for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],c=q[(i+2)%4];if((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])<=1e-5)return false;area+=a[0]*b[1]-b[0]*a[1];}
  return area>1e-3;
}
function deformHomography(from,to){
  const a=[];
  for(let i=0;i<4;i++){const [x,y]=from[i],[u,v]=to[i];a.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}
  for(let col=0;col<8;col++){
    let pivot=col;for(let row=col+1;row<8;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;
    if(Math.abs(a[pivot][col])<1e-12)throw Error('Deform: the frame is too flat.');
    [a[col],a[pivot]]=[a[pivot],a[col]];const scale=a[col][col];for(let j=col;j<9;j++)a[col][j]/=scale;
    for(let row=0;row<8;row++)if(row!==col){const k=a[row][col];for(let j=col;j<9;j++)a[row][j]-=k*a[col][j];}
  }
  return [...a.map(row=>row[8]),1];
}
function deformPoint(H,x,y){const d=H[6]*x+H[7]*y+1;if(Math.abs(d)<1e-9)throw Error('Deform: a point is too close to the perspective horizon.');const p=[(H[0]*x+H[1]*y+H[2])/d,(H[3]*x+H[4]*y+H[5])/d];if(p.some(v=>!Number.isFinite(v)||Math.abs(v)>1e8))throw Error('Deform: the frame is too extreme.');return p;}
function deformProjectObject(source,H){
  const out=clone(source);
  if(!deformWalk(out,(o,M)=>{
    const inv=minv(M);
    for(const c of o.contours)for(const n of c.nodes){
      const x=n.x,y=n.y,w=mapply(M,x,y),p=mapply(inv,...deformPoint(H,...w));
      // Explicit handle edits made after preparation are respected as well.
      for(const pair of [['ix','iy'],['ox','oy']])if(n[pair[0]]||n[pair[1]]){
        const h=mapply(M,x+n[pair[0]],y+n[pair[1]]),v=mapply(inv,...deformPoint(H,...h));
        n[pair[0]]=v[0]-p[0];n[pair[1]]=v[1]-p[1];
      }
      n.x=p[0];n.y=p[1];
    }
  }))throw Error('Deform: a captured object is no longer an editable vector path.');
  return out;
}
function deformQuadHit(q,p){for(let i=0;i<4;i++){const [x,y]=w2s(...q[i]);if(Math.hypot(x-p.sx,y-p.sy)<=10)return {action:'corner',index:i};}return null;}
function deformInside(q,p){return eInRing([p.w.x,p.w.y],q);}
function deformDown(e,p){
  if(e.button!==0||S.space||!['select','deform'].includes(S.tool)||e.ctrlKey||e.metaKey||REC.armed)return false;
  const draft=deformDraft();
  if(draft){
    const q=draft.rect&&deformRectQuad(draft.rect),hit=q&&deformQuadHit(q,p);
    if(!q){draft.rect={x0:p.w.x,y0:p.w.y,x1:p.w.x+180/S.view.z,y1:p.w.y+120/S.view.z};S.drag={type:'deform',draft:true,action:'place',start:p.w,base:clone(draft.rect)};}
    else if(hit||S.tool==='deform'&&deformInside(q,p))S.drag={type:'deform',draft:true,action:hit?.action||'move',index:hit?.index,start:p.w,base:clone(draft.rect)};
    else if(S.tool==='deform'){draft.rect={x0:p.w.x,y0:p.w.y,x1:p.w.x+180/S.view.z,y1:p.w.y+120/S.view.z};S.drag={type:'deform',draft:true,action:'place',start:p.w,base:clone(draft.rect)};}
    else return false;
    invalidate();return true;
  }
  const refs=deformFrames().slice().reverse();
  for(const ref of refs){
    if(getLayer(ref.lid).locked||editorObjectHidden(ref.lid,ref.id))continue;
    const q=ref.o.deformFrame.quad,hit=deformQuadHit(q,p);
    if(!hit&&!(S.tool==='deform'&&ref.lid===S.layerId&&deformInside(q,p)))continue;
    DEFORM.active={lid:ref.lid,id:ref.id};
    const originals=C.evalLayerObjs(getLayer(ref.lid),S.frame).filter(o=>ref.o.deformFrame.targets.includes(o.id));
    S.drag={type:'deform',lid:ref.lid,id:ref.id,action:hit?.action||'move',index:hit?.index,start:p.w,quad:clone(q),originals:clone(originals),started:false};invalidate();return true;
  }
  return false;
}
function deformDrag(p,e){
  const d=S.drag;if(d?.type!=='deform')return;
  const w=GRID.visible&&GRID.snap?gridPoint(p.w):p.w;
  if(d.draft){const draft=deformDraft();if(!draft)return;const b=d.base;
    if(d.action==='move'){const dx=w.x-d.start.x,dy=w.y-d.start.y;draft.rect={x0:b.x0+dx,x1:b.x1+dx,y0:b.y0+dy,y1:b.y1+dy};}
    else {const anchor=d.action==='place'?[d.start.x,d.start.y]:deformRectQuad(b)[(d.index+2)%4];if(Math.hypot(w.x-d.start.x,w.y-d.start.y)*S.view.z<3)return;draft.rect={x0:Math.min(anchor[0],w.x),x1:Math.max(anchor[0],w.x),y0:Math.min(anchor[1],w.y),y1:Math.max(anchor[1],w.y)};}
    invalidate();return;
  }
  if(Math.hypot(w.x-d.start.x,w.y-d.start.y)*S.view.z<2&&!d.started)return;
  const quad=clone(d.quad);
  if(d.action==='corner')quad[d.index]=[w.x,w.y];else for(const q of quad){q[0]+=w.x-d.start.x;q[1]+=w.y-d.start.y;}
  if(!deformConvex(quad))return;
  const l=getLayer(d.lid);if(!l||l.locked||!l.visible)return;
  let next;try{const H=deformHomography(d.quad,quad);next=d.originals.map(o=>deformProjectObject(o,H));}catch(error){if(!d.warned){protest(error.message);d.warned=true;}return;}
  if(!next.length)return;
  if(!d.started){d.rollback={doc:snap(),undo:H.stack.slice(),redo:H.redo.slice(),dirty:unsaved,serial:S.changeSerial||0,sel:clone(S.sel)};pushUndo();C.insertKeyframe(l,S.frame,false);d.started=true;}
  const key=C.kfAt(l,S.frame),byId=new Map(next.map(o=>[o.id,o]));key.objs=key.objs.map(o=>byId.get(o.id)||o);
  const frame=key.objs.find(o=>o.id===d.id);if(frame)frame.deformFrame.quad=quad;
  invalidate();
}
function deformQueueMove(p){
  DEFORM.pending={drag:S.drag,p};
  if(!DEFORM.raf)DEFORM.raf=requestAnimationFrame(()=>{DEFORM.raf=0;const next=DEFORM.pending;DEFORM.pending=null;if(next&&S.drag===next.drag)deformDrag(next.p);});
}
function deformEnd(cancel=false){
  if(DEFORM.raf)cancelAnimationFrame(DEFORM.raf);DEFORM.raf=0;
  const pending=DEFORM.pending;DEFORM.pending=null;
  if(!cancel&&pending&&S.drag===pending.drag)deformDrag(pending.p);
  const d=S.drag;if(d?.type!=='deform')return;
  S.drag=null;
  if(cancel&&d.rollback){const r=d.rollback;restoreSnap(r.doc);H.stack=r.undo;H.redo=r.redo;unsaved=r.dirty;S.changeSerial=r.serial;S.sel=r.sel;$('#mFile').classList.toggle('dirty',unsaved);notifyDesktopDirty();refreshAll();}
  else if(cancel&&d.draft){const draft=deformDraft();if(draft)draft.rect=d.action==='place'?null:clone(d.base);invalidate();}
  else if(d.started){commit();refreshAll();}
  else invalidate();
}
const deformNativeDown=onDown;onDown=function(e){const p=stagePt(e);if(deformDown(e,p)){if(S.playing)stopPlay();return;}return deformNativeDown(e);};
const deformNativeMove=onMove;onMove=function(e){if(S.drag?.type==='deform'){deformQueueMove(stagePt(e));return;}return deformNativeMove(e);};
const deformNativeUp=onUp;onUp=function(e){if(S.drag?.type==='deform'){deformEnd(e.type==='pointercancel');return;}return deformNativeUp(e);};
const deformNativePinch=startPinch;startPinch=function(){if(S.drag?.type==='deform')deformEnd(true);return deformNativePinch();};
const deformNativeOverlay=drawOverlay;drawOverlay=function(ctx){deformNativeOverlay(ctx);deformOverlay(ctx);};
function deformOverlay(ctx){
  const hud=$('#deformHud');if(!hud)return;
  const draft=deformDraft(),refs=deformFrames(),current=deformFrameRef();
  if(S.playing){hud.hidden=true;return;}
  const rows=refs.map(r=>({q:r.o.deformFrame.quad,ref:r}));if(draft?.rect)rows.push({q:deformRectQuad(draft.rect),draft:true});
  for(const row of rows){const q=row.q.map(p=>w2s(...p));ctx.save();ctx.setLineDash([7,5]);ctx.lineJoin='round';ctx.beginPath();q.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=row.draft?'#218f47':CSSV.accent;ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);
    if(['select','deform'].includes(S.tool))for(const p of q){ctx.fillStyle=CSSV.panel;ctx.fillRect(p[0]-4,p[1]-4,8,8);ctx.strokeRect(p[0]-4,p[1]-4,8,8);}ctx.restore();
  }
  if(draft?.rect){ctx.save();ctx.strokeStyle='#218f47';ctx.lineWidth=1;ctx.setLineDash([2,4]);for(const o of deformCandidates(draft)){const q=worldCorners(o)?.map(p=>w2s(...p));if(!q)continue;ctx.beginPath();q.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.stroke();}ctx.restore();}
  const q=draft?.rect?deformRectQuad(draft.rect):current?.o.deformFrame.quad;
  hud.hidden=!q||!!S.drag||S.space;
  if(!q)return;
  const locked=getLayer(draft?.lid||current?.lid)?.locked||REC.armed;
  $('#deformConfirm').disabled=!draft||locked||!deformCandidates(draft).length||!deformConvex(q);
  $('#deformRemove').disabled=!!locked;
  $('#deformStatus').textContent=draft?deformCandidates(draft).length+' objects · prepare nodes':'Nodes fixed';
  const at=w2s(...q[1]);hud.style.left=Math.max(4,Math.min(stage.clientWidth-hud.offsetWidth-4,at[0]+10))+'px';hud.style.top=Math.max(4,Math.min(stage.clientHeight-40,at[1]-40))+'px';
}
function deformUI(){
  const hud=document.createElement('div');hud.id='deformHud';hud.hidden=true;hud.innerHTML='<button type="button" id="deformConfirm" title="Confirm frame and prepare fixed vector nodes" aria-label="Prepare deformation nodes">✓</button><button type="button" id="deformRemove" title="Remove this frame from all keyframes; keep deformed paths" aria-label="Remove deformation frame">×</button><span id="deformStatus"></span>';$('#stagewrap').append(hud);$('#deformConfirm').addEventListener('click',deformConfirm);$('#deformRemove').addEventListener('click',deformRemove);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.tool==='deform'&&!modalBg.classList.contains('on')){if(S.drag?.type==='deform')deformEnd(true);DEFORM.draft=null;setTool('select');invalidate();e.preventDefault();e.stopImmediatePropagation();}},true);
  window.addEventListener('pointermove',e=>{const d=DEFORM.palette;if(!d)return;if(!d.started&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>5){if(!deformBegin()){DEFORM.palette=null;return;}d.started=true;d.button.dataset.deformDragged='1';}if(d.started&&deformDraft()){const p=stagePt(e);DEFORM.draft.rect={x0:p.w.x,y0:p.w.y,x1:p.w.x+180/S.view.z,y1:p.w.y+120/S.view.z};invalidate();}});
  const end=e=>{const d=DEFORM.palette;if(!d)return;DEFORM.palette=null;if(d.started){const r=stage.getBoundingClientRect();if(e.type==='pointercancel'||e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)DEFORM.draft=null;invalidate();setTimeout(()=>delete d.button.dataset.deformDragged,0);}};
  window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
}
