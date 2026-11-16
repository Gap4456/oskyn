/* This adapter is injected inside the shared editor scope by mobile/build.cjs.
   The desktop build and the common animation core are not modified. */
document.body.classList.add('oskyn-mobile');
document.title='oskyn '+APP_VERSION+' · Mobile preview';
const mobile={panel:null,panels:{},transform:false,columns:1,navOwner:null,blocked:new Set(),recorded:new Set(),recordUntil:0};
const mobileMods=Object.fromEntries(['Shift','Control','Alt'].map(key=>[key,{latched:false,held:new Map()}]));
const mobileKey=key=>mobileMods[key].latched||mobileMods[key].held.size>0;
const mobileFrozenEvents=new WeakSet();
function mobileEvent(e,extra={}){
  if(mobileFrozenEvents.has(e)&&!Object.keys(extra).length)return e;
  return new Proxy(e,{get(target,key){if(Object.hasOwn(extra,key))return extra[key];if(key==='shiftKey')return target.shiftKey||mobileKey('Shift');if(key==='ctrlKey')return target.ctrlKey||mobileKey('Control');if(key==='altKey')return target.altKey||mobileKey('Alt');const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
}
const mobileTop=document.createElement('div');mobileTop.id='mobileTop';
for(const id of ['mFile','mExport'])mobileTop.appendChild($('#'+id));
function mobileButton(id,text,fn,parent){const b=document.createElement('button');b.type='button';b.id=id;b.textContent=text;b.addEventListener('click',fn);parent.appendChild(b);return b;}
mobileButton('mobileEdit','Edit',()=>mobileEditMenu(),mobileTop);
mobileButton('mobileFit','Fit',()=>fitView(),mobileTop);
mobileButton('mobilePreview','Preview',()=>openPreview(),mobileTop);
mobileButton('mobileDelete','Delete',()=>{
  if(mobileTouch.points.size){mobileCancelSingle();mobileTouch.mode='blocked';return;}
  if(REC.armed)recordSetArmed(false);
  if(mobile.panel==='timeline')frameAction('rmframe');
  else if(S.tool==='node'&&kNodeKeys().length)deleteNode();
  else deleteSel();
},mobileTop);
$('#stagewrap').appendChild(mobileTop);
const mobileQuick=document.createElement('div');mobileQuick.id='mobileQuick';mobileQuick.setAttribute('aria-label','Undo and redo');for(const id of ['bUndo','bRedo'])mobileQuick.appendChild($('#'+id));$('#stagewrap').appendChild(mobileQuick);
const mobileReminders=document.createElement('div');mobileReminders.id='mobileReminders';mobileReminders.setAttribute('aria-label','Active modifiers and recording status');$('#stagewrap').appendChild(mobileReminders);
for(const key of Object.keys(mobileMods)){const s=document.createElement('span');s.id='mobileReminder'+key;s.className='mobile-reminder';s.textContent=key==='Control'?'Ctrl':key;s.hidden=true;mobileReminders.appendChild(s);}
const mobileRecordStatus=document.createElement('span');mobileRecordStatus.id='mobileRecordStatus';mobileRecordStatus.hidden=true;mobileReminders.appendChild(mobileRecordStatus);
const mobileRecordCount=document.createElement('span');mobileRecordCount.id='mobileRecordCount';mobileRecordCount.setAttribute('aria-live','off');mobileRecordCount.hidden=true;mobileReminders.appendChild(mobileRecordCount);

function mobilePanel(id,label,content,width,side){
  const box=document.createElement('section');box.id='mobilePanel-'+id;box.className='mobile-panel';box.hidden=true;box.setAttribute('aria-label',label+' panel');
  const head=document.createElement('div');head.className='mobile-panel-head';head.innerHTML='<strong>'+label+'</strong>';
  const reset=document.createElement('button');reset.type='button';reset.textContent='↑';reset.setAttribute('aria-label','Scroll '+label+' to start');head.appendChild(reset);
  const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close '+label+' panel');close.addEventListener('click',()=>mobileClosePanel());head.appendChild(close);box.appendChild(head);
  const body=document.createElement('div');body.className='mobile-panel-body';const viewport=document.createElement('div');viewport.className='mobile-panel-viewport';const inner=document.createElement('div');inner.className='mobile-panel-content';inner.appendChild(content);viewport.appendChild(inner);body.appendChild(viewport);
  box.appendChild(body);$('#stagewrap').appendChild(box);
  const state={id,box,head,viewport,inner,width,side,z:1,x:0,y:0,left:null,top:null};mobile.panels[id]=state;
  reset.addEventListener('click',()=>{viewport.scrollTo(0,0);if(id==='timeline'){$('#tlScroll').scrollTo(0,0);content.querySelector('.tl-bar').scrollTo(0,0);}});
  mobilePanelGesture(state,head);
  return state;
}
function mobileApplyPanel(p){
  p.inner.style.transform='none';
}
function mobileSafe(){const style=getComputedStyle(document.documentElement);return Object.fromEntries(['top','bottom','left','right'].map(k=>[k,parseFloat(style.getPropertyValue('--mobile-safe-'+k))||0]));}
function mobilePlacePanel(p,reset=false){
  const safe=mobileSafe(),W=stageW,H=stageH,safeTop=58+safe.top,safeBottom=76+safe.bottom;
  p.box.style.width=Math.min(p.width,W-safe.left-safe.right-24)+'px';p.box.style.height=(p.side==='bottom'?Math.min(Math.max(240,H*.48),H-safeTop-safeBottom):Math.max(110,H-safeTop-safeBottom))+'px';
  if(reset||p.left===null){p.left=p.side==='right'?W-safe.right-p.box.offsetWidth-12:p.side==='bottom'?(W-p.box.offsetWidth)/2:safe.left+12;p.top=p.side==='bottom'?H-p.box.offsetHeight-safeBottom:safeTop;}
  p.left=clamp(p.left,4+safe.left,Math.max(4+safe.left,W-safe.right-p.box.offsetWidth-4));p.top=clamp(p.top,4+safe.top,Math.max(4+safe.top,H-safe.bottom-p.box.offsetHeight-4));p.box.style.left=p.left+'px';p.box.style.top=p.top+'px';
  mobileApplyPanel(p);
}
function mobileClosePanel(){for(const p of Object.values(mobile.panels))p.box.hidden=true;mobile.panel=null;for(const b of document.querySelectorAll('[data-mobile-panel]'))b.setAttribute('aria-expanded','false');}
function mobileOpenPanel(id){
  if(mobile.panel===id){mobileClosePanel();return;}
  mobileClosePanel();toggleProjectMenu(false);const p=mobile.panels[id];p.box.hidden=false;mobile.panel=id;mobilePlacePanel(p);const b=document.querySelector('[data-mobile-panel="'+id+'"]');if(b)b.setAttribute('aria-expanded','true');
}
/* Gesture ownership belongs to the heading where both touches started.
   It is not transferred to a field when one finger is lifted or moves out. */
function mobilePanelGesture(p,area){
  const points=new Map();let mode=null,start=null;
  area.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    if(mobile.navOwner&&mobile.navOwner!==area)return;e.preventDefault();e.stopPropagation();area.setPointerCapture(e.pointerId);mobile.navOwner=area;points.set(e.pointerId,e);
    if(e.pointerType==='mouse'){mode='mouse';start={cx:e.clientX,cy:e.clientY,left:p.left,top:p.top};}
    if(points.size===2){const [a,b]=[...points.values()];mode='gesture';start={cx:(a.clientX+b.clientX)/2,cy:(a.clientY+b.clientY)/2,d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)||1,z:p.z,x:p.x,y:p.y,left:p.left,top:p.top};}
  });
  area.addEventListener('pointermove',e=>{
    if(!points.has(e.pointerId))return;e.preventDefault();e.stopPropagation();points.set(e.pointerId,e);if(mode==='mouse'){p.left=start.left+e.clientX-start.cx;p.top=start.top+e.clientY-start.cy;mobilePlacePanel(p);return;}if(mode!=='gesture'||points.size!==2)return;
    const [a,b]=[...points.values()],cx=(a.clientX+b.clientX)/2,cy=(a.clientY+b.clientY)/2;
    p.left=start.left+cx-start.cx;p.top=start.top+cy-start.cy;mobilePlacePanel(p);
  });
  const end=e=>{if(!points.has(e.pointerId))return;e.preventDefault();e.stopPropagation();points.delete(e.pointerId);mode='blocked';if(!points.size){mobile.navOwner=null;mode=null;start=null;}};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])area.addEventListener(event,end);
  window.addEventListener('blur',()=>{points.clear();mode=null;start=null;if(mobile.navOwner===area)mobile.navOwner=null;});
}
const tools=$('#tools'),props=$('#props'),timeline=$('#tl');
const toolPanel=mobilePanel('tools','Tools',tools,92,'left');mobilePanel('props','Properties',props,302,'right');mobilePanel('timeline','Timeline',timeline,780,'bottom');
props.prepend($('#kNodeBar'),$('#kSelectBar'),$('#toolopts'));
const mobileRecordButton=$('#pRecord');
const timelineBar=timeline.querySelector('.tl-bar'),playRow=document.createElement('div'),frameRow=document.createElement('div');playRow.className=frameRow.className='mobile-timeline-row';
for(const id of ['pPlay','pPrev','pNext','pLoop','pOnion','pOnionOpt','pRecordAudio','pFirst','pLast','tcode'])playRow.appendChild($('#'+id));
for(const b of [...timelineBar.querySelectorAll('[data-fr]')])frameRow.appendChild(b);
const duplicateHistory=[$('#pUndo'),$('#pRedo')];timelineBar.replaceChildren(playRow,frameRow,...duplicateHistory);
const modifierGroup=document.createElement('div');modifierGroup.id='mobileModifiers';tools.appendChild(modifierGroup);
function mobileSyncModifiers(){
  for(const key of Object.keys(mobileMods)){const on=mobileKey(key),b=$('#mobileMod'+key);if(b)b.setAttribute('aria-pressed',String(on));$('#mobileReminder'+key).hidden=!on;}
  document.body.classList.toggle('mobile-modifiers-visible',Object.keys(mobileMods).some(mobileKey));
  S.shiftHeld=mobileKey('Shift');skeletonHudModifiers(mobileKey('Control'),mobileKey('Shift'));invalidate();
}
for(const key of Object.keys(mobileMods)){
  const b=document.createElement('button');b.type='button';b.id='mobileMod'+key;b.dataset.mobileMod=key;b.textContent=key;b.setAttribute('aria-pressed','false');modifierGroup.appendChild(b);
  b.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);mobileMods[key].held.set(e.pointerId,{time:performance.now(),used:false});mobileSyncModifiers();});
  b.addEventListener('pointerup',e=>{const h=mobileMods[key].held.get(e.pointerId);if(!h)return;e.preventDefault();mobileMods[key].held.delete(e.pointerId);if(!h.used&&performance.now()-h.time<350)mobileMods[key].latched=!mobileMods[key].latched;mobileSyncModifiers();});
  for(const event of ['pointercancel','lostpointercapture'])b.addEventListener(event,e=>{if(mobileMods[key].held.delete(e.pointerId))mobileSyncModifiers();});
  b.addEventListener('click',e=>{if(e.detail!==0)return;mobileMods[key].latched=!mobileMods[key].latched;mobileSyncModifiers();});
}
modifierGroup.appendChild(mobileRecordButton);
for(const p of Object.values(mobile.panels))new MutationObserver(()=>{if(!p.box.hidden)mobileApplyPanel(p);}).observe(p.inner,{childList:true,subtree:true});
const nativeLayoutClick=$('#kToolLayout');nativeLayoutClick.textContent='1 / 2';nativeLayoutClick.addEventListener('click',e=>{e.stopImmediatePropagation();mobile.columns=mobile.columns===1?2:1;nativeLayoutClick.setAttribute('aria-pressed',String(mobile.columns===2));toolPanel.box.classList.toggle('two-columns',mobile.columns===2);toolPanel.width=mobile.columns===2?140:92;mobilePlacePanel(toolPanel);},true);
for(const [id,label,icon] of [['tools','Tools','✎'],['props','Properties','☷'],['timeline','Timeline','Timeline']]){
  const b=mobileButton('mobile'+id[0].toUpperCase()+id.slice(1)+'Toggle',icon,()=>mobileOpenPanel(id),$('#stagewrap'));b.className='mobile-edge';b.dataset.mobilePanel=id;b.setAttribute('aria-label','Open '+label+' panel');b.setAttribute('aria-expanded','false');
  let down=null;b.addEventListener('pointerdown',e=>{if(e.button===0){down={x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);}});
  b.addEventListener('pointerup',e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;down=null;if(Math.hypot(dx,dy)>12){mobileLastClick={button:b,time:performance.now()};mobileOpenPanel(id);}});
}

function mobileTouchHelp(){openModal('Mobile preview','<p>Use the edge handles for Tools, Properties and Timeline. One panel opens at a time. Swipe inside a panel to scroll. The timeline toolbar and frames scroll independently left and right. Two fingers on the panel heading move the whole panel. ↑ scrolls to the start. Preview and Delete stay visible at the top.</p><p>Two fingers on the canvas pan and zoom the drawing. A second finger cancels an unfinished single-finger edit. Hold a canvas object or a frame for its menu.</p><p>Tap Shift, Control or Alt to latch it, or hold it while drawing. The faint canvas reminders ignore touches. REC arms drag-to-record: drag an object, node or bone, then release to stop. Undo/Redo stay visible.</p><p>Save projects explicitly. Photo import and saving to Files must still be verified on a real iPhone. PWA/offline installation is not included in this preview.</p>');}
function mobileEditMenu(pos){
  const one=singleSel(),nodeItems=S.tool==='node'&&nodeEditable(one?.o)&&!one.o.skin&&!one.o.skel?[
    ...['corner','straight','smooth','symmetric','auto'].map((op,i)=>({label:['Corner nodes','Straight segments','Smooth nodes','Symmetric nodes','Auto-smooth nodes'][i],fn:()=>kNodeOperation(op)})),
    {label:'Delete selected nodes',disabled:!kNodeKeys().length,fn:deleteNode},
    ...(pos&&kCurveHit(one.o,pos.x-stage.getBoundingClientRect().left,pos.y-stage.getBoundingClientRect().top)?[{label:'Add node here',fn:()=>nodeDbl(stagePt({clientX:pos.x,clientY:pos.y}))}]:[]),'-'
  ]:[];
  showMenu(pos?null:$('#mobileEdit'),[
    ...nodeItems,
    ...(one?.o.kind==='clip'?[{label:'Edit symbol',fn:()=>enterSym(one.o.sym)}]:[]),
    ...(one?.o.kind==='text'?[{label:'Edit text',fn:()=>startTextEdit(null,{lid:one.lid,id:one.id})}]:[]),
    {label:'Copy objects',disabled:!S.sel.length,fn:copySel},{label:'Paste objects',disabled:!S.clipboard.length,fn:()=>pasteClip()},
    {label:'Duplicate',disabled:!S.sel.length,fn:duplicateSel},{label:'Delete selected',disabled:!S.sel.length,fn:deleteSel},
    {label:'Deselect',fn:()=>{S.sel=[];S.nodeSel=null;refreshProps();invalidate();}},
    {label:mobile.transform?'Move only':'Show transform handles',fn:()=>{mobile.transform=!mobile.transform;invalidate();}},
    {label:'Undo/Redo on '+(document.body.classList.contains('mobile-right-handed')?'left':'right'),fn:()=>document.body.classList.toggle('mobile-right-handed')},'-',
    {label:'Touch help',fn:mobileTouchHelp}
  ],pos);
}
/* Preserve the desktop menu semantics while allowing its built-in properties
   shortcuts to reveal the mobile sheet as well. */
$('#bProps').addEventListener('click',e=>{e.stopImmediatePropagation();mobileOpenPanel('props');},true);
$('#mFile').addEventListener('click',e=>{
  e.stopImmediatePropagation();showMenu(e.currentTarget,[
    {label:'New animation',fn:newOpenProject},{label:'Open project or .fla…',fn:pickFile},
    {label:'Import image…',fn:()=>$('#imgIn').click()},{label:'Save project',fn:saveProject},'-',
    {label:'Library & sounds…',fn:()=>{mobileOpenPanel('props');setTab('lib');}},
    {label:'Document settings…',fn:()=>{mobileOpenPanel('props');setTab('doc');}},
    {label:'Preview animation',fn:openPreview},{label:'Report a problem…',fn:showReport},{label:'Touch help',fn:mobileTouchHelp}
  ]);
},true);

const nativeSetTab=setTab;setTab=(...args)=>{nativeSetTab(...args);if(mobile.panel==='props')requestAnimationFrame(()=>mobileApplyPanel(mobile.panels.props));};
const nativeSetTool=setTool;setTool=id=>{nativeSetTool(id);if(mobile.panel==='tools'&&!Object.values(mobileMods).some(m=>m.held.size))mobileClosePanel();};
const nativeHiddenControls=selectionControlsHidden;selectionControlsHidden=()=>S.tool==='select'&&(!mobile.transform||mobileKey('Shift'))||nativeHiddenControls();
const nativeHitHandle=hitHandle;hitHandle=(handles,x,y)=>{for(const h of handles){const p=w2s(h.x,h.y);if(Math.hypot(p[0]-x,p[1]-y)<=15)return h;}return nativeHitHandle(handles,x,y);};
const nativeNodeHit=hitNodePart;hitNodePart=(o,x,y)=>{for(let ci=0;ci<o.contours.length;ci++)for(let ni=0;ni<o.contours[ci].nodes.length;ni++){const p=nodeScreen(o,o.contours[ci].nodes[ni],'anchor');if(Math.hypot(p[0]-x,p[1]-y)<=14)return {ci,ni,part:'anchor'};}return nativeNodeHit(o,x,y);};
const nativeSkeletonModifiers=skeletonHudModifiers;skeletonHudModifiers=(ctrl,shift)=>nativeSkeletonModifiers(ctrl||mobileKey('Control'),shift||mobileKey('Shift'));
const nativeFitView=fitView;fitView=()=>{
  if(!stageW||!stageH){nativeFitView();return;}
  const safe=mobileSafe(),b=S.edit.length?symBounds():{x0:0,y0:0,x1:S.doc.w,y1:S.doc.h},w=Math.max(20,b.x1-b.x0),h=Math.max(20,b.y1-b.y0),top=64+safe.top,bottom=70+safe.bottom;
  S.view.z=clamp(Math.min((stageW-safe.left-safe.right-72)/w,Math.max(40,stageH-top-bottom)/h),.05,32);S.view.px=(stageW+safe.left-safe.right)/2-(b.x0+b.x1)/2*S.view.z;S.view.py=top+(stageH-top-bottom)/2-(b.y0+b.y1)/2*S.view.z;S.autoFit=true;updateZoom();invalidate();
};

/* REC reuses the shared take/overdub engine. A real drag supplies hold-Q in the
   mobile adapter; canvas navigation and panel controls never start a take. */
function mobileSyncRecord(){
  document.body.classList.toggle('mobile-record-visible',REC.armed);
  const b=$('#pRecord');b.textContent='REC';b.title=REC.armed?'Disarm drag-to-record':'Arm drag-to-record';
  mobileRecordStatus.hidden=!REC.armed;mobileRecordStatus.textContent=REC.running?'● REC':REC_AUDIO.waiting?'REC · loading audio':'● REC ready';mobileRecordStatus.className=REC.running?'running':'armed';
  mobileRecordCount.hidden=!mobile.recorded.size||(!REC.running&&performance.now()>mobile.recordUntil);mobileRecordCount.textContent='<'+mobile.recorded.size+' frames recorded>';
}
const nativeRecordSync=recordSync;recordSync=()=>{nativeRecordSync();mobileSyncRecord();};
const nativeRecordSetArmed=recordSetArmed;recordSetArmed=on=>{if(on&&!['select','node','bone'].includes(S.tool))setTool('select');nativeRecordSetArmed(on);mobileSyncRecord();};
const nativeRecordCapture=recordCapture;recordCapture=frame=>{nativeRecordCapture(frame);if(REC.running){mobile.recorded.add(frame);mobileSyncRecord();}};
const nativeRecordBegin=recordBegin;recordBegin=()=>{if(!REC.running&&REC.live&&REC.drag?.started)mobile.recorded.clear();nativeRecordBegin();mobileSyncRecord();};
const nativeRecordStop=recordStop;recordStop=()=>{const was=REC.running;nativeRecordStop();if(was){mobile.recordUntil=performance.now()+3000;setTimeout(mobileSyncRecord,3100);}mobileSyncRecord();};
const nativeToast=toast;toast=msg=>nativeToast(String(msg).startsWith('Record: choose a start frame')?'REC ready: drag one selected object, node or bone. Release it to stop.':msg);
const nativeOnDown=onDown,nativeOnMove=onMove,nativeOnUp=onUp;
onDown=e=>{if(S.tool==='bone')skeletonHoverAt(stagePt(e),false,true);nativeOnDown(mobileEvent(e));};
onMove=e=>{if(S.drag&&S.drag.type!=='pan'&&REC.armed&&S.frame<899)REC.held=true;nativeOnMove(mobileEvent(e));};
onUp=e=>{nativeOnUp(mobileEvent(e));REC.held=false;mobileSyncRecord();};

const mobileTouch={points:new Map(),mode:null,timer:0,hold:0,first:null,last:null,checkpoint:null,pinch:null};
function mobileCheckpoint(){
  const entries=S.edit.map(({sym,frame,layerId,timelineLeft,timelineTop})=>({sym,frame,layerId,timelineLeft,timelineTop})),doc=snap();entries.forEach((e,i)=>Object.assign(S.edit[i],e));
  return {doc,entries,undo:H.stack.slice(),redo:H.redo.slice(),dirty:unsaved,serial:S.changeSerial||0,sel:clone(S.sel),nodeSel:clone(S.nodeSel),nodeKeys:clone(S.kNodeSelection||[]),view:{...S.view},autoFit:S.autoFit,recorded:[...mobile.recorded]};
}
function mobileCancelSingle(){
  clearTimeout(mobileTouch.timer);clearTimeout(mobileTouch.hold);
  if(REC.live||REC.running){REC.held=false;recordFinishDrag();REC.takeId=null;REC.targetId=null;REC.baseLayer=null;REC.doc=null;REC.lastFrame=null;REC.lastPose=null;}
  const saved=mobileTouch.checkpoint;S.draw=null;S.drag=null;C.freeBind.clear();
  if(saved){restoreSnap(saved.doc);saved.entries.forEach((entry,i)=>{if(S.edit[i])Object.assign(S.edit[i],entry);});H.stack=saved.undo;H.redo=saved.redo;S.sel=saved.sel;S.nodeSel=saved.nodeSel;S.kNodeSelection=saved.nodeKeys;S.view=saved.view;S.autoFit=saved.autoFit;unsaved=saved.dirty;S.changeSerial=saved.serial;mobile.recorded=new Set(saved.recorded);$('#mFile').classList.toggle('dirty',unsaved);notifyDesktopDirty();refreshAll();}
  REC.held=false;mobileTouch.checkpoint=null;mobileSyncRecord();
}
function mobileFreezeEvent(e){const frozen=mobileEvent(e,{shiftKey:e.shiftKey||mobileKey('Shift'),ctrlKey:e.ctrlKey||mobileKey('Control'),altKey:e.altKey||mobileKey('Alt')});mobileFrozenEvents.add(frozen);return frozen;}
function mobileStartSingle(){
  if(mobileTouch.mode!=='pending')return;mobileTouch.checkpoint=mobileCheckpoint();mobileTouch.mode='single';onDown(mobileTouch.first);if(mobileTouch.last!==mobileTouch.first)onMove(mobileTouch.last);
}
function mobileStartPinch(){
  mobileCancelSingle();mobileTouch.mode='pinch';const [a,b]=[...mobileTouch.points.values()],r=stage.getBoundingClientRect(),x=(a.clientX+b.clientX)/2-r.left,y=(a.clientY+b.clientY)/2-r.top;
  mobileTouch.pinch={distance:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)||1,z:S.view.z,wx:(x-S.view.px)/S.view.z,wy:(y-S.view.py)/S.view.z};
}
function mobileMovePinch(){
  if(mobileTouch.points.size!==2)return;const [a,b]=[...mobileTouch.points.values()],r=stage.getBoundingClientRect(),p=mobileTouch.pinch,z=clamp(p.z*Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/p.distance,.05,32);
  S.view.z=z;S.view.px=(a.clientX+b.clientX)/2-r.left-p.wx*z;S.view.py=(a.clientY+b.clientY)/2-r.top-p.wy*z;S.autoFit=false;updateZoom();invalidate();
}
function mobileOutsideCanvas(){
  const held=Object.values(mobileMods).some(m=>m.held.size);if(held)return false;
  if(mobile.panel){mobileClosePanel();return true;}if(!$('#projectButtons').hidden){toggleProjectMenu(false);return true;}return false;
}
stage.addEventListener('pointerdown',e=>{
  if(mobileOutsideCanvas()){e.preventDefault();e.stopImmediatePropagation();return;}
  for(const mod of Object.values(mobileMods))for(const h of mod.held.values())h.used=true;
  if(e.pointerType!=='touch')return;e.preventDefault();e.stopImmediatePropagation();stage.setPointerCapture(e.pointerId);stage.focus({preventScroll:true});mobileTouch.points.set(e.pointerId,e);
  if(mobileTouch.points.size===2){mobileStartPinch();return;}if(mobileTouch.points.size>2){mobileTouch.mode='blocked';return;}
  mobileTouch.first=mobileTouch.last=mobileFreezeEvent(e);mobileTouch.mode='pending';mobileTouch.timer=setTimeout(mobileStartSingle,80);
  mobileTouch.hold=setTimeout(()=>{
    if(REC.armed||!['pending','single'].includes(mobileTouch.mode)||!['select','node','bone'].includes(S.tool)||Math.hypot(mobileTouch.last.clientX-e.clientX,mobileTouch.last.clientY-e.clientY)>8)return;
    mobileCancelSingle();const p=stagePt(e);if(S.tool==='bone'){skeletonHoverAt(p,false,true);skeletonMenuSync();}else {const hit=hitAt(p.w.x,p.w.y,8);if(hit){S.sel=[{lid:hit.lid,id:hit.id}];selectLayer(hit.lid,true);if(S.tool==='node'&&nodeEditable(hit.o)&&!hit.o.skin&&!hit.o.skel){const n=hitNodePart(hit.o,p.sx,p.sy);if(n?.part==='anchor'){S.nodeSel={ci:n.ci,ni:n.ni};S.kNodeSelection=[n.ci+':'+n.ni];}}refreshProps();invalidate();}mobileEditMenu({x:e.clientX,y:e.clientY});}mobileTouch.mode='menu';
  },550);
},{capture:true,passive:false});
stage.addEventListener('pointermove',e=>{
  if(e.pointerType!=='touch')return;e.preventDefault();e.stopImmediatePropagation();if(!mobileTouch.points.has(e.pointerId))return;mobileTouch.points.set(e.pointerId,e);mobileTouch.last=mobileFreezeEvent(e);
  if(mobileTouch.mode==='pinch'){mobileMovePinch();return;}if(Math.hypot(e.clientX-mobileTouch.first.clientX,e.clientY-mobileTouch.first.clientY)>8)clearTimeout(mobileTouch.hold);if(mobileTouch.mode==='single')onMove(e);
},{capture:true,passive:false});
function mobileEndTouch(e){
  if(e.pointerType!=='touch')return;e.preventDefault();e.stopImmediatePropagation();if(!mobileTouch.points.has(e.pointerId))return;
  if(e.type==='pointercancel')mobileCancelSingle();else if(['pending','single'].includes(mobileTouch.mode)){mobileStartSingle();onUp(e);mobileTouch.checkpoint=null;}
  mobileTouch.points.delete(e.pointerId);clearTimeout(mobileTouch.timer);clearTimeout(mobileTouch.hold);if(mobileTouch.points.size)mobileTouch.mode='blocked';else {mobileTouch.mode=null;mobileTouch.first=null;mobileTouch.last=null;mobileTouch.pinch=null;}
}
for(const event of ['pointerup','pointercancel'])stage.addEventListener(event,mobileEndTouch,{capture:true,passive:false});
stage.addEventListener('lostpointercapture',e=>{if(mobileTouch.points.has(e.pointerId))mobileEndTouch({pointerType:'touch',pointerId:e.pointerId,type:'pointercancel',preventDefault(){},stopImmediatePropagation(){}});});
/* A synthetic click gives touch buttons a consistent activation path. Ignore
   the delayed native compatibility click for that same activation. */
let mobileButtonTouch=null,mobileLastClick=null;
for(const id of ['bUndo','bRedo'])$('#'+id).addEventListener('click',e=>{
  if(mobileTouch.points.size){mobileCancelSingle();mobileTouch.mode='blocked';e.stopImmediatePropagation();}
  mobile.recorded.clear();mobile.recordUntil=0;mobileSyncRecord();
},true);

document.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch')return;
  if(mobile.navOwner&&!mobile.navOwner.contains(e.target)){mobile.blocked.add(e.pointerId);e.preventDefault();e.stopImmediatePropagation();return;}
  const b=e.target.closest('button');if(!b||b.disabled||b.dataset.mobileMod||b.closest('#boneMenu')||['boneAngle','boneAngleRemove'].includes(b.id))return;
  mobileButtonTouch={id:e.pointerId,button:b,x:e.clientX,y:e.clientY};
},true);
document.addEventListener('pointerup',e=>{
  if(mobile.blocked.delete(e.pointerId)){e.preventDefault();e.stopImmediatePropagation();return;}
  const p=mobileButtonTouch;if(!p||p.id!==e.pointerId)return;mobileButtonTouch=null;
  if(!p.button.isConnected||p.button.disabled||Math.hypot(e.clientX-p.x,e.clientY-p.y)>10)return;
  mobileLastClick={button:p.button,time:performance.now(),x:e.clientX,y:e.clientY};e.preventDefault();p.button.click();
},true);
document.addEventListener('click',e=>{if(e.isTrusted&&e.detail>0&&mobileLastClick&&performance.now()-mobileLastClick.time<700&&(mobileLastClick.button.contains(e.target)||Math.hypot(e.clientX-mobileLastClick.x,e.clientY-mobileLastClick.y)<14)){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('pointercancel',e=>{mobile.blocked.delete(e.pointerId);if(mobileButtonTouch?.id===e.pointerId)mobileButtonTouch=null;},true);

/* Native touch scrolling owns swipes; only a stationary tap selects a frame.
   Long press retains the shared frame actions, without starting a key drag. */
let mobileFrameHold=null;
function mobileSelectFrame(e,canvas){
  if(S.playing)stopPlay();
  const c=cellAt(e,canvas),l=canvas===tlC?layers().slice().reverse()[c.row]:null;
  if(e.shiftKey||mobileKey('Shift')){
    const all=canvas===tlRuler,from=S.fsel&&S.fsel.all===all&&(all||S.fsel.lid===l?.id)?S.fsel.anchor:S.frame;
    S.fsel={a:Math.min(from,c.f),b:Math.max(from,c.f),anchor:from,all,...(!all&&l?{lid:l.id}:{})};
  }else S.fsel=null;
  if(l)selectLayer(l.id);setFrame(c.f);drawTimeline();
}
for(const canvas of [tlC,tlRuler])for(const type of ['pointerdown','pointermove','pointerup','pointercancel'])canvas.addEventListener(type,e=>{
  if(e.pointerType!=='touch')return;e.stopImmediatePropagation();
  if(type==='pointerdown'){
    clearTimeout(mobileFrameHold?.timer);
    const h={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,menu:false};mobileFrameHold=h;
    if(canvas===tlC)h.timer=setTimeout(()=>{if(mobileFrameHold!==h||h.moved)return;h.menu=true;mobileFrameMenu(e);},550);
  }else if(mobileFrameHold?.id===e.pointerId){
    const h=mobileFrameHold;
    if(type==='pointermove'){if(Math.hypot(e.clientX-h.x,e.clientY-h.y)>8){h.moved=true;clearTimeout(h.timer);}}
    else {clearTimeout(h.timer);mobileFrameHold=null;if(type==='pointerup'&&!h.moved&&!h.menu)mobileSelectFrame(e,canvas);}
  }
},{capture:true,passive:true});
function mobileFrameMenu(e){
  const c=cellAt(e,tlC),l=layers().slice().reverse()[c.row];if(!l)return;selectLayer(l.id);setFrame(c.f);
  showMenu(null,[{label:'Copy Frames',disabled:l.locked,fn:()=>copySelectedFrames(l,c.f)},{label:'Cut Selected Frames',disabled:l.locked,fn:()=>cutSelectedFrames(l,c.f)},{label:'Paste Frames',disabled:l.locked||!copiedFrames,fn:()=>pasteSelectedFrames(l,c.f)},{label:'Clear Selected Frames',disabled:l.locked,fn:()=>clearSelectedFrames(l,c.f)},'-',...['frame','key','blank','rmframe','clearkey','motion','shape','notween'].map((kind,i)=>({label:['Insert frame','Insert keyframe','Insert blank keyframe','Remove selected frames','Clear keyframe','Create motion tween','Create shape tween','Remove tween'][i],disabled:l.locked,fn:()=>frameAction(kind)}))],{x:e.clientX,y:e.clientY});
}
const nativeProjectToggle=toggleProjectMenu;toggleProjectMenu=open=>{const expanded=typeof open==='boolean'?open:$('#projectToggle').getAttribute('aria-expanded')!=='true';if(expanded)mobileClosePanel();nativeProjectToggle(expanded);};
$('#projectToggle').innerHTML='<svg viewBox="0 0 20 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3h11v15H6zM3 6v15h11"/></svg>';
let mobileProjectDrag=null;
$('#projectToggle').addEventListener('pointerdown',e=>{mobileProjectDrag={x:e.clientX,y:e.clientY,bottom:stageH-$('#projectDrawer').offsetTop-$('#projectDrawer').offsetHeight};e.currentTarget.setPointerCapture(e.pointerId);});
$('#projectToggle').addEventListener('pointermove',e=>{if(!mobileProjectDrag)return;if(Math.abs(e.clientY-mobileProjectDrag.y)>12){mobileProjectDrag.moved=true;$('#projectDrawer').style.bottom=clamp(mobileProjectDrag.bottom+mobileProjectDrag.y-e.clientY,70,Math.max(70,stageH-$('#projectDrawer').offsetHeight-60))+'px';}});
for(const event of ['pointerup','pointercancel'])$('#projectToggle').addEventListener(event,()=>{if(mobileProjectDrag?.moved)mobileLastClick={button:$('#projectToggle'),time:performance.now()};mobileProjectDrag=null;});
const nativeMobileLoad=loadDoc;loadDoc=doc=>{nativeMobileLoad(doc);mobile.recorded.clear();mobile.recordUntil=0;mobileSyncRecord();};
const nativeSwitchProject=switchProject;switchProject=id=>{nativeSwitchProject(id);mobileClosePanel();toggleProjectMenu(false);mobileSyncRecord();};
const nativeOpenProject=openProjectDoc;openProjectDoc=(...args)=>{nativeOpenProject(...args);mobileClosePanel();toggleProjectMenu(false);mobileSyncRecord();};
window.addEventListener('blur',()=>{if(mobileTouch.points.size)mobileCancelSingle();mobileTouch.points.clear();mobileTouch.mode=null;for(const mod of Object.values(mobileMods))mod.held.clear();mobileSyncModifiers();});
window.addEventListener('resize',()=>requestAnimationFrame(()=>{for(const p of Object.values(mobile.panels))if(!p.box.hidden)mobilePlacePanel(p);if(S.autoFit)fitView();}));
setTool('select');mobileSyncModifiers();mobileSyncRecord();requestAnimationFrame(()=>{resizeStage();fitView();refreshAll();});
