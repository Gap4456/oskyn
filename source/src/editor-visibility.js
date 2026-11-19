/* Editor-only hide stack. Kept on in-memory projects, never in saved documents. */
function editorHideState(){
  const ps=projectSession(),project=ps.items.find(p=>p.id===ps.active);project.editorHides ||=new Map();
  const scope=JSON.stringify(S.edit.map(e=>e.sym));let state=project.editorHides.get(scope);
  if(!state){state={stack:[],outlines:false};project.editorHides.set(scope,state);}return state;
}
function editorObjectHidden(lid,id){return editorHideState().stack.some(group=>group.some(r=>r.lid===lid&&r.id===id));}
function editorHideCandidates(){
  const chosen=selEval().filter(r=>!getLayer(r.lid)?.locked&&getLayer(r.lid)?.visible!==false);if(chosen.length)return chosen;
  const l=curLayer();if(!l||l.locked||l.visible===false)return [];
  const o=C.evalLayerObjs(l,S.frame).slice().reverse().find(o=>!editorObjectHidden(l.id,o.id));return o?[{lid:l.id,id:o.id,o}]:[];
}
function editorHide(){
  const group=editorHideCandidates().map(({lid,id})=>({lid,id}));if(!group.length)return;
  editorHideState().stack.push(group);S.sel=[];S.nodeSel=null;S.kNodeSelection=[];S.multiNodeRefs=[];refreshProps();invalidate();
}
function editorShow(all=false){
  const state=editorHideState();if(all)state.stack=[];else state.stack.pop();refreshProps();invalidate();
}
function refreshEditorHideButtons(){
  const hide=$('#bEditorHide'),show=$('#bEditorShow');if(!hide||!show)return;
  const state=editorHideState(),hidden=state.stack.some(group=>group.some(r=>{const l=getLayer(r.lid);return l&&l.visible!==false&&C.evalLayerObjs(l,S.frame).some(o=>o.id===r.id);}));hide.disabled=!editorHideCandidates().length;show.disabled=!state.stack.length;
  const outlines=$('#bHiddenOutlines');if(outlines){outlines.hidden=!hidden;outlines.setAttribute('aria-pressed',String(state.outlines));outlines.title=state.outlines?'Hide hidden object outlines':'Show hidden object outlines';outlines.setAttribute('aria-label',outlines.title);}
}
function editorHiddenEntries(entries){return entries.map(e=>({...e,objs:e.objs.filter(o=>!editorObjectHidden(e.layer.id,o.id))}));}
function editorShowMenu(button){
  const state=editorHideState();showMenu(button,[{label:'Show last hidden',disabled:!state.stack.length,fn:()=>editorShow()}, {label:'Show all hidden',disabled:!state.stack.length,fn:()=>editorShow(true)},'-',{label:(state.outlines?'✓ ':'')+'Show hidden outlines',fn:()=>{state.outlines=!state.outlines;refreshEditorHideButtons();invalidate();}}]);
}
const editorHideNativeOverlay=drawOverlay;
drawOverlay=function(ctx){
  editorHideNativeOverlay(ctx);const state=editorHideState();if(!state.outlines)return;
  ctx.save();ctx.globalAlpha=.55;ctx.setLineDash([5,5]);
  for(const group of state.stack)for(const r of group){const l=getLayer(r.lid);if(!l)continue;const o=C.evalLayerObjs(l,S.frame).find(o=>o.id===r.id),corners=o&&worldCorners(o);if(!corners)continue;
    ctx.beginPath();corners.forEach((p,i)=>{const q=w2s(...p);i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#171721';ctx.lineWidth=1;ctx.stroke();
  }ctx.restore();
};

function editorHideCloneLayer(from,to){
  for(const group of editorHideState().stack)for(const r of group.slice())if(r.lid===from&&!group.some(q=>q.lid===to&&q.id===r.id))group.push({...r,lid:to});
}
