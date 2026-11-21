/* Session-only desktop layout. The editor document and history are untouched. */
const TIMELINE_LAYOUT={height:null,drag:null,raf:0};
function initTimelineResize(){
  const app=$('#app'),panel=$('#tl'),grip=$('#tlResize');
  const mobile=()=>document.body.classList.contains('oskyn-mobile');
  const maximum=()=>Math.max(8,innerHeight-$('#top').getBoundingClientRect().bottom);
  const defaultHeight=()=>Math.min(maximum(),parseFloat(getComputedStyle(app).getPropertyValue('--timeline-default-height'))||232);
  function apply(height,preserve=true){
    if(mobile())return;
    const def=defaultHeight();let h=height==null?def:clamp(height,8,maximum());
    if(Math.abs(h-def)<=8){h=def;TIMELINE_LAYOUT.height=null;}else{h=h<24?8:h;TIMELINE_LAYOUT.height=h;}
    if(preserve)S.autoFit=false;
    app.style.setProperty('--timeline-height',h+'px');
    document.body.classList.toggle('timeline-adjusted',Math.abs(h-def)>.5);
    document.body.classList.toggle('timeline-collapsed',h===8);
    grip.setAttribute('aria-valuemin','8');grip.setAttribute('aria-valuemax',String(Math.round(maximum())));grip.setAttribute('aria-valuenow',String(Math.round(h)));
    if(!TIMELINE_LAYOUT.raf)TIMELINE_LAYOUT.raf=requestAnimationFrame(()=>{TIMELINE_LAYOUT.raf=0;invalidate();});
  }
  grip.addEventListener('pointerdown',e=>{
    if(mobile()||e.button!==0)return;
    e.preventDefault();grip.setPointerCapture(e.pointerId);
    TIMELINE_LAYOUT.drag={id:e.pointerId,y:e.clientY,start:panel.getBoundingClientRect().height,previous:TIMELINE_LAYOUT.height};
  });
  grip.addEventListener('pointermove',e=>{const d=TIMELINE_LAYOUT.drag;if(!d||d.id!==e.pointerId)return;if(Math.abs(e.clientY-d.y)<2&&!d.moved)return;d.moved=true;document.body.classList.add('timeline-resizing');apply(d.start+d.y-e.clientY);});
  const end=e=>{const d=TIMELINE_LAYOUT.drag;if(!d||d.id!==e.pointerId)return;TIMELINE_LAYOUT.drag=null;document.body.classList.remove('timeline-resizing');if(e.type==='pointercancel')apply(d.previous);};
  grip.addEventListener('pointerup',end);grip.addEventListener('pointercancel',end);grip.addEventListener('lostpointercapture',end);
  grip.addEventListener('dblclick',e=>{e.preventDefault();TIMELINE_LAYOUT.drag=null;document.body.classList.remove('timeline-resizing');apply(null);});
  grip.addEventListener('keydown',e=>{if(mobile())return;let h=panel.getBoundingClientRect().height;if(e.key==='ArrowUp')h+=16;else if(e.key==='ArrowDown')h-=16;else if(e.key==='Home')h=8;else if(e.key==='End')h=maximum();else if(e.key==='Enter')h=null;else return;e.preventDefault();e.stopPropagation();apply(h);});
  window.addEventListener('resize',()=>apply(TIMELINE_LAYOUT.height,false));
  apply(null,false);
}
