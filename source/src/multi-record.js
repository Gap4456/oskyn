/* A multi-anchor pass shares one clock, one undo and one Take per source layer.
   Each object still uses the existing per-channel pose merger. */
let MULTIREC=null;
function multiRecordContext(target,fn){
  const saved={takeId:REC.takeId,targetId:REC.targetId,baseLayer:REC.baseLayer,live:REC.live,mask:REC.mask,controlStart:REC.controlStart};
  Object.assign(REC,{takeId:target.lid,targetId:target.id,baseLayer:target.base,live:target.live,mask:target.mask,controlStart:target.start});
  try{return fn();}finally{Object.assign(REC,saved);}
}
function multiRecordPose(target,frame){return multiRecordContext(target,()=>recordMergePose(C.evalLayerObjs(target.base,frame).find(o=>o.id===target.id),target.live));}
function multiRecordValid(){return MULTIREC&&MULTIREC.doc===S.doc&&MULTIREC.targets.every(t=>getLayer(t.lid));}
function multiRecordPrepare(d){
  if(MULTIREC?.drag===d)return true;
  const refs=multiNodeRefs(),objects=multiNodeObjects().filter(o=>refs.some(r=>multiNodeSame(o,r)));
  if(objects.length<2||!refs.length)return false;
  if(objects.some(o=>{const l=getLayer(o.lid);return !l||l.locked||!l.visible||l.mask||o.o.bind||o.o.sbind||o.o.skin;})){
    S.drag=null;protest('Multi Record needs unlocked, visible vector paths without bone bindings or mask layers.');return false;
  }
  const mapping=new Map(),create=objects.some(o=>{const l=getLayer(o.lid);return !l.recordTake&&!/ — Take \d+$/.test(l.name);});
  if(create)recordHistory();
  for(const lid of new Set(objects.map(o=>o.lid))){
    const source=getLayer(lid);let take=source;
    if(!source.recordTake&&!/ — Take \d+$/.test(source.name)){
      take=clone(source);take.id=uid();take.visible=true;take.locked=false;take.recordTake=true;
      const name=source.name.replace(/ — Take \d+$/,'');let n=1;while(layers().some(l=>l.name===name+' — Take '+n))n++;
      take.name=name+' — Take '+n;source.visible=false;layers().splice(layers().indexOf(source)+1,0,take);editorHideCloneLayer(source.id,take.id);
    }mapping.set(lid,take);
  }
  const targets=objects.map(one=>{
    const lid=mapping.get(one.lid).id,base=clone(mapping.get(one.lid)),live=clone(C.evalLayerObjs(base,S.frame).find(o=>o.id===one.id));
    return {lid,id:one.id,base,live,start:clone(live),mask:{type:'node',nodes:refs.filter(r=>multiNodeSame(r,one)).map(r=>({ci:r.ci,ni:r.ni,keys:['x','y']}))}};
  });
  MULTIREC={doc:S.doc,drag:d,targets,append:false};
  S.sel=S.sel.map(r=>mapping.has(r.lid)?{...r,lid:mapping.get(r.lid).id}:r);
  S.multiNodeRefs=refs.map(r=>({...r,lid:mapping.get(r.lid).id}));d.lid=mapping.get(d.lid).id;S.layerId=d.lid;
  const primary=targets.find(t=>t.lid===d.lid&&t.id===d.id)||targets[0];
  Object.assign(REC,{doc:S.doc,drag:d,takeId:primary.lid,targetId:primary.id,baseLayer:primary.base,live:primary.live,mask:primary.mask,controlStart:primary.start,lastFrame:null,lastPose:null,creationUndo:create,append:false});
  buildLayerList();refreshProps();markDirty();return true;
}
function multiRecordWrite(frame,after=false){
  for(const lid of new Set(MULTIREC.targets.map(t=>t.lid))){
    const targets=MULTIREC.targets.filter(t=>t.lid===lid),source=targets[0].base,take=getLayer(lid),objs=clone(C.evalLayerObjs(source,frame));
    for(const target of targets){
      if(after&&target.hadAnimation)continue;
      const at=objs.findIndex(o=>o.id===target.id),pose=multiRecordPose(target,frame);if(at<0)objs.push(pose);else objs[at]=pose;
    }
    let key=C.kfAt(take,frame);if(!key){const original=C.kfAt(source,frame);key=original?clone(original):C.mkKf(frame);take.kfs.push(key);}
    key.objs=objs;key.tween='none';delete key.rot;C.sortKfs(take);
  }
}
const multiRecordNativePrepare=recordPrepareDrag;
recordPrepareDrag=function(d,w){
  if(REC.armed&&d.multiNode&&d.type==='node'&&d.part==='anchor'){
    if(MULTIREC?.drag===d)return true;if(Math.hypot(w.x-d.start.x,w.y-d.start.y)*S.view.z<3)return false;return multiRecordPrepare(d);
  }return multiRecordNativePrepare(d,w);
};
const multiRecordNativeCapture=recordCapture;
recordCapture=function(frame){
  if(!MULTIREC)return multiRecordNativeCapture(frame);
  if(!multiRecordValid())return;multiRecordWrite(frame);REC.lastFrame=frame;REC.lastPose=clone(REC.live);S.doc.frames=Math.max(S.doc.frames,frame+1);S.frame=frame;updateTime();keepPlayheadVisible();invalidate();
};
const multiRecordNativeAdvance=recordAdvance;
recordAdvance=function(now){
  if(!MULTIREC)return multiRecordNativeAdvance(now);if(!multiRecordValid())return false;
  const end=Math.min(899,REC.startFrame+Math.floor(recordElapsed(now)*REC.fps/1000));for(let f=REC.lastFrame+1;f<=end;f++)recordCapture(f);return end<899;
};
const multiRecordNativeBegin=recordBegin;
recordBegin=function(){
  if(!MULTIREC)return multiRecordNativeBegin();
  if(REC.running||!REC.armed||!REC.held||!REC.drag?.started||!multiRecordValid())return;
  if(S.frame>=899){protest('Record: the 900-frame timeline limit has been reached.');return;}
  if(!recordAudioReady()){recordAudioWait();return;}
  if(!REC.creationUndo)recordHistory();REC.creationUndo=false;
  const start=MULTIREC.append&&REC.lastFrame===S.frame?S.frame+1:S.frame;REC.startFrame=start;
  for(const t of MULTIREC.targets){t.base=clone(getLayer(t.lid));t.hadAnimation=multiRecordContext(t,()=>recordHadChannelAnimation());}
  for(const lid of new Set(MULTIREC.targets.map(t=>t.lid))){
    if(!start)continue;const take=getLayer(lid),source=MULTIREC.targets.find(t=>t.lid===lid).base,previous=C.kfFor(source,start-1);
    if(previous&&previous.tween!=='none')for(let f=previous.f;f<start;f++){
      let k=C.kfAt(take,f);if(!k){k=C.mkKf(f);take.kfs.push(k);}k.objs=clone(C.evalLayerObjs(source,f));k.tween='none';delete k.rot;
    }
    if(!C.kfAt(take,start-1))take.kfs.push(C.mkKf(start-1,clone(C.evalLayerObjs(source,start-1))));C.sortKfs(take);
  }
  REC.startFrame=start;REC.startedAt=performance.now();REC.fps=clamp(S.doc.fps,1,120);REC.running=true;
  try{recordAudioStart(start,REC.fps);}catch(error){recordAudioStop();REC.running=false;toast('Could not start audio: '+error.message);return;}
  recordCapture(start);recordSync();
  const tick=now=>{if(!REC.running)return;if(!recordAdvance(now)){recordStop();REC.held=false;toast('Record stopped at the 900-frame limit.');return;}REC.raf=requestAnimationFrame(tick);};REC.raf=requestAnimationFrame(tick);
};
const multiRecordNativeStop=recordStop;
recordStop=function(){
  if(!MULTIREC)return multiRecordNativeStop();recordAudioCancelWait();
  if(!REC.running){recordAudioStop();recordSync();return;}
  cancelAnimationFrame(REC.raf);recordAdvance(performance.now());if(multiRecordValid())recordCapture(REC.lastFrame);REC.running=false;recordAudioStop();
  if(multiRecordValid())for(let f=REC.lastFrame+1;f<S.doc.frames;f++)multiRecordWrite(f,true);
  MULTIREC.append=true;REC.append=true;setFrame(REC.startFrame);markDirty();commit();recordSync();refreshProps();
};
const multiRecordNativeFinish=recordFinishDrag;
recordFinishDrag=function(){multiRecordNativeFinish();MULTIREC=null;};
const multiRecordNativeEntries=recordEntries;
recordEntries=function(entries,frame){
  if(!MULTIREC||!REC.armed||frame!==S.frame)return multiRecordNativeEntries(entries,frame);
  return entries.map(e=>({...e,objs:e.objs.map(o=>{const target=MULTIREC.targets.find(t=>t.lid===e.layer.id&&t.id===o.id);return target?multiRecordPose(target,frame):o;})}));
};
const multiRecordNativeFind=findEval;
findEval=function(lid,id){const t=MULTIREC?.targets.find(t=>t.lid===lid&&t.id===id);return t&&REC.armed?multiRecordPose(t,S.frame):multiRecordNativeFind(lid,id);};
