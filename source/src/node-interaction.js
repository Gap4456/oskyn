/* Handle visibility is editor state. New nodes retain exact subdivision until
   their first anchor drag, which straightens only their adjacent segments. */
const NODE_UI={hidden:new Map(),fresh:new Set(),lastToggle:null};
function nodeUiKey(one,ci,ni){const n=one.o.contours[ci]?.nodes[ni];return JSON.stringify([S.projects?.active||'',S.edit.map(e=>e.sym),one.lid,one.id,ci,n?.mid||ni]);}
function nodeUiObjects(){const one=singleSel();return multiNodeActive()?multiNodeObjects():one&&nodeEditable(one.o)&&!one.o.skin&&!one.o.skel&&!one.o.rig?[one]:[];}
const nodeUiNativeHandles=visibleNodeHandles;
visibleNodeHandles=function(o){
  const one=singleSel();if(!one||one.o.id!==o.id)return nodeUiNativeHandles(o);
  const keys=S.kNodeSelection,node=S.nodeSel,selected=kNodeKeys().filter(k=>{const r=kNodeFromKey(k);return !NODE_UI.hidden.get(nodeUiKey(one,r.ci,r.ni));});
  S.kNodeSelection=selected;S.nodeSel=selected.length?kNodeFromKey(selected.at(-1)):null;
  try{return nodeUiNativeHandles(o).filter(r=>!NODE_UI.hidden.get(nodeUiKey(one,r.ci,r.ni)));}finally{S.kNodeSelection=keys;S.nodeSel=node;}
};
const nodeUiNativeDown=nodeDown;
nodeDown=function(e,p){
  const selected=[];
  if(!REC.armed&&!e.shiftKey&&!e.ctrlKey&&!e.metaKey){
    for(const one of nodeUiObjects()){
      const refs=multiNodeActive()?multiNodeRefs().filter(r=>multiNodeSame(r,one)):kNodeKeys().map(k=>({...kNodeFromKey(k),lid:one.lid,id:one.id}));
      selected.push(...refs);
    }
  }
  nodeUiNativeDown(e,p);const d=S.drag;
  if(d?.type==='node'&&d.part==='anchor'&&selected.some(r=>r.lid===d.lid&&r.id===d.id&&r.ci===d.ci&&r.ni===d.ni)){
    const o=findEval(d.lid,d.id),q=o&&nodeScreen(o,o.contours[d.ci].nodes[d.ni],'anchor');
    if(q&&Math.hypot(q[0]-p.sx,q[1]-p.sy)<=4.5)d.nodeUiToggle=nodeUiKey({lid:d.lid,id:d.id,o},d.ci,d.ni);
  }
};
const nodeUiNativeUp=onUp;
onUp=function(e){
  const d=S.drag;
  if(d?.nodeUiToggle&&!d.started&&e.type!=='pointercancel'){
    const previous=!!NODE_UI.hidden.get(d.nodeUiToggle),recent=NODE_UI.lastToggle?.key===d.nodeUiToggle&&performance.now()-NODE_UI.lastToggle.time<500?NODE_UI.lastToggle:null;NODE_UI.hidden.set(d.nodeUiToggle,!previous);NODE_UI.lastToggle={key:d.nodeUiToggle,previous:recent?recent.previous:previous,time:performance.now()};
  }return nodeUiNativeUp(e);
};
const nodeUiNativeDouble=nodeDbl;
nodeDbl=function(p){
  const before=nodeUiObjects().map(one=>({lid:one.lid,id:one.id,lengths:one.o.contours.map(c=>c.nodes.length),mids:one.o.contours.flatMap(c=>c.nodes.map(n=>n.mid)).filter(Boolean)}));
  if(NODE_UI.lastToggle&&performance.now()-NODE_UI.lastToggle.time<700){NODE_UI.hidden.set(NODE_UI.lastToggle.key,NODE_UI.lastToggle.previous);NODE_UI.lastToggle=null;}
  nodeUiNativeDouble(p);
  for(const old of before){const o=findEval(old.lid,old.id);if(!o)continue;const ci=o.contours.findIndex((c,i)=>c.nodes.length===(old.lengths[i]||0)+1);if(ci<0)continue;
    // The inserted anchor has a fresh morph identity and a birth record.
    const ni=o.contours[ci].nodes.findIndex(n=>n.birth&&!old.mids.includes(n.mid));
    if(ni<0)continue;const one={lid:old.lid,id:old.id,o},key=nodeUiKey(one,ci,ni);NODE_UI.fresh.add(key);NODE_UI.hidden.set(key,true);
    if(S.sel.length>1)S.multiNodeRefs=[...multiNodeRefs().filter(r=>!multiNodeSame(r,one)),{lid:one.lid,id:one.id,ci,ni}];
    else {S.nodeSel={ci,ni};S.kNodeSelection=[ci+':'+ni];}
  }invalidate();
};
function nodeUiStraighten(one,ci,ni){
  const c=one.o.contours[ci],n=c?.nodes[ni];if(!n||!NODE_UI.fresh.has(nodeUiKey(one,ci,ni)))return;
  n.ix=n.iy=n.ox=n.oy=0;n.s=false;
  if(ni>0||c.closed){const prev=c.nodes[(ni+c.nodes.length-1)%c.nodes.length];prev.ox=prev.oy=0;prev.s=false;}
  if(ni+1<c.nodes.length||c.closed){const next=c.nodes[(ni+1)%c.nodes.length];next.ix=next.iy=0;next.s=false;}
}
const nodeUiNativeDrag=nodeDrag;
nodeDrag=function(w,e){
  const d=S.drag,started=d.started;nodeUiNativeDrag(w,e);if(!d.started||REC.armed)return;
  if(d.part==='anchor'&&!started){
    if(d.items)for(const item of d.items)nodeUiStraighten({lid:item.lid,id:item.id,o:item.o},item.ci,item.ni);
    else if(d.o){const keys=d.groupKeys||[d.ci+':'+d.ni];for(const k of keys){const r=kNodeFromKey(k);nodeUiStraighten({lid:d.lid,id:d.id,o:d.o},r.ci,r.ni);}}
  }else if(d.part!=='anchor'&&d.o){const key=nodeUiKey({lid:d.lid,id:d.id,o:d.o},d.ci,d.ni);NODE_UI.fresh.delete(key);NODE_UI.hidden.set(key,false);}
};
const nodeUiNativeCurve=kCurveDrag;
kCurveDrag=function(w){
  nodeUiNativeCurve(w);const d=S.drag;if(!d?.started||!d.o)return;const c=d.o.contours[d.ci];
  for(const ni of [d.ni,(d.ni+1)%c.nodes.length]){const key=nodeUiKey({lid:d.lid,id:d.id,o:d.o},d.ci,ni);NODE_UI.hidden.set(key,false);NODE_UI.fresh.delete(key);}invalidate();
};
