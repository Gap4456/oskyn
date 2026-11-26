/* Multi-object node editing. Legacy single-object and Record gestures retain
   their original handlers; node coordinates are scoped to an owning object. */
function multiNodeEligible(o){return o?.kind==='path'&&!o.skin&&!o.skel&&!o.rig;}
function multiNodeObjects(){return selEval().filter(s=>multiNodeEligible(s.o)&&!getLayer(s.lid)?.locked&&getLayer(s.lid)?.visible!==false);}
function multiNodeActive(){return S.tool==='node'&&multiNodeObjects().length>1;}
function multiNodeSame(a,b){return a.lid===b.lid&&a.id===b.id;}
function multiNodeRefs(){
  const objects=multiNodeObjects(),seen=new Set();
  return (S.multiNodeRefs||[]).filter(r=>{const o=objects.find(s=>multiNodeSame(s,r))?.o,key=JSON.stringify([r.lid,r.id,r.ci,r.ni]);if(!o?.contours[r.ci]?.nodes[r.ni]||seen.has(key))return false;seen.add(key);return true;});
}
function multiNodeContext(one,fn,refs=multiNodeRefs()){
  const saved={sel:S.sel,node:S.nodeSel,keys:S.kNodeSelection},mine=refs.filter(r=>multiNodeSame(r,one));
  S.sel=[{lid:one.lid,id:one.id}];S.kNodeSelection=mine.map(r=>r.ci+':'+r.ni);S.nodeSel=mine.length?{ci:mine.at(-1).ci,ni:mine.at(-1).ni}:null;
  const outerPush=pushUndo;
  pushUndo=()=>{const local={sel:S.sel,node:S.nodeSel,keys:S.kNodeSelection};S.sel=saved.sel;S.nodeSel=saved.node;S.kNodeSelection=saved.keys;try{outerPush();}finally{S.sel=local.sel;S.nodeSel=local.node;S.kNodeSelection=local.keys;}};
  try{return fn();}finally{pushUndo=outerPush;S.sel=saved.sel;S.nodeSel=saved.node;S.kNodeSelection=saved.keys;}
}
function multiNodeHit(p){
  const objects=multiNodeObjects().slice().reverse();
  // Anchors of every open figure win over any figure's curve handles.
  let closest=null,distance=10;
  for(const one of objects)for(let ci=0;ci<one.o.contours.length;ci++)for(let ni=0;ni<one.o.contours[ci].nodes.length;ni++){
    const q=nodeScreen(one.o,one.o.contours[ci].nodes[ni],'anchor'),d=Math.hypot(q[0]-p.sx,q[1]-p.sy);if(d<distance){distance=d;closest={one,ci,ni,part:'anchor'};}
  }
  if(closest)return closest;
  for(const one of objects){const hit=multiNodeContext(one,()=>hitNodePart(one.o,p.sx,p.sy));if(hit)return {one,...hit};}
  return null;
}
const multiNodeNativeKeys=kNodeKeys;
kNodeKeys=function(){return multiNodeActive()?multiNodeRefs().map(r=>r.ci+':'+r.ni):multiNodeNativeKeys();};
const multiNodeNativeDown=nodeDown;
nodeDown=function(e,p){
  const objects=multiNodeObjects(),hit=hitAt(p.w.x,p.w.y,6);
  const recordHit=REC.armed&&objects.length>1?multiNodeHit(p):null;
  const recordSelected=recordHit&&multiNodeRefs().some(r=>multiNodeSame(r,recordHit.one)&&r.ci===recordHit.ci&&r.ni===recordHit.ni);
  const recordAnchors=recordHit?.part==='anchor'&&(e.shiftKey||recordSelected&&multiNodeRefs().some(r=>!multiNodeSame(r,recordHit.one)));
  if(REC.armed&&(!recordAnchors&&!e.shiftKey||recordHit&&recordHit.part!=='anchor')){
    if(S.sel.length>1&&hit&&multiNodeEligible(hit.o)){
      const refs=multiNodeRefs().filter(r=>multiNodeSame(r,hit));S.sel=[{lid:hit.lid,id:hit.id}];S.kNodeSelection=refs.map(r=>r.ci+':'+r.ni);S.nodeSel=refs.at(-1)||null;
    }
    S.multiNodeRefs=[];return multiNodeNativeDown(e,p);
  }
  const openHit=e.shiftKey?(objects.length>1?multiNodeHit(p):objects.length===1?hitNodePart(objects[0].o,p.sx,p.sy):null):null;
  if(e.shiftKey&&!openHit&&hit&&multiNodeEligible(hit.o)&&objects.length&&!objects.some(o=>multiNodeSame(o,hit))){
    // Preserve the first figure's legacy anchor selection when opening a second.
    if(objects.length===1)S.multiNodeRefs=multiNodeNativeKeys().map(k=>({...kNodeFromKey(k),lid:objects[0].lid,id:objects[0].id}));
    S.sel=[...S.sel,{lid:hit.lid,id:hit.id}];selectLayer(hit.lid,true);S.nodeSel=null;S.kNodeSelection=[];clearProtest();refreshProps();invalidate();return;
  }
  if(!multiNodeActive()){S.multiNodeRefs=[];return multiNodeNativeDown(e,p);}
  multiNodeDown(e,p);
};
function multiNodeDown(e,p){
  let refs=multiNodeRefs();S.multiNodeRefs=refs;clearProtest();
  const hit=multiNodeHit(p),shift=e.shiftKey&&!(e.ctrlKey&&hit);
  if(e.ctrlKey&&!e.shiftKey||e.ctrlKey&&e.shiftKey&&!hit){
    S.drag={type:'node-marquee',multiNode:true,start:p.w,cur:p.w,base:e.shiftKey?refs.slice():[],entire:false};return;
  }
  if(hit){
    const r={lid:hit.one.lid,id:hit.one.id,ci:hit.ci,ni:hit.ni},selected=refs.some(q=>multiNodeSame(q,r)&&q.ci===r.ci&&q.ni===r.ni);
    if(shift&&hit.part==='anchor'){
      S.multiNodeRefs=selected?refs.filter(q=>!multiNodeSame(q,r)||q.ci!==r.ci||q.ni!==r.ni):[...refs,r];refreshProps();invalidate();return;
    }
    if(hit.part==='anchor')S.multiNodeRefs=selected?refs:[r];
    S.drag={type:'node',multiNode:true,part:hit.part,ci:r.ci,ni:r.ni,lid:r.lid,id:r.id,start:p.w,started:false};refreshProps();return;
  }
  const h=hitAt(p.w.x,p.w.y,6);
  if(h&&!multiNodeObjects().some(o=>multiNodeSame(o,h))){
    S.multiNodeRefs=[];S.nodeSel=null;S.kNodeSelection=[];return multiNodeNativeDown(e,p);
  }
  if(h&&!e.shiftKey){
    const one=multiNodeObjects().find(o=>multiNodeSame(o,h));
    const curve=one&&kCurveHit(one.o,p.sx,p.sy);
    if(curve){S.drag={type:'curve-bend',lid:one.lid,id:one.id,ci:curve.ci,ni:curve.ni,t:curve.t,start:p.w,started:false};return;}
  }
  S.drag={type:'node-marquee',multiNode:true,start:p.w,cur:p.w,base:e.shiftKey?refs.slice():[],entire:true};
}
const multiNodeNativeOnDown=onDown;
onDown=function(e){
  if(S.tool==='node'&&multiNodeActive()&&e.ctrlKey&&!S.space&&e.button===0){const p=stagePt(e);S.cursorW=p.w;if(REC.armed)nodeDown(e,p);else multiNodeDown(e,p);invalidate();return;}
  return multiNodeNativeOnDown(e);
};
const multiNodeNativeMarquee=kNodeMarqueeUp;
kNodeMarqueeUp=function(d){
  if(!d.multiNode)return multiNodeNativeMarquee(d);
  const a=w2s(d.start.x,d.start.y),b=w2s(d.cur.x,d.cur.y),x0=Math.min(a[0],b[0]),x1=Math.max(a[0],b[0]),y0=Math.min(a[1],b[1]),y1=Math.max(a[1],b[1]);
  const refs=d.base.slice();
  if(x1-x0>=3||y1-y0>=3)for(const one of multiNodeObjects())one.o.contours.forEach((c,ci)=>c.nodes.forEach((n,ni)=>{
    const [x,y]=nodeScreen(one.o,n,'anchor'),r=d.entire?5:0;
    if(x-r>=x0&&x+r<=x1&&y-r>=y0&&y+r<=y1&&!refs.some(q=>multiNodeSame(q,one)&&q.ci===ci&&q.ni===ni))refs.push({lid:one.lid,id:one.id,ci,ni});
  }));
  S.multiNodeRefs=refs;refreshProps();invalidate();
};
const multiNodeNativeDrag=nodeDrag;
nodeDrag=function(w,e){
  const d=S.drag;if(!d.multiNode)return multiNodeNativeDrag(w,e);
  if(d.part!=='anchor'){
    const one={lid:d.lid,id:d.id,o:findEval(d.lid,d.id)};
    return multiNodeContext(one,()=>multiNodeNativeDrag(w,e));
  }
  if(!d.started){
    if(!d.nudge&&Math.hypot(w.x-d.start.x,w.y-d.start.y)*S.view.z<2)return;
    const recording=typeof MULTIREC!=='undefined'&&MULTIREC?.drag===d;
    if(!recording)pushUndo();d.items=[];
    const refs=multiNodeRefs();
    if(!recording)for(const lid of new Set(refs.map(r=>r.lid)))recordDragEditable(getLayer(lid),S.frame);
    for(const r of refs){const o=(typeof MULTIREC!=='undefined'&&MULTIREC?.drag===d?MULTIREC.targets.find(t=>t.lid===r.lid&&t.id===r.id)?.live:null)||findEditable(r.lid,r.id),n=o?.contours[r.ci]?.nodes[r.ni];if(n){const m=matOf(o.t),p=mapply(m,n.x,n.y);d.items.push({...r,o,n,inv:minv(m),x:p[0],y:p[1]});}}
    d.primary=d.items.find(r=>r.lid===d.lid&&r.id===d.id&&r.ci===d.ci&&r.ni===d.ni);d.started=true;
  }
  let dx=w.x-d.start.x,dy=w.y-d.start.y;
  if(e.ctrlKey&&e.shiftKey){if(Math.abs(dx)>=Math.abs(dy))dy=0;else dx=0;}
  if(d.primary&&GRID.visible&&GRID.snap){const q=gridPoint({x:d.primary.x+dx,y:d.primary.y+dy});if(!(e.ctrlKey&&e.shiftKey)||dx!==0)dx=q.x-d.primary.x;if(!(e.ctrlKey&&e.shiftKey)||dy!==0)dy=q.y-d.primary.y;}
  for(const item of d.items){const q=mapply(item.inv,item.x+dx,item.y+dy);item.n.x=q[0];item.n.y=q[1];}invalidate();
};
function multiNodeBatch(fn,clear=false){
  const refs=multiNodeRefs();if(!refs.length){protest('Select a node first');return false;}
  const objects=multiNodeObjects().filter(o=>refs.some(r=>multiNodeSame(r,o))),nativePush=pushUndo,nativeCommit=commit;
  pushUndo();pushUndo=()=>{};commit=()=>{};
  try{for(const one of objects)multiNodeContext(one,fn,refs);}finally{pushUndo=nativePush;commit=nativeCommit;}
  pruneSel();S.multiNodeRefs=clear?[]:refs;commit();invalidate();return true;
}
const multiNodeNativeDelete=deleteNode;
deleteNode=function(){return multiNodeActive()?multiNodeBatch(multiNodeNativeDelete,true):multiNodeNativeDelete();};
const multiNodeNativeOperation=kNodeOperation;
kNodeOperation=function(op){return multiNodeActive()?multiNodeBatch(()=>multiNodeNativeOperation(op)):multiNodeNativeOperation(op);};
const multiNodeNativeDouble=nodeDbl;
nodeDbl=function(p){
  if(!multiNodeActive())return multiNodeNativeDouble(p);
  const objects=multiNodeObjects(),h=hitAt(p.w.x,p.w.y,6),one=objects.find(o=>h&&multiNodeSame(o,h))||objects.slice().reverse().find(o=>kCurveHit(o.o,p.sx,p.sy));if(!one)return;
  let mine=[];multiNodeContext(one,()=>{multiNodeNativeDouble(p);mine=multiNodeNativeKeys().map(k=>({...kNodeFromKey(k),lid:one.lid,id:one.id}));});
  S.multiNodeRefs=[...multiNodeRefs().filter(r=>!multiNodeSame(r,one)),...mine];refreshProps();invalidate();
};
const multiNodeNativeWheel=kNodeWheel;
kNodeWheel=function(dy){
  if(!multiNodeActive())return multiNodeNativeWheel(dy);
  const refs=multiNodeRefs(),last=refs.at(-1),one=multiNodeObjects().find(o=>last&&multiNodeSame(o,last));if(!one)return false;
  let mine=[];multiNodeContext(one,()=>{multiNodeNativeWheel(dy);mine=multiNodeNativeKeys().map(k=>({...kNodeFromKey(k),lid:one.lid,id:one.id}));});S.multiNodeRefs=[...refs.filter(r=>!multiNodeSame(r,one)),...mine];invalidate();return true;
};
const multiNodeNativeOverlay=drawOverlay;
drawOverlay=function(ctx){
  multiNodeNativeOverlay(ctx);if(!multiNodeActive())return;
  const refs=multiNodeRefs();ctx.save();ctx.lineWidth=1;ctx.strokeStyle=CSSV.accent;
  for(const one of multiNodeObjects())multiNodeContext(one,()=>{
    kDrawTrueContours(ctx,one.o);ctx.fillStyle=CSSV.accentFg;
    for(const h of visibleNodeHandles(one.o)){const n=one.o.contours[h.ci].nodes[h.ni],a=nodeScreen(one.o,n,'anchor'),b=nodeScreen(one.o,n,h.part);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();ctx.beginPath();ctx.arc(...b,5,0,Math.PI*2);ctx.fill();ctx.stroke();}
    one.o.contours.forEach((c,ci)=>c.nodes.forEach((n,ni)=>{const p=nodeScreen(one.o,n,'anchor');ctx.fillStyle=refs.some(r=>multiNodeSame(r,one)&&r.ci===ci&&r.ni===ni)?CSSV.accent:CSSV.accentFg;ctx.fillRect(p[0]-4,p[1]-4,8,8);ctx.strokeRect(p[0]-4,p[1]-4,8,8);}));
  },refs);ctx.restore();
};
window.addEventListener('keydown',e=>{
  if(REC.running&&REC.drag?.multiNode)return;
  if(!multiNodeActive()||e.target.closest?.('input,textarea,[contenteditable="true"]')||$('#modalBg').classList.contains('on')||$('#prev').classList.contains('on'))return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){
    e.preventDefault();e.stopImmediatePropagation();S.multiNodeRefs=[];for(const one of multiNodeObjects())one.o.contours.forEach((c,ci)=>c.nodes.forEach((n,ni)=>S.multiNodeRefs.push({lid:one.lid,id:one.id,ci,ni})));refreshProps();invalidate();
  }else if(!e.ctrlKey&&!e.metaKey&&e.key.startsWith('Arrow')&&multiNodeRefs().length){
    e.preventDefault();e.stopImmediatePropagation();const r=multiNodeRefs()[0],o=findEval(r.lid,r.id),n=o.contours[r.ci].nodes[r.ni],p=mapply(matOf(o.t),n.x,n.y),step=e.shiftKey?10:1;
    S.drag={type:'node',multiNode:true,nudge:true,part:'anchor',...r,start:{x:p[0],y:p[1]},started:false};nodeDrag({x:p[0]+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),y:p[1]+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)},{ctrlKey:false,shiftKey:false});S.drag=null;commit();
  }
},true);
