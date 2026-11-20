
(function(){'use strict';
/* ===== Onionskyn app, part 1: state, helpers, history, stage rendering ===== */
const sessionPrefs={data:new Map(),getItem(key){return this.data.has(key)?this.data.get(key):null;},setItem(key,value){this.data.set(key,String(value));},removeItem(key){this.data.delete(key);}};
const C = window.FCCore;
const { uid, clamp, lerp, clone, matOf, mmul, minv, mapply, drawObj, hitObj, localBounds, worldBounds, worldCorners } = C;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const CW = 16, RH = 26, RULER = 24;
const LS_THEME = 'flashcraft.theme';
const APP_VERSION = '1.0.2', PROJECT_VERSION = 3;
/* diagnostics ring buffers + unsaved-work tracking */
const FCLOG = { errs: [], msgs: [] };
const logPush = (a, m) => { a.push(new Date().toISOString().slice(11, 19) + ' ' + String(m).slice(0, 240)); if (a.length > 15) a.shift(); };
window.addEventListener('error', (e) => logPush(FCLOG.errs, (e.message || 'error') + (e.filename ? ' @' + String(e.filename).split('/').pop() + ':' + e.lineno : '')));
window.addEventListener('unhandledrejection', (e) => logPush(FCLOG.errs, 'promise: ' + (e.reason && e.reason.message || e.reason)));
let unsaved = false, lastSaveAt = Date.now(), nagAt = 0, autosaveWarned = false;
let desktopCloseBridge = null, desktopSaveInProgress = false;
function notifyDesktopDirty() {
  if (!desktopCloseBridge) return;
  try { desktopCloseBridge.setDirty(anyProjectsDirty()); }
  catch (_) { desktopCloseBridge = null; } // Keep the browser close guard if IPC fails.
}
function initDesktopClose() {
  const bridge = window.onionskynDesktop;
  if (!bridge || !['setDirty','onSaveBeforeClose','saveRequestResult'].every(key => typeof bridge[key] === 'function')) return;
  try {
    bridge.onSaveBeforeClose(async () => {
      if (desktopSaveInProgress) return;
      desktopSaveInProgress = true;
      let ok = false, count = 1;
      try {
        if (REC.armed) recordSetArmed(false);
        // Electron waits for the download's completed event before closing.
        // Keep dirty true here so cancelling/failing the file dialog stays safe.
        if(bridge.saveAllBeforeClose){const result=await saveAllProjectsBeforeClose();ok=result.ok;count=result.count;}
        else if(inactiveProjectsDirty())toast('Save the other open projects before closing the app.');
        else ok = await saveProject({ keepDirty: true });
      } catch (error) {
        logPush(FCLOG.errs,'Save before close: '+String(error && error.message || error));
      } finally {
        desktopSaveInProgress = false;
        bridge.saveRequestResult(!!ok,count);
      }
    });
    bridge.setDirty(anyProjectsDirty());
    desktopCloseBridge = bridge;
  } catch (_) { desktopCloseBridge = null; }
}
function markDirty() { S.changeSerial=(S.changeSerial||0)+1; if (!unsaved) { unsaved = true; notifyDesktopDirty(); lastSaveAt = Date.now(); const b = document.getElementById('mFile'); if (b) b.classList.add('dirty'); } }
function clearDirty() { unsaved = false; invalidate(); notifyDesktopDirty(); lastSaveAt = Date.now(); const b = document.getElementById('mFile'); if (b) b.classList.remove('dirty'); }
window.addEventListener('beforeunload', (e) => { if (anyProjectsDirty() && !desktopCloseBridge) { e.preventDefault(); e.returnValue = ''; } });
setInterval(() => {
  const now = Date.now();
  if (unsaved && now - lastSaveAt > 600000 && now - nagAt > 600000) { nagAt = now; toast('You have unsaved changes. File → Save project (Ctrl+S) keeps a copy you can reopen anywhere.'); }
}, 60000);

const S = {
  doc: null, frame: 0, layerId: null, tool: 'select', sel: [], view: { z: 1, px: 0, py: 0 },
  style: { font: 'Arial', size: 32, bold: false, italic: false, align: 'left', fill: '#3F5BFF', fillOn: true, fa: 1, stroke: '#1B2030', strokeOn: true, sa: 1, sw: 2, cap: 'round', join: 'round', dash: 'solid', radius: 0, smooth: 40, bsize: 14, esize: 20, bshape: 'round', bpress: true, bangle: 0, bcolor: '#3F5BFF', fb: { size: 12, stab: 25, smooth: 50, round: 100, angle: 0, taper: 25, vel: 0, press: 100, zoom: true, color: '#3F5BFF', alpha: 100, merge: true }, bmerge: true, bgap: 'small', ball: false, fillType: 'solid', gradEdit: true },
  onion: { on: false, b: 1, a: 1 }, playing: false, loop: true, pen: null, draw: null, drag: null, nodeSel: null,
  edit: [], space: false, clipboard: [], cursorW: { x: 0, y: 0 }, autoFit: true
};
const hctx = document.createElement('canvas').getContext('2d');
C.setMeasure(hctx);
let CSSV = {};
function readTheme() {
  const cs = getComputedStyle(document.documentElement);
  const g = (n) => cs.getPropertyValue(n).trim();
  CSSV = {
    pasteboard: g('--pasteboard'), accent: g('--accent'), accentFg: g('--accent-fg'), playhead: g('--playhead'), line: g('--line'), line2: g('--line2'),
    cell: g('--cell'), cell5: g('--cell5'), motion: g('--motion'), shape: g('--shape'), held: g('--held'), key: g('--key'), fg: g('--fg'), mut: g('--mut'), panel: g('--panel')
  };
}

/* ---------- lookups ---------- */
const layers = () => { C.setSkeletonScope(S.doc.layers); return S.doc.layers; };
const getLayer = (id) => layers().find((l) => l.id === id);
const curLayer = () => getLayer(S.layerId) || layers()[layers().length - 1];
const fnum = (f) => f + 1;
function findEval(lid, id) {
  if (REC.live && lid === REC.takeId && id === REC.targetId) return recordPoseAt(S.frame);
  const l = getLayer(lid);
  if (!l || l.visible === false) return null;
  return C.evalLayerObjs(l, S.frame).find((o) => o.id === id) || null;
}
function findEditable(lid, id) {
  if (REC.live && lid === REC.takeId && id === REC.targetId) return REC.live;
  const l = getLayer(lid);
  const kf = l && C.kfFor(l, S.frame);
  const o=(kf&&kf.objs.find(o=>o.id===id))||null;
  if(o?.kind==='image'&&!o.contours)o.contours=C.imageContours(o);
  if(o?.sbind&&!SK.baseline.has(o.id)) {
    const pose=C.evalLayerObjs(l,S.frame).find(p=>p.id===id);
    if(pose){o.t={...pose.t};SK.baseline.set(o.id,JSON.stringify(o.t));}
  }
  return o;
}
function selEval() {
  const out = [];
  for (const s of S.sel) { const o = findEval(s.lid, s.id); if (o&&!editorObjectHidden(s.lid,s.id)) out.push({ lid: s.lid, id: s.id, o }); }
  return out;
}
function nodeEditable(o) {return o&&(o.kind==='path'||o.kind==='image');}
function singleSel() { const a = selEval(); return a.length === 1 ? a[0] : null; }
function pruneSel() { S.sel = S.sel.filter((s) => findEval(s.lid, s.id)&&!editorObjectHidden(s.lid,s.id)); if (!nodeEditable(singleSel()?.o)) S.nodeSel = null; }
function walkPaths(o, fn) {
  if(o.mirror)return;
  if (o.kind === 'image') return;
  if (o.kind === 'group') o.children.forEach((c) => walkPaths(c, fn));
  else if (o.kind === 'text') { const b = o.fill; fn(o); if (o.fill && o.fill !== b) o.runs.forEach((r) => { r.c = o.fill; }); }
  else if (o.kind !== 'clip') fn(o);
}

/* ---------- history ---------- */
const H = { stack: [], redo: [] };
/* Hold-Q performance recording. Live drag references never point into saved poses. */
const REC = { armed:false, running:false, held:false, live:null, drag:null,
  takeId:null, targetId:null, baseLayer:null, doc:null, raf:0, writingHistory:false,
  creationUndo:false, lastFrame:null, lastPose:null, mask:null, controlStart:null, append:false };
/* Timeline sound monitoring for hold-Q recording; no scripts or microphone run. */
const REC_AUDIO = { enabled:true, context:null, cache:new Map(), voices:new Set(),
  waiting:false, request:0, clock:null, lastError:'' };
try { REC_AUDIO.enabled=sessionPrefs.getItem('onionskyn.recordAudio')!=='0'; } catch (_) {}
function recordAudioSync() {
  const b=$('#pRecordAudio');if(!b)return;
  b.setAttribute('aria-pressed',String(REC_AUDIO.enabled));
  b.title='Hear Frame → Sound timeline audio while holding Q to record. '+(REC_AUDIO.enabled?'On':'Off');
}
function recordAudioRecords() {
  const sounds=S.doc?.sounds||{},records=[];
  for(const layer of S.doc?.layers||[]) {
    if(layer.visible===false)continue;
    for(const key of layer.kfs) {
      const sd=key.sound;if(!sd)continue;
      let name=sd.name;
      if(!sounds[name])name=Object.keys(sounds).find(n=>(sounds[n].ids||[]).includes(sd.name)||n.split('/').pop().replace(/\.[^.]+$/,'')===sd.name);
      if(name&&sounds[name]?.b64)records.push({layer:layer.id,frame:key.f,name,sd});
    }
  }
  return records;
}
function recordAudioStop() {
  for(const source of REC_AUDIO.voices){try{source.stop();}catch(_){}try{source.disconnect();}catch(_){}}
  REC_AUDIO.voices.clear();REC_AUDIO.clock=null;
}
function recordAudioCancelWait() {
  REC_AUDIO.request++;REC_AUDIO.waiting=false;
}
function recordAudioReset() {
  recordAudioCancelWait();recordAudioStop();
  const context=REC_AUDIO.context;REC_AUDIO.context=null;REC_AUDIO.cache.clear();REC_AUDIO.lastError='';
  if(context)context.close().catch(()=>{});
}
function recordAudioPrune() {
  const sounds=S.doc?.sounds||{};
  for(const [name,item] of REC_AUDIO.cache)if(!sounds[name]||item.b64!==sounds[name].b64||item.mime!==sounds[name].mime)REC_AUDIO.cache.delete(name);
}
async function recordAudioPrepare() {
  if(!REC_AUDIO.enabled)return true;
  recordAudioPrune();
  const records=recordAudioRecords();if(!records.length)return true;
  try {
    let context=REC_AUDIO.context;
    if(!context||context.state==='closed') {
      const AudioContext=window.AudioContext||window.webkitAudioContext;
      if(!AudioContext)throw Error('Audio playback is unavailable in this browser.');
      context=new AudioContext();REC_AUDIO.context=context;
    }
    const resumed=context.state==='running'?Promise.resolve():context.resume();
    const sounds=S.doc.sounds||{},names=new Set(records.map(r=>r.name));
    for(const [name,item] of REC_AUDIO.cache)if(!sounds[name]||item.b64!==sounds[name].b64||item.mime!==sounds[name].mime)REC_AUDIO.cache.delete(name);
    const loads=[];
    for(const name of names) {
      const sound=sounds[name];let item=REC_AUDIO.cache.get(name);
      if(!item) {
        item={b64:sound.b64,mime:sound.mime,buffer:null,error:null,promise:null};
        const binary=atob(sound.b64),bytes=new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
        item.promise=context.decodeAudioData(bytes.buffer).then(buffer=>{item.buffer=buffer;},error=>{item.error=error;});
        REC_AUDIO.cache.set(name,item);
      }
      loads.push(item.promise);
    }
    await Promise.all([resumed,...loads]);
    if(REC_AUDIO.context!==context)return false;
    const failed=[...names].find(name=>REC_AUDIO.cache.get(name)?.error);
    if(failed)throw Error('Could not decode '+failed+'. Turn Audio off to record silently.');
    if(context.state!=='running')throw Error('Audio is paused by the browser. Click Audio off/on and try again.');
    REC_AUDIO.lastError='';return true;
  } catch(error) { REC_AUDIO.lastError=String(error&&error.message||error);return false; }
}
function recordAudioReady() {
  if(!REC_AUDIO.enabled)return true;
  const records=recordAudioRecords();if(!records.length)return true;
  if(REC_AUDIO.context?.state!=='running')return false;
  return records.every(r=>{const s=S.doc.sounds[r.name],item=REC_AUDIO.cache.get(r.name);return item?.buffer&&item.b64===s.b64&&item.mime===s.mime;});
}
function recordAudioWait() {
  if(REC_AUDIO.waiting)return;
  REC_AUDIO.waiting=true;const request=++REC_AUDIO.request;recordSync();
  recordAudioPrepare().then(ok=>{
    if(request!==REC_AUDIO.request)return;
    REC_AUDIO.waiting=false;recordSync();
    if(!ok){REC.held=false;toast(REC_AUDIO.lastError||'Could not prepare recording audio.');return;}
    if(REC.armed&&REC.held&&REC.live&&!REC.running)recordBegin();
  });
}
function recordAudioCues(fps, records=recordAudioRecords(), cache=REC_AUDIO.cache) {
  const cues=[],active=new Map();
  for(const r of records.slice().sort((a,b)=>a.frame-b.frame)) {
    const buffer=cache.get(r.name)?.buffer;if(!buffer||!buffer.duration)continue;
    const time=r.frame/fps,key=r.layer+'\0'+r.name,previous=active.get(key),sync=r.sd.sync||'event';
    if(sync==='stop'){if(previous)previous.end=Math.min(previous.end,time);continue;}
    if(sync==='start'&&previous&&previous.end>time)continue;
    if(sync==='stream'&&previous)previous.end=Math.min(previous.end,time);
    const loops=r.sd.loop===-1?Infinity:Math.max(0,Math.min(99,r.sd.loop|0))+1;
    const cue={name:r.name,buffer,start:time,end:time+buffer.duration*loops,loop:loops>1};
    cues.push(cue);active.set(key,cue);
  }
  return cues;
}
function recordAudioStart(frame,fps) {
  recordAudioStop();
  if(!REC_AUDIO.enabled||!REC_AUDIO.context||!recordAudioRecords().length)return;
  stopAudition();
  const context=REC_AUDIO.context,position=frame/fps,epoch=context.currentTime+0.025;
  REC_AUDIO.clock={context,epoch};
  for(const cue of recordAudioCues(fps)) {
    if(cue.end<=position||cue.start>=900/fps)continue;
    const from=Math.max(position,cue.start),duration=Math.min(cue.end,900/fps)-from;
    if(duration<=0)continue;
    const source=context.createBufferSource();source.buffer=cue.buffer;source.loop=cue.loop;
    source.connect(context.destination);REC_AUDIO.voices.add(source);
    source.onended=()=>{REC_AUDIO.voices.delete(source);try{source.disconnect();}catch(_){}};
    const offset=(from-cue.start)%cue.buffer.duration;
    try { source.start(epoch+Math.max(0,cue.start-position),offset,duration); }
    catch(error){REC_AUDIO.voices.delete(source);source.disconnect();throw error;}
  }
}
function recordElapsed(now) {
  const clock=REC_AUDIO.clock;
  return clock?Math.max(0,(clock.context.currentTime-clock.epoch)*1000):Math.max(0,now-REC.startedAt);
}

const recordDragTypes = new Set(['move','node','curve-bend','scale','rotate','skeleton','arc-mouth']);
// A pass owns only the coordinates manipulated by its drag. All other channels
// are evaluated from the immutable Take snapshot at the current frame.
function recordMaskNode(ci,ni,keys) {
  let part=REC.mask.nodes.find(p=>p.ci===ci&&p.ni===ni);
  if(!part){part={ci,ni,keys:[]};REC.mask.nodes.push(part);}
  for(const key of keys)if(!part.keys.includes(key))part.keys.push(key);
}
function recordBuildMask(d,pose) {
  REC.mask={type:d.type,nodes:[]};
  if(d.type==='arc-mouth')REC.mask.arcEdge=d.edge;
  if(d.type==='skeleton'){REC.mask.joints=pose.skel.nodes.some(n=>n.pin)?Array.from(new Set([d.joint,...pose.skel.nodes.filter(n=>n.pin).map(n=>n.id)])):skeletonOwned(pose.skel,d.joint);REC.mask.root=pose.skel.nodes.find(n=>n.id===d.joint)?.parent==null;REC.mask.joint=d.joint;}
  if(d.type==='node') {
    if(d.part==='anchor') {
      const keys=d.groupKeys?.length?d.groupKeys:[d.ci+':'+d.ni];
      for(const key of keys){const p=kNodeFromKey(key);recordMaskNode(p.ci,p.ni,['x','y']);}
    } else {
      const mine=d.part==='out'?'o':'i';recordMaskNode(d.ci,d.ni,[mine+'x',mine+'y','s']);
    }
  } else if(d.type==='curve-bend') {
    recordMaskNode(d.ci,d.ni,['ox','oy','s']);
    recordMaskNode(d.ci,(d.ni+1)%pose.contours[d.ci].nodes.length,['ix','iy','s']);
  }
}
function recordObserveDrag(e) {
  const d=REC.drag;
  if(d?.type==='skeleton'&&REC.mask&&REC.live?.skel&&(REC.live.skel.nodes.some(n=>n.pin)||C.skeletonRigidGroups(REC.live.skel).length))for(const n of REC.live.skel.nodes){const before=REC.controlStart?.skel.nodes.find(q=>q.id===n.id);if(before&&Math.hypot(n.x-before.x,n.y-before.y)>1e-8&&!REC.mask.joints.includes(n.id))REC.mask.joints.push(n.id);}
  if(!REC.mask||!d||d.type!=='node'||d.part==='anchor')return;
  // Smooth handles are coupled by the editing tool. Explicitly include both
  // when the current gesture moves both; unrelated adjacent handles stay free.
  if(d.n?.s&&!e.altKey)recordMaskNode(d.ci,d.ni,['ix','iy','ox','oy','s']);
}
function recordMergePose(base,control) {
  const out=clone(base||REC.controlStart||control),mask=REC.mask;
  if(!mask||!control)return out;
  if(mask.type==='skeleton'){
    const byId=new Map(out.skel.nodes.map(n=>[n.id,n])),live=new Map(control.skel.nodes.map(n=>[n.id,n])),original=new Map(out.skel.nodes.map(n=>[n.id,{...n}]));
    const anchors=new Set(control.skel.nodes.filter(n=>n.parent==null||n.spring).map(n=>n.id));
    for(const n of out.skel.nodes)if(mask.joints.includes(n.id)) {
      const q=live.get(n.id);if(!q)continue;
      if(mask.root&&!control.skel.nodes.some(n=>n.pin)) {
        let a=n;while(a.parent!=null&&!anchors.has(a.id))a=byId.get(a.parent);
        const from=original.get(a.id),to=live.get(a.id);
        n.x=original.get(n.id).x+to.x-from.x;n.y=original.get(n.id).y+to.y-from.y;
      } else {n.x=q.x;n.y=q.y;}
    }
    C.skeletonBuild(out);
  } else if(mask.type==='arc-mouth') {
    if(!out.arc||!control.arc)return out;
    const turn=2*Math.PI,max=359*Math.PI/180,baseStart=out.arc.start,align=turn*Math.round((baseStart-control.arc.start)/turn);
    if(mask.arcEdge===0){const end=baseStart+out.arc.mouth;out.arc.start=control.arc.start+align;out.arc.mouth=clamp(end-out.arc.start,0,max);}
    else {const end=control.arc.start+control.arc.mouth+align;out.arc.mouth=clamp(end-baseStart,0,max);}
    out.contours=[C.mouthContour(out.arc)];
  } else if(mask.type==='move') {
    out.t.x=control.t.x;out.t.y=control.t.y;
  } else if(mask.type==='rotate'||mask.type==='scale') {
    // Rotation/scaling can be layered over an existing position animation.
    const anchor=mask.type==='scale'&&REC.drag?.recordAnchor?REC.drag.recordAnchor:getPivot(out);
    const world=mapply(matOf(out.t),anchor[0],anchor[1]);
    if(mask.type==='rotate')out.t.r=control.t.r;
    else {out.t.sx=control.t.sx;out.t.sy=control.t.sy;}
    const changed=mapply(matOf(out.t),anchor[0],anchor[1]);
    out.t.x+=world[0]-changed[0];out.t.y+=world[1]-changed[1];
  } else for(const part of mask.nodes) {
    const target=out.contours?.[part.ci]?.nodes[part.ni],source=control.contours?.[part.ci]?.nodes[part.ni];
    if(!target||!source)continue;
    for(const key of part.keys){if(source[key]===undefined)delete target[key];else target[key]=source[key];}
  }
  C.constrainImageMask(out);return out;
}
function recordPoseAt(frame) {
  const base=C.evalLayerObjs(REC.baseLayer,frame).find(o=>o.id===REC.targetId);
  return recordMergePose(base,REC.live);
}
function recordHadChannelAnimation() {
  const signature=o=>{
    if(!o)return null;
    const type=REC.mask.type;
    if(type==='skeleton'){const ids=REC.mask.root?o.skel.nodes.filter(n=>n.parent==null||n.spring).map(n=>n.id):REC.mask.joints;return JSON.stringify(ids.map(id=>{const n=o.skel?.nodes.find(n=>n.id===id);return n?[n.x,n.y]:null;}));}
    if(type==='arc-mouth'){if(!o.arc)return null;const angle=o.arc.start+(REC.mask.arcEdge?o.arc.mouth:0);return Math.atan2(Math.sin(angle),Math.cos(angle)).toFixed(9);}
    if(type==='move')return JSON.stringify([o.t.x,o.t.y]);
    if(type==='rotate')return JSON.stringify([o.t.r]);
    if(type==='scale')return JSON.stringify([o.t.sx,o.t.sy]);
    return JSON.stringify(REC.mask.nodes.map(p=>p.keys.filter(k=>k!=='s').map(k=>o.contours?.[p.ci]?.nodes[p.ni]?.[k]||0)));
  };
  const source=REC.baseLayer,frames=new Set([REC.startFrame]);
  source.kfs.forEach((k,i)=>{frames.add(k.f);const next=source.kfs[i+1];if(next&&k.tween!=='none')frames.add((k.f+next.f)/2);});
  const first=signature(C.evalLayerObjs(source,REC.startFrame).find(o=>o.id===REC.targetId));
  for(const f of frames)if(signature(C.evalLayerObjs(source,f).find(o=>o.id===REC.targetId))!==first)return true;
  return false;
}

function recordSync() {
  const button=$('#pRecord'),status=$('#hRecord');if(!button)return;
  button.setAttribute('aria-pressed',String(REC.armed));
  button.classList.toggle('recording',REC.running);
  button.textContent=REC.running?'● REC':REC.armed?'● Record · Q':'● Record';
  button.title=REC.armed?'Drag an object, selected anchors across figures, a curve or an ellipse mouth handle and hold Q to record. Click to leave Record mode.':'Enable performance recording (hold Q while dragging)';
  if(status){status.hidden=!REC.armed;status.textContent=REC.running?'● Recording · release Q to pause':REC_AUDIO.waiting?'Audio loading… keep Q held':'Overdub ready · drag + hold Q';}
}
function recordHistory() {
  REC.writingHistory=true;try{pushUndo();}finally{REC.writingHistory=false;}
}
function recordSetArmed(on) {
  if(!on){recordStop();recordFinishDrag();REC.armed=false;REC.held=false;REC.takeId=null;REC.targetId=null;REC.baseLayer=null;REC.doc=null;REC.mask=null;REC.controlStart=null;REC.lastPose=null;REC.append=false;recordAudioCancelWait();recordAudioStop();if(REC_AUDIO.context?.state==='running')REC_AUDIO.context.suspend().catch(()=>{});recordSync();return;}
  if(S.playing)stopPlay();
  REC.armed=true;recordSync();recordAudioPrepare();
  toast('Record: choose a start frame, drag a figure/node/curve and hold Q. New passes preserve other recorded movement in the same Take. ♪ Audio follows Frame → Sound cues.');
}
function recordValid() {
  return REC.doc===S.doc && getLayer(REC.takeId) && REC.baseLayer;
}
function recordPrepareDrag(d,w) {
  if(!REC.armed||!recordDragTypes.has(d.type))return false;
  if(REC.drag===d&&REC.live)return true;
  if(Math.hypot(w.x-d.start.x,w.y-d.start.y)*S.view.z<3)return false;
  const one=singleSel(),source=one&&getLayer(one.lid);
  if(d.type==='skeleton'&&d.mode!=='pose'){S.drag=null;protest('Leave Record mode, then switch to Animate using the hand icon.');return false;}
  if(!one||!source||source.locked||!source.visible||source.mask||one.o.rig||one.o.bind||one.o.sbind){
    S.drag=null;protest('Record: select one unlocked figure on an artwork layer. Bone-bound artwork and mask layers are not supported yet.');return false;
  }
  REC.creationUndo=false;REC.append=false;
  if(!recordValid()||one.lid!==REC.takeId||one.id!==REC.targetId){
    let take=source;
    if(!source.recordTake&&!/ — Take \d+$/.test(source.name)){
      recordHistory();REC.creationUndo=true;
      take=clone(source);take.id=uid();take.visible=true;take.locked=false;take.recordTake=true;
      const baseName=source.name.replace(/ — Take \d+$/,'');
      let number=1;while(layers().some(l=>l.name===baseName+' — Take '+number))number++;
      take.name=baseName+' — Take '+number;
      source.visible=false;layers().splice(layers().indexOf(source)+1,0,take);editorHideCloneLayer(source.id,take.id);
      S.layerId=take.id;S.sel=[{lid:take.id,id:one.id}];S.fsel=null;
      buildLayerList();markDirty();
    }
    REC.takeId=take.id;REC.targetId=one.id;REC.doc=S.doc;REC.lastFrame=null;REC.lastPose=null;
  }
  REC.baseLayer=clone(getLayer(REC.takeId));
  const pose=C.evalLayerObjs(REC.baseLayer,S.frame).find(o=>o.id===REC.targetId);
  if(!pose){S.drag=null;return false;}
  REC.live=clone(pose);REC.controlStart=clone(pose);REC.drag=d;recordBuildMask(d,pose);
  if(d.lid)d.lid=REC.takeId;
  return true;
}
function recordDragEditable(layer,frame) {
  if(REC.live&&REC.drag===S.drag&&layer&&layer.id===REC.takeId)return C.kfFor(layer,frame);
  return C.ensureEditable(layer,frame);
}
function skeletonLiveEntries(entries,live) {
  if(!live?.skel)return entries;
  return entries.map(e=>({...e,objs:e.objs.map(o=>o.skin?.to===live.id?C.softPoseObject(o,live):o.sbind?.to===live.id?C.skeletonPoseObject(o,C.skeletonBoundPose(o,live)):o)}));
}
function recordEntries(entries,frame) {
  if(!REC.live||!REC.armed||frame!==S.frame)return entries;
  const live=recordPoseAt(frame);
  return skeletonLiveEntries(entries.map(e=>e.layer.id!==REC.takeId?e:{...e,objs:e.objs.map(o=>o.id===REC.targetId?live:o)}),live);
}
function recordPutKey(frame,control,restore=false) {
  const take=getLayer(REC.takeId);if(!take)return;
  const source=REC.baseLayer,objs=clone(C.evalLayerObjs(source,frame));
  const at=objs.findIndex(o=>o.id===REC.targetId);
  let pose=at<0?null:objs[at];
  if(!restore){
    pose=recordMergePose(pose,control);
    if(at<0)objs.push(pose);else objs[at]=pose;
  }
  let key=C.kfAt(take,frame);
  if(!key){const original=C.kfAt(source,frame);key=original?clone(original):C.mkKf(frame);take.kfs.push(key);}
  key.objs=objs;key.tween='none';delete key.rot;C.sortKfs(take);
  return pose;
}
function recordCapture(frame) {
  const pose=recordPutKey(frame,REC.live);
  REC.lastFrame=frame;REC.lastPose=clone(pose);
  S.doc.frames=Math.max(S.doc.frames,frame+1);S.frame=frame;
  updateTime();keepPlayheadVisible();invalidate();
}
function recordAdvance(now) {
  if(!recordValid()||!REC.live)return false;
  const target=Math.min(899,REC.startFrame+Math.floor(recordElapsed(now)*REC.fps/1000));
  for(let frame=REC.lastFrame+1;frame<=target;frame++)recordCapture(frame);
  return target<899;
}
function recordBegin() {
  if(REC.running||!REC.armed||!REC.held||!REC.live||!REC.drag?.started||!recordValid())return;
  if(S.frame>=899){protest('Record: the 900-frame timeline limit has been reached.');return;}
  if(!recordAudioReady()){recordAudioWait();return;}
  if(!REC.creationUndo)recordHistory();REC.creationUndo=false;
  const take=getLayer(REC.takeId);
  const start=REC.append&&REC.lastFrame===S.frame?S.frame+1:S.frame;
  REC.baseLayer=clone(take);
  // Preserve every existing integer-frame pose before a punch-in. Sampling
  // the affected tween first avoids changing its easing when a key is inserted.
  if(start>0){
    const previous=C.kfFor(take,start-1),preserved=[];
    if(previous&&previous.tween!=='none'){
      for(let f=previous.f+1;f<start;f++)if(!C.kfAt(take,f))preserved.push(C.mkKf(f,clone(C.evalLayerObjs(take,f))));
      previous.tween='none';delete previous.rot;
    }
    take.kfs.push(...preserved);C.sortKfs(take);
    if(!C.kfAt(take,start-1)){take.kfs.push(C.mkKf(start-1,clone(C.evalLayerObjs(take,start-1))));C.sortKfs(take);}
  }
  REC.startFrame=start;REC.startedAt=performance.now();REC.fps=clamp(S.doc.fps,1,120);REC.running=true;
  try { recordAudioStart(start,REC.fps); } catch(error) { recordAudioStop(); REC.running=false; toast('Could not start audio: '+String(error.message||error)); return; }
  clearTimeout(saveTimer);recordCapture(start);recordSync();
  const tick=now=>{
    if(!REC.running)return;
    if(!recordAdvance(now)){recordStop();REC.held=false;toast('Record stopped at the 900-frame limit.');return;}
    REC.raf=requestAnimationFrame(tick);
  };
  REC.raf=requestAnimationFrame(tick);
}
function recordStop() {
  recordAudioCancelWait();
  if(!REC.running){recordAudioStop();recordSync();return;}
  cancelAnimationFrame(REC.raf);recordAdvance(performance.now());
  // Store the final mouse pose in the current sampled frame as well.
  if(recordValid()&&REC.live)recordCapture(REC.lastFrame);
  REC.running=false;recordAudioStop();
  if(recordValid()&&REC.lastPose&&REC.lastFrame<899){
    const next=REC.lastFrame+1;
    if(next<S.doc.frames){
      if(recordHadChannelAnimation()){
        // Overwrite an existing channel only inside the Q-held interval.
        // Restore the prior take at the first following frame.
        if(!C.kfAt(REC.baseLayer,next)){
          const after=REC.baseLayer.kfs.find(k=>k.f>next);
          const end=after?Math.min(after.f-1,S.doc.frames-1):next;
          for(let f=next;f<=end;f++)recordPutKey(f,null,true);
        }
      } else {
        // A newly animated channel holds its last value; every previously
        // recorded node/handle/transform continues from this pass's snapshot.
        let previous=JSON.stringify(C.kfAt(getLayer(REC.takeId),REC.lastFrame).objs);
        for(let f=next;f<S.doc.frames;f++){
          const objects=clone(C.evalLayerObjs(REC.baseLayer,f)),at=objects.findIndex(o=>o.id===REC.targetId);
          const pose=recordMergePose(at<0?null:objects[at],REC.live);
          if(at<0)objects.push(pose);else objects[at]=pose;
          const current=JSON.stringify(objects);
          if(C.kfAt(REC.baseLayer,f)||current!==previous)recordPutKey(f,REC.live);
          previous=current;
        }
      }
    }
  }
  REC.append=true;
  setFrame(REC.startFrame);
  markDirty();commit();recordSync();refreshProps();
}
function recordFinishDrag() {
  recordStop();
  if(REC.drag===S.drag)S.drag=null;
  REC.live=null;REC.drag=null;REC.mask=null;REC.controlStart=null;REC.append=false;REC.creationUndo=false;invalidate();
}
function recordField(target) {return target&&(target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));}
window.addEventListener('keydown',e=>{
  if(!REC.armed)return;
  if(e.key==='Escape'){
    e.preventDefault();e.stopImmediatePropagation();recordSetArmed(false);return;
  }
  if(e.key.toLowerCase()==='q'&&!e.ctrlKey&&!e.metaKey&&!recordField(e.target)&&!modalBg.classList.contains('on')){
    e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){REC.held=true;recordBegin();}return;
  }
  if((REC.running || (REC.live && REC.drag))&&!['Shift','Alt','Control','Meta'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();}
},true);
window.addEventListener('keyup',e=>{
  if(e.key.toLowerCase()==='q'&&(REC.held||REC.running)){
    e.preventDefault();e.stopImmediatePropagation();REC.held=false;recordStop();
  }
},true);
window.addEventListener('blur',()=>{REC.held=false;recordFinishDrag();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){REC.held=false;recordFinishDrag();}});

let editGesture = false;
/* ---- symbol editing: while inside a symbol, doc.layers/frames are swapped for the symbol's own; unwind() restores the scene for saving */
function enterSymRaw(sym) {
  const lib = S.doc.lib && S.doc.lib[sym];
  if (!lib) return false;
  S.edit.push({ sym, layers: S.doc.layers, frames: S.doc.frames, frame: S.frame, layerId: S.layerId });
  S.doc.layers = lib.layers; S.doc.frames = Math.max(1, lib.frames || 1);
  return true;
}
function exitSymRaw() {
  const e = S.edit.pop();
  if (!e) return null;
  S.doc.lib[e.sym].frames = S.doc.frames;
  S.doc.layers = e.layers; S.doc.frames = e.frames;
  return e;
}
function unwind() { const p = S.edit.map((e) => e.sym); while (S.edit.length) exitSymRaw(); return p; }
function rewind(p) { for (const s of p) if (!enterSymRaw(s)) break; }
const noSounds = (k, v) => (k === 'sounds' ? undefined : v);
const noMedia = (k, v) => (k === 'sounds' || k === 'images' ? undefined : v);
const metaImages = (v) => Object.fromEntries(Object.entries(v).map(([n, s]) => [n, { name: s.name, mime: s.mime, w: s.w, h: s.h, size: s.size, ext: 1 }]));
const metaSounds = (k, v) => (k === 'images' && v ? metaImages(v) : k === 'sounds' && v ? Object.fromEntries(Object.entries(v).map(([n, s]) => [n, { name: s.name, mime: s.mime, ids: s.ids, size: s.size, ext: 1 }])) : v);
const snap = () => { const p = unwind(); const str = JSON.stringify({ doc: S.doc, frame: S.frame, layerId: S.layerId, path: p, nodeEdit:S.tool==='node'&&S.sel.length>1?{sel:S.sel,refs:S.multiNodeRefs||[]}:undefined }, noMedia); rewind(p); return str; };
function pushUndo() {
  if (REC.live && REC.drag === S.drag && !REC.writingHistory) return;
  markDirty();
  const s = snap();
  H.stack.push(s);
  const cap = s.length > 1500000 ? 10 : 60;
  while (H.stack.length > cap) H.stack.shift();
  H.redo.length = 0;
  updateHistoryButtons();
}
function restoreSnap(str) {
  const o = JSON.parse(str);
  o.doc.sounds = S.doc.sounds || {}; o.doc.images = S.doc.images || {};
  clearTimeout(SK.badgeTimer);SK.badgeTimer=0;SK.rigidPick=null;SK.angleEdit=null;SK.angleHover=null;SK.baseline.clear();SK.placeReady=false;SK.add=false;SK.binding=false;SK.bindTarget=null;SK.hover=null;SK.dismissed=null;SK.actionDrag=null;S.drag=null;
  S.doc = o.doc; C.setLib(S.doc.lib); C.setImages(S.doc.images); S.edit = []; rewind(o.path || []); S.frame = clamp(o.frame, 0, S.doc.frames - 1);
  S.layerId = getLayer(o.layerId) ? o.layerId : layers()[layers().length - 1].id;
  S.multiNodeRefs=o.nodeEdit?.refs||[];if(o.nodeEdit)S.sel=o.nodeEdit.sel;
  pruneSel();
  if(singleSel()?.o.star&&S.tool==='node')setTool('select');
  refreshAll();
}
function undo() { if (REC.armed) recordSetArmed(false); if (!H.stack.length) return; markDirty(); H.redo.push(snap()); restoreSnap(H.stack.pop()); updateHistoryButtons(); }
function redo() { if (REC.armed) recordSetArmed(false); if (!H.redo.length) return; markDirty(); H.stack.push(snap()); restoreSnap(H.redo.pop()); updateHistoryButtons(); }
function updateHistoryButtons() { for(const id of ['#bUndo','#pUndo'])$(id).disabled = !H.stack.length; for(const id of ['#bRedo','#pRedo'])$(id).disabled = !H.redo.length; }
/* push undo once per gesture (a drag, a slider sweep, a typed value) */
function beginEditOnce() { if (!editGesture) { pushUndo(); editGesture = true; } }
['pointerup', 'change', 'blur'].forEach((ev) => window.addEventListener(ev, () => { editGesture = false; }, true));
/* a key press ends the edit gesture, except while typing in a text field: there the gesture stays open until a short pause, so a burst of typing is one undo step */
let gestureTimer = 0;
window.addEventListener('keyup', (e) => {
  const t = e.target, typing = t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && /^(text|search|url|email|tel|password)?$/.test(t.type || '')));
  clearTimeout(gestureTimer);
  if (typing) gestureTimer = setTimeout(() => { editGesture = false; }, 900); else editGesture = false;
}, true);

/* ---------- redraw scheduling ---------- */
let dirty = false;
function invalidate() {
  if (dirty) return;
  dirty = true;
  requestAnimationFrame(() => { dirty=false;C.beginRenderEval();try{renderStage();drawTimeline();renderProjectButtons();}finally{C.endRenderEval();} });
}
let saveTimer = 0;
/* keep attached symbols in step with their bones; one the user just moved is re-attached from its new spot */
function settleAll() {
  const selected=new Set(S.sel.map(s=>s.id));
  const rigs=new Map(skeletonList().map(r=>[r.id,r.o]));
  for(const l of layers())for(const o of C.kfFor(l,S.frame)?.objs||[])if(o.sbind&&selected.has(o.id)&&SK.baseline.has(o.id)&&SK.baseline.get(o.id)!==JSON.stringify(o.t)) {
    const r=rigs.get(o.sbind.to);if(r){const bind=C.skeletonOffsets(o,r,o.sbind.joint);if(bind)o.sbind=bind;}
  }
  SK.baseline.clear();
  const ed = new Set(S.sel.map((q) => q.id));
  for (const l of layers()) { const k = C.kfFor(l, S.frame); if (k && k.objs.some((o) => o.bind)) C.settleBinds(k.objs, ed); }
}
function commit() {
  clearProtest();
  settleAll();
  markDirty();
  invalidate(); refreshProps(); updateTime();
  clearTimeout(saveTimer);
  saveTimer = 0;
}
function refreshAll() { if(!$('#bonePoseGallery').hidden&&SK.galleryRef)skeletonPoseGallery(SK.galleryRef);buildLayerList(); refreshProps(); updateTime(); updateHistoryButtons(); invalidate(); syncOnionUI(); clearTimeout(saveTimer); saveTimer = 0; }
function autosave() { /* Disabled: Save project is the only persistence path. */ }

let toastTimer = 0;
// Only explicitly marked blocked actions escalate; routine notices stay ordinary.
const PROTEST={key:null,count:0,last:0,node:null,timer:0,pending:0};
function clearProtest(){
  clearTimeout(PROTEST.timer);clearTimeout(PROTEST.pending);
  PROTEST.node?.remove();Object.assign(PROTEST,{key:null,count:0,last:0,node:null,timer:0,pending:0});
}
function protest(msg,key=msg){toast(msg,{protest:true,key});}
function protestLater(msg,key=msg){
  clearTimeout(PROTEST.pending);PROTEST.pending=setTimeout(()=>{PROTEST.pending=0;protest(msg,key);},420);
}
function toast(msg,options={}) {
  const box=$('#toast');
  if(options.protest){
    const now=performance.now(),key=options.key||msg,same=PROTEST.key===key&&now-PROTEST.last<5000;
    if(!same)clearProtest();
    PROTEST.key=key;PROTEST.last=now;PROTEST.count=same?PROTEST.count+1:1;
    const d=PROTEST.node||document.createElement('div');PROTEST.node=d;d.className='toast-protest';d.setAttribute('role','status');
    const level=Math.min(5,PROTEST.count-1);d.dataset.level=level;d.dataset.count=PROTEST.count;
    d.style.setProperty('--protest-size',(12.5+level*2.5)+'px');d.style.setProperty('--protest-red',(level*20)+'%');
    d.textContent=level>=4?String(msg).toUpperCase():msg;
    if(!d.isConnected)box.appendChild(d);
    clearTimeout(PROTEST.timer);PROTEST.timer=setTimeout(clearProtest,5000);
    logPush(FCLOG.msgs,msg);return;
  }
  clearProtest();
  const d=document.createElement('div');d.textContent=msg;logPush(FCLOG.msgs,msg);box.appendChild(d);
  setTimeout(()=>d.remove(),3800);
}

/* ---------- view ---------- */
const stage = $('#stage'), sctx = stage.getContext('2d');
let stageW = 0, stageH = 0, dpr = 1;
function resizeStage() {
  const r = $('#stagewrap').getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  stageW = Math.max(1, r.width); stageH = Math.max(1, r.height);
  stage.width = Math.round(stageW * dpr); stage.height = Math.round(stageH * dpr);
  invalidate();
}
function symBounds() {
  let b = null;
  for (const { objs } of C.evalDoc(S.doc, 0)) for (const o of objs) {
    const wb = worldBounds(o);
    if (!wb) continue;
    b = b ? { x0: Math.min(b.x0, wb.x0), y0: Math.min(b.y0, wb.y0), x1: Math.max(b.x1, wb.x1), y1: Math.max(b.y1, wb.y1) } : { x0: wb.x0, y0: wb.y0, x1: wb.x1, y1: wb.y1 };
  }
  return b || { x0: -50, y0: -50, x1: 50, y1: 50 };
}
function fitView() {
  const m = stageW < 500 ? 24 : 56;
  if (S.edit.length) {
    const b = symBounds(), bw = Math.max(b.x1 - b.x0, 20), bh = Math.max(b.y1 - b.y0, 20);
    S.view.z = clamp(Math.min((stageW - m * 2) / bw, (stageH - m * 2) / bh), 0.05, 6);
    S.view.px = stageW / 2 - (b.x0 + b.x1) / 2 * S.view.z; S.view.py = stageH / 2 - (b.y0 + b.y1) / 2 * S.view.z;
    S.autoFit = false; updateZoom(); invalidate();
    return;
  }
  const z = Math.min((stageW - m * 2) / S.doc.w, (stageH - m * 2) / S.doc.h);
  S.view.z = clamp(z, 0.05, 8);
  S.view.px = (stageW - S.doc.w * S.view.z) / 2; S.view.py = (stageH - S.doc.h * S.view.z) / 2;
  S.autoFit = true;
  updateZoom(); invalidate();
}
function zoomAt(sx, sy, f) {
  const z0 = S.view.z, z1 = clamp(z0 * f, 0.05, 32);
  const wx = (sx - S.view.px) / z0, wy = (sy - S.view.py) / z0;
  S.view.z = z1; S.view.px = sx - wx * z1; S.view.py = sy - wy * z1;
  S.autoFit = false;
  updateZoom(); invalidate();
}
function updateZoom() { $('#zVal').textContent = Math.round(S.view.z * 100) + '%'; }
const w2s = (x, y) => [x * S.view.z + S.view.px, y * S.view.z + S.view.py];
const s2w = (x, y) => ({ x: (x - S.view.px) / S.view.z, y: (y - S.view.py) / S.view.z });

/* ---------- editor-only drawing grid (CSS cm at 96 dpi) ---------- */
const GRID_CM = [0.5, 1, 2, 4, 8, 16];
const GRID = { visible: false, snap: false, cm: 0.5, color: '#4A90E2' };
try {
  const saved = JSON.parse(sessionPrefs.getItem('onionskyn.grid') || '{}');
  GRID.visible = saved.visible === true;
  if (GRID_CM.includes(saved.cm)) GRID.cm = saved.cm;
  if (/^#[0-9a-f]{6}$/i.test(saved.color)) GRID.color = saved.color;
} catch (_) {}
function gridSave() {
  try { sessionPrefs.setItem('onionskyn.grid', JSON.stringify({ visible: GRID.visible, cm: GRID.cm, color: GRID.color })); } catch (_) {}
}
function gridSync() {
  $('#bGrid').setAttribute('aria-pressed', String(GRID.visible));
  $('#bGridSnap').disabled = !GRID.visible;
  $('#bGridSnap').setAttribute('aria-pressed', String(GRID.visible && GRID.snap));
  $('#bGridSnap').title = GRID.visible ? 'Snap nodes, line ends, ellipse centres and shape corners to the visible grid' : 'Show Grid first to enable snapping';
}
function gridStep() {
  let step = GRID.cm * 96 / 2.54;
  // At distant zoom levels, snap to the coarser lines that remain visible.
  while (step * S.view.z < 6) step *= 5;
  return step;
}
function gridPoint(w) {
  if (!GRID.visible || !GRID.snap) return w;
  const step = gridStep();
  return { x: Math.round(w.x / step) * step, y: Math.round(w.y / step) * step };
}
function drawGrid(ctx) {
  if (!GRID.visible || S.playing) return;
  const z = S.view.z, step = gridStep(), v = S.view;
  let x0 = -v.px / z, y0 = -v.py / z, x1 = (stageW - v.px) / z, y1 = (stageH - v.py) / z;
  if (!S.edit.length) { x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(S.doc.w, x1); y1 = Math.min(S.doc.h, y1); }
  if (x1 < x0 || y1 < y0) return;
  ctx.save(); ctx.strokeStyle = GRID.color; ctx.lineWidth = 1 / z;
  for (const major of [false, true]) {
    ctx.globalAlpha = major ? 0.48 : 0.22; ctx.beginPath();
    for (let i = Math.ceil(x0 / step); i <= Math.floor(x1 / step); i++) {
      if ((i % 5 === 0) !== major) continue;
      ctx.moveTo(i * step, y0); ctx.lineTo(i * step, y1);
    }
    for (let i = Math.ceil(y0 / step); i <= Math.floor(y1 / step); i++) {
      if ((i % 5 === 0) !== major) continue;
      ctx.moveTo(x0, i * step); ctx.lineTo(x1, i * step);
    }
    ctx.stroke();
  }
  ctx.restore();
}
function openGridOptions() {
  const body = openModal('Grid settings',
    '<div class="row"><label for="gridSize">Square size</label><select id="gridSize">' +
    GRID_CM.map(cm => '<option value="' + cm + '">' + cm + ' cm</option>').join('') +
    '</select></div><div class="row"><label for="gridColor">Grid colour</label><input id="gridColor" type="color" value="' + GRID.color + '"></div>' +
    '<p class="hint">1 cm = 37.8 document pixels. Every fifth line is stronger. At distant zoom levels, a coarser grid is shown.</p>' +
    '<p class="hint">Grid is a drawing guide only. Enable Snap separately to align pen and node anchors. Curve handles stay free. Grid is excluded from previews and exports.</p>',
    [{ label: 'Reset blue', keep: true, fn: () => { GRID.color = '#4A90E2'; $('#gridColor').value = GRID.color; gridSave(); invalidate(); } }, { label: 'Done', primary: true }]);
  $('#gridSize').value = String(GRID.cm);
  body.querySelector('#gridSize').addEventListener('change', e => { const cm = Number(e.target.value); if (GRID_CM.includes(cm)) { GRID.cm = cm; gridSave(); invalidate(); } });
  body.querySelector('#gridColor').addEventListener('input', e => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { GRID.color = e.target.value; gridSave(); invalidate(); } });
}

/* ---------- stage rendering ---------- */
function onionOwner(){return S.edit.length?S.doc.lib[S.edit.at(-1).sym]:S.doc;}
function onionPins(){const owner=onionOwner();return Array.isArray(owner?.onionFrames)?Array.from(new Set(owner.onionFrames.filter(f=>Number.isInteger(f)&&f>=0&&f<S.doc.frames))).sort((a,b)=>a-b).slice(0,10):[];}
function onionRange(layer,frame){const s=S.fsel,a=s?Math.min(s.a,s.b):frame,b=s?Math.max(s.a,s.b):frame;return s&&(s.all||s.lid===layer?.id)&&frame>=a&&frame<=b?{a,b:Math.min(b,S.doc.frames-1)}:{a:frame,b:frame};}
function onionPinFrames(layer,frame,remove=false){
  const range=onionRange(layer,frame),old=onionPins(),chosen=Array.from({length:range.b-range.a+1},(_,i)=>range.a+i),next=remove?old.filter(f=>!chosen.includes(f)):Array.from(new Set([...old,...chosen])).sort((a,b)=>a-b);
  if(next.length>10){toast('Choose up to 10 onion skin reference frames. Remove a reference first.');return;}
  if(JSON.stringify(old)===JSON.stringify(next)){if(!remove)setOnion(true,false);return;}
  pushUndo();onionOwner().onionFrames=next;S.onion.on=!remove;refreshAll();toast(remove?'Onion skin reference removed.':next.length+' onion skin reference frame(s).');
}
function onionRemovePin(frame){const old=onionPins();if(!old.includes(frame))return;pushUndo();onionOwner().onionFrames=old.filter(f=>f!==frame);if(!onionPins().length)S.onion.on=false;refreshAll();}
function onionClearPins(){if(!onionPins().length)return;pushUndo();onionOwner().onionFrames=[];S.onion.on=false;refreshAll();}
function onionColor(frame,kind='pin'){
  const hue=kind==='before'?350:kind==='after'?150:(260+frame*137.508)%360;
  const hsl=l=>{const c=(1-Math.abs(2*l-1))*.8,x=c*(1-Math.abs(hue/60%2-1)),m=l-c/2,p=hue<60?[c,x,0]:hue<120?[x,c,0]:hue<180?[0,c,x]:hue<240?[0,x,c]:hue<300?[x,0,c]:[c,0,x];return C.rgbToHex(...p.map(v=>(v+m)*255));};
  const lum=color=>C.hexToRgb(/^#[0-9a-f]{8}$/i.test(color)?color.slice(0,7):/^#[0-9a-f]{4}$/i.test(color)?color.slice(0,4):color).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),background=lum(S.edit.length?(S.editBg||CSSV.pasteboard):S.doc.bg==='transparent'?CSSV.pasteboard:S.doc.bg),panel=lum(CSSV.panel),contrast=(a,b)=>(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  return [.3,.4,.5,.6,.72].map(l=>{const c=hsl(l),v=lum(c);return {c,score:Math.min(contrast(v,background),contrast(v,panel))};}).sort((a,b)=>b.score-a.score)[0].c;
}
function onionReferences(){
  const pins=onionPins(),frames=new Map();
  if(!pins.length||onionOwner()?.onionMixed){for(let k=S.onion.b;k>=1;k--)if(S.frame-k>=0)frames.set(S.frame-k,{f:S.frame-k,c:onionColor(S.frame-k,'before'),a:.26/k});for(let k=S.onion.a;k>=1;k--)if(S.frame+k<S.doc.frames)frames.set(S.frame+k,{f:S.frame+k,c:onionColor(S.frame+k,'after'),a:.26/k});}
  for(const f of pins)if(f!==S.frame)frames.set(f,{f,c:onionColor(f),a:.28});
  return Array.from(frames.values());
}
function onionPinsUI(){
  const list=$('#opPins');if(!list)return;list.replaceChildren();const pins=onionPins();
  if(!pins.length){const text=document.createElement('span');text.className='hint';text.textContent='Right-click timeline frames → Light as onion skin (up to 10).';list.append(text);}
  for(const f of pins){const chip=document.createElement('span');chip.className='op-pin';chip.style.borderColor=onionColor(f);const go=document.createElement('button');go.type='button';go.textContent='Frame '+(f+1);go.title='Go to reference frame '+(f+1);go.addEventListener('click',()=>setFrame(f));const del=document.createElement('button');del.type='button';del.textContent='×';del.title='Remove onion reference '+(f+1);del.setAttribute('aria-label',del.title);del.addEventListener('click',()=>onionRemovePin(f));chip.append(go,del);list.append(chip);}
  const mixed=$('#opMixed');mixed.closest('label').hidden=!pins.length;mixed.checked=!!onionOwner()?.onionMixed;
  $('#opClear').hidden=!pins.length;$('#opB').disabled=$('#opA').disabled=!!pins.length&&!mixed.checked;
  $('#opCount').textContent=pins.length?pins.length+'/10 pinned references':'No pinned references';
}

function drawFrameObjs(ctx, f, opt) {
  let entries=recordEntries(C.evalDoc(S.doc,f,!!(opt&&(opt.ghosts||opt.onion))),f);
  if(opt?.onionCurrent)entries=entries.map(e=>({...e,objs:e.layer.mask?e.objs:e.objs.filter(o=>{if(o.invisMask)return true;const current=opt.onionCurrent.get(e.layer.id+':'+o.id);if(!current)return true;if(current.o===o)return false;current.signature??=JSON.stringify([current.o,current.o._f,current.o._el,current.o.mirror?current.o.children:null,current.o._mirrorCuts]);return current.signature!==JSON.stringify([o,o._f,o._el,o.mirror?o.children:null,o._mirrorCuts]);})}));
  if(opt?.editorZones||opt?.onion)entries=editorHiddenEntries(entries);
  if(opt?.editorZones)entries=skeletonZoneEntries(entries);
  C.drawUnits(ctx,entries,opt);
  if(opt?.onion&&S.tool==='bone')for(const e of entries)if(e.layer.visible!==false)for(const o of e.objs)if(o.skel){const scale=Math.max(Math.abs(o.t.sx),Math.abs(o.t.sy),.001),radius=3/(S.view.z*scale),contours=[...o.contours,...o.skel.nodes.map(n=>{const c=C.ellipseContour(radius,radius);for(const p of c.nodes){p.x+=n.x;p.y+=n.y;}return c;})];C.drawObj(ctx,{...o,skel:undefined,contours,fill:null,stroke:'#ffffff',sw:1/S.view.z,sa:1,op:1},opt);}

}
function renderStage() {
  if (!S.doc) return;
  mirrorSync();
  skeletonMenuSync();
  const ctx = sctx, z = S.view.z, d = S.doc;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = S.editBg || CSSV.pasteboard; ctx.fillRect(0, 0, stage.width, stage.height);
  ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * S.view.px, dpr * S.view.py);
  ctx.save();
  const inSym = S.edit.length > 0;
  if (!inSym) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16 * dpr; ctx.shadowOffsetY = 3 * dpr; ctx.fillStyle = d.bg; ctx.fillRect(0, 0, d.w, d.h); }
  ctx.restore();
  if (!inSym) { ctx.fillStyle = d.bg; ctx.fillRect(0, 0, d.w, d.h); }
  if (S.playing) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, d.w, d.h); ctx.clip(); }
  drawFrameObjs(ctx, S.frame, { ghosts: !S.playing, editorZones: true });
  if(MIR.active&&!MIR.id&&!S.playing)mirrorPreview(ctx);
  if(S.onion.on&&!S.playing){
    const current=new Map();for(const e of recordEntries(C.evalDoc(S.doc,S.frame,true),S.frame))for(const o of e.objs)current.set(e.layer.id+':'+o.id,{o});
    for(const ref of onionReferences())drawFrameObjs(ctx,ref.f,{tint:{c:ref.c,a:ref.a},onion:{width:1/S.view.z},onionCurrent:current});
  }
  if (!S.playing) {
    for (const { layer, objs } of C.evalDoc(S.doc, S.frame)) {
      if (layer.visible === false) continue;
      for (const o of objs) if (!editorObjectHidden(layer.id,o.id)&&o.invisMask && o.kind === 'path') {
        drawObj(ctx, Object.assign({}, o, { invisMask: false, fill: '#688fe9', fa: 0.25, grad: null, stroke: '#4169b4', sa: 0.8, sw: 1, blur: 0 }), {});
      }
    }
  }
  if (!S.playing && !(S.drawGhostOff)) {
    for (const { layer, objs } of C.evalDoc(S.doc, S.frame)) if (layer.mask && layer.visible !== false) for (const o of objs) if(!editorObjectHidden(layer.id,o.id))drawObj(ctx, o, { tint: { c: CSSV.accent, a: layer.id === S.layerId ? 0.4 : 0.22 } });
  }
  if (S.playing) ctx.restore();
  drawGrid(ctx);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.strokeStyle = CSSV.line; ctx.lineWidth = 1;
  if (!S.edit.length) ctx.strokeRect(S.view.px - 0.5, S.view.py - 0.5, d.w * z + 1, d.h * z + 1);
  if (S.edit.length) {
    ctx.strokeStyle = CSSV.accent; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(S.view.px - 7, S.view.py); ctx.lineTo(S.view.px + 7, S.view.py); ctx.moveTo(S.view.px, S.view.py - 7); ctx.lineTo(S.view.px, S.view.py + 7); ctx.stroke();
  }
  if (!S.playing) { drawOverlay(ctx); kroganDrawGhostPlaceholders(ctx); }
  else kroganGhostTargets = [];
}

/* KROGAN V2.4: editor-only rescue markers for symbol instances whose current
   internal frame contains no artwork. No document data, tween, or export changes. */
let kroganGhostTargets = [];
function kroganGhostAt(sx, sy) {
  return kroganGhostTargets.find(g => sx >= g.x && sx <= g.x + 24 && sy >= g.y && sy <= g.y + 24) || null;
}
function kroganDrawGhostPlaceholders(ctx) {
  kroganGhostTargets = [];
  if (S.playing || S.edit.length || !S.doc || !S.doc.lib) return;
  const candidates = [];
  for (const { layer, objs } of C.evalDoc(S.doc, S.frame)) {
    if (layer.visible === false || layer.locked) continue;
    for (const o of objs) {
      if (o.kind !== 'clip'||editorObjectHidden(layer.id,o.id)) continue;
      const lib = S.doc.lib[o.sym];
      if (!lib || !Array.isArray(lib.layers)) continue;
      const frame = o._f || 0;
      // A blank symbol frame must have no drawable objects in visible layers.
      const empty = lib.layers.every(l => l.visible === false || C.evalLayerObjs(l, frame).length === 0);
      if (empty) candidates.push({ sym: o.sym, name: o.name || o.sym });
    }
  }
  if (!candidates.length) return;
  // Fixed screen pixels, independent of zoom and original object dimensions.
  const x = Math.max(4, Math.round(S.view.px - 32));
  const top = Math.max(4, Math.round(S.view.py));
  const rows = Math.max(1, Math.floor((stage.clientHeight - top - 4) / 29));
  ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  candidates.forEach((g, i) => {
    const col = Math.floor(i / rows), row = i % rows;
    const gx = x - col * 29, gy = top + row * 29;
    if (gx < 0 || gy + 24 > stage.clientHeight) return;
    kroganGhostTargets.push({ ...g, x: gx, y: gy });
    ctx.fillStyle = 'rgba(125,108,190,0.20)'; ctx.fillRect(gx, gy, 24, 24);
    ctx.strokeStyle = 'rgba(104,83,177,0.85)'; ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]); ctx.strokeRect(gx + .5, gy + .5, 23, 23); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(104,83,177,0.8)';
    ctx.fillRect(gx + 10, gy + 10, 4, 4);
  });
  ctx.restore();
}

/* ---------- handles & overlay ---------- */
function getHandles(o) {
  if(selectionControlsHidden())return [];
  if(o.mirror)return [];
  const b = localBounds(o);
  if (!b) return [];
  const m = matOf(o.t), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const pts = { nw: [b.x0, b.y0], n: [cx, b.y0], ne: [b.x1, b.y0], e: [b.x1, cy], se: [b.x1, b.y1], s: [cx, b.y1], sw: [b.x0, b.y1], w: [b.x0, cy] };
  const out = [];
  for (const k in pts) { const p = mapply(m, pts[k][0], pts[k][1]); out.push({ id: k, x: p[0], y: p[1], l: pts[k] }); }
  const n = out.find((h) => h.id === 'n'), c = mapply(m, cx, cy);
  const dx = n.x - c[0], dy = n.y - c[1], len = Math.hypot(dx, dy) || 1, off = 26 / S.view.z;
  out.push({ id: 'rot', x: n.x + dx / len * off, y: n.y + dy / len * off, l: null });
  const south = out.find(h => h.id === 's');
  out.push({ id: 'rotSouth', x: south.x - dx / len * off, y: south.y - dy / len * off, l: null });
  return out;
}
function hitHandle(hs, sx, sy) {
  for (const h of hs) { const p = w2s(h.x, h.y); if (Math.hypot(p[0] - sx, p[1] - sy) <= 9) return h; }
  return null;
}
function visibleNodeHandles(o) {
  const result=new Map(),keys=kNodeKeys();
  const add=(ci,ni,part)=>{const n=o.contours[ci]?.nodes[ni];if(n&&(part==='in'?(n.ix||n.iy):(n.ox||n.oy)))result.set(ci+':'+ni+':'+part,{ci,ni,part});};
  for(const key of keys){const {ci,ni}=kNodeFromKey(key);add(ci,ni,'in');add(ci,ni,'out');}
  for(const key of keys){
    const {ci,ni}=kNodeFromKey(key),c=o.contours[ci];if(!c?.nodes[ni])continue;
    const count=c.nodes.length;
    if(ni>0||c.closed)add(ci,(ni+count-1)%count,'out');
    if(ni+1<count||c.closed)add(ci,(ni+1)%count,'in');
  }
  return [...result.values()];
}
function nodeScreen(o, n, which) {
  const m = matOf(o.t);
  const lx = which === 'in' ? n.x + n.ix : which === 'out' ? n.x + n.ox : n.x;
  const ly = which === 'in' ? n.y + n.iy : which === 'out' ? n.y + n.oy : n.y;
  const p = mapply(m, lx, ly);
  return w2s(p[0], p[1]);
}
function drawOverlay(ctx) {
  const acc = CSSV.accent;
  const sels = selEval();
  ctx.lineWidth = 1; ctx.strokeStyle = acc; ctx.fillStyle = CSSV.accentFg;
  for (const s of sels) {
    if(s.o.skel)continue;
    const cs = worldCorners(s.o);
    if (!cs) continue;
    ctx.beginPath();
    cs.forEach((p, i) => { const q = w2s(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
    ctx.closePath();
    if(S.tool==='select'&&sels.length>1||S.tool==='node'&&s.o.kind==='group'){
      ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash([9,6]);
      ctx.strokeStyle='#ffffff';ctx.lineWidth=5;ctx.stroke();
      ctx.strokeStyle='#171721';ctx.lineWidth=2;ctx.stroke();ctx.restore();
    }else ctx.stroke();
  }
  const one = sels.length === 1 ? sels[0] : null;
  if (one && S.tool === 'gradient' && gradEditing(one.o)) drawGradHandles(ctx, one.o);
  else if (one && S.tool === 'select' && !selectionControlsHidden() && !one.o.skel && !one.o.mirror) {
    const hs = getHandles(one.o);
    for (const [rotation, edge] of [['rot','n'],['rotSouth','s']]) {
      const rot = hs.find(h => h.id === rotation), nh = hs.find(h => h.id === edge);
      if (rot && nh) { const a = w2s(nh.x, nh.y), b = w2s(rot.x, rot.y); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    }
    for (const h of hs) {
      const p = w2s(h.x, h.y);
      ctx.beginPath();
      if (h.id.startsWith('rot')) ctx.arc(p[0], p[1], 5, 0, Math.PI * 2); else ctx.rect(p[0] - 4, p[1] - 4, 8, 8);
      ctx.fill(); ctx.stroke();
    }
	    // Iegūstam atlasītās figūras rotācijas centru.
    const pivot = getPivot(one.o);

    // Pārveidojam pivot no lokālajām uz pasaules koordinātām.
    const pivotWorld = mapply(matOf(one.o.t), pivot[0], pivot[1]);

    // Pārveidojam pasaules koordinātas uz ekrāna koordinātām.
    const pivotScreen = w2s(pivotWorld[0], pivotWorld[1]);

    // Saglabājam pašreizējos zīmēšanas iestatījumus.
    ctx.save();

    // Izvēlamies oranžu krāsu un līnijas biezumu.
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;

    // Sākam zīmēt krustiņu.
    ctx.beginPath();

    // Horizontālā līnija.
    ctx.moveTo(pivotScreen[0] - 7, pivotScreen[1]);
    ctx.lineTo(pivotScreen[0] + 7, pivotScreen[1]);

    // Vertikālā līnija.
    ctx.moveTo(pivotScreen[0], pivotScreen[1] - 7);
    ctx.lineTo(pivotScreen[0], pivotScreen[1] + 7);

    // Uzzīmējam abas līnijas.
    ctx.stroke();

    // Atjaunojam iepriekšējos zīmēšanas iestatījumus.
    ctx.restore();
  }
  if (one && S.tool === 'node' && nodeEditable(one.o) && !one.o.skel && !one.o.skin && !one.o.arc) {
    const handleKeys=new Set(visibleNodeHandles(one.o).map(h=>h.ci+':'+h.ni+':'+h.part));
    one.o.contours.forEach((c, ci) => {
      c.nodes.forEach((n, ni) => {
        const sel = S.nodeSel && S.nodeSel.ci === ci && S.nodeSel.ni === ni;
        {
          for (const w of ['in', 'out']) {
            if (!handleKeys.has(ci+':'+ni+':'+w)) continue;
            const a = nodeScreen(one.o, n, 'anchor'), b = nodeScreen(one.o, n, w);
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
            ctx.beginPath(); ctx.arc(b[0], b[1], 5.33, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          }
        }
        const p = nodeScreen(one.o, n, 'anchor');
        ctx.beginPath(); ctx.rect(p[0] - 4, p[1] - 4, 8, 8);
        ctx.fillStyle = sel ? acc : CSSV.accentFg; ctx.fill(); ctx.stroke(); ctx.fillStyle = CSSV.accentFg;
      });
    });
  }
  const d = S.drag;
  if (d && (d.type === 'marquee' || d.type === 'node-marquee')) {
    const a = w2s(d.start.x, d.start.y), b = w2s(d.cur.x, d.cur.y);
    ctx.save(); ctx.fillStyle = acc; ctx.globalAlpha = 0.12;
    ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.restore();
    ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  }
  if(!selectionControlsHidden())mirrorOverlay(ctx);
  arcDraw(ctx);
  starDraw(ctx);
  if (S.draw) drawPreview(ctx);
  drawBrushCursor(ctx);
  drawEraserCursor(ctx);
  skeletonDraw(ctx);
  if (S.pen) drawPenPreview(ctx);
}
/* ===== Onionskyn app, part 2: tools and pointer input ===== */
const MIR={active:false,placing:false,box:null,lid:null,sourceLid:null,id:null,ids:null,scope:'',near:false,busy:false,palette:null};
