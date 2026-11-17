const TOOLS = [
  { id: 'select', k: 'V', n: 'Selection', svg: '<path d="M5 3l10.5 6.5-4.8 1.3-2.5 4.7z"/>', cur: 'default' },
  { id: 'node', k: 'A', n: 'Node edit', svg: '<path d="M5 3l8 5-3.5 1-2 4z"/><rect x="12.5" y="12.5" width="4" height="4"/>', cur: 'default' },
  { sep: 1 },
  { id: 'pen', k: 'P', n: 'Pen (click, or drag for curves; Enter to finish)', svg: '<path d="M3.5 16.5l1.8-5.2 7.6-7.6 3.4 3.4-7.6 7.6z"/><path d="M5.3 11.3l3.4 3.4"/>', cur: 'crosshair' },
  { id: 'pencil', k: 'Y', n: 'Pencil (draw freehand nodes)', svg: '<path d="M6.8 12.7l1-4.1L14 2.4l3.4 3.4-6.2 6.2z"/><path d="m7.8 8.6 3.4 3.4M4 12.5v6M1 15.5h6"/><rect x="12" y="14" width="4.5" height="4.5"/>', cur: 'crosshair' },
  { id: 'brush', k: 'B', n: 'Brush (paints a filled shape; [ and ] change size)', svg: '<path d="M16.5 3.5c-3 .6-6.5 4-8 7l1.5 1.5c3-1.5 6.4-5 7-8.5z"/><path d="M8.3 11.3c-2 0-3.3 1.2-3.3 3.2 0 1-.5 1.6-1.2 2 2.6.6 6-.2 6-3.4"/>', cur: 'crosshair' },
  { id: 'fluid', k: 'F', n: 'Fluid brush (smooth, tapered strokes; [ and ] change size)', svg: '<path d="M16.8 3.2c-4 .2-8.4 3.6-9.6 8.2l1.4 1.4c4.6-1.2 8-5.6 8.2-9.6z"/><path d="M7 12.6c-1.6 0-2.6 1.2-2.6 2.8 0 .8-.4 1.3-1 1.6 2.2.4 4.6-.6 4.6-2.8"/><path d="M10.5 16.5c1.6.4 3.2-.2 5-1.8" stroke-dasharray="1.6 2"/>', cur: 'crosshair' },
  { id: 'eraser', k: 'E', n: 'Eraser (cuts fills and lines on the active layer; [ and ] change size)', svg: '<path d="M7.5 16.5h8"/><path d="M4.2 11.8L11 5l4.2 4.2-6.8 6.8H6z"/><path d="M8 8.2l4.2 4.2"/>', cur: 'crosshair' },
  { id: 'bone', k: 'J', n: 'Bones (click to place a bone; hover a joint for actions)', svg: '<circle cx="4" cy="10" r="3" stroke-dasharray="3 2"/><circle cx="16" cy="10" r="3" stroke-dasharray="3 2"/><path d="M7 10h6" stroke-dasharray="2 2"/>', cur: 'crosshair' },
  { id: 'mirror', k: 'M', n: 'Mirror (drag from toolbar or draw a frame; filled vector paths)', svg: '<path d="M10 2v16" stroke-dasharray="2 2"/><path d="M7 5L2 10l5 5zM13 5l5 5-5 5z"/>', cur: 'crosshair' },
  { id: 'line', k: 'L', n: 'Line (Shift = 45°)', svg: '<path d="M4 16L16 4"/>', cur: 'crosshair' },
  { id: 'rect', k: 'R', n: 'Rectangle (Shift = square, Alt = from centre)', svg: '<rect x="3.5" y="5.5" width="13" height="9" rx="1"/>', cur: 'crosshair' },
  { id: 'ellipse', k: 'O', n: 'Ellipse (Shift = circle, Alt = from centre)', svg: '<ellipse cx="10" cy="10" rx="7" ry="5.5"/>', cur: 'crosshair' },
  { id: 'star', k: 'U', n: 'Star / Cog (drag to draw; Shift + ring to turn)', svg: '<path d="M10 2l2.4 5.1 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8z"/>', cur: 'crosshair' },
  { sep: 1 },
  { id: 'text', k: 'T', n: 'Text (click to type; double-click text to edit)', svg: '<path d="M3.5 16.5L9.2 3.5h1.6l5.7 13M5.6 12h8.8"/>', cur: 'text' },
  { id: 'bucket', k: 'K', n: 'Paint bucket (Alt = stroke)', svg: '<path d="M4 10l5.5-5.5 6 6-5.5 5.5z"/><path d="M16.5 12.5c0 1.5 1.2 1.9 1.2 3.1a1.2 1.2 0 01-2.4 0c0-1.2 1.2-1.6 1.2-3.1z"/>', cur: 'cell' },
  { id: 'dropper', k: 'I', n: 'Screen eyedropper (Alt = stroke; Esc = cancel)', svg: '<path d="M11 5.5l2.2-2.2a2.8 2.8 0 014 4L15 9.5" fill="currentColor"/><path d="M9.5 4l6.5 6.5M10.7 6.2L4.2 12.7v2.6L2.8 17l1.7-1.4h2.6l6.5-6.5"/>', cur: 'copy' },
  { id: 'gradient', k: 'G', n: 'Gradient (drag across a filled path; double-click line to add stop)', svg: '<rect x="3" y="5" width="14" height="10" rx="1"/><path d="M5 12L15 8M5 15V5"/>', cur: 'crosshair' },
  { id: 'hand', k: 'H', n: 'Hand (or hold Space)', svg: '<path d="M7 9.5V5a1.2 1.2 0 012.4 0v3.5V4a1.2 1.2 0 012.4 0v4.5V5a1.2 1.2 0 012.4 0v6.2c0 3-2 5-5 5-2.6 0-3.8-1.5-4.8-3.4L4 10.6a1.2 1.2 0 012-.8z"/>', cur: 'grab' }
];
function buildTools() {
  const box = $('#tools');
  for (const t of TOOLS) {
    if (t.sep) continue; // KROGAN: no divider rows in either layout
    const b = document.createElement('button');
    b.className = 'tool'; b.dataset.tool = t.id; b.title = t.n + ' (' + t.k + ')'; b.setAttribute('aria-label', t.n); b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true">' + t.svg + '</svg><kbd>' + t.k + '</kbd>';
    b.addEventListener('click', e => {if(t.id==='mirror'){if(!b.dataset.mirrorDragged)mirrorBegin();return;}setTool(t.id);if(t.id==='dropper')screenDropper(e.altKey);});
    if(t.id==='mirror')b.addEventListener('pointerdown',e=>{if(e.button===0){MIR.palette={x:e.clientX,y:e.clientY,button:b,started:false};b.setPointerCapture(e.pointerId);}});
    box.appendChild(b);
  }
  const sw = document.createElement('div');
  sw.className = 'swatches';
  sw.innerHTML = '<input type="color" id="swStroke" title="Stroke colour" aria-label="Stroke colour"><input type="color" id="swFill" title="Fill colour" aria-label="Fill colour">';
  const layout = document.createElement('button');
  layout.type = 'button';
  layout.id = 'kToolLayout';
  layout.className = 'tool-layout-toggle';
  layout.title = 'Switch between one-column and two-column toolbars';
  layout.setAttribute('aria-label', 'Toggle toolbar columns');
  layout.textContent = '';
  box.appendChild(layout);
  box.appendChild(sw);
  let compact = false;
  try { compact = sessionPrefs.getItem('kroganToolColumns') === '2'; } catch (_) {}
  const syncLayout = () => {
    document.body.classList.toggle('k-tools-double', compact);
    layout.setAttribute('aria-pressed', String(compact));
    layout.title = compact ? 'Use one toolbar column' : 'Use two toolbar columns';
  };
  layout.addEventListener('click', () => {
    compact = !compact;
    syncLayout();
    try { sessionPrefs.setItem('kroganToolColumns', compact ? '2' : '1'); } catch (_) {}
  });
  syncLayout();
}
function rememberDrawingColour(colour){
  if(typeof colour!=='string'||!/^#[0-9a-f]{3,8}$/i.test(colour))return;
  S.style.drawColor=colour;S.style.bcolor=colour;S.style.fb.color=colour;
  for(const id of ['bcolor','fb_color']){const el=document.getElementById(id);if(el)setVal(el,colour);}
}
function setTool(id) {
  if(id!==S.tool)clearProtest();
  if(id!=='dropper'){panelPicker=false;document.body.classList.remove('screen-pick-fallback');}
  if(S.drag?.type==='skeleton'&&id!==S.tool){if(S.drag.started)commit();S.drag=null;}
  if (S.pen && id !== 'pen') finishPen(false);
  if(id==='brush'||id==='fluid')rememberDrawingColour(S.style.drawColor||singleSel()?.o.fill||S.style.fill||S.style.stroke);
  endTextEdit(true);
  S.bone = null;
  S.tool = id; S.draw = null; S.nodeSel = id === 'node' ? S.nodeSel : null;
  if (id !== 'node') S.kNodeSelection = [];
  if(id==='node'){
    const one=singleSel();
    if(one?.o.star&&!getLayer(one.lid).locked){pushUndo();C.ensureEditable(getLayer(one.lid),S.frame);starBake(findEditable(one.lid,one.id));commit();}
  }
  document.getElementById('kNodeBar')?.classList.toggle('on', id === 'node');
  document.getElementById('kSelectBar')?.classList.toggle('on', id === 'select');
  $$('.tool').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === id)));
  const t = TOOLS.find((x) => x.id === id);
  stage.style.cursor = t ? t.cur : 'default';
  $('#hTool').textContent = t ? t.n.replace(/ \(.*\)/, '') : '';
  { let any = false; $$('#toolopts label').forEach((lb) => { const m = lb.dataset.for.split(' ').includes(id); lb.classList.toggle('on', m); any = any || m; }); $('#toolopts').classList.toggle('on', any); }
  { const was = S.tool0; S.tool0 = id; const tb = $('#tab-brush');
    if (tb) {
      tb.hidden = id !== 'fluid';
      if (id === 'fluid' && was !== 'fluid') { if (S.tab !== 'brush') S.tabBefore = S.tab; }
      else if (id !== 'fluid' && S.tab === 'brush') setTab(S.tabBefore && S.tabBefore !== 'brush' ? S.tabBefore : 'obj');
    } }
  if (id === 'text') autoTab('text'); else if (id === 'fluid') autoTab('brush');
  skeletonAimClear();SK.menuLock=null;SK.rigidPick=null;SK.binding=false;SK.bindTarget=null;SK.angleEdit=null;SK.angleHover=null;
  SK.placeReady=id==='bone';
  if(id==='bone'){SK.add=false;SK.hover=null;SK.dismissed=null;}
  else {SK.add=false;SK.hover=null;SK.actionDrag=null;}
  skeletonPanel();
  invalidate();
}

function selectionControlsHidden(){return S.tool==='select'&&!!S.shiftHeld&&S.drag?.type!=='star';}
window.addEventListener('keydown',e=>{if(e.key==='Shift'&&!e.target.closest?.('input,textarea,select,[contenteditable="true"]')){S.shiftHeld=true;if(S.tool==='select')stage.style.cursor='move';invalidate();}});
window.addEventListener('keyup',e=>{if(e.key==='Shift'){S.shiftHeld=false;if(S.tool==='select')stage.style.cursor='default';invalidate();}});
window.addEventListener('blur',()=>{S.shiftHeld=false;invalidate();});

/* ---------- hit testing & creation ---------- */
function hitAt(x, y, tolPx, rigFirst) {
  const tol = tolPx / S.view.z, ls = layers();
  /* a bone arm is a guide laid over artwork, so it is picked last unless asked for first (Alt+click) */
  for (const pass of rigFirst ? [true, false] : [false, true]) {
    for (let i = ls.length - 1; i >= 0; i--) {
      const l = ls[i];
      if (!l.visible || l.locked) continue;
      const objs = C.evalLayerObjs(l, S.frame);
      for (let j = objs.length - 1; j >= 0; j--) if (!!objs[j].rig === pass && hitObj(objs[j], x, y, tol, hctx)) return { lid: l.id, id: objs[j].id, o: objs[j] };
    }
  }
  return null;
}
function canDraw() {
  const l = curLayer();
  if (!l) return false;
  if (l.locked) { protest('This layer is locked. Unlock it to draw.'); return false; }
  if (l.visible === false) { protest('This layer is hidden. Show it to draw.'); return false; }
  return true;
}
function currentPaint(forceStroke) {
  const st = S.style;
  const p = { fill: st.fillOn ? st.fill : null, fa: st.fa, stroke: st.strokeOn ? st.stroke : null, sa: st.sa, sw: st.sw, cap: st.cap, join: st.join, dash: st.dash || 'solid' };
  if (forceStroke && !p.stroke) { p.stroke = st.stroke; p.sa = 1; }
  if (!p.fill && !p.stroke) { p.stroke = st.stroke; p.sa = 1; }
  return p;
}
function addObject(o) {
  const l = curLayer();
  if (!l || l.locked || l.visible === false) return false;
  pushUndo();
  const kf = C.ensureEditable(l, S.frame);
  kf.objs.push(o);
  S.sel = [{ lid: l.id, id: o.id }];
  commit(); buildLayerList();
  return true;
}
/* freehand strokes: don't select the result, and optionally merge into the previous stroke of the same colour so a drawing stays one shape */
function contourArea(c) { let a = 0; const n = c.nodes; for (let i = 0; i < n.length; i++) { const p = n[i], q = n[(i + 1) % n.length]; a += p.x * q.y - q.x * p.y; } return a / 2; }
function facePositive(cs) { for (const c of cs) if (contourArea(c) < 0) c.nodes.reverse(); return cs; }
function addStroke(o, merge, tag) {
  const l = curLayer();
  if (!l || l.locked || l.visible === false) return false;
  pushUndo();
  const kf = C.ensureEditable(l, S.frame);
  const q = kf.objs[kf.objs.length - 1];
  o.fl = tag;
  if (merge && q && q.kind === 'path' && q.fl === tag && q.fill === o.fill && q.fa === o.fa && !q.stroke && !q.grad && q.t.r === 0 && q.t.sx === 1 && q.t.sy === 1 && (q.op == null || q.op === 1)) {
    for (const c of o.contours) { for (const n of c.nodes) { n.x += o.t.x - q.t.x; n.y += o.t.y - q.t.y; } q.contours.push(c); }
    C.recenter(q);
  } else kf.objs.push(o);
  S.sel = [];
  commit(); buildLayerList();
  return true;
}
function stagePt(e) {
  const r = stage.getBoundingClientRect();
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  return { sx, sy, w: s2w(sx, sy) };
}

/* ---------- pointer plumbing ---------- */
const ptrs = new Map();
let pinch = null;
stage.addEventListener('pointerleave', () => { if (S.brushHover) { S.brushHover = null; invalidate(); } });
stage.tabIndex=0;
stage.addEventListener('pointerdown', (e) => {
  stage.focus({preventScroll:true});
  stage.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { startPinch(); return; }
  if (ptrs.size > 2) return;
  onDown(e);
});
stage.addEventListener('pointermove', (e) => {
  if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch) { movePinch(); return; }
  onMove(e);
});
const endPtr = (e) => {
  const had = ptrs.delete(e.pointerId);
  if (pinch) { if (ptrs.size < 2) pinch = null; return; }
  if (had) onUp(e);
};
stage.addEventListener('pointerup', endPtr);
stage.addEventListener('pointercancel', endPtr);
stage.addEventListener('dblclick', (e) => onDbl(e));
stage.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (S.tool === 'pen' && S.pen) finishPen(false);
  if(SK.add||SK.binding||SK.placeReady||SK.rigidPick){SK.rigidPick=null;SK.add=false;SK.binding=false;SK.bindTarget=null;SK.placeReady=false;skeletonPanel();invalidate();}
});
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p=stagePt(e),unit=e.deltaMode===1?16:e.deltaMode===2?stageH:1,dx=e.deltaX*unit,dy=e.deltaY*unit;
  if(e.ctrlKey||e.metaKey||e.altKey)zoomAt(p.sx,p.sy,Math.exp(Math.max(-.18,Math.min(.18,-dy*.0015))));
  else {if(e.shiftKey)S.view.px-=dx||dy;else {S.view.px-=dx;S.view.py-=dy;}S.autoFit=false;invalidate();}
}, { passive: false });
function startPinch() {
  S.drag = null; S.draw = null;
  const [a, b] = Array.from(ptrs.values());
  const r = stage.getBoundingClientRect();
  pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: S.view.z, cx0: (a.x + b.x) / 2 - r.left, cy0: (a.y + b.y) / 2 - r.top, px0: S.view.px, py0: S.view.py };
}
function movePinch() {
  const [a, b] = Array.from(ptrs.values());
  const r = stage.getBoundingClientRect();
  const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
  const cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top;
  const z = clamp(pinch.z0 * d / pinch.d0, 0.05, 32);
  const wx = (pinch.cx0 - pinch.px0) / pinch.z0, wy = (pinch.cy0 - pinch.py0) / pinch.z0;
  S.view.z = z; S.view.px = cx - wx * z; S.view.py = cy - wy * z;
  S.autoFit = false;
  updateZoom(); invalidate();
}

function onDown(e) {
  if (REC.armed && !['select','node','bone'].includes(S.tool) && e.button === 0 && !S.space) { protest('Record: use Selection or Node edit to move an existing figure.'); return; }
  if (S.playing) stopPlay();
  const p = stagePt(e);
  if (e.button === 0 && !(e.ctrlKey&&['select','node','mirror'].includes(S.tool)) && kroganGhostAt(p.sx, p.sy)) return; // Ghost marker: no drawing or selection behind it.
  if (e.button === 1 || S.space || S.tool === 'hand') {
    S.drag = { type: 'pan', sx: p.sx, sy: p.sy, px: S.view.px, py: S.view.py };
    stage.style.cursor = 'grabbing';
    return;
  }
  if (e.button !== 0) return;
  S.cursorW = p.w;
  if(S.tool==='select')S.shiftHeld=e.shiftKey;
  // Ctrl selection must win before pivots, handles, curves and object hit-tests.
  if(e.ctrlKey&&['select','node','mirror'].includes(S.tool)){
    const one=singleSel(),nodes=S.tool==='node'&&nodeEditable(one?.o)&&!one.o.arc&&!one.o.skel&&!one.o.skin&&!getLayer(one.lid)?.locked;
    if(nodes&&e.shiftKey&&hitNodePart(one.o,p.sx,p.sy)){
      nodeDown({shiftKey:false,altKey:e.altKey,ctrlKey:true},p);return;
    }
    S.drag=nodes?{type:'node-marquee',start:p.w,cur:p.w,lid:one.lid,id:one.id,base:e.shiftKey?kNodeKeys().slice():[],forceMarquee:true,clickTool:S.tool}:{type:'marquee',start:p.w,cur:p.w,base:e.shiftKey?S.sel.slice():[],forceMarquee:true,clickTool:S.tool};
    stage.style.cursor='crosshair';invalidate();return;
  }
  if(!selectionControlsHidden()){
    if(mirrorDown(e,p))return;
    if(starDown(e,p))return;
    if(arcDown(p))return;
  }
  switch (S.tool) {
    case 'select': selDown(e, p); break;
    case 'node': nodeDown(e, p); break;
    case 'gradient': kroganGradDown(e, p); break;
    case 'pen': penDown(e, p); break;
    case 'pencil': if (canDraw()) S.draw = { type: 'pencil', pts: [p.w] }; break;
    case 'brush': if (canDraw()) S.draw = { type: 'brush', pts: [brushPt(p.w, e)] }; break;
    case 'fluid': if (canDraw()) S.draw = { type: 'fluid', pts: [brushPt(p.w, e)] }; break;
    case 'eraser': if (canDraw()) { S.draw = { type: 'erase', last: p.w, changed: false, undone: false }; eraseSweep(S.draw, p.w, p.w); S.brushHover = p.w; } break;
    case 'line': case 'rect': case 'ellipse': case 'star': if (canDraw()) S.draw = { type: S.tool, start: ['rect','line'].includes(S.tool)?gridPoint(p.w):p.w, cur: ['rect','line'].includes(S.tool)?gridPoint(p.w):p.w, shift: e.shiftKey, alt: e.altKey || e.ctrlKey || e.metaKey }; break;
    case 'bone': boneDown(e, p); break;
    case 'text': textDown(e, p); break;
    case 'bucket': bucketDown(e, p); break;
    case 'dropper': dropperDown(e, p); break;
  }
  invalidate();
}
function onMove(e) {
  const p = stagePt(e);
  mirrorHover(p);
  if(starSelection()&&!S.drag)invalidate();
  S.cursorW = p.w;
  if (S.tool === 'brush' || S.tool === 'fluid') { S.brushHover = p.w; if (!S.draw) invalidate(); }
  if (S.tool === 'eraser') { S.brushHover = p.w; if (!S.draw) invalidate(); }
  $('#hCoord').textContent = 'x ' + Math.round(p.w.x) + '  y ' + Math.round(p.w.y);
  const d = S.drag;
  if (d) {
    if(d.type==='mirror'){mirrorDrag(p.w,e);return;}
    if(d.type==='star'){starDrag(p.w,e);return;}
    if (REC.armed && recordDragTypes.has(d.type) && !recordPrepareDrag(d,p.w)) return;
    if(d.type==='arc-mouth'){arcDrag(p.w);if(REC.held&&REC.live&&d.started)recordBegin();return;}
    if (d.type === 'pan') { S.view.px = d.px + (p.sx - d.sx); S.view.py = d.py + (p.sy - d.sy); S.autoFit = false; invalidate(); return; }
	if (d.type === 'pivot') pivotDrag(p.w);
	else
    if (d.type === 'move') moveDrag(p.w, e);
    else if (d.type === 'scale' || d.type === 'rotate') xformDrag(p.w, e);
    else if (d.type === 'marquee' || d.type === 'node-marquee') { d.cur = p.w; invalidate(); }
    else if (d.type === 'node') nodeDrag(p.w, e);
    else if (d.type === 'curve-bend') kCurveDrag(p.w);
    else if (d.type === 'grad') gradDrag(p.w);
    else if (d.type === 'kgrad-create') kroganGradMove(p.w);
    else if (d.type === 'skeleton') skeletonDrag(p.w);
    else if (d.type === 'bone-limit') skeletonAngleDrag(p);
    if (REC.live && REC.drag === d) recordObserveDrag(e);
    if (REC.held && REC.live && d.started) recordBegin();
    return;
  }
  if (S.draw) {
    const dr = S.draw;
    if (dr.type === 'erase') { if (Math.hypot(p.w.x - dr.last.x, p.w.y - dr.last.y) * S.view.z >= 1.5) { eraseSweep(dr, dr.last, p.w); dr.last = p.w; } S.brushHover = p.w; invalidate(); return; }
    if (dr.type === 'pencil') dr.pts.push(p.w); else if (dr.type === 'brush' || dr.type === 'fluid') dr.pts.push(brushPt(p.w, e)); else { dr.cur = ['rect','line'].includes(dr.type)?gridPoint(p.w):p.w; dr.shift = e.shiftKey; dr.alt = e.altKey || e.ctrlKey || e.metaKey; }
    invalidate(); return;
  }
  if (S.bone) invalidate();
  if (S.pen) { penMove(p.w); return; }
  if (S.tool === 'gradient' && !S.space) { stage.style.cursor = 'crosshair'; }
  if(e.ctrlKey&&['select','node','mirror'].includes(S.tool)&&!S.space){stage.style.cursor='crosshair';return;}
  if (S.tool === 'select' && !S.space) {
    const one = singleSel();
    let cur = 'default';
    if (one && !getLayer(one.lid).locked) {
      const h = hitHandle(getHandles(one.o), p.sx, p.sy);
      if (h) cur = h.id.startsWith('rot') ? 'grab' : (h.id === 'n' || h.id === 's') ? 'ns-resize' : (h.id === 'e' || h.id === 'w') ? 'ew-resize' : (h.id === 'nw' || h.id === 'se') ? 'nwse-resize' : 'nesw-resize';
      else if (hitAt(p.w.x, p.w.y, 5)) cur = 'move';
    } else if (hitAt(p.w.x, p.w.y, 5)) cur = 'move';
    stage.style.cursor = cur;
  }
}
function onUp(e) {
  
  if (REC.drag && REC.drag === S.drag) { recordFinishDrag(); C.freeBind.clear(); return; }
  const p = stagePt(e);
  const d = S.drag;
  if(d?.forceMarquee){
    d.cur=p.w;
    if(e.type==='pointercancel'){S.drag=null;invalidate();return;}
    if(Math.max(Math.abs(p.w.x-d.start.x),Math.abs(p.w.y-d.start.y))*S.view.z<3){
      S.drag=null;const start={...p,w:d.start};
      if(d.clickTool==='node')nodeDown(e,start);else if(d.clickTool==='select')selDown(e,start);
      if(S.drag?.type==='node-marquee')kNodeMarqueeUp(S.drag);
      S.drag=null;refreshProps();invalidate();return;
    }
  }
  if(d?.type==='mirror'){
    if(e.type==='pointercancel'){if(d.undo){const snap=H.stack.pop();restoreSnap(snap);updateHistoryButtons();}else MIR.box=d.base;S.drag=null;invalidate();return;}
    mirrorDrag(p.w,e);MIR.placing=false;S.drag=null;if(!MIR.id)mirrorPersist();else if(d.changed){commit();refreshAll();}invalidate();return;
  }
  if (d) {
    
    C.freeBind.clear();
    if (d.type === 'pan') { const t = TOOLS.find((x) => x.id === S.tool); stage.style.cursor = S.space ? 'grab' : t.cur; }
    if (d.type === 'marquee') marqueeUp(d);
    if (d.type === 'node-marquee') kNodeMarqueeUp(d);
    if ((d.type === 'star' || d.type === 'arc-mouth' || d.type === 'node' || d.type === 'curve-bend' || d.type === 'grad' || d.type === 'rig' || d.type === 'skeleton' || d.type === 'bone-limit' || d.type === 'kgrad-create') && d.started) { commit(); }
    // Saglabājam arī pabeigtu pivot pārvietošanu.
    if ((d.type === 'move' || d.type === 'scale' ||
	d.type === 'rotate' || d.type === 'pivot') && d.started) commit();
    S.drag = null; invalidate();
    return;
  }
  if (S.draw) {
    const dr = S.draw; S.draw = null;
    if (dr.type === 'erase') { if (dr.changed) { finishErase(dr); S.sel = []; commit(); buildLayerList(); } }
    else if (dr.type === 'pencil') finishPencil(dr.pts);
    else if (dr.type === 'brush') finishBrush(dr.pts);
    else if (dr.type === 'fluid') finishFluid(dr.pts);
    else finishShape(dr);
    invalidate(); return;
  }
  if (S.pen) penUp();
}
function onDbl(e) {
  if(singleSel()?.o.mirror){mirrorBegin();return;}
  if (REC.armed) { protest('Leave Record mode before adding or removing nodes.'); return; }
  const p = stagePt(e);
  if(starFinish(p)){e.preventDefault();return;}
  if(arcFinish(p)){e.preventDefault();return;}
  const rescue = kroganGhostAt(p.sx, p.sy);
  if (rescue) { e.preventDefault(); enterSym(rescue.sym); return; }
    // Ctrl + dubultklikšķis uz pivot atgriež to figūras centrā.
  if (S.tool === 'select' && e.ctrlKey) {

    // Iegūstam pašlaik atlasīto figūru.
    const one = singleSel();

    // Pārbaudām, vai figūra ir atlasīta, nav bloķēta
    // un pele atrodas tieši uz oranžā krustiņa.
    if (one && !getLayer(one.lid).locked &&
        pivotHit(one.o, p.sx, p.sy)) {

      // Saglabājam iepriekšējo stāvokli Ctrl+Z vajadzībām.
      pushUndo();

      // Sagatavojam figūru rediģēšanai pašreizējā kadrā.
      C.ensureEditable(getLayer(one.lid), S.frame);

      // Atrodam rediģējamo figūru.
      const o = findEditable(one.lid, one.id);

      // Ja figūra atrasta, noņemam pielāgoto pivot.
      if (o) {
        delete o.pivot; // getPivot() atkal izmantos figūras centru.
        commit();       // Saglabājam izmaiņas.
        invalidate();   // Pārzīmējam ekrānu.
      }

      // Neļaujam dubultklikšķim atvērt simbolu.
      e.preventDefault();
      return;
    }
  }
  if (S.tool === 'pen' && S.pen) { finishPen(false); return; }
  if(S.tool==='node'||S.tool==='select'){
    const h=hitAt(p.w.x,p.w.y,5);
    if(h?.o.kind==='clip'){clearProtest();e.preventDefault();enterSym(h.o.sym);return;}
  }
  if (S.tool === 'node') {nodeDbl(p);return;}
  if (S.tool === 'gradient') { kroganGradDouble(p); return; }
  if (S.tool === 'select') {
    const h = hitAt(p.w.x, p.w.y, 5);
    if (h && h.o.kind === 'text') startTextEdit(null, { lid: h.lid, id: h.id });
    else if (h && h.o.kind === 'clip') enterSym(h.o.sym);
    else if(h&&nodeEditable(h.o)&&!h.o.skel&&!h.o.rig&&!h.o.skin&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
      const one=singleSel();
      if(one&&one.lid===h.lid&&one.id===h.id){S.nodeSel=null;S.kNodeSelection=[];setTool('node');refreshProps();e.preventDefault();}
    }
    else if (!h && S.edit.length) exitSym();
  }
}
stage.addEventListener('mousedown', (e) => { if (S.tool === 'text') e.preventDefault(); });

/* ---------- text tool ---------- */
let textEd = null;
function textDown(e, p) {
  const h = hitAt(p.w.x, p.w.y, 4);
  if (h && h.o.kind === 'text') startTextEdit(null, { lid: h.lid, id: h.id });
  else startTextEdit(p.w, null);
}
function startTextEdit(w, ex) {
  endTextEdit(true);
  let src = null;
  if (ex) { src = findEval(ex.lid, ex.id); if (!src || src.kind !== 'text') return; if (getLayer(ex.lid).locked) return; }
  else if (!canDraw()) return;
  const st = S.style, r0 = src ? src.runs[0] : { font: st.font, size: st.size, c: st.fillOn ? st.fill : '#000000', b: st.bold, i: st.italic };
  const pos = src ? mapply(matOf(src.t), 0, 0) : [w.x, w.y];
  const sc = src ? Math.abs(src.t.sy) : 1;
  const sp = w2s(pos[0], pos[1]);
  const ta = document.createElement('textarea');
  ta.id = 'textEd'; ta.wrap = 'off'; ta.spellcheck = false; ta.rows = 1;
  ta.value = src ? src.runs.map((r) => r.t).join('') : '';
  ta.style.left = stage.offsetLeft + sp[0] + 'px'; ta.style.top = stage.offsetTop + sp[1] + 'px';
  ta.style.font = (r0.i ? 'italic ' : '') + (r0.b ? 'bold ' : '') + (r0.size * sc * S.view.z) + 'px "' + r0.font + '", Arial, sans-serif';
  ta.style.lineHeight = '1.2'; ta.style.color = r0.c; ta.style.background = src ? S.doc.bg : 'transparent';
  const fit = () => { ta.style.width = '10px'; ta.style.height = '10px'; ta.style.width = Math.max(40, ta.scrollWidth + 8) + 'px'; ta.style.height = Math.max(ta.scrollHeight, 10) + 'px'; };
  ta.addEventListener('input', fit);
  ta.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Escape') { ev.preventDefault(); endTextEdit(true); } else if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); endTextEdit(true); } });
  ta.addEventListener('blur', () => endTextEdit(true));
  $('#stagewrap').appendChild(ta);
  textEd = { ta, ex, w, r0 };
  fit();
  setTimeout(() => { ta.focus(); ta.select(); }, 0);
}
function endTextEdit(ok) {
  if (!textEd) return;
  const { ta, ex, w, r0 } = textEd;
  textEd = null;
  const val = ta.value;
  ta.remove();
  if (!ok) return;
  if (ex) {
    const l = getLayer(ex.lid);
    const cur = findEval(ex.lid, ex.id);
    if (!l || !cur || val === cur.runs.map((r) => r.t).join('')) return;
    pushUndo();
    const kf = C.ensureEditable(l, S.frame);
    const o = kf.objs.find((x) => x.id === ex.id);
    if (!o) return;
    if (!val.trim()) { kf.objs.splice(kf.objs.indexOf(o), 1); S.sel = []; } else o.runs = [Object.assign({}, o.runs[0], { t: val })];
    commit(); buildLayerList();
  } else if (val.trim()) {
    const o = { id: uid(), kind: 'text', runs: [{ t: val, font: r0.font, size: r0.size, c: r0.c, b: r0.b, i: r0.i }], align: S.style.align, ls: 0, fill: r0.c, fa: 1, op: 1, t: C.newT() };
    o.t.x = w.x; o.t.y = w.y;
    addObject(o);
    setTool('select');
  }
}
// Pārbauda, vai pele atrodas uz oranžā pivot krustiņa.
function pivotHit(o, sx, sy) {
  const pv = getPivot(o); // Iegūstam pivot lokālās koordinātas.
  const world = mapply(matOf(o.t), pv[0], pv[1]); // Pārvēršam pasaules koordinātās.
  const screen = w2s(world[0], world[1]); // Pārvēršam ekrāna koordinātās.

  // Atgriež true, ja pele atrodas ne tālāk kā 9 pikseļus.
  return Math.hypot(sx - screen[0], sy - screen[1]) <= 9;
}
/* ---------- selection tool ---------- */
function selDown(e, p) {
  clearProtest();
  const w = p.w, one = singleSel();
	// Ja nospiests uz pivot, sākam pārvietot tikai krustiņu.
	if (one && !selectionControlsHidden() && !getLayer(one.lid).locked &&
    !one.o.skel &&
    pivotHit(one.o, p.sx, p.sy)) {

	// Atceramies atlasīto figūru un sākuma punktu.
	S.drag = {
		type: 'pivot',
		lid: one.lid,
		id: one.id,
		start: w,
		started: false
  };

  return; // Beidzam selDown(), lai nesāktos figūras pārvietošana.
}
  if (one && !getLayer(one.lid).locked && !one.o.skel) {
    const h = hitHandle(getHandles(one.o), p.sx, p.sy);
    if (h) { S.drag = { type: h.id.startsWith('rot') ? 'rotate' : 'scale', h, start: w, started: false, lid: one.lid, id: one.id }; return; }
  }
  const hit = hitAt(w.x, w.y, 5, e.altKey);
  if (hit) {
    const inSel = S.sel.some((s) => s.lid === hit.lid && s.id === hit.id);
    if (e.shiftKey && !inSel) S.sel = S.sel.concat([{ lid: hit.lid, id: hit.id }]);
    else if (!inSel) S.sel = [{ lid: hit.lid, id: hit.id }];
    selectLayer(hit.lid, true);
    S.drag = { type: 'move', start: w, started: false, snapId: hit.id, dragOnly:e.shiftKey&&inSel };
  } else {
    const base = e.shiftKey ? S.sel.slice() : [];
    S.sel = base.slice();
    S.drag = { type: 'marquee', start: w, cur: w, base };
  }
  refreshProps();
}
function selLayerIds() { return Array.from(new Set(S.sel.map((s) => s.lid))); }
function beginEdit() {
  pushUndo();
  for (const lid of selLayerIds()) recordDragEditable(getLayer(lid), S.frame);
}
function shapeSnapAnchor(o,start) {
  const b=localBounds(o);if(!b)return null;
  const frame=o.arc||o.ellipseFrame;
  let ellipse=frame&&Number.isFinite(frame.rx)&&Number.isFinite(frame.ry)&&frame.rx>0&&frame.ry>0&&(o.arc||frame.path===JSON.stringify(o.contours));
  // Older saved circles have no ellipse metadata. Recognise their four
  // cardinal Bezier anchors without treating a four-corner polygon as a circle.
  if(!ellipse&&o.kind==='path'&&o.contours.length===1){const c=o.contours[0],cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2,rx=(b.x1-b.x0)/2,ry=(b.y1-b.y0)/2;
    if(c.closed&&c.nodes.length===4&&rx>0&&ry>0){const expected=[[cx,b.y0],[b.x1,cy],[cx,b.y1],[b.x0,cy]];ellipse=expected.every(([x,y])=>c.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<1e-5&&(n.ix||n.iy)&&(n.ox||n.oy)));}
  }
  const m=matOf(o.t);
  if(o.kind==='path'&&o.contours.length&&o.contours.every(c=>!c.closed)){
    const ends=o.contours.filter(c=>c.nodes.length).flatMap(c=>[c.nodes[0],c.nodes.at(-1)]).map(n=>mapply(m,n.x,n.y));
    ends.sort((a,b)=>Math.hypot(a[0]-start.x,a[1]-start.y)-Math.hypot(b[0]-start.x,b[1]-start.y));
    if(ends.length)return {x:ends[0][0],y:ends[0][1]};
  }
  if(ellipse){const p=mapply(m,(b.x0+b.x1)/2,(b.y0+b.y1)/2);return {x:p[0],y:p[1]};}
  const corners=[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]].map(p=>mapply(m,...p));
  corners.sort((a,b)=>Math.hypot(a[0]-start.x,a[1]-start.y)-Math.hypot(b[0]-start.x,b[1]-start.y));
  return {x:corners[0][0],y:corners[0][1]};
}
function moveDrag(w, e) {
  const d = S.drag;
  if (!d.started) {
    if (Math.hypot(w.x - d.start.x, w.y - d.start.y) * S.view.z < 3) return;
    d.started = true; beginEdit();
    d.orig = S.sel.map((s) => { const o = findEditable(s.lid, s.id); return o ? { o, x: o.t.x, y: o.t.y } : null; }).filter(Boolean);
    const leader=d.orig.find(q=>q.o.id===d.snapId)||d.orig[0];d.snapAnchor=leader&&shapeSnapAnchor(leader.o,d.start);
    for (const q of d.orig) if (q.o.bind||q.o.sbind) C.freeBind.add(q.o.id);
  }
  let dx = w.x - d.start.x, dy = w.y - d.start.y;
  const horizontal=Math.abs(dx)>Math.abs(dy);
  const constrain=e.shiftKey&&!d.dragOnly;
  if (constrain) { if (horizontal) dy = 0; else dx = 0; }
  if(GRID.visible&&GRID.snap&&d.snapAnchor){const a=d.snapAnchor,target=gridPoint({x:a.x+dx,y:a.y+dy});if(!constrain||horizontal)dx=target.x-a.x;if(!constrain||!horizontal)dy=target.y-a.y;}
  for (const q of d.orig) { q.o.t.x = q.x + dx; q.o.t.y = q.y + dy; }
  invalidate(); refreshTransformFields();
}
// Atgriež objekta rotācijas centru lokālajās koordinātās.
function getPivot(o) {
  if(o.arc)return [0,0];
  // Ja objektam jau ir pielāgots pivot, izmantojam to.
  if (Array.isArray(o.pivot) && o.pivot.length === 2) {
    return o.pivot;
  }

  // Citādi aprēķinām figūras sākotnējo viduspunktu.
  const b = localBounds(o);

  // Ja figūrai nav robežu, izmantojam koordinātu sākumpunktu.
  if (!b) return [0, 0];

  // Aprēķinām robežu viduspunktu.
  return [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
}
// Pārvieto pivot, nekustinot pašu figūru.
function pivotDrag(w) {
  const d = S.drag; // Pašreizējās vilkšanas dati.

  // Pirmajā kustībā sagatavojam rediģēšanu.
  if (!d.started) {
    // Ignorējam ļoti mazas nejaušas peles kustības.
    if (Math.hypot(w.x - d.start.x, w.y - d.start.y) * S.view.z < 3) return;

    pushUndo(); // Saglabājam vienu Ctrl+Z ierakstu.
    C.ensureEditable(getLayer(d.lid), S.frame); // Sagatavojam pašreizējo kadru.

    const o = findEditable(d.lid, d.id); // Atrodam rediģējamo figūru.
    if (!o) { S.drag = null; return; } // Ja figūras nav, pārtraucam.

    d.o = o; // Saglabājam figūru.
    d.inv = minv(matOf(o.t)); // Apgrieztā transformācijas matrica.
    d.started = true; // Vilkšana ir sākusies.
  }

  // Pārvēršam peles atrašanās vietu figūras lokālajās koordinātās.
  const local = mapply(d.inv, w.x, w.y);

  // Mainām tikai pivot, nevis figūras pozīciju.
  d.o.pivot = [local[0], local[1]];

  invalidate(); // Pārzīmējam krustiņu.
}
function xformDrag(w, e) {
  const d = S.drag;
  if (!d.started) {
    if (Math.hypot(w.x - d.start.x, w.y - d.start.y) * S.view.z < 2) return;
    pushUndo(); recordDragEditable(getLayer(d.lid), S.frame);
    const o = findEditable(d.lid, d.id);
    if (!o) { S.drag = null; return; }
    if (o.bind||o.sbind) C.freeBind.add(o.id);
    d.o = o; d.t0 = Object.assign({}, o.t); d.b = localBounds(o); d.M0 = matOf(o.t); d.inv = minv(d.M0); d.started = true;
    const pivot = getPivot(o);

	// Saglabājam pivot X un Y koordinātas.
	d.cx = pivot[0];
	d.cy = pivot[1];

	// Aprēķinām rotācijas centra atrašanās vietu pasaulē.
	d.C = mapply(d.M0, d.cx, d.cy);
    d.a0 = Math.atan2(d.start.y - d.C[1], d.start.x - d.C[0]);
  }
  const t0 = d.t0, o = d.o, b = d.b;
  if (d.type === 'rotate') {
    const a = Math.atan2(w.y - d.C[1], w.x - d.C[0]);
    let r = t0.r + (a - d.a0) * 180 / Math.PI;
    if (e.shiftKey) r = Math.round(r / 15) * 15;
    const rr = r * Math.PI / 180, c = Math.cos(rr), s = Math.sin(rr);
    o.t.r = r;
    o.t.x = d.C[0] - (c * t0.sx * d.cx - s * t0.sy * d.cy);
    o.t.y = d.C[1] - (s * t0.sx * d.cx + c * t0.sy * d.cy);
  } else {
    const h = d.h, id = h.id, pl = mapply(d.inv, w.x, w.y);
    const mx = id.includes('e') || id.includes('w'), my = id.includes('n') || id.includes('s');
    const centered = e.altKey || e.ctrlKey || e.metaKey;
    const ax = centered ? d.cx : (mx ? (h.l[0] === b.x0 ? b.x1 : b.x0) : d.cx);
    const ay = centered ? d.cy : (my ? (h.l[1] === b.y0 ? b.y1 : b.y0) : d.cy);
    d.recordAnchor = [ax,ay];
    let fx = 1, fy = 1;
    if (mx) { const den = h.l[0] - ax; fx = Math.abs(den) < 1e-6 ? 1 : (pl[0] - ax) / den; }
    if (my) { const den = h.l[1] - ay; fy = Math.abs(den) < 1e-6 ? 1 : (pl[1] - ay) / den; }
    if (e.shiftKey && mx && my) { const m = Math.max(Math.abs(fx), Math.abs(fy)); fx = (fx < 0 ? -1 : 1) * m; fy = (fy < 0 ? -1 : 1) * m; }
    let sx = t0.sx * fx, sy = t0.sy * fy;
    if (Math.abs(sx) < 0.001) sx = sx < 0 ? -0.001 : 0.001;
    if (Math.abs(sy) < 0.001) sy = sy < 0 ? -0.001 : 0.001;
    const A = mapply(d.M0, ax, ay), r = t0.r * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    o.t.sx = sx; o.t.sy = sy;
    o.t.x = A[0] - (c * sx * ax - s * sy * ay);
    o.t.y = A[1] - (s * sx * ax + c * sy * ay);
  }
  invalidate(); refreshTransformFields();
}
function marqueeUp(d) {
  const x0 = Math.min(d.start.x, d.cur.x), x1 = Math.max(d.start.x, d.cur.x), y0 = Math.min(d.start.y, d.cur.y), y1 = Math.max(d.start.y, d.cur.y);
  if ((x1 - x0) * S.view.z < 3 && (y1 - y0) * S.view.z < 3) { refreshProps(); return; }
  const out = d.base.slice();
  for (const l of layers()) {
    if (!l.visible || l.locked) continue;
    for (const o of C.evalLayerObjs(l, S.frame)) {
      const b = worldBounds(o);
      if (!b) continue;
      const epsilon=.5/Math.max(S.view.z,.001);
      if (b.x0 >= x0-epsilon && b.x1 <= x1+epsilon && b.y0 >= y0-epsilon && b.y1 <= y1+epsilon && !out.some((s) => s.lid === l.id && s.id === o.id)) out.push({ lid: l.id, id: o.id });
    }
  }
  S.sel = out; refreshProps();
}

/* ---------- shapes ---------- */
function boxFrom(d) {
  let x0 = d.start.x, y0 = d.start.y, x1 = d.cur.x, y1 = d.cur.y;
  if (d.shift && d.type !== 'line') {
    const w = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    x1 = x0 + (x1 < x0 ? -w : w); y1 = y0 + (y1 < y0 ? -w : w);
  }
  if (d.alt && d.type !== 'line') { x0 = 2 * d.start.x - x1; y0 = 2 * d.start.y - y1; }
  if (d.type === 'line' && d.shift) {
    const dx = x1 - x0, dy = y1 - y0, a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4;
    let l=Math.hypot(dx,dy);
    if(GRID.visible&&GRID.snap){const step=gridStep()*(Math.abs(Math.sin(a)*Math.cos(a))>.1?Math.SQRT2:1);l=Math.round(l/step)*step;}
    x1 = x0 + Math.cos(a) * l; y1 = y0 + Math.sin(a) * l;
  }
  if(d.type==='ellipse'&&GRID.visible&&GRID.snap){const cx=(x0+x1)/2,cy=(y0+y1)/2,p=gridPoint({x:cx,y:cy});x0+=p.x-cx;x1+=p.x-cx;y0+=p.y-cy;y1+=p.y-cy;}
  return { x0, y0, x1, y1, w: Math.abs(x1 - x0), h: Math.abs(y1 - y0), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
function arcSelection(){if(selectionControlsHidden())return null;const one=singleSel();return one&&one.o.arc&&['select','node','ellipse'].includes(S.tool)&&!getLayer(one.lid).locked?one:null;}
function arcHandles(one){const a=one.o.arc,M=matOf(one.o.t);const handles=[0,1].map(i=>{const angle=a.start+(i?a.mouth:0)+(a.mouth<1e-8?(i?.13:-.13):0),p=mapply(M,a.rx*Math.cos(angle),a.ry*Math.sin(angle)),c=mapply(M,0,0),q=w2s(p[0],p[1]),center=w2s(c[0],c[1]),dx=q[0]-center[0],dy=q[1]-center[1],len=Math.hypot(dx,dy)||1;return {i,x:q[0]+dx/len*24,y:q[1]+dy/len*24,center};});if(Math.hypot(handles[0].x-handles[1].x,handles[0].y-handles[1].y)<18){const h=handles[1],dx=h.x-h.center[0],dy=h.y-h.center[1],len=Math.hypot(dx,dy)||1;h.x+=dx/len*20;h.y+=dy/len*20;}return handles;}
function arcDown(p){const one=arcSelection();if(!one)return false;const h=arcHandles(one).find(h=>Math.hypot(h.x-p.sx,h.y-p.sy)<10);if(!h)return false;S.drag={type:'arc-mouth',lid:one.lid,id:one.id,start:{...p.w},edge:h.i,last:(()=>{const q=mapply(minv(matOf(one.o.t)),p.w.x,p.w.y);return Math.atan2(q[1]/one.o.arc.ry,q[0]/one.o.arc.rx);})(),started:false};return true;}
function arcDrag(w){const d=S.drag;if(!d.started){pushUndo();recordDragEditable(getLayer(d.lid),S.frame);d.o=findEditable(d.lid,d.id);d.inv=minv(matOf(d.o.t));d.started=true;}
  const a=d.o.arc,q=mapply(d.inv,w.x,w.y),angle=Math.atan2(q[1]/a.ry,q[0]/a.rx);
  if(d.last!=null){let delta=Math.atan2(Math.sin(angle-d.last),Math.cos(angle-d.last));const mouth=clamp(a.mouth+(d.edge?delta:-delta),0,359*Math.PI/180);if(!d.edge)a.start+=a.mouth-mouth;a.mouth=mouth;d.o.contours=[C.mouthContour(a)];}
  d.last=angle;invalidate();
}
function arcDraw(ctx){const one=arcSelection();if(!one||S.playing)return;ctx.save();ctx.lineWidth=1.5;const hs=arcHandles(one);
  for(const h of hs){ctx.strokeStyle=CSSV.accent;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(...h.center);ctx.lineTo(h.x,h.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=CSSV.accentFg;ctx.beginPath();ctx.arc(h.x,h.y,6,0,Math.PI*2);ctx.fill();ctx.stroke();}
  if(S.drag?.type==='arc-mouth'&&S.drag.started){const h=hs[S.drag.edge],text=Math.round(one.o.arc.mouth*180/Math.PI)+'°';ctx.font='13px sans-serif';ctx.fillStyle=CSSV.accent;ctx.fillText(text,h.x+12,h.y-10);}
  ctx.restore();
}
function arcFinish(p){const one=arcSelection();if(!one)return false;const local=mapply(minv(matOf(one.o.t)),p.w.x,p.w.y),a=one.o.arc;if((local[0]/a.rx)**2+(local[1]/a.ry)**2>1.2)return false;pushUndo();C.ensureEditable(getLayer(one.lid),S.frame);const o=findEditable(one.lid,one.id);o.ellipseFrame={rx:o.arc.rx,ry:o.arc.ry,path:JSON.stringify(o.contours)};delete o.arc;S.nodeSel=null;setTool('select');commit();return true;}

/* Star/Cog controls: radii, independent turns, valley width and repeated bends. */
let starCountHUD=null,starCountInput=null;
function starSelection(){if(selectionControlsHidden())return null;const one=singleSel();return one?.o.star&&['select','star'].includes(S.tool)&&!getLayer(one.lid).locked?one:null;}
function starPoint(o,r,angle){const p=mapply(matOf(o.t),r*Math.cos(angle),r*Math.sin(angle));return w2s(...p);}
function starControls(one){
  const a=one.o.star,step=Math.PI*2/a.points,M=minv(matOf(one.o.t)),cursor=S.cursorW?mapply(M,S.cursorW.x,S.cursorW.y):[a.outer,0],angle=Math.atan2(cursor[1],cursor[0]);
  const valley=Math.round((angle-a.innerAngle-step/2)/step),root=a.innerAngle+(valley+.5)*step;
  const controls=[
    {kind:'outer',r:a.outer,angle:a.outerAngle+step*.4,label:'Outer radius · Shift = turn'},
    {kind:'inner',r:a.inner,angle:a.innerAngle,label:'Inner radius · Shift = turn'},
    {kind:'clip',r:a.clip,angle:a.outerAngle+step*.22,label:'Trim tooth tips'},
    {kind:'gap',r:a.inner,angle:root+a.gap*step,root,label:'Widen all valleys'}
  ].map(h=>({...h,p:starPoint(one.o,h.r,h.angle)}));
  const ns=one.o.contours[0].nodes,mouse=S.cursorW?w2s(S.cursorW.x,S.cursorW.y):starPoint(one.o,a.clip,a.outerAngle);
  let tooth=0,distance=Infinity;
  for(let i=0;i<a.points;i++)for(const j of [i*4,i*4+1]){const n=ns[j],q=mapply(matOf(one.o.t),n.x,n.y),p=w2s(...q),d=Math.hypot(p[0]-mouse[0],p[1]-mouse[1]);if(d<distance){distance=d;tooth=i;}}
  const tips=['left','right'].map((side,k)=>{const ni=tooth*4+k,n=ns[ni],q=mapply(matOf(one.o.t),n.x,n.y);return {kind:'corner-'+side,side,ni,p:w2s(...q),label:(side==='left'?'Left':'Right')+' tooth corner · drag around or inside the trim ring'};});
  if(Math.hypot(tips[0].p[0]-tips[1].p[0],tips[0].p[1]-tips[1].p[1])<16){const center=starPoint(one.o,0,0),dx=tips[0].p[0]-center[0],dy=tips[0].p[1]-center[1],L=Math.hypot(dx,dy)||1;for(let i=0;i<2;i++){const sign=i?1:-1;tips[i].p=[tips[i].p[0]-dy/L*7*sign,tips[i].p[1]+dx/L*7*sign];}}
  return tips.concat(controls);
}
function starDown(e,p){
  const one=starSelection();if(!one)return false;
  const a=one.o.star,controls=starControls(one),local=mapply(minv(matOf(one.o.t)),p.w.x,p.w.y),angle=Math.atan2(local[1],local[0]);
  let hit=controls.find(h=>Math.hypot(h.p[0]-p.sx,h.p[1]-p.sy)<=(h.side?6:9));
  if(!hit&&S.tool==='select'&&hitHandle(getHandles(one.o),p.sx,p.sy))return false;
  if(!hit){
    const curve=kCurveHit(one.o,p.sx,p.sy);
    if(curve&&curve.t>.05&&curve.t<.95){
      const nodes=one.o.contours[0].nodes,n=nodes[curve.ni],next=nodes[(curve.ni+1)%nodes.length];
      if(Math.hypot(next.x-n.x,next.y-n.y)*S.view.z>5)hit={kind:'curve',role:['tip','right','root','left'][curve.ni%4],ni:curve.ni,t:curve.t};
    }
  }
  if(!hit)for(const kind of ['inner','outer','clip']){
    if(kind==='clip'&&Math.abs(a.clip-a.outer)*S.view.z<12)continue;
    const h=controls.find(h=>h.kind===kind),point=starPoint(one.o,h.r,angle);
    if(Math.hypot(point[0]-p.sx,point[1]-p.sy)<6){hit=h;break;}
  }
  if(!hit)return false;
  if(REC.armed){protest('Leave Record mode to change Star/Cog controls.');return true;}
  S.drag={type:'star',lid:one.lid,id:one.id,start:p.w,base:clone(a),hit,started:false};return true;
}
function starDrag(w,e){
  const d=S.drag;if(!d.started){if(Math.hypot(w.x-d.start.x,w.y-d.start.y)*S.view.z<2)return;pushUndo();C.ensureEditable(getLayer(d.lid),S.frame);d.o=findEditable(d.lid,d.id);d.inv=minv(matOf(d.o.t));d.p0=mapply(d.inv,d.start.x,d.start.y);d.started=true;}
  const a=d.o.star,q=mapply(d.inv,w.x,w.y),r=Math.hypot(...q),h=d.hit,base=d.base,angle=Math.atan2(q[1],q[0]);
  if(h.side){
    const n=C.starContour(base).nodes[h.ni],x=n.x+q[0]-d.p0[0],y=n.y+q[1]-d.p0[1],old=base.corners?.[h.side]||{};
    a.corners ||= {left:{turn:0,depth:0},right:{turn:0,depth:0}};
    const turn=Math.atan2(Math.sin(Math.atan2(y,x)-Math.atan2(n.y,n.x)),Math.cos(Math.atan2(y,x)-Math.atan2(n.y,n.x)));
    a.corners[h.side]={turn:(old.turn||0)+turn,depth:clamp(1-Math.hypot(x,y)/base.clip,0,.98)};
  }else if(h.kind==='curve'){
    const ns=C.starContour(base).nodes,n=ns[h.ni],next=ns[(h.ni+1)%ns.length],dx=next.x-n.x,dy=next.y-n.y,L2=dx*dx+dy*dy,gain=1/(3*h.t*(1-h.t)),x=(q[0]-d.p0[0])*gain,y=(q[1]-d.p0[1])*gain;
    const old=base.curves[h.role];a.curves[h.role]={bend:clamp(old.bend+(-dy*x+dx*y)/L2,-1.5,1.5),slide:clamp(old.slide+(dx*x+dy*y)/L2,-1.5,1.5)};
  }else if(h.kind==='gap')a.gap=clamp(Math.abs(Math.atan2(Math.sin(angle-h.root),Math.cos(angle-h.root)))/(Math.PI*2/a.points),0,.45);
  else if(e.shiftKey&&(h.kind==='outer'||h.kind==='inner')){
    const delta=Math.atan2(Math.sin(angle-Math.atan2(d.p0[1],d.p0[0])),Math.cos(angle-Math.atan2(d.p0[1],d.p0[0])));
    a[h.kind+'Angle']=base[h.kind+'Angle']+delta;
  }else if(h.kind==='outer'){
    a.outer=Math.max(a.inner+.1,r);a.clip=clamp(base.clip/base.outer*a.outer,a.inner+.01,a.outer);
  }else if(h.kind==='inner'){a.inner=clamp(r,.01,a.outer-.1);a.clip=Math.max(a.clip,a.inner+.01);}
  else a.clip=clamp(r,a.inner+.01,a.outer);
  d.o.contours=[C.starContour(a)];invalidate();
}
function starBake(o){
  const original=o.contours[0].nodes,nodes=[],eps=Math.max(.0000001,o.star.outer*1e-9);
  for(const n of original){
    const previous=nodes[nodes.length-1];
    if(previous&&Math.hypot(previous.x-n.x,previous.y-n.y)<eps&&!previous.ox&&!previous.oy&&!n.ix&&!n.iy){previous.ox=n.ox;previous.oy=n.oy;}
    else nodes.push({...n});
  }
  if(nodes.length>1){const first=nodes[0],last=nodes[nodes.length-1];if(Math.hypot(first.x-last.x,first.y-last.y)<eps&&!last.ox&&!last.oy&&!first.ix&&!first.iy){first.ix=last.ix;first.iy=last.iy;nodes.pop();}}
  o.contours=[{closed:true,nodes}];delete o.star;
}
function starFinish(p){
  const one=starSelection();if(!one)return false;
  const q=mapply(minv(matOf(one.o.t)),p.w.x,p.w.y);if(Math.hypot(...q)>one.o.star.outer*1.1)return false;
  pushUndo();C.ensureEditable(getLayer(one.lid),S.frame);starBake(findEditable(one.lid,one.id));S.nodeSel=null;setTool('node');commit();return true;
}
function starHUD(){
  if(starCountHUD)return;
  const box=starCountHUD=document.createElement('div');box.id='starCountHUD';box.style.cssText='position:fixed;z-index:30;width:64px;padding:3px;background:var(--panel);border:1px solid var(--accent);border-radius:4px;display:none;box-sizing:border-box;';
  const grip=document.createElement('div');grip.title='Move star count controls';grip.setAttribute('aria-label','Move star count controls');grip.style.cssText='height:13px;cursor:grab;background:radial-gradient(circle,currentColor 1.5px,transparent 2px) center/10px 6px;opacity:.6;touch-action:none;';
  const input=starCountInput=document.createElement('input');input.addEventListener('blur',()=>invalidate());input.type='number';input.min='3';input.max='64';input.step='1';input.title='Star rays / cog teeth';input.setAttribute('aria-label','Star rays / cog teeth');input.style.cssText='width:100%;height:29px;box-sizing:border-box;';box.append(grip,input);document.body.appendChild(box);
  box.addEventListener('pointerdown',e=>e.stopPropagation());box.addEventListener('dblclick',e=>e.stopPropagation());
  input.addEventListener('change',()=>{const one=starSelection(),n=Math.round(+input.value);if(!one||!Number.isFinite(n)||n<3||n>64||REC.armed){invalidate();return;}if(n===one.o.star.points)return;pushUndo();C.ensureEditable(getLayer(one.lid),S.frame);const o=findEditable(one.lid,one.id);o.star.points=n;o.contours=[C.starContour(o.star)];commit();});
  let drag=null;
  grip.addEventListener('pointerdown',e=>{const one=starSelection();if(!one||e.button!==0)return;S.starHudOffsets ||=new Map();const offset=S.starHudOffsets.get(one.id)||[0,0];drag={id:one.id,x:e.clientX,y:e.clientY,offset};grip.setPointerCapture(e.pointerId);e.preventDefault();e.stopPropagation();});
  grip.addEventListener('pointermove',e=>{if(!drag)return;S.starHudOffsets.set(drag.id,[drag.offset[0]+e.clientX-drag.x,drag.offset[1]+e.clientY-drag.y]);invalidate();});
  const end=()=>{drag=null;};grip.addEventListener('pointerup',end);grip.addEventListener('pointercancel',end);grip.addEventListener('lostpointercapture',end);
}
function starDraw(ctx){
  starHUD();const one=starSelection();starCountHUD.style.display=one&&!S.playing?'block':'none';if(!one||S.playing)return;
  const o=one.o,a=o.star,rect=stage.getBoundingClientRect(),center=starPoint(o,0,0),offset=S.starHudOffsets?.get(one.id)||[0,0];
  starCountHUD.style.left=rect.left+center[0]-32+offset[0]+'px';starCountHUD.style.top=rect.top+center[1]-24+offset[1]+'px';
  if(document.activeElement!==starCountInput)starCountInput.value=a.points;
  ctx.save();ctx.strokeStyle=CSSV.accent;ctx.lineWidth=1.3;ctx.setLineDash([6,5]);
  for(const r of [a.inner,a.outer,a.clip]){
    ctx.beginPath();for(let i=0;i<=96;i++){const p=starPoint(o,r,i/96*Math.PI*2);i?ctx.lineTo(...p):ctx.moveTo(...p);}ctx.stroke();
  }
  ctx.setLineDash([]);ctx.fillStyle=CSSV.accentFg;
  for(const h of starControls(one)){ctx.beginPath();if(h.side)ctx.rect(h.p[0]-4,h.p[1]-4,8,8);else ctx.arc(...h.p,h.kind==='gap'?5:6,0,Math.PI*2);ctx.fill();ctx.stroke();
    const mouse=S.cursorW&&w2s(S.cursorW.x,S.cursorW.y);if(mouse&&Math.hypot(mouse[0]-h.p[0],mouse[1]-h.p[1])<14){ctx.fillStyle=CSSV.accent;ctx.font='12px sans-serif';ctx.fillText(h.label,h.p[0]+11,h.p[1]-9);ctx.fillStyle=CSSV.accentFg;}}
  ctx.restore();
}

function finishShape(d) {
  const b = boxFrom(d);
  if (d.type === 'line') {
    if (Math.hypot(b.x1 - b.x0, b.y1 - b.y0) * S.view.z < 3) return;
    const c = { closed: false, nodes: [C.node(b.x0 - b.cx, b.y0 - b.cy), C.node(b.x1 - b.cx, b.y1 - b.cy)] };
    const o = C.mkPath([c], Object.assign(currentPaint(true), { fill: null }), { x: b.cx, y: b.cy });
    addObject(o); return;
  }
  if (b.w * S.view.z < 3 || b.h * S.view.z < 3) return;
  if(d.type==='star'){
    const radius=Math.min(b.w,b.h)/2,star=C.starDefaults(radius),o=C.mkPath([C.starContour(star)],currentPaint(false),{x:b.cx,y:b.cy,sx:b.w/(radius*2),sy:b.h/(radius*2)});
    o.star=star;o.pivot=[0,0];S.nodeSel=null;addObject(o);return;
  }
  const c = d.type === 'rect' ? C.rectContour(b.w, b.h, S.style.radius) : C.ellipseContour(b.w / 2, b.h / 2);
  const o=C.mkPath([c],currentPaint(false),{x:b.cx,y:b.cy});
  if(d.type==='ellipse')o.arc={rx:b.w/2,ry:b.h/2,start:0,mouth:0};
  S.nodeSel=null;addObject(o);
}
function drawPreview(ctx) {
  const d = S.draw;
  if (d.type === 'erase') return;
  ctx.save(); ctx.strokeStyle = CSSV.accent; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
  if (d.type === 'brush') {
    const cs = brushOutline(d.pts, S.style, S.view.z), p = new Path2D(), st = S.style;
    ctx.setLineDash([]);
    ctx.beginPath();
    for (const c of cs) { c.nodes.forEach((n, i) => { const q = w2s(n.x, n.y); i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]); }); p.closePath(); }
    ctx.fillStyle = st.bcolor; ctx.fill(p, 'nonzero');
  } else if (d.type === 'fluid') {
    const cs = fluidOutline(d.pts, S.style.fb, S.view.z), p = new Path2D();
    ctx.setLineDash([]);
    for (const c of cs) { c.nodes.forEach((n, i) => { const q = w2s(n.x, n.y); i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]); }); p.closePath(); }
    ctx.globalAlpha = S.style.fb.alpha / 100; ctx.fillStyle = S.style.fb.color; ctx.fill(p, 'nonzero');
  } else if (d.type === 'pencil') {
    ctx.beginPath();
    d.pts.forEach((p, i) => { const q = w2s(p.x, p.y); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
    ctx.stroke();
  } else {
    const b = boxFrom(d), a = w2s(b.x0, b.y0), c = w2s(b.x1, b.y1);
    ctx.beginPath();
    if (d.type === 'line') { ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); }
    else if (d.type === 'rect') ctx.rect(Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.abs(c[0] - a[0]), Math.abs(c[1] - a[1]));
    else if(d.type==='star'){
      const radius=Math.max(.01,Math.min(b.w,b.h)/2),local=new Path2D(),path=new Path2D();C.tracePath(local,[C.starContour(C.starDefaults(radius))]);
      const center=w2s(b.cx,b.cy);path.addPath(local,new DOMMatrix([S.view.z*b.w/(radius*2),0,0,S.view.z*b.h/(radius*2),...center]));ctx.stroke(path);
    }
    else ctx.ellipse((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, Math.abs(c[0] - a[0]) / 2, Math.abs(c[1] - a[1]) / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------- pencil ---------- */
function rdp(pts, tol) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let md = 0, mi = -1;
    const A = pts[a], B = pts[b], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy);
    for (let i = a + 1; i < b; i++) {
      const P = pts[i];
      const dd = L < 1e-9 ? Math.hypot(P.x - A.x, P.y - A.y) : Math.abs(dy * P.x - dx * P.y + B.x * A.y - B.y * A.x) / L;
      if (dd > md) { md = dd; mi = i; }
    }
    if (md > tol && mi > 0) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function smoothNodes(pts, closed) {
  const n = pts.length;
  return pts.map((p, i) => {
    const prev = pts[i === 0 ? (closed ? n - 1 : 0) : i - 1], next = pts[i === n - 1 ? (closed ? 0 : n - 1) : i + 1];
    const tx = (next.x - prev.x) / 6, ty = (next.y - prev.y) / 6;
    const end = !closed && (i === 0 || i === n - 1);
    return { x: p.x, y: p.y, ix: end && i === 0 ? 0 : -tx, iy: end && i === 0 ? 0 : -ty, ox: end && i === n - 1 ? 0 : tx, oy: end && i === n - 1 ? 0 : ty, s: true };
  });
}
function finishPencil(raw) {
  if (raw.length < 2) return;
  const tol = lerp(0.6, 7, S.style.smooth / 100) / S.view.z;
  let pts = rdp(raw, tol);
  if (pts.length < 2) return;
  const first = pts[0], last = pts[pts.length - 1];
  let closed = false;
  if (pts.length > 3 && Math.hypot(first.x - last.x, first.y - last.y) * S.view.z < 10) { closed = true; pts = pts.slice(0, -1); }
  const nodes = pts.length === 2 ? pts.map((p) => C.node(p.x, p.y)) : smoothNodes(pts, closed);
  const paint = currentPaint(true);
  if (!closed) paint.fill = null;
  const o = C.mkPath([{ closed, nodes }], paint);
  C.recenter(o);
  addObject(o);
}


/* ---------- brush: sweeps a convex nib along the stroke and fills the outline (nonzero) ---------- */
const BRUSH_SHAPES = [['round', 'Round'], ['square', 'Square'], ['diamond', 'Diamond'], ['ovalh', 'Oval wide'], ['ovalv', 'Oval tall'], ['flat', 'Calligraphy (flat)']];
function nibOf(shape, base, angle) {
  const n = clamp(Math.round(8 + Math.sqrt(Math.max(base, 1)) * 4), 12, 40);
  const ell = (rx, ry, rot) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry, c = Math.cos(rot), s = Math.sin(rot); return [x * c - y * s, x * s + y * c]; });
  let V;
  switch (shape) {
    case 'square': V = [[-1, -1], [1, -1], [1, 1], [-1, 1]]; break;
    case 'diamond': V = [[0, -1.3], [1.3, 0], [0, 1.3], [-1.3, 0]]; break;
    case 'ovalh': V = ell(1, 0.42, 0); break;
    case 'ovalv': V = ell(0.42, 1, 0); break;
    case 'flat': V = ell(1.2, 0.17, 0); break;
    default: V = ell(1, 1, 0);
  }
  if (angle && shape !== 'round') { const r = angle * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r); V = V.map((v) => [v[0] * c - v[1] * sn, v[0] * sn + v[1] * c]); }
  return V;
}
function brushPt(w, e) { return { x: w.x, y: w.y, pr: e && e.pointerType === 'pen' ? clamp(e.pressure || 0.5, 0.02, 1) : 1, t: e && e.timeStamp ? e.timeStamp : undefined }; }
function brushOutline(raw, st, z) {
  const base = Math.max(0.5, st.bsize / 2), V = nibOf(st.bshape, base, st.bangle), K = V.length;
  const sc = (p) => (st.bpress ? lerp(0.15, 1, p.pr == null ? 1 : p.pr) : 1);
  const pt = (p, k) => ({ x: p.x + V[k][0] * base * sc(p), y: p.y + V[k][1] * base * sc(p) });
  const sup = (nx, ny) => { let bk = 0, bd = -1e18; for (let k = 0; k < K; k++) { const d = V[k][0] * nx + V[k][1] * ny; if (d > bd + 1e-9) { bd = d; bk = k; } } return bk; };
  const asNodes = (pts) => ({ closed: true, nodes: pts.map((q) => C.node(q.x, q.y)) });
  /* resample evenly */
  const step = Math.max(1.5 / z, st.bsize * 0.15), hy = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  let a = { x: raw[0].x, y: raw[0].y, pr: raw[0].pr == null ? 1 : raw[0].pr }, need = step;
  let R = [a];
  for (let i = 1; i < raw.length; i++) {
    const b = { x: raw[i].x, y: raw[i].y, pr: raw[i].pr == null ? 1 : raw[i].pr };
    let d = hy(a, b);
    while (d >= need && d > 1e-9) { const t = need / d; a = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, pr: lerp(a.pr, b.pr, t) }; R.push(a); d = hy(a, b); need = step; }
    need -= d; a = b;
  }
  const last = raw[raw.length - 1];
  if (hy(R[R.length - 1], last) > step * 0.25) R.push({ x: last.x, y: last.y, pr: last.pr == null ? 1 : last.pr });
  if (R.length < 2) return [asNodes(V.map((_, k) => pt(R[0], k)))];
  for (let k = 0, n = Math.round(st.smooth / 100 * 6); k < n && R.length > 2; k++) {
    const Q = R; R = Q.map((p, i) => (i === 0 || i === Q.length - 1 ? p : { x: (Q[i - 1].x + 2 * p.x + Q[i + 1].x) / 4, y: (Q[i - 1].y + 2 * p.y + Q[i + 1].y) / 4, pr: p.pr }));
  }
  R = rdp(R, Math.max(0.3 / z, st.bsize * 0.015) * (1 + st.smooth / 40));
  return sweepNib(R, V, base, sc, asNodes);
}
/* sweeps convex nib V (scaled by base * sc(point)) along polyline Q and returns the filled outline contour */
function sweepNib(R, V, base, sc, asNodes) {
  const K = V.length, hy = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const pt = (p, k) => ({ x: p.x + V[k][0] * base * sc(p), y: p.y + V[k][1] * base * sc(p) });
  const sup = (nx, ny) => { let bk = 0, bd = -1e18; for (let k = 0; k < K; k++) { const d = V[k][0] * nx + V[k][1] * ny; if (d > bd + 1e-9) { bd = d; bk = k; } } return bk; };
  const walk = (Q) => {
    const out = [], segs = [];
    for (let i = 0; i + 1 < Q.length; i++) { const L = hy(Q[i], Q[i + 1]); if (L < 1e-9) continue; const dx = (Q[i + 1].x - Q[i].x) / L, dy = (Q[i + 1].y - Q[i].y) / L; segs.push({ i, dx, dy, a: sup(dy, -dx) }); }
    let joinedStart=null;
    segs.forEach((sg, j) => {
      out.push(joinedStart||pt(Q[sg.i], sg.a), pt(Q[sg.i + 1], sg.a));
      joinedStart=null;
      const nx = segs[j + 1];
      if (nx) {
        const cross = sg.dx * nx.dy - sg.dy * nx.dx, P = Q[sg.i + 1];
        if (cross > 1e-6) { let k = sg.a; while (k !== nx.a) { k = (k + 1) % K; if (k !== nx.a) out.push(pt(P, k)); } }
        else if (cross < -1e-6) {
          // Inner joins meet at the intersection of the two swept edges.
          // Connecting through the centreline cuts a tooth into every bend.
          const a=pt(Q[sg.i],sg.a),b=pt(P,sg.a),c=pt(P,nx.a),d=pt(Q[nx.i+1],nx.a);
          const ux=b.x-a.x,uy=b.y-a.y,vx=d.x-c.x,vy=d.y-c.y,det=ux*vy-uy*vx;
          if(Math.abs(det)>1e-9){
            const t=((c.x-a.x)*vy-(c.y-a.y)*vx)/det;
            const joint={x:a.x+t*ux,y:a.y+t*uy};
            const reach=base*sc(P)*Math.max(...V.map(v=>Math.hypot(v[0],v[1])));
            if(Math.hypot(joint.x-P.x,joint.y-P.y)<=reach*4){out[out.length-1]=joint;joinedStart=joint;}
          }
        }
      } else {
        const P = Q[sg.i + 1], b = sup(-sg.dy, sg.dx);
        let k = sg.a; while (k !== b) { k = (k + 1) % K; if (k !== b) out.push(pt(P, k)); }
      }
    });
    return out;
  };
  const pts = walk(R).concat(walk(R.slice().reverse()));
  const clean = pts.filter((q, i) => i === 0 || Math.abs(q.x - pts[i - 1].x) + Math.abs(q.y - pts[i - 1].y) > 1e-6);
  return [asNodes(clean)];
}

// Store the visible silhouette, not a collection of internal overlap edges.
// Fit curves only after release, with a subpixel error bound; previews stay fast.
function brushSilhouette(contours, size, z) {
  let result=contours;
  try {
    const geometry=polygonClipping.union(...contours.map(c=>[[c.nodes.map(n=>[n.x,n.y])]]));
    if(geometry.length)result=geometry.flatMap(poly=>poly.map(ring=>({closed:true,nodes:ring.slice(0,-1).map(p=>C.node(p[0],p[1]))})));
  } catch (_) { /* Keep the original silhouette if geometry cannot be resolved. */ }
  const tolerance=Math.min(.25/Math.max(z,.01),Math.max(.001,size*.01));
  return result.map(c=>fitSilhouetteContour(c,tolerance));
}
function fitSilhouetteContour(c,tolerance) {
  if(c.nodes.length<=1024)return C.kroganSimplifyContour(c,tolerance).contour;
  // Bound fitting work for long strokes instead of leaving their dense
  // outlines untouched. Neighbouring pieces share the same fixed endpoint.
  const nodes=[],count=c.nodes.length,last=c.closed?count:count-1;
  for(let start=0;start<last;start+=96){
    const end=Math.min(start+96,last),piece=[];
    for(let i=start;i<=end;i++)piece.push(c.nodes[i%count]);
    const fitted=C.kroganSimplifyContour({closed:false,nodes:piece},tolerance).contour.nodes;
    if(nodes.length){nodes[nodes.length-1].ox=fitted[0].ox;nodes[nodes.length-1].oy=fitted[0].oy;}
    nodes.push(...fitted.slice(nodes.length?1:0).map(n=>({...n})));
  }
  if(c.closed){const closing=nodes.pop();nodes[0].ix=closing.ix;nodes[0].iy=closing.iy;}
  return {...c,nodes};
}

function finishBrush(raw) {
  if (!raw.length) return;
  const st = S.style, cs = brushSilhouette(brushOutline(raw, st, S.view.z), st.bsize, S.view.z);
  const o = C.mkPath(cs, { fill: st.bcolor, fa: 1, stroke: null, sw: 0 });
  o.nz = true;
  C.recenter(o);
  addStroke(o, st.bmerge !== false, 'b');
}
/* ---------- fluid brush: stabilised, smoothed, tapered variable-width strokes ---------- */
const FB_DEFAULT = { size: 12, stab: 25, smooth: 50, round: 100, angle: 0, taper: 25, vel: 0, press: 100, zoom: true, color: '#1B2030', alpha: 100, merge: true };
function fbSize(fb, z) { return Math.max(0.3, fb.zoom ? fb.size : fb.size / z); }
function fbNib(fb) {
  const n = 28, ry = clamp(fb.round / 100, 0.06, 1), rot = (fb.angle || 0) * Math.PI / 180, c = Math.cos(rot), sn = Math.sin(rot);
  return Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, x = Math.cos(a), y = Math.sin(a) * ry; return [x * c - y * sn, x * sn + y * c]; });
}
/* lazy-rope stabiliser: the brush follows the pointer at the end of a rope of length stab */
function fbStabilize(raw, ropeLen) {
  const out = [{ x: raw[0].x, y: raw[0].y, pr: raw[0].pr, t: raw[0].t }];
  if (ropeLen <= 1e-9) { for (let i = 1; i < raw.length; i++) out.push({ x: raw[i].x, y: raw[i].y, pr: raw[i].pr, t: raw[i].t }); return out; }
  let b = { x: raw[0].x, y: raw[0].y };
  for (let i = 1; i < raw.length; i++) {
    const p = raw[i], d = Math.hypot(p.x - b.x, p.y - b.y);
    if (d > ropeLen) { const k = (d - ropeLen) / d; b = { x: b.x + (p.x - b.x) * k, y: b.y + (p.y - b.y) * k }; out.push({ x: b.x, y: b.y, pr: p.pr, t: p.t }); }
  }
  const l = raw[raw.length - 1], e = out[out.length - 1];
  if (Math.hypot(l.x - e.x, l.y - e.y) > 1e-6) out.push({ x: l.x, y: l.y, pr: l.pr, t: l.t });
  return out;
}
function fbRdp(pts, tolG, tolW) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let md = 0, mi = -1;
    const A = pts[a], B = pts[b], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), ds = B.s - A.s;
    for (let i = a + 1; i < b; i++) {
      const P = pts[i];
      const g = L < 1e-9 ? Math.hypot(P.x - A.x, P.y - A.y) : Math.abs(dy * P.x - dx * P.y + B.x * A.y - B.y * A.x) / L;
      const kk = A.k + (B.k - A.k) * (ds > 1e-9 ? (P.s - A.s) / ds : 0);
      const dd = Math.max(g / tolG, Math.abs(P.k - kk) / tolW);
      if (dd > md) { md = dd; mi = i; }
    }
    if (md > 1 && mi > 0) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
function fluidOutline(raw, fb, z) {
  fb = Object.assign({}, FB_DEFAULT, fb || {});
  const size = fbSize(fb, z), base = size / 2, V = fbNib(fb);
  const asNodes = (pts) => ({ closed: true, nodes: pts.map((q) => C.node(q.x, q.y)) });
  const hy = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const P = clamp(fb.press, 0, 100) / 100, VEL = clamp(fb.vel, -100, 100) / 100;
  const pf = (pr) => clamp(1 - P * (1 - (pr == null ? 1 : pr)), 0.08, 1);
  const st = fbStabilize(raw, clamp(fb.stab, 0, 100) / 100 * 40 / z);
  /* resample evenly, carrying pressure and time */
  let total = 0; for (let i = 1; i < st.length; i++) total += hy(st[i - 1], st[i]);
  const step = Math.max(1 / z, size * 0.08, total / 3000);
  const mk = (q) => ({ x: q.x, y: q.y, pr: q.pr == null ? 1 : q.pr, t: q.t });
  let a = mk(st[0]), need = step; let R = [a];
  const lt = (u, v, t) => (u == null || v == null ? undefined : u + (v - u) * t);
  for (let i = 1; i < st.length; i++) {
    const b = mk(st[i]);
    let d = hy(a, b);
    while (d >= need && d > 1e-9) { const t = need / d; a = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, pr: lerp(a.pr, b.pr, t), t: lt(a.t, b.t, t) }; R.push(a); d = hy(a, b); need = step; }
    need -= d; a = b;
  }
  const lastP = mk(st[st.length - 1]);
  if (hy(R[R.length - 1], lastP) > step * 0.2 || R.length < 2) R.push(lastP);
  if (R.length < 2 || total < 1e-6) { const q = R[0]; return [asNodes(V.map((v) => ({ x: q.x + v[0] * base * pf(q.pr), y: q.y + v[1] * base * pf(q.pr) })))]; }
  /* curve smoothing: relax the path, keeping both ends */
  const sigma = clamp(fb.smooth, 0, 100) / 100 * (10 / z + size * 0.6);
  for (let k = 0, n = Math.min(600, Math.round(2 * (sigma / step) * (sigma / step))); k < n && R.length > 2; k++) {
    const Q = R; R = Q.map((p, i) => (i === 0 || i === Q.length - 1 ? p : { x: (Q[i - 1].x + 2 * p.x + Q[i + 1].x) / 4, y: (Q[i - 1].y + 2 * p.y + Q[i + 1].y) / 4, pr: p.pr, t: p.t }));
  }
  /* arc length, speed (screen px per ms; needs timestamps) */
  R[0].s = 0; for (let i = 1; i < R.length; i++) R[i].s = R[i - 1].s + hy(R[i - 1], R[i]);
  const L = R[R.length - 1].s;
  let sp = R.map((p, i) => { const u = R[Math.max(0, i - 2)], v = R[Math.min(R.length - 1, i + 2)]; const dt = (u.t != null && v.t != null) ? v.t - u.t : 0; return dt > 0 ? hy(u, v) * z / dt : 0; });
  for (let k = 0; k < 3; k++) sp = sp.map((v, i) => (sp[Math.max(0, i - 1)] + v + sp[Math.min(sp.length - 1, i + 1)]) / 3);
  const tl = clamp(fb.taper, 0, 100) / 100 * L / 2, ss = (x) => x * x * (3 - 2 * x);
  R.forEach((p, i) => {
    const vn = clamp(sp[i] / 2, 0, 1), vf = VEL >= 0 ? 1 - VEL * vn * 0.85 : 1 + (-VEL) * vn * 0.6;
    const tf = tl > 1e-9 ? Math.max(0.04, ss(clamp(Math.min(p.s, L - p.s) / tl, 0, 1))) : 1;
    p.k = clamp(pf(p.pr) * vf * tf, 0.03, 2);
  });
  R = fbRdp(R, Math.max(0.2 / z, size * 0.01), Math.max(0.01, 0.2 / z / base));
  R.forEach((p) => { p.pr = p.k; });
  return sweepNib(R, V, base, (p) => p.pr, asNodes);
}
function finishFluid(raw) {
  if (!raw.length) return;
  const fb = S.style.fb, cs = brushSilhouette(fluidOutline(raw, fb, S.view.z), fbSize(fb,S.view.z), S.view.z);
  const o = C.mkPath(cs, { fill: fb.color, fa: fb.alpha / 100, stroke: null, sw: 0 });
  o.nz = true;
  C.recenter(o);
  addStroke(o, fb.merge !== false, 'f');
}

function drawBrushCursor(ctx) {
  const w = S.brushHover, st = S.style;
  if (!w || (S.tool !== 'brush' && S.tool !== 'fluid') || S.space || (S.draw && (S.draw.type === 'brush' || S.draw.type === 'fluid'))) return;
  const fl = S.tool === 'fluid';
  const V = fl ? fbNib(st.fb) : nibOf(st.bshape, st.bsize / 2, st.bangle), r = fl ? fbSize(st.fb, S.view.z) / 2 : st.bsize / 2;
  ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.beginPath();
  V.forEach((v, i) => { const q = w2s(w.x + v[0] * r, w.y + v[1] * r); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,24,40,.85)'; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.restore();
}

/* ---------- pen ---------- */
function penDown(e, p) {
  if (!canDraw()) return;
  const P = S.pen || (S.pen = { nodes: [], hover: p.w, drag: null, bitmapKnife:singleSel()?.o.kind==='image' });
  const w = gridPoint(p.w);
  if (P.nodes.length >= 2) {
    const f = P.nodes[0];
    if (Math.hypot(f.x - w.x, f.y - w.y) * S.view.z < 9) { finishPen(true); return; }
  }
  const n = { x: w.x, y: w.y, ix: 0, iy: 0, ox: 0, oy: 0 };
  P.nodes.push(n); P.drag = n;
}
function penMove(w) {
  const P = S.pen;
  // Pen places straight segments; curve handles are edited after finishing the path.
  P.hover = gridPoint(w);
  invalidate();
}
function penUp() { if (S.pen) S.pen.drag = null; }
function finishPen(closed) {
  const P = S.pen;
  S.pen = null;
  if (!P) return;
  let nodes = P.nodes;
  if (nodes.length >= 2) {
    const a = nodes[nodes.length - 1], b = nodes[nodes.length - 2];
    if (Math.hypot(a.x - b.x, a.y - b.y) * S.view.z < 3) nodes = nodes.slice(0, -1);
  }
  if (nodes.length < 2) { invalidate(); return; }
  const paint = currentPaint(!closed||P.bitmapKnife);
  if (!closed||P.bitmapKnife) paint.fill = null;
  if(P.bitmapKnife){paint.stroke=paint.stroke||CSSV.accent;paint.sw=1/Math.max(.01,S.view.z);}
  const o = C.mkPath([{ closed, nodes }], paint);
  C.recenter(o);
  addObject(o);
}
function cancelPen() { S.pen = null; invalidate(); }
function drawPenPreview(ctx) {
  const P = S.pen;
  if (!P.nodes.length) return;
  ctx.save(); ctx.strokeStyle = CSSV.accent; ctx.lineWidth = 1.5; ctx.fillStyle = CSSV.accentFg;
  const pt = (x, y) => w2s(x, y);
  ctx.beginPath();
  const n0 = P.nodes[0], s0 = pt(n0.x, n0.y);
  ctx.moveTo(s0[0], s0[1]);
  for (let i = 0; i < P.nodes.length - 1; i++) {
    const a = P.nodes[i], b = P.nodes[i + 1];
    const c1 = pt(a.x + a.ox, a.y + a.oy), c2 = pt(b.x + b.ix, b.y + b.iy), e = pt(b.x, b.y);
    ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], e[0], e[1]);
  }
  const last = P.nodes[P.nodes.length - 1];
  if (!P.drag && P.hover) {
    const c1 = pt(last.x + last.ox, last.y + last.oy), h = pt(P.hover.x, P.hover.y);
    ctx.bezierCurveTo(c1[0], c1[1], h[0], h[1], h[0], h[1]);
  }
  ctx.stroke();
  P.nodes.forEach((n, i) => {
    const p = pt(n.x, n.y);
    if (n.ox || n.oy) {
      for (const k of [[n.x + n.ox, n.y + n.oy], [n.x + n.ix, n.y + n.iy]]) { const q = pt(k[0], k[1]); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.beginPath(); ctx.arc(q[0], q[1], 3.5, 0, 6.3); ctx.fill(); ctx.stroke(); }
    }
    ctx.beginPath(); ctx.rect(p[0] - 4, p[1] - 4, 8, 8);
    ctx.fillStyle = i === 0 ? CSSV.accent : CSSV.accentFg; ctx.fill(); ctx.stroke(); ctx.fillStyle = CSSV.accentFg;
  });
  ctx.restore();
}

/* KROGAN node selection and Inkscape-style path operations. */
function kNodeFromKey(key) { const [ci,ni] = key.split(':').map(Number); return {ci,ni}; }
function kNodeKeys() {
  const one = singleSel();
  if (!one || !nodeEditable(one.o)) return [];
  const keys = (S.kNodeSelection || []).filter(k => { const {ci,ni}=kNodeFromKey(k); return !!one.o.contours[ci]?.nodes[ni]; });
  if (!keys.length && S.nodeSel) keys.push(S.nodeSel.ci + ':' + S.nodeSel.ni);
  return keys;
}
function kNodeWheel(dy) {
  if(singleSel()?.o.skin)return;
  const one = singleSel();
  if (!one || !nodeEditable(one.o)) return false;
  const keys = kNodeKeys();
  if (!keys.length) return false;
  if (dy < 0) {
    // Move forward from the last ADDED node, not the currently drawn handle.
    const last = kNodeFromKey(keys[keys.length - 1]);
    const c = one.o.contours[last.ci];
    if (!c || !c.nodes.length) return true;
    for (let step = 1; step <= c.nodes.length; step++) {
      const ni = (last.ni + step) % c.nodes.length;
      const key = last.ci + ':' + ni;
      if (!keys.includes(key)) { keys.push(key); break; }
    }
  } else if (keys.length > 1) {
    keys.pop();
  }
  S.kNodeSelection = keys;
  S.nodeSel = kNodeFromKey(keys[keys.length - 1]);
  invalidate();
  return true;
}
// The original renderer highlights only S.nodeSel. Overlay the other
// selected anchors without modifying the original drawing implementation.
const kOriginalDrawOverlay = drawOverlay;
drawOverlay = function(ctx) {
  kOriginalDrawOverlay(ctx);
  if (S.tool !== 'node') return;
  const one = singleSel();
  if (!one || !nodeEditable(one.o)) return;
  const keys = kNodeKeys();
  kDrawTrueContours(ctx, one.o);
  if (keys.length < 2) return;
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = CSSV.accent;
  ctx.fillStyle = CSSV.accent;
  for (const key of keys) {
    const {ci, ni} = kNodeFromKey(key);
    const n = one.o.contours[ci]?.nodes[ni];
    if (!n) continue;
    const p = nodeScreen(one.o, n, 'anchor');
    ctx.fillRect(p[0] - 3.5, p[1] - 3.5, 7, 7);
    ctx.strokeRect(p[0] - 4.5, p[1] - 4.5, 9, 9);
  }
  ctx.restore();
};
function kNodeOperation(op) {
  if(singleSel()?.o.skin){protest('Detach the soft body before editing nodes.');return;}
  const one=singleSel(); if (!one || !nodeEditable(one.o) || getLayer(one.lid).locked) return;
  const keys=kNodeKeys(); if (!keys.length) { protest('Select a node first'); return; }
  pushUndo(); C.ensureEditable(getLayer(one.lid),S.frame);
  const o=findEditable(one.lid,one.id); if (!o) return;
  const selected=new Set(keys);
  if (op==='straight') {
    let count=0;
    o.contours.forEach((c,ci)=>{ const len=c.nodes.length;
      for(let i=0;i<(c.closed?len:len-1);i++){
        const j=(i+1)%len;
        if(!selected.has(ci+':'+i)||!selected.has(ci+':'+j))continue;
        const a=c.nodes[i],b=c.nodes[j];
        a.ox=a.oy=b.ix=b.iy=0; a.s=b.s=false; count++;
      }
    });
    if(!count) protest('Select two adjacent nodes to straighten their segment');
  } else {
    keys.forEach(key=>{
      const {ci,ni}=kNodeFromKey(key),c=o.contours[ci],n=c?.nodes[ni]; if(!n)return;
      if(op==='corner'){n.s=false;return;}
      const [prev,next]=nodeNeighbors(c,ni);
      let dx=next.x-prev.x,dy=next.y-prev.y;
      let mag=Math.hypot(dx,dy);
      if(mag<1e-6){dx=1;dy=0;mag=1;}
      dx/=mag;dy/=mag;
      const li=Math.hypot(n.ix,n.iy)||Math.hypot(n.x-prev.x,n.y-prev.y)/3;
      const lo=Math.hypot(n.ox,n.oy)||Math.hypot(next.x-n.x,next.y-n.y)/3;
      const L=op==='symmetric'?(li+lo)/2:0;
      n.ix=-dx*(L||li);n.iy=-dy*(L||li);
      n.ox=dx*(L||lo);n.oy=dy*(L||lo);n.s=true;
    });
  }
  C.constrainImageMask(o);commit(); invalidate();
}
function kNodeInitToolbar(){
  document.querySelectorAll('#kSelectBar [data-karrange]').forEach(b=>b.addEventListener('click',()=>{if(S.tool==='select')arrange(b.dataset.karrange);}));
  document.querySelectorAll('#kNodeBar [data-knode]').forEach(b=>b.addEventListener('click',()=>kNodeOperation(b.dataset.knode)));
  document.getElementById('kNodeBar')?.classList.toggle('on',S.tool==='node');
  document.getElementById('kSelectBar')?.classList.toggle('on',S.tool==='select');
  document.querySelectorAll('#kSelectBar [data-ktransform]').forEach(b => b.addEventListener('click', () => kroganSelectionTransform(b.dataset.ktransform)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',kNodeInitToolbar);else kNodeInitToolbar();


/* KROGAN V4: segment hit testing, direct Bézier bending and blur-proof guide. */
function kCurveHit(o, sx, sy) {
  let best=null, min=9; // Screen pixels: same tolerance at every zoom.
  o.contours.forEach((c,ci)=>{
    const len=c.nodes.length, count=c.closed?len:len-1;
    for(let ni=0;ni<count;ni++) {
      const a=c.nodes[ni], b=c.nodes[(ni+1)%len];
      // Sample the actual cubic, not the blurred/stroked raster.
      for(let j=0;j<=80;j++) {
        const t=j/80, xy=C.bezPt(a,b,t);
        const world=mapply(matOf(o.t),xy[0],xy[1]);
        const screen=w2s(world[0],world[1]);
        const dist=Math.hypot(screen[0]-sx,screen[1]-sy);
        if(dist<min){min=dist;best={ci,ni,t};}
      }
    }
  });
  return best;
}
/* Inkscape-inspired direct curve dragging. Source: Inkscape curve-drag-point.cpp (GPL-2.0-or-later). */
function kCurveDrag(w) {
  const d=S.drag;
  if(!d.started) {
    if(Math.hypot(w.x-d.start.x,w.y-d.start.y)*S.view.z<2)return;
    pushUndo(); recordDragEditable(getLayer(d.lid),S.frame);
    const o=findEditable(d.lid,d.id);
    if(!o){S.drag=null;return;}
    d.o=o;d.inv=minv(matOf(o.t));
    const c=o.contours[d.ci],a=c?.nodes[d.ni],b=c?.nodes[(d.ni+1)%c.nodes.length];
    if(!a||!b){S.drag=null;return;}
    d.a=a;d.b=b;
    d.original={ax:a.ox,ay:a.oy,bx:b.ix,by:b.iy};
    d.p0=mapply(d.inv,d.start.x,d.start.y);
    // Straight segment: open its cubic handles at 1/3 of the chord, like Inkscape.
    if(Math.hypot(a.ox,a.oy)<1e-8 && Math.hypot(b.ix,b.iy)<1e-8) {
      a.ox=(b.x-a.x)/3;a.oy=(b.y-a.y)/3;
      b.ix=(a.x-b.x)/3;b.iy=(a.y-b.y)/3;
      d.original={ax:a.ox,ay:a.oy,bx:b.ix,by:b.iy};
    }
    d.basePoint=C.bezPt(a,b,d.t);
    d.started=true;
  }
  const xy=mapply(d.inv,w.x,w.y);
  const dx=xy[0]-d.p0[0],dy=xy[1]-d.p0[1];
  // Inkscape's cubic weight gives more control to the nearby handle.
  // The hit tester samples t at 1/80 increments, so endpoint t=0/1 is excluded.
  const t=Math.max(1/80,Math.min(79/80,d.t)),u=1-t;
  let weight;
  if(t<=1/6)weight=0;
  else if(t<=.5)weight=Math.pow((6*t-1)/2,3)/2;
  else if(t<=5/6)weight=(1-Math.pow((6*u-1)/2,3))/2+.5;
  else weight=1;
  const k0=(1-weight)/(3*t*u*u),k1=weight/(3*t*t*u);
  d.a.ox=d.original.ax+k0*dx;d.a.oy=d.original.ay+k0*dy;
  d.b.ix=d.original.bx+k1*dx;d.b.iy=d.original.by+k1*dy;
  // Avoid automatically re-aligning the opposite handles during this segment edit.
  d.a.s=false;d.b.s=false;
  C.constrainImageMask(d.o);
  invalidate();
}

function kDrawTrueContours(ctx,o) {
  ctx.save();ctx.lineWidth=1.15;ctx.strokeStyle=CSSV.accent;
  ctx.setLineDash([4,4]);
  o.contours.forEach(c=>{
    const len=c.nodes.length,count=c.closed?len:len-1;
    if(!count)return;
    ctx.beginPath();
    const start=nodeScreen(o,c.nodes[0],'anchor');ctx.moveTo(start[0],start[1]);
    for(let i=0;i<count;i++){
      const a=c.nodes[i],b=c.nodes[(i+1)%len];
      const out=nodeScreen(o,a,'out'),inn=nodeScreen(o,b,'in'),end=nodeScreen(o,b,'anchor');
      ctx.bezierCurveTo(out[0],out[1],inn[0],inn[1],end[0],end[1]);
    }
    ctx.stroke();
  });
  ctx.restore();
}

/* ---------- node edit tool ---------- */
function nodeDown(e, p) {
  if(singleSel()?.o.skin){protest('Detach the soft body through its slime menu before editing nodes.');return;}
  if(singleSel()?.o.arc){selDown(e,p);return;}
  if(singleSel()?.o.skel){protest('Use the Bone tool (J) to build or pose this skeleton.');return;}
  const one = singleSel();
  if (one && one.o.rig) { protest('A bone arm is posed with the Selection tool: drag its hand, elbow or shoulder.'); return; }
  if (one && nodeEditable(one.o) && !getLayer(one.lid).locked) {
    const hit = hitNodePart(one.o, p.sx, p.sy);
    if (hit) {
      clearProtest();
      if (e.shiftKey && hit.part === 'anchor') {
        const key = hit.ci + ':' + hit.ni;
        if (!S.kNodeSelection?.length && S.nodeSel)
          S.kNodeSelection = [S.nodeSel.ci + ':' + S.nodeSel.ni];
        S.kNodeSelection ||= [];
        const at = S.kNodeSelection.indexOf(key);
        if (at < 0) S.kNodeSelection.push(key); else S.kNodeSelection.splice(at, 1);
        S.nodeSel = S.kNodeSelection.length ? kNodeFromKey(S.kNodeSelection.at(-1)) : null;
        refreshProps(); invalidate(); return;
      }
      // Keep multi-selection when grabbing an already selected anchor.
      // Clicking an unselected anchor without Shift starts a new selection.
      const key = hit.ci + ':' + hit.ni;
      const existing = kNodeKeys();
      const moveGroup = hit.part === 'anchor' && existing.length > 1 && existing.includes(key);
      if(hit.part==='anchor'){
        if (!moveGroup) S.kNodeSelection = [key];
        S.nodeSel = { ci: hit.ci, ni: hit.ni };
      }
      S.drag = { type: 'node', part: hit.part, ci: hit.ci, ni: hit.ni, lid: one.lid, id: one.id, start: p.w, started: false,
        groupKeys: moveGroup ? [...existing] : null };
      refreshProps(); return;
    }
  }
  // KROGAN: grab the actual mathematical segment, even if blur hides it.
  if (one && nodeEditable(one.o) && !getLayer(one.lid).locked && !e.shiftKey) {
    const curve = kCurveHit(one.o, p.sx, p.sy);
    if (curve) {
      clearProtest();
      S.drag = {type:'curve-bend', lid:one.lid, id:one.id,
        ci:curve.ci, ni:curve.ni, t:curve.t, start:p.w, started:false};
      return;
    }
  }
  // Dragging empty space in Node mode selects enclosed anchors only.
  if (one && nodeEditable(one.o) && !getLayer(one.lid).locked && !hitAt(p.w.x, p.w.y, 6)) {
    clearProtest();
    S.drag = {type:'node-marquee', start:p.w, cur:p.w, lid:one.lid, id:one.id, base:e.shiftKey ? kNodeKeys().slice() : []};
    return;
  }
  const h = hitAt(p.w.x, p.w.y, 6);
  if (h && nodeEditable(h.o)) { clearProtest(); S.sel = [{ lid: h.lid, id: h.id }]; selectLayer(h.lid, true); }
  else if(h){
    S.sel=[{lid:h.lid,id:h.id}];selectLayer(h.lid,true);
    if(h.o.kind==='clip')protestLater('This is a symbol. Double-click to edit inside.','node-symbol:'+h.id);
    else if(h.o.kind==='group')protestLater('This is a group. Ungroup (Ctrl+Shift+G) to edit individual nodes.','node-group:'+h.id);
    else protestLater('This is text. Use the Text tool (T) to edit it.','node-text:'+h.id);
  }
  else {clearProtest();S.sel = [];}
  S.nodeSel = null; S.kNodeSelection = []; refreshProps();
}
function hitNodePart(o, sx, sy) {
  const near = (a, r) => Math.hypot(a[0] - sx, a[1] - sy) <= r;
  // Anchor ALWAYS wins, even if a large handle sits directly on it.
  for (let ci = 0; ci < o.contours.length; ci++)
    for (let ni = 0; ni < o.contours[ci].nodes.length; ni++)
      if (near(nodeScreen(o, o.contours[ci].nodes[ni], 'anchor'), 9))
        return {ci, ni, part:'anchor'};
  // The same handle list drives display and picking, including facing neighbours.
  for(const {ci,ni,part} of visibleNodeHandles(o)){
    const n=o.contours[ci].nodes[ni];
    if(near(nodeScreen(o,n,part),10))return {ci,ni,part};
  }
  return null;
}
function kNodeMarqueeUp(d) {
  const one=singleSel();
  if (!one || !nodeEditable(one.o) || one.id!==d.id || one.lid!==d.lid) return;
  const a=w2s(d.start.x,d.start.y), b=w2s(d.cur.x,d.cur.y);
  const x0=Math.min(a[0],b[0]), x1=Math.max(a[0],b[0]);
  const y0=Math.min(a[1],b[1]), y1=Math.max(a[1],b[1]);
  if (x1-x0<3 && y1-y0<3) {
    if (!d.base.length) { S.sel=[]; S.nodeSel=null; S.kNodeSelection=[]; refreshProps(); invalidate(); }
    return;
  }
  const keys=d.base.slice(), radius=5; // entire 8px node square plus border
  one.o.contours.forEach((c,ci)=>c.nodes.forEach((n,ni)=>{
    const [x,y]=nodeScreen(one.o,n,'anchor');
    const key=ci+':'+ni;
    const inside=d.forceMarquee?x>=x0-.5&&x<=x1+.5&&y>=y0-.5&&y<=y1+.5:x-radius>=x0&&x+radius<=x1&&y-radius>=y0&&y+radius<=y1;
    if (inside && !keys.includes(key)) keys.push(key);
  }));
  S.kNodeSelection=keys;
  S.nodeSel=keys.length?kNodeFromKey(keys[keys.length-1]):null;
  refreshProps(); invalidate();
}

function nodeDrag(w, e) {
  const d = S.drag;
  if (!d.started) {
    if (Math.hypot(w.x - d.start.x, w.y - d.start.y) * S.view.z < 2) return;
    pushUndo(); recordDragEditable(getLayer(d.lid), S.frame);
    const o = findEditable(d.lid, d.id);
    if (!o) { S.drag = null; return; }
    d.o = o; d.inv = minv(matOf(o.t));
    const n = o.contours[d.ci].nodes[d.ni];
    d.n = n; d.n0 = Object.assign({}, n);
    // Snapshot each selected anchor at drag start, so the group moves as one.
    if (d.part === 'anchor' && d.groupKeys?.length > 1) {
      d.groupNodes = d.groupKeys.map(key => {
        const {ci, ni} = kNodeFromKey(key);
        const anchor = o.contours[ci]?.nodes[ni];
        return anchor ? {anchor, x:anchor.x, y:anchor.y} : null;
      }).filter(Boolean);
    }
    d.p0 = mapply(d.inv, d.start.x, d.start.y);
    d.started = true;
  }
  const constrained=e.ctrlKey&&e.shiftKey;
  if(constrained){
    const m=matOf(d.o.t);
    if(d.part==='anchor'){
      let dx=w.x-d.start.x,dy=w.y-d.start.y;
      const axis=Math.abs(dx)>=Math.abs(dy)?0:1;
      const origin=mapply(m,d.n0.x,d.n0.y);
      let target=origin[axis]+(axis===0?dx:dy);
      if(GRID.visible&&GRID.snap){const g=gridPoint({x:origin[0]+dx,y:origin[1]+dy});target=axis===0?g.x:g.y;}
      // Align the grabbed anchor with another anchor without moving the locked axis.
      const excluded=new Set(d.groupKeys||[d.ci+':'+d.ni]);
      const unsnapped=target;let distance=8/S.view.z;
      for(let ci=0;ci<d.o.contours.length;ci++)for(let ni=0;ni<d.o.contours[ci].nodes.length;ni++){
        if(excluded.has(ci+':'+ni))continue;
        const n=d.o.contours[ci].nodes[ni],v=mapply(m,n.x,n.y)[axis],gap=Math.abs(v-unsnapped);
        if(gap<distance){distance=gap;target=v;}
      }
      w=axis===0?{x:d.start.x+target-origin[0],y:d.start.y}:{x:d.start.x,y:d.start.y+target-origin[1]};
    }else{
      const anchor=mapply(m,d.n.x,d.n.y);
      w=Math.abs(w.x-anchor[0])>=Math.abs(w.y-anchor[1])?{x:w.x,y:anchor[1]}:{x:anchor[0],y:w.y};
    }
  }
  if (!constrained && d.part === 'anchor' && GRID.visible && GRID.snap) {
    const m = matOf(d.o.t), origin = mapply(m, d.n0.x, d.n0.y);
    const target = gridPoint({ x: origin[0] + w.x - d.start.x, y: origin[1] + w.y - d.start.y });
    w = { x: d.start.x + target.x - origin[0], y: d.start.y + target.y - origin[1] };
  }
  const pl = mapply(d.inv, w.x, w.y), n = d.n;
  if (d.part === 'anchor') {
    const dx = pl[0] - d.p0[0], dy = pl[1] - d.p0[1];
    if (d.groupNodes?.length) {
      for (const item of d.groupNodes) { item.anchor.x = item.x + dx; item.anchor.y = item.y + dy; }
    } else { n.x = d.n0.x + dx; n.y = d.n0.y + dy; }
  }
  else {
    const hx = pl[0] - n.x, hy = pl[1] - n.y;
    const mine = d.part === 'out' ? 'o' : 'i', other = d.part === 'out' ? 'i' : 'o';
    n[mine + 'x'] = hx; n[mine + 'y'] = hy;
    if (n.s && !e.altKey) {
      const l2 = Math.hypot(hx, hy) || 1, L = Math.hypot(n[other + 'x'], n[other + 'y']) || l2;
      n[other + 'x'] = -hx / l2 * L; n[other + 'y'] = -hy / l2 * L;
    } else if (e.altKey) n.s = false;
  }
  C.constrainImageMask(d.o);
  invalidate();
}
function nodeNeighbors(c, ni) {
  const n = c.nodes.length;
  return [c.nodes[ni === 0 ? (c.closed ? n - 1 : 0) : ni - 1], c.nodes[ni === n - 1 ? (c.closed ? 0 : n - 1) : ni + 1]];
}
function seedMorphNodes(layer,id) {
  for(const k of layer.kfs)for(const o of k.objs)if(o.id===id&&o.kind==='image'&&!o.contours)o.contours=C.imageContours(o);
  const frames=layer.kfs.flatMap(k=>k.objs.filter(o=>o.id===id&&o.ellipseFrame?.path===JSON.stringify(o.contours)));
  const groups=new Map();
  for(const k of layer.kfs){const o=k.objs.find(o=>o.id===id);if(!nodeEditable(o))continue;
    o.contours.forEach((c,ci)=>{const key=ci+':'+c.closed+':'+c.nodes.length;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c);});
  }
  for(const contours of groups.values()){
    const ref=contours.find(c=>c.nodes.every(n=>n.mid))||contours[0];
    for(const n of ref.nodes)if(!n.mid)n.mid=uid();
    for(const c of contours)if(c.nodes.every(n=>!n.mid))c.nodes.forEach((n,i)=>{n.mid=ref.nodes[i].mid;});
  }
  for(const o of frames)o.ellipseFrame.path=JSON.stringify(o.contours);
}
function nodeDbl(p) {
  if(singleSel()?.o.skin){protest('Detach the soft body before editing nodes.');return;}
  const one = singleSel();
  if (!one || !nodeEditable(one.o) || getLayer(one.lid).locked) return;
  const hit = hitNodePart(one.o, p.sx, p.sy);
  if (hit && hit.part === 'anchor') {
    pushUndo(); C.ensureEditable(getLayer(one.lid), S.frame);
    const o = findEditable(one.lid, one.id), c = o.contours[hit.ci], n = c.nodes[hit.ni];
    const nb = nodeNeighbors(c, hit.ni);
    if(n.s)n.s=false;
    else {
      let li=Math.hypot(n.ix,n.iy),lo=Math.hypot(n.ox,n.oy);
      let tx=lo?n.ox:li?-n.ix:nb[1].x-nb[0].x,ty=lo?n.oy:li?-n.iy:nb[1].y-nb[0].y;
      const len=Math.hypot(tx,ty)||1;tx/=len;ty/=len;
      if(!li&&!lo){li=Math.hypot(n.x-nb[0].x,n.y-nb[0].y)/3;lo=Math.hypot(nb[1].x-n.x,nb[1].y-n.y)/3;}
      n.ix=-tx*li;n.iy=-ty*li;n.ox=tx*lo;n.oy=ty*lo;n.s=true;
    }
    S.nodeSel = { ci: hit.ci, ni: hit.ni };
    C.constrainImageMask(o);commit(); return;
  }
  if (hit) return;
  const curve=kCurveHit(one.o,p.sx,p.sy);
  if (!curve) return;
  const best={ci:curve.ci,i:curve.ni,t:Math.max(0.001,Math.min(0.999,curve.t))};
  pushUndo(); seedMorphNodes(getLayer(one.lid),one.id); C.ensureEditable(getLayer(one.lid), S.frame);
  const o = findEditable(one.lid, one.id), c = o.contours[best.ci];
  const j = (best.i + 1) % c.nodes.length;
  const r = C.splitSeg(c.nodes[best.i], c.nodes[j], best.t);
  // Exact subdivision preserves the existing cubic, including neighbouring
  // handles. Corner type keeps the new handles independent when edited later.
  r[1].s=false;
  if(!(c.nodes[best.i].ox||c.nodes[best.i].oy||c.nodes[j].ix||c.nodes[j].iy)){
    r[0].ox=r[0].oy=r[2].ix=r[2].iy=0;
    r[1].ix=r[1].iy=r[1].ox=r[1].oy=0;
  }
  r[1].mid=uid();r[1].birth=[c.nodes[best.i].mid,c.nodes[j].mid,best.t];
  c.nodes[best.i] = r[0]; c.nodes[j] = r[2];
  c.nodes.splice(best.i + 1, 0, r[1]);
  S.nodeSel = { ci: best.ci, ni: best.i + 1 };
  commit();
}
function deleteNode() {
  const one=singleSel();
  if(!one||one.o.skin||!nodeEditable(one.o)||getLayer(one.lid).locked)return false;
  const selected=[...new Set(kNodeKeys())].map(kNodeFromKey).filter(({ci,ni})=>one.o.contours[ci]?.nodes[ni]);
  if(!selected.length)return false;
  // Reject an invalid bitmap-mask deletion as a whole, rather than partly deleting the selection.
  if(one.o.kind==='image'&&one.o.contours.some((c,ci)=>c.nodes.length-selected.filter(n=>n.ci===ci).length<3)){
    protest('A bitmap mask needs at least three nodes.');return true;
  }
  pushUndo();seedMorphNodes(getLayer(one.lid),one.id);C.ensureEditable(getLayer(one.lid),S.frame);
  const o=findEditable(one.lid,one.id);
  // Descending indices keep every selected node valid as nodes/contours disappear.
  for(const {ci,ni} of selected.sort((a,b)=>b.ci-a.ci||b.ni-a.ni)){
    const c=o.contours[ci];
    const n=c.nodes[ni],count=c.nodes.length;
    if(count>2){
      const left=c.nodes[(ni+count-1)%count],right=c.nodes[(ni+1)%count];
      let removed;
      if(!c.closed&&(ni===0||ni===count-1)){
        const next=ni===0?right:left;removed={mid:n.mid,birth:[next.mid,next.mid,0],end:ni===0?'start':'end'};
      }else{
        // Find a point on the replacement cubic; the surviving anchors stay fixed.
        let best=.5,cost=Infinity;
        const distance=t=>{const p=C.bezPt(left,right,t);return (p[0]-n.x)**2+(p[1]-n.y)**2;};
        for(let k=0;k<=40;k++){const t=k/40,d=distance(t);if(d<cost){cost=d;best=t;}}
        let lo=Math.max(0,best-.025),hi=Math.min(1,best+.025);
        for(let k=0;k<20;k++){const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(distance(a)<distance(b))hi=b;else lo=a;}
        removed={mid:n.mid,birth:[left.mid,right.mid,clamp((lo+hi)/2,.001,.999)]};
      }
      c.gone=[...(c.gone||[]).filter(q=>q.mid!==n.mid),removed];
    }
    c.nodes.splice(ni, 1);
  }
  o.contours=o.contours.filter(c=>c.nodes.length>=2);
  S.nodeSel=null;S.kNodeSelection=[];
  if(!o.contours.length){const kf=C.kfFor(getLayer(one.lid),S.frame);kf.objs.splice(kf.objs.indexOf(o),1);S.sel=[];}
  commit();return true;
}

/* ---------- gradients: creation, canvas handles, stops ---------- */
const GR = 819.2;
function makeGrad(type, contours, c1, c2) {
  const b = C.contoursBounds(contours);
  if (!b) return null;
  const w = Math.max(b.x1 - b.x0, 1), h = Math.max(b.y1 - b.y0, 1), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const k = Math.max(w, h) / (GR * 2);
  const m = type === 'radial' ? [k, 0, 0, k, cx, cy] : [w / (GR * 2), 0, 0, h / (GR * 2), cx, cy];
  return { type, stops: [{ o: 0, c: c1, a: 1 }, { o: 1, c: c2 === c1 ? '#FFFFFF' : c2, a: 1 }], m };
}
function gradColorAt(stops, t) {
  const s = stops.slice().sort((a, b) => a.o - b.o);
  if (t <= s[0].o) return { c: s[0].c, a: C.nz(s[0].a, 1) };
  for (let i = 1; i < s.length; i++) if (t <= s[i].o) {
    const u = (t - s[i - 1].o) / Math.max(1e-9, s[i].o - s[i - 1].o);
    return { c: C.lerpHex(s[i - 1].c, s[i].c, u), a: C.nz(s[i - 1].a, 1) + (C.nz(s[i].a, 1) - C.nz(s[i - 1].a, 1)) * u };
  }
  const l = s[s.length - 1]; return { c: l.c, a: C.nz(l.a, 1) };
}
const gradEditing = (o) => S.style.gradEdit !== false && o && o.kind === 'path' && o.grad && Math.abs(o.grad.m[0] * o.grad.m[3] - o.grad.m[1] * o.grad.m[2]) > 1e-12;
function gradPts(o) {
  const g = o.grad, M = matOf(o.t);
  const W = (x, y) => { const a = mapply(g.m, x, y), b = mapply(M, a[0], a[1]); return { x: b[0], y: b[1] }; };
  const out = [], rad = g.type === 'radial';
  if (rad) { out.push(Object.assign({ id: 'c' }, W(0, 0)), Object.assign({ id: 'r' }, W(GR, 0)), Object.assign({ id: 'y' }, W(0, GR))); }
  else out.push(Object.assign({ id: 'a' }, W(-GR, 0)), Object.assign({ id: 'b' }, W(GR, 0)));
  g.stops.forEach((s, i) => { if (s.o > 0.001 && s.o < 0.999) out.push(Object.assign({ id: 's', i, c: s.c }, rad ? W(s.o * GR, 0) : W(-GR + s.o * 2 * GR, 0))); });
  return out;
}
function drawGradHandles(ctx, o) {
  const pts = gradPts(o), g = o.grad, acc = CSSV.accent, sc = (q) => w2s(q.x, q.y);
  const by = (id) => pts.find((q) => q.id === id);
  ctx.save(); ctx.lineWidth = 1.5; ctx.strokeStyle = acc;
  const line = (a, b) => { const p = sc(a), q = sc(b); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
  if (g.type === 'radial') {
    const c = by('c'), r = by('r'), y = by('y'); line(c, r); line(c, y);
    const M = matOf(o.t); ctx.beginPath();
    for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2, u = mapply(g.m, Math.cos(a) * GR, Math.sin(a) * GR), w = mapply(M, u[0], u[1]), s = w2s(w[0], w[1]); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }
    ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
  } else line(by('a'), by('b'));
  for (const q of pts) {
    const p = sc(q); ctx.beginPath();
    if (q.id === 's') { ctx.rect(p[0] - 5, p[1] - 5, 10, 10); ctx.fillStyle = q.c; }
    else {
      ctx.arc(p[0], p[1], q.id === 'y' ? 4 : 6, 0, Math.PI * 2);
      const first = q.id === 'a' || q.id === 'c', last = g.stops.slice().sort((a, b) => a.o - b.o);
      ctx.fillStyle = q.id === 'a' || q.id === 'c' ? last[0].c : q.id === 'y' ? CSSV.accentFg : last[last.length - 1].c;
    }
    ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = acc; ctx.stroke();
  }
  ctx.restore();
}
function gradHit(o, sx, sy) {
  const pts = gradPts(o), near = (q) => { const p = w2s(q.x, q.y); return Math.hypot(p[0] - sx, p[1] - sy) <= 9; };
  return pts.filter((q) => q.id === 's').find(near) || pts.find((q) => q.id !== 's' && near(q)) || null;
}
function gradDown(e, p, one) {
  const o = one.o;
  if (!gradEditing(o)) return false;
  const hit = gradHit(o, p.sx, p.sy);
  if (hit) {
    if (hit.id === 's' && e.altKey && o.grad.stops.length > 2) {
      pushUndo(); C.ensureEditable(getLayer(one.lid), S.frame);
      const eo = findEditable(one.lid, one.id); if (!eo || !eo.grad) return true;
      eo.grad.stops.splice(hit.i, 1); commit(); return true;
    }
    S.drag = { type: 'grad', part: hit.id, i: hit.i, lid: one.lid, id: one.id, start: p.w, started: false };
    return true;
  }
  /* click on the gradient line: add a stop there */
  const pts = gradPts(o), g = o.grad, rad = g.type === 'radial';
  const A = pts.find((q) => q.id === (rad ? 'c' : 'a')), B = pts.find((q) => q.id === (rad ? 'r' : 'b'));
  const a = w2s(A.x, A.y), b = w2s(B.x, B.y), dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
  if (L2 < 1) return false;
  const t = ((p.sx - a[0]) * dx + (p.sy - a[1]) * dy) / L2;
  if (t < 0 || t > 1 || Math.hypot(a[0] + dx * t - p.sx, a[1] + dy * t - p.sy) > 6) return false;
  pushUndo(); C.ensureEditable(getLayer(one.lid), S.frame);
  const eo = findEditable(one.lid, one.id); if (!eo || !eo.grad) return true;
  const col = gradColorAt(eo.grad.stops, t);
  eo.grad.stops.push({ o: t, c: col.c, a: col.a });
  eo.grad.stops.sort((u, v) => u.o - v.o);
  const i = eo.grad.stops.findIndex((s) => s.o === t);
  S.drag = { type: 'grad', part: 's', i, lid: one.lid, id: one.id, start: p.w, started: true, fresh: true };
  const eo2 = eo; S.drag.o = eo2; S.drag.inv = minv(matOf(eo2.t)); S.drag.m0 = eo2.grad.m.slice();
  commit();
  return true;
}
function gradDrag(w) {
  const d = S.drag;
  if (!d.started) {
    if (Math.hypot(w.x - d.start.x, w.y - d.start.y) * S.view.z < 2) return;
    pushUndo(); C.ensureEditable(getLayer(d.lid), S.frame);
    const o = findEditable(d.lid, d.id);
    if (!o || !o.grad) { S.drag = null; return; }
    d.o = o; d.inv = minv(matOf(o.t)); d.m0 = o.grad.m.slice(); d.started = true;
  }
  const g = d.o.grad, m = d.m0, l = mapply(d.inv, w.x, w.y);
  const P0 = mapply(m, -GR, 0), P1 = mapply(m, GR, 0), ctr = [m[4], m[5]];
  const setLin = (A, B) => { const xv = [(B[0] - A[0]) / (2 * GR), (B[1] - A[1]) / (2 * GR)]; if (Math.hypot(xv[0], xv[1]) < 1e-6) return; g.m = [xv[0], xv[1], -xv[1], xv[0], (A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; };
  if (d.part === 'a') setLin(l, P1);
  else if (d.part === 'b') setLin(P0, l);
  else if (d.part === 'c') g.m = [m[0], m[1], m[2], m[3], l[0], l[1]];
  else if (d.part === 'r') {
    const nx = (l[0] - ctr[0]) / GR, ny = (l[1] - ctr[1]) / GR, den = m[0] * m[0] + m[1] * m[1];
    if (den < 1e-12 || Math.hypot(nx, ny) < 1e-6) return;
    const zr = (nx * m[0] + ny * m[1]) / den, zi = (ny * m[0] - nx * m[1]) / den;
    g.m = [nx, ny, m[2] * zr - m[3] * zi, m[2] * zi + m[3] * zr, m[4], m[5]];
  } else if (d.part === 'y') g.m = [m[0], m[1], (l[0] - ctr[0]) / GR, (l[1] - ctr[1]) / GR, m[4], m[5]];
  else if (d.part === 's') {
    let t;
    if (g.type === 'radial') { const R = [m[0] * GR, m[1] * GR]; t = ((l[0] - ctr[0]) * R[0] + (l[1] - ctr[1]) * R[1]) / (R[0] * R[0] + R[1] * R[1]); }
    else { const v = [P1[0] - P0[0], P1[1] - P0[1]]; t = ((l[0] - P0[0]) * v[0] + (l[1] - P0[1]) * v[1]) / (v[0] * v[0] + v[1] * v[1]); }
    if (g.stops[d.i]) g.stops[d.i].o = Math.max(0, Math.min(1, t));
  }
  invalidate(); if (window.gsSync) window.gsSync();
}


/* KROGAN Gradient V1: single straight fill axis, no stroke changes. */
let kGradSelected = null;
function kroganGradDown(e,p) {
  const current = singleSel();
  if (current && !getLayer(current.lid).locked && gradEditing(current.o)) {
    const handle = gradHit(current.o,p.sx,p.sy);
    if (handle) {
      kGradSelected = {lid:current.lid,id:current.id,part:handle.id,i:handle.i};
      gradDown(e,p,current);
      return;
    }
  }
  const hit = hitAt(p.w.x,p.w.y,5);
  if (!hit || hit.o.kind !== 'path' || getLayer(hit.lid).locked) return;
  S.sel=[{lid:hit.lid,id:hit.id}]; selectLayer(hit.lid,true);
  const obj = hit.o;
  if (!obj.fill && !obj.grad) { protest('Gradient needs a filled path.'); refreshProps(); return; }
  pushUndo(); C.ensureEditable(getLayer(hit.lid),S.frame);
  const o=findEditable(hit.lid,hit.id);
  if (!o) return;
  const base=o.grad?.stops?.[0]?.c || o.fill || S.style.fill || '#FFFFFF';
  const inv=minv(matOf(o.t));
  const a=mapply(inv,p.w.x,p.w.y);
  const b=[a[0]+0.01,a[1]];
  o.grad={type:'linear',stops:[{o:0,c:base,a:1},{o:1,c:base,a:0}],m:[(b[0]-a[0])/(2*GR),0,0,(b[0]-a[0])/(2*GR),(a[0]+b[0])/2,a[1]]};
  o.fill=base;
  S.drag={type:'kgrad-create',lid:hit.lid,id:hit.id,start:a,inv,started:true};
  kGradSelected={lid:hit.lid,id:hit.id,part:'b'};
  refreshProps(); invalidate();
}
function kroganGradMove(w) {
  const d=S.drag;if(!d||d.type!=='kgrad-create')return;
  const o=findEditable(d.lid,d.id);if(!o||!o.grad)return;
  const b=mapply(d.inv,w.x,w.y),a=d.start;
  let dx=b[0]-a[0],dy=b[1]-a[1];
  if(Math.hypot(dx,dy)<0.1){dx=0.1;dy=0;}
  o.grad.m=[dx/(2*GR),dy/(2*GR),-dy/(2*GR),dx/(2*GR),(a[0]+b[0])/2,(a[1]+b[1])/2];
  invalidate();
}
function kroganGradDouble(p) {
  const one=singleSel();if(!one||!gradEditing(one.o)||getLayer(one.lid).locked)return;
  const g=one.o.grad;if(g.type!=='linear')return;
  const pts=gradPts(one.o),A=pts.find(q=>q.id==='a'),B=pts.find(q=>q.id==='b');
  const a=w2s(A.x,A.y),b=w2s(B.x,B.y),dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy;
  if(len<1)return;
  const t=((p.sx-a[0])*dx+(p.sy-a[1])*dy)/len;
  if(t<=0.005||t>=0.995||Math.hypot(a[0]+dx*t-p.sx,a[1]+dy*t-p.sy)>8)return;
  pushUndo();C.ensureEditable(getLayer(one.lid),S.frame);
  const o=findEditable(one.lid,one.id);if(!o?.grad)return;
  const col=gradColorAt(o.grad.stops,t);
  o.grad.stops.push({o:t,c:col.c,a:col.a});o.grad.stops.sort((x,y)=>x.o-y.o);
  kGradSelected={lid:one.lid,id:one.id,part:'s',i:o.grad.stops.findIndex(x=>x.o===t)};
  commit();refreshProps();
}
function kroganGradDelete() {
  const q=kGradSelected,one=singleSel();
  if(!q||!one||one.id!==q.id||one.lid!==q.lid||!one.o.grad)return false;
  pushUndo();C.ensureEditable(getLayer(q.lid),S.frame);
  const o=findEditable(q.lid,q.id);if(!o?.grad)return false;
  const stops=o.grad.stops;
  if(q.part==='s'&&stops.length>2&&stops[q.i])stops.splice(q.i,1);
  else if(q.part==='a')stops[0].a=0;
  else if(q.part==='b')stops[stops.length-1].a=0;
  else return false;
  kGradSelected=null;commit();refreshProps();return true;
}
/* ---------- bucket & eyedropper ---------- */
/* ---------- region fill (Flash-style paint bucket on enclosed space) ---------- */
const GAPS = { none: 0, small: 2, medium: 5, large: 10 };
/* square dilation of a binary mask by r cells, separable with running sums */
function dilateMask(m, W, H, r) {
  if (r <= 0) return m;
  const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    let cnt = 0; const row = y * W;
    for (let x = -r; x < W; x++) {
      const add = x + r, rem = x - r - 1;
      if (add < W && add >= 0 && m[row + add]) cnt++;
      if (rem >= 0 && m[row + rem]) cnt--;
      if (x >= 0) tmp[row + x] = cnt > 0 ? 1 : 0;
    }
  }
  for (let x = 0; x < W; x++) {
    let cnt = 0;
    for (let y = -r; y < H; y++) {
      const add = y + r, rem = y - r - 1;
      if (add < H && add >= 0 && tmp[add * W + x]) cnt++;
      if (rem >= 0 && tmp[rem * W + x]) cnt--;
      if (y >= 0) out[y * W + x] = cnt > 0 ? 1 : 0;
    }
  }
  return out;
}
/* flood fill from (sx,sy) through cells where block==0; returns {mask, border} */
function floodMask(block, W, H, sx, sy) {
  const mask = new Uint8Array(W * H); let border = false;
  const st = [sx, sy];
  while (st.length) {
    const y = st.pop(), x0 = st.pop();
    if (block[y * W + x0] || mask[y * W + x0]) continue;
    let a = x0, b = x0;
    while (a > 0 && !block[y * W + a - 1] && !mask[y * W + a - 1]) a--;
    while (b < W - 1 && !block[y * W + b + 1] && !mask[y * W + b + 1]) b++;
    if (a === 0 || b === W - 1 || y === 0 || y === H - 1) border = true;
    for (let x = a; x <= b; x++) {
      mask[y * W + x] = 1;
      if (y > 0 && !block[(y - 1) * W + x] && !mask[(y - 1) * W + x]) st.push(x, y - 1);
      if (y < H - 1 && !block[(y + 1) * W + x] && !mask[(y + 1) * W + x]) st.push(x, y + 1);
    }
  }
  return { mask, border };
}
/* boundary loops of a binary mask as arrays of [x,y] grid corners (interior on the right) */
function traceMask(m, W, H) {
  const V = W + 1, out = new Map();
  const add = (x0, y0, x1, y1) => { const k = y0 * V + x0; let a = out.get(k); if (!a) { a = []; out.set(k, a); } a.push({ x1, y1, used: false }); };
  const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H && m[y * W + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!m[y * W + x]) continue;
    if (!at(x, y - 1)) add(x, y, x + 1, y);
    if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);
    if (!at(x - 1, y)) add(x, y + 1, x, y);
  }
  const loops = [];
  for (const [k0, list] of out) {
    for (const e0 of list) {
      if (e0.used) continue;
      const pts = []; let x = k0 % V, y = (k0 / V) | 0, e = e0;
      for (;;) {
        e.used = true; pts.push([x, y]);
        const dx = e.x1 - x, dy = e.y1 - y; x = e.x1; y = e.y1;
        const nxt = (out.get(y * V + x) || []).filter((q) => !q.used);
        if (!nxt.length) break;
        let pick = nxt[0];
        if (nxt.length > 1) { /* prefer the right turn so diagonal touches stay apart */
          let best = -9;
          for (const q of nxt) { const cx = dx * (q.y1 - y) - dy * (q.x1 - x); if (cx > best) { best = cx; pick = q; } }
        }
        e = pick;
        if (x === k0 % V && y === ((k0 / V) | 0) && e === e0) break;
      }
      if (pts.length >= 4) loops.push(pts);
    }
  }
  return loops;
}
function rdpClosed(pts, eps) {
  /* drop collinear corners, then simplify the ring from two far anchors */
  const n0 = pts.length, keep = [];
  for (let i = 0; i < n0; i++) {
    const a = pts[(i + n0 - 1) % n0], b = pts[i], c = pts[(i + 1) % n0];
    if ((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) !== 0) keep.push(b);
  }
  if (keep.length < 4) return keep;
  const rdp = (p, i0, i1, out) => {
    let md = 0, mi = -1;
    const a = p[i0], b = p[i1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-9;
    for (let i = i0 + 1; i < i1; i++) { const d = Math.abs(dy * (p[i][0] - a[0]) - dx * (p[i][1] - a[1])) / L; if (d > md) { md = d; mi = i; } }
    if (md > eps) { rdp(p, i0, mi, out); out.push(p[mi]); rdp(p, mi, i1, out); }
  };
  const half = keep.length >> 1, ring = keep.concat([keep[0]]);
  const r = [keep[0]]; rdp(ring, 0, half, r); r.push(ring[half]); rdp(ring, half, ring.length - 1, r);
  return r;
}
function regionFill(p, opt) {
  if (!canDraw()) return false;
  const doc = S.doc, st = S.style, gap = GAPS[opt.gap] || 0;
  const pad = 40, bx = -pad, by = -pad, WW = doc.w + pad * 2, HH = doc.h + pad * 2;
  const s = Math.min(2, 3600 / Math.max(WW, HH)), W = Math.ceil(WW * s), H = Math.ceil(HH * s);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.setTransform(s, 0, 0, s, -bx * s, -by * s);
  const ents = opt.all ? C.evalDoc(doc, S.frame) : [{ layer: curLayer(), objs: C.evalLayerObjs(curLayer(), S.frame) }];
  for (const en of ents) { if (en.layer.visible === false || en.layer.mask) continue; for (const o of en.objs) C.drawObj(ctx, o, {}); }
  const d = ctx.getImageData(0, 0, W, H).data, obst = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) obst[i] = d[i * 4 + 3] >= 16 ? 1 : 0;
  /* close gaps by morphological closing of the walls, so sharp corners of the region keep their exact shape */
  const r = Math.round(gap * s);
  let block = obst;
  if (r > 0) {
    const inv = dilateMask(obst, W, H, r).map((v) => 1 - v);
    block = dilateMask(inv, W, H, r).map((v) => 1 - v);
    for (let i = 0; i < W * H; i++) if (obst[i]) block[i] = 1;
  }
  const sx = Math.round((p.x - bx) * s), sy = Math.round((p.y - by) * s);
  if (sx < 0 || sy < 0 || sx >= W || sy >= H) return false;
  if (block[sy * W + sx]) { toast(obst[sy * W + sx] ? 'That spot is already filled.' : 'Too close to a line. Try a smaller gap size.'); return false; }
  const fl = floodMask(block, W, H, sx, sy);
  if (fl.border) { toast(gap < 10 ? 'This area isn\u2019t closed. Try a larger gap size in the tool options.' : 'This area isn\u2019t closed.'); return false; }
  /* tuck the fill under the strokes so no antialiased halo shows at corners */
  /* closing also swallows narrow wedges of the region: win them back by growing through the cells closing added (original free space only) */
  if (r > 0) {
    const m = fl.mask, st2 = [];
    for (let i = 0; i < W * H; i++) if (m[i]) st2.push(i);
    while (st2.length) {
      const i = st2.pop(), x = i % W, y = (i / W) | 0;
      const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
      for (const j of nb) if (j >= 0 && !m[j] && block[j] && !obst[j]) { m[j] = 1; st2.push(j); }
    }
  }
  const reg = dilateMask(fl.mask, W, H, Math.max(2, Math.ceil(1.5 * s)));
  const loops = traceMask(reg, W, H).map((l) => rdpClosed(l, 0.7)).filter((l) => l.length >= 3);
  if (!loops.length) return false;
  const cs = loops.map((l) => ({ closed: true, nodes: l.map((q) => C.node(bx + q[0] / s, by + q[1] / s)) }));
  pushUndo();
  const kf = C.ensureEditable(curLayer(), S.frame);
  const o = C.mkPath(cs, { fill: st.fill, fa: st.fa, stroke: null, sw: 0 });
  o.nz = false;
  C.recenter(o);
  if (st.fillType && st.fillType !== 'solid') { const gr = makeGrad(st.fillType, o.contours, st.fill, st.fill2 || '#FFFFFF'); if (gr) o.grad = gr; }
  kf.objs.unshift(o);
  S.sel = [{ lid: curLayer().id, id: o.id }];
  commit(); buildLayerList();
  return true;
}

function bucketDown(e, p) {
  const hit = hitAt(p.w.x, p.w.y, 4);
  if (!hit) { if (!e.altKey) regionFill(p.w, { gap: S.style.bgap || 'small', all: !!S.style.ball }); return; }
  pushUndo(); C.ensureEditable(getLayer(hit.lid), S.frame);
  const o = findEditable(hit.lid, hit.id);
  if (!o) return;
  const st = S.style;
  const gt = st.fillType && st.fillType !== 'solid' ? st.fillType : null;
  walkPaths(o, (q) => {
    if (e.altKey) { q.stroke = st.stroke; q.sa = st.sa; if (!(q.sw > 0)) q.sw = st.sw; return; }
    q.fill = st.fill; q.fa = st.fa;
    if (q.kind === 'path') { const gr = gt && makeGrad(gt, q.contours, st.fill, st.fill2 || '#FFFFFF'); if (gr) q.grad = gr; else delete q.grad; }
  });
  S.sel = [{ lid: hit.lid, id: hit.id }];
  commit();
}
let screenDropperBusy=false,panelPicker=false,panelPickerStroke=false,blockPickClick=false;
function applyPickedColor(hex,stroke) {
  rememberDrawingColour(hex);
  const selected=selEval().filter(s=>!getLayer(s.lid)?.locked&&!s.o.skel&&['path','text','group'].includes(s.o.kind));
  if(selected.length){
    pushUndo();for(const lid of new Set(selected.map(s=>s.lid)))C.ensureEditable(getLayer(lid),S.frame);
    for(const s of selected){const o=findEditable(s.lid,s.id);if(o)walkPaths(o,p=>{if(stroke){p.stroke=hex;if(!(p.sw>0))p.sw=S.style.sw||2;p.sa=1;}else{p.fill=hex;p.fa=1;if(p.grad)p.grad.stops[0].c=hex;}});}
    commit();refreshProps();
  }
  if(stroke){S.style.stroke=hex;S.style.strokeOn=true;}else{S.style.fill=hex;S.style.fillOn=true;}
  syncStyleUI();toast((stroke?'Stroke':'Fill')+' colour '+hex.toUpperCase());
}
function startPanelPicker(stroke){panelPicker=true;panelPickerStroke=stroke;document.body.classList.add('screen-pick-fallback');toast('Click a colour anywhere in oskyn. Alt = stroke; Esc = cancel.');}
async function screenDropper(stroke=false) {
  if(screenDropperBusy)return;
  if(!window.EyeDropper){startPanelPicker(stroke);return;}
  panelPicker=false;document.body.classList.remove('screen-pick-fallback');screenDropperBusy=true;
  try{const {sRGBHex}=await new EyeDropper().open();applyPickedColor(sRGBHex,stroke);}
  catch(error){if(error.name==='AbortError')setTool('select');else startPanelPicker(stroke);}
  finally{screenDropperBusy=false;}
}
function panelColourAt(e){
  const target=document.elementFromPoint(e.clientX,e.clientY);if(!target)return null;
  const cv=document.createElement('canvas');cv.width=cv.height=1;const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1,1);
  const parents=[];for(let n=target;n instanceof Element;n=n.parentElement)parents.unshift(n);
  for(const n of parents){ctx.fillStyle=getComputedStyle(n).backgroundColor;ctx.fillRect(0,0,1,1);}
  const rect=target.getBoundingClientRect();
  if(target instanceof HTMLCanvasElement){const x=clamp(Math.floor((e.clientX-rect.left)*target.width/rect.width),0,target.width-1),y=clamp(Math.floor((e.clientY-rect.top)*target.height/rect.height),0,target.height-1);const px=target.getContext('2d').getImageData(x,y,1,1);const one=document.createElement('canvas');one.width=one.height=1;one.getContext('2d').putImageData(px,0,0);ctx.drawImage(one,0,0);}
  else if(target instanceof HTMLImageElement&&target.complete){ctx.drawImage(target,(e.clientX-rect.left)*target.naturalWidth/rect.width,(e.clientY-rect.top)*target.naturalHeight/rect.height,1,1,0,0,1,1);}
  else {
    const range=document.caretRangeFromPoint?.(e.clientX,e.clientY);
    if(range?.startContainer.nodeType===Node.TEXT_NODE&&target.contains(range.startContainer)){
      const text=range.startContainer.textContent,index=Math.min(range.startOffset,text.length-1);
      if(index>=0&&text[index].trim()){range.setStart(range.startContainer,index);range.setEnd(range.startContainer,index+1);const r=range.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){ctx.fillStyle=getComputedStyle(range.startContainer.parentElement).color;ctx.fillRect(0,0,1,1);}}
    }
  }
  const p=ctx.getImageData(0,0,1,1).data;return C.rgbToHex(p[0],p[1],p[2]);
}
document.addEventListener('pointerdown',e=>{
  if(!panelPicker||S.tool!=='dropper'||e.button!==0||e.target.closest('[data-tool]'))return;
  e.preventDefault();e.stopImmediatePropagation();blockPickClick=true;
  try{const hex=panelColourAt(e);if(hex)applyPickedColor(hex,panelPickerStroke||e.altKey);}catch(error){toast('Could not sample that colour. Try the drawing or a panel background.');}
  panelPicker=false;document.body.classList.remove('screen-pick-fallback');setTool('select');
},true);
document.addEventListener('pointerup',()=>{if(blockPickClick)setTimeout(()=>{blockPickClick=false;},0);},true);
document.addEventListener('pointercancel',()=>{blockPickClick=false;},true);
document.addEventListener('click',e=>{if(blockPickClick){blockPickClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('keydown',e=>{if(panelPicker&&e.key==='Escape'){panelPicker=false;document.body.classList.remove('screen-pick-fallback');setTool('select');e.preventDefault();e.stopImmediatePropagation();}},true);
function dropperDown(e, p) {
  try {const px=sctx.getImageData(clamp(Math.round(p.sx*dpr),0,stage.width-1),clamp(Math.round(p.sy*dpr),0,stage.height-1),1,1).data;applyPickedColor(C.rgbToHex(px[0],px[1],px[2]),e.altKey);}catch(error){}
}

/* ---------- eraser ----------
   Fills are cut with polygon boolean ops (polygon-clipping); lines are trimmed where the eraser passes.
   All geometry is done in world space so the eraser stays a true circle on scaled or rotated shapes. */
const eraserR = () => Math.max(0.5, (S.style.esize || 20) / 2);
function eFlatten(c, m) {
  const n = c.nodes, out = [], cnt = c.closed ? n.length : n.length - 1;
  if (!n.length) return out;
  const sc = Math.max(0.01, Math.hypot(m[0], m[1]), Math.hypot(m[2], m[3]));
  out.push(C.mapply(m, n[0].x, n[0].y));
  for (let i = 0; i < cnt; i++) {
    const a = n[i], b = n[(i + 1) % n.length], last = c.closed && i === cnt - 1;
    if (a.ox || a.oy || b.ix || b.iy) {
      const L = Math.hypot(a.ox, a.oy) + Math.hypot(b.ix, b.iy) + Math.hypot(b.x - a.x, b.y - a.y);
      const k = Math.min(64, Math.max(4, Math.ceil(L * sc / 3)));
      for (let j = 1; j < k; j++) { const q = C.bezPt(a, b, j / k); out.push(C.mapply(m, q[0], q[1])); }
    }
    if (!last) out.push(C.mapply(m, b.x, b.y));
  }
  return out;
}
const eArea = (r) => { let s = 0; for (let i = 0, n = r.length; i < n; i++) { const a = r[i], b = r[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
function eInRing(pt, r) {
  let ins = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i][1] > pt[1]) !== (r[j][1] > pt[1]) && pt[0] < (r[j][0] - r[i][0]) * (pt[1] - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) ins = !ins;
  }
  return ins;
}
/* the filled area of a path as a polygon-clipping MultiPolygon, honouring its fill rule */
function eFillGeom(o, m, flatten = eFlatten) {
  const rings = o.contours.filter((c) => c.closed && c.nodes.length >= 2).map((c) => flatten(c, m)).filter((r) => r.length >= 3);
  if (!rings.length) return null;
  const pc = polygonClipping;
  if (!o.nz) return rings.length === 1 ? [[rings[0]]] : pc.xor(...rings.map((r) => [[r]]));
  const ar = rings.map(eArea);
  let big = 0; ar.forEach((a, i) => { if (Math.abs(a) > Math.abs(ar[big])) big = i; });
  const sg = Math.sign(ar[big]), solid = [], maybe = [];
  rings.forEach((r, i) => (Math.sign(ar[i]) === sg ? solid : maybe).push(i));
  const holes = maybe.filter((i) => solid.some((j) => eInRing(rings[i][0], rings[j])));
  const solidIdx = solid.concat(maybe.filter((i) => !holes.includes(i)));
  let g = pc.union(...solidIdx.map((i) => [[rings[i]]]));
  if (holes.length) g = pc.difference(g, ...holes.map((i) => [[rings[i]]]));
  return g;
}
function eCapsule(P, Q, r) {
  const N = 14, th = Math.atan2(Q[1] - P[1], Q[0] - P[0]), pts = [];
  if (Math.hypot(Q[0] - P[0], Q[1] - P[1]) < 1e-6) { for (let i = 0; i < N * 2; i++) { const a = i / (N * 2) * Math.PI * 2; pts.push([P[0] + Math.cos(a) * r, P[1] + Math.sin(a) * r]); } return pts; }
  for (let i = 0; i <= N; i++) { const a = th - Math.PI / 2 + i / N * Math.PI; pts.push([Q[0] + Math.cos(a) * r, Q[1] + Math.sin(a) * r]); }
  for (let i = 0; i <= N; i++) { const a = th + Math.PI / 2 + i / N * Math.PI; pts.push([P[0] + Math.cos(a) * r, P[1] + Math.sin(a) * r]); }
  return pts;
}
const eDistSeg = (x, y, P, Q) => {
  const dx = Q[0] - P[0], dy = Q[1] - P[1], L = dx * dx + dy * dy;
  const t = L < 1e-12 ? 0 : Math.max(0, Math.min(1, ((x - P[0]) * dx + (y - P[1]) * dy) / L));
  return Math.hypot(x - P[0] - t * dx, y - P[1] - t * dy);
};
/* the part of segment AB closer than r to segment PQ, as [t0, t1] (a convex distance, so one interval), or null */
function eInterval(A, B, P, Q, r) {
  const f = (t) => eDistSeg(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, P, Q);
  let lo = 0, hi = 1;
  for (let i = 0; i < 28; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (f(m1) < f(m2)) hi = m2; else lo = m1; }
  const tm = (lo + hi) / 2;
  if (f(tm) >= r) return null;
  let t0 = 0, t1 = 1;
  if (f(0) >= r) { let a = 0, b = tm; for (let i = 0; i < 26; i++) { const m = (a + b) / 2; if (f(m) < r) b = m; else a = m; } t0 = b; }
  if (f(1) >= r) { let a = tm, b = 1; for (let i = 0; i < 26; i++) { const m = (a + b) / 2; if (f(m) < r) a = m; else b = m; } t1 = a; }
  return [t0, t1];
}
/* trim a polyline; returns the surviving pieces, or null when the eraser never touched it */
function eCutLine(pts, closed, P, Q, r) {
  const L = pts.slice(); if (closed) L.push(pts[0]);
  const pieces = []; let cur = [], touched = false, startKept = false, endKept = false;
  const at = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
  for (let i = 0; i + 1 < L.length; i++) {
    const A = L[i], B = L[i + 1];
    const near = Math.min(A[0], B[0]) - r > Math.max(P[0], Q[0]) || Math.max(A[0], B[0]) + r < Math.min(P[0], Q[0]) || Math.min(A[1], B[1]) - r > Math.max(P[1], Q[1]) || Math.max(A[1], B[1]) + r < Math.min(P[1], Q[1]);
    const iv = near ? null : eInterval(A, B, P, Q, r);
    if (!iv) { if (!cur.length) cur.push(A); cur.push(B); if (i === 0) startKept = true; continue; }
    touched = true;
    if (iv[0] > 1e-6) { if (!cur.length) cur.push(A); cur.push(at(A, B, iv[0])); if (i === 0) startKept = true; }
    if (cur.length > 1) pieces.push(cur);
    cur = [];
    if (iv[1] < 1 - 1e-6) { cur = [at(A, B, iv[1]), B]; }
  }
  if (!touched) return null;
  if (cur.length > 1) { pieces.push(cur); endKept = true; }
  if (closed && startKept && endKept && pieces.length > 1) { const last = pieces.pop(); pieces[0] = last.concat(pieces[0].slice(1)); }
  return pieces.filter((p) => p.length > 1 && p.some((q) => Math.hypot(q[0] - p[0][0], q[1] - p[0][1]) > 1e-3));
}
const eNode = (inv, p) => { const q = C.mapply(inv, p[0], p[1]); return C.node(q[0], q[1]); };
// A circular eraser uses real cubic caps, so sampling points never become nodes.
function eRoundCapsule(P,Q,r) {
  const dx=Q[0]-P[0],dy=Q[1]-P[1],length=Math.hypot(dx,dy),k=.5522847498307936*r;
  if(length<1e-9){const c=C.ellipseContour(r,r);for(const n of c.nodes){n.x+=P[0];n.y+=P[1];}return c;}
  const ux=dx/length,uy=dy/length,vx=-uy,vy=ux;
  const nodes=[
    {...C.node(0,-r),ix:-k}, {...C.node(length,-r),ox:k},
    {...C.node(length+r,0),iy:-k,oy:k}, {...C.node(length,r),ix:k},
    {...C.node(0,r),ox:-k}, {...C.node(-r,0),iy:k,oy:-k}
  ];
  for(const n of nodes){const {x,y,ix,iy,ox,oy}=n;n.x=P[0]+x*ux+y*vx;n.y=P[1]+x*uy+y*vy;n.ix=ix*ux+iy*vx;n.iy=ix*uy+iy*vy;n.ox=ox*ux+oy*vx;n.oy=ox*uy+oy*vy;}
  return {closed:true,nodes};
}
function eCutFillContours(o,P,Q,r) {
  const m=C.matOf(o.t),inv=C.minv(m),pc=polygonClipping,g=eFillGeom(o,m);
  if(!g?.length||!pc.intersection(g,[[eCapsule(P,Q,r)]]).length)return null;
  try {
    const cutter=C.mkPath([eRoundCapsule(P,Q,r)],{fill:'#ffffff',stroke:null,sw:0});
    const curves=kroganBooleanSources([o,cutter]);
    return pc.difference(...curves.geometries).flatMap(poly=>poly.map(ring=>curves.reconstruct(ring,inv)).filter(Boolean));
  } catch (_) {
    // A difficult junction still erases using the established polygon fallback.
    return pc.difference(g,[[eCapsule(P,Q,r)]]).flatMap(poly=>poly.map(ring=>{
      const points=rdpClosed(ring.slice(0,-1),.12);
      return {closed:true,nodes:points.map(p=>eNode(inv,p))};
    }).filter(c=>c.nodes.length>=3));
  }
}
function eEraseImage(o,P,Q,r) {
  const mask={...o,kind:'path',contours:C.imageContours(o),fill:'#ffffff',stroke:null,nz:false};
  const contours=eCutFillContours(mask,P,Q,r);
  return contours===null?null:[{...C.clone(o),contours,eraserMask:true}];
}
function finishErase(dr) {
  const layer=curLayer(),key=layer&&C.kfFor(layer,S.frame);
  for(const o of key?.objs||[]){
    if(!dr.touched?.has(o.id))continue;
    const m=C.matOf(o.t),scale=Math.max(Math.hypot(m[0],m[1]),Math.hypot(m[2],m[3]),.001);
    const tolerance=.2/Math.max(.01,S.view.z*scale);
    o.contours=o.contours.map(c=>fitSilhouetteContour(c,tolerance));
  }
}
/* erase one path object; returns null (untouched) or the list of objects that replace it */
function eErasePath(o, P, Q, r) {
  const m = C.matOf(o.t), inv = C.minv(m);
  const hasFill = o.fill != null && o.contours.some((c) => c.closed);
  const hasStroke = !!o.stroke && o.sw > 0;
  let fillRings = null, strokeContours = null;
  if (hasFill) fillRings=eCutFillContours(o,P,Q,r);
  if (hasStroke) {
    let any = false; const out = [];
    for (const c of o.contours) {
      const pts = eFlatten(c, m), pieces = pts.length > 1 ? eCutLine(pts, c.closed, P, Q, r) : null;
      if (!pieces) { out.push(c); continue; }
      any = true;
      for (const pc2 of pieces) out.push({ closed: false, nodes: pc2.map((p) => eNode(inv, p)) });
    }
    if (any) strokeContours = out;
  }
  if (!fillRings && !strokeContours) return null;
  const res = [];
  const make = (contours, fill, stroke) => {
    const k = C.clone(o); k.id = C.uid(); k.contours = contours;delete k.star;
    if (!fill) k.fill = null; if (!stroke) k.stroke = null;
    if (fill) k.nz = false;
    C.recenter(k); return k;
  };
  if (hasFill && hasStroke) {
    const fr = fillRings || o.contours.filter((c) => c.closed);
    if (fr.length) res.push(make(fr, true, false));
    const sc = strokeContours || o.contours;
    if (sc.length) res.push(make(sc, false, true));
  } else if (hasFill) {
    const open = o.contours.filter((c) => !c.closed);
    const cs = (fillRings || []).concat(open);
    if (cs.length) { const k = make(cs, true, false); k.id = o.id; res.push(k); }
  } else {
    if (strokeContours.length) { const k = make(strokeContours, false, true); k.id = o.id; res.push(k); }
  }
  if (res.length) res[0].id = o.id;
  return res;
}
/* one eraser sweep from world point a to b on the active layer; returns true if anything changed */
function eraseSweep(dr, a, b) {
  const l = curLayer();
  if (!l || l.locked || l.visible === false) return false;
  const r = eraserR(), P = [a.x, a.y], Q = [b.x, b.y];
  const bx0 = Math.min(P[0], Q[0]) - r, bx1 = Math.max(P[0], Q[0]) + r, by0 = Math.min(P[1], Q[1]) - r, by1 = Math.max(P[1], Q[1]) + r;
  const cand = C.evalLayerObjs(l, S.frame).filter((o) => {
    if (!['path','image'].includes(o.kind) || o.rig) return false;
    const wb = C.worldBounds(o); if (!wb) return false;
    const pad = (o.stroke ? o.sw : 0) / 2 + 1;
    return !(wb.x0 - pad > bx1 || wb.x1 + pad < bx0 || wb.y0 - pad > by1 || wb.y1 + pad < by0);
  });
  if (!cand.length) return false;
  const ids = new Set(cand.map((o) => o.id));
  let kf = C.kfFor(l, S.frame);
  const targets = (kf && (kf.f === S.frame || kf.tween === 'none') ? kf.objs : cand).filter((o) => ids.has(o.id));
  const plan = [];
  for (const o of targets) { const rep = o.kind==='image'?eEraseImage(o,P,Q,r):eErasePath(o,P,Q,r); if (rep) plan.push([o.id, rep]); }
  if (!plan.length) return false;
  if (!dr.undone) { pushUndo(); dr.undone = true; }
  kf = plan.some(([,rep])=>rep.some(o=>o.kind==='image'))&&!C.kfAt(l,S.frame)?C.insertKeyframe(l,S.frame,false):C.ensureEditable(l,S.frame);
  const erasedImages=new Set(plan.flatMap(([,rep])=>rep.filter(o=>o.kind==='image').map(o=>o.id)));
  for(const key of l.kfs)for(const o of key.objs)if(erasedImages.has(o.id))o.eraserMask=true;
  dr.touched ||= new Set();
  for (const [id, rep] of plan) {
    for(const o of rep)dr.touched.add(o.id);
    const i = kf.objs.findIndex((x) => x.id === id);
    if (i >= 0) kf.objs.splice(i, 1, ...rep);
  }
  dr.changed = true;
  return true;
}
function drawEraserCursor(ctx) {
  const w = S.brushHover;
  if (!w || S.tool !== 'eraser' || S.space) return;
  const c = w2s(w.x, w.y), rr = eraserR() * S.view.z;
  ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(c[0], c[1], rr, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,24,40,.85)'; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.restore();
}

/* Bones, first small step: a two-joint guide and an on-canvas hover menu. */
const BONE_MENU_REACH=128;
const SK={ctrlHeld:false,shiftHeld:false,menuLock:null,menuAimTimer:0,menuAimCandidate:null,zoneRig:null,softOpen:null,poseOpen:null,rigidPick:null,bindTarget:null,placeReady:false,active:null,joint:null,mode:'pose',visible:true,add:false,binding:false,baseline:new Map(),hover:null,dismissed:null,actionDrag:null,badgeTimer:0,badgeEpoch:performance.now(),angleHover:null,angleEdit:null};
function skeletonList() {
  C.setSkeletonScope(layers());const result=[];
  for(const l of layers())if(l.visible!==false)for(const o of C.evalLayerObjs(l,S.frame))if(o.skel)result.push({lid:l.id,id:o.id,o});
  return result;
}
function skeletonActive() {const one=singleSel();if(one?.o.skel)SK.active=one.id;return skeletonList().find(r=>r.id===SK.active)||null;}
function skeletonDesc(g,id) {const ids=new Set([id]);for(const n of g.nodes)if(ids.has(n.parent))ids.add(n.id);return ids;}
function skeletonChain(g,id) {
  const byId=new Map(g.nodes.map(n=>[n.id,n])),chain=[byId.get(id)];if(!chain[0])return [];
  if(chain[0].hinge&&chain[0].parent!=null)return [byId.get(chain[0].parent),chain[0]];
  while(chain[0].parent!=null){const p=byId.get(chain[0].parent);chain.unshift(p);if(p.pin||p.parent==null||g.nodes.filter(n=>n.parent===p.id).length>1)break;}
  return chain;
}
function skeletonOwned(g,id){return Array.from(new Set([...skeletonDesc(g,id),...skeletonChain(g,id).slice(1).map(n=>n.id)]));}
function skeletonScreen(r,n){const p=mapply(matOf(r.o.t),n.x,n.y);return w2s(p[0],p[1]);}
/* Edit-mode angle control: hover an edge half to choose its connected end. */
function skeletonAngleKey(r){return r?r.lid+':'+r.id+':'+r.joint+':'+r.bone:'';}
function skeletonAngleRef(ref) {
  if(!ref)return null;
  const r=skeletonList().find(r=>r.id===ref.id&&r.lid===ref.lid);if(!r||skeletonMode(r)!=='edit'||getLayer(r.lid).locked)return null;
  const n=r.o.skel.nodes.find(n=>n.id===ref.joint);if(!n)return null;
  const ns=r.o.skel.nodes.filter(q=>q.id===n.parent||q.parent===n.id);
  if(ns.length!==2||!ns.some(q=>q.id===ref.bone))return null;
  return {...r,joint:n.id,bone:ref.bone,ref:ns.find(q=>q.id!==ref.bone).id};
}
function skeletonAngleHit(p) {
  for(const r of skeletonList().reverse()) {
    if(skeletonMode(r)!=='edit'||getLayer(r.lid).locked)continue;
    for(const n of r.o.skel.nodes)if(n.parent!=null) {
      const parent=r.o.skel.nodes.find(q=>q.id===n.parent),a=skeletonScreen(r,parent),b=skeletonScreen(r,n),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
      if(len<64)continue;
      const t=clamp(((p.sx-a[0])*dx+(p.sy-a[1])*dy)/(len*len),0,1);
      if(t*len<30||(1-t)*len<30||Math.hypot(p.sx-a[0]-t*dx,p.sy-a[1]-t*dy)>9)continue;
      const joint=t<.5?parent:n,bone=t<.5?n:parent;
      const candidate=skeletonAngleRef({...r,joint:joint.id,bone:bone.id});
      if(candidate&&skeletonKey(candidate)!==SK.dismissed)return candidate;
    }
  }
  return null;
}
function skeletonAngleButtonPoint(r) {
  const g=r.o.skel,a=skeletonScreen(r,g.nodes.find(n=>n.id===r.joint)),b=skeletonScreen(r,g.nodes.find(n=>n.id===r.bone)),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
  return [clamp(a[0]+dx*.3+dy/len*27,18,stageW-18),clamp(a[1]+dy*.3-dx/len*27,18,stageH-18)];
}
function skeletonAngleRemovePoint(r){const p=skeletonAngleButtonPoint(r),joint=skeletonScreen(r,r.o.skel.nodes.find(n=>n.id===r.joint)),choices=[[-38,0],[38,0],[0,-38],[0,38]].map(([x,y])=>[p[0]+x,p[1]+y]).filter(q=>q[0]>=18&&q[0]<=stageW-18&&q[1]>=18&&q[1]<=stageH-18);choices.sort((a,b)=>Math.hypot(b[0]-joint[0],b[1]-joint[1])-Math.hypot(a[0]-joint[0],a[1]-joint[1]));return choices[0]||[p[0]+38,p[1]];}
function skeletonAngleMenuSync() {
  const button=$('#boneAngle'),remove=$('#boneAngleRemove');if(!button||!remove)return;
  const r=skeletonAngleRef(SK.angleHover)||skeletonAngleRef(SK.angleEdit);
  button.hidden=!r||SK.shiftHeld||S.tool!=='bone'||S.playing||!!S.drag||!!SK.add||!!SK.actionDrag||skeletonKey(r)===SK.dismissed;
  remove.hidden=button.hidden||!C.skeletonJointLimit(r?.o.skel||{nodes:[]},r?.joint);
  if(button.hidden)return;
  const p=skeletonAngleButtonPoint(r);button.style.left=p[0]+'px';button.style.top=p[1]+'px';button.disabled=REC.armed;
  if(!remove.hidden){const q=skeletonAngleRemovePoint(r);remove.style.left=q[0]+'px';remove.style.top=q[1]+'px';remove.disabled=REC.armed;}
  button.setAttribute('aria-pressed',String(!!C.skeletonJointLimit(r.o.skel,r.joint)));
  button.setAttribute('aria-expanded',String(skeletonAngleKey(r)===skeletonAngleKey(SK.angleEdit)));
}
function skeletonRemoveLimit(ref){
  const r=skeletonAngleRef(ref);if(!r||REC.armed||!C.skeletonJointLimit(r.o.skel,r.joint))return;
  pushUndo();
  for(const l of layers())for(const key of l.kfs)for(const o of key.objs)if(o.id===r.id&&o.skel){const n=o.skel.nodes.find(n=>n.id===r.joint);if(n)delete n.limit;}
  SK.angleEdit=null;SK.angleHover={lid:r.lid,id:r.id,joint:r.joint,bone:r.bone};commit();skeletonAngleMenuSync();toast('Joint movement limit removed.');
}
function skeletonAngleHover(p,jointHit) {
  if(S.tool!=='bone'||S.playing||S.drag||SK.add||SK.actionDrag){skeletonAngleMenuSync();return;}
  const current=skeletonAngleRef(SK.angleHover),hit=!jointHit&&skeletonAngleHit(p);
  if(hit)SK.angleHover=hit;
  else if(jointHit)SK.angleHover=null;
  else if(current){const q=skeletonAngleButtonPoint(current);if(Math.hypot(p.sx-q[0],p.sy-q[1])>45)SK.angleHover=null;}
  skeletonAngleMenuSync();
}
function skeletonAngleValue(r) {
  const g=r.o.skel,n=g.nodes.find(n=>n.id===r.joint),bone=g.nodes.find(n=>n.id===r.bone),ref=g.nodes.find(n=>n.id===r.ref),l=C.skeletonJointLimit(g,n.id);
  if(l)return l.bone===bone.id?{...l}:{bone:bone.id,ref:ref.id,min:-l.max,max:-l.min};
  const a=C.skeletonUnwrap(Math.atan2(bone.y-n.y,bone.x-n.x)-Math.atan2(ref.y-n.y,ref.x-n.x),0);
  return {bone:bone.id,ref:ref.id,min:a-Math.PI/3,max:a+Math.PI/3};
}
function skeletonWriteLimit(r,limit) {
  for(const l of layers())for(const key of l.kfs)for(const o of key.objs)if(o.id===r.id&&o.skel){const n=o.skel.nodes.find(n=>n.id===r.joint);if(n)n.limit={...limit};}
}
function skeletonOpenAngle(ref) {
  const r=skeletonAngleRef(ref);if(!r||REC.armed)return;
  if(skeletonAngleKey(r)===skeletonAngleKey(SK.angleEdit)){SK.angleEdit=null;invalidate();return;}
  if(!C.skeletonJointLimit(r.o.skel,r.joint)){pushUndo();skeletonWriteLimit(r,skeletonAngleValue(r));commit();}
  SK.angleEdit={lid:r.lid,id:r.id,joint:r.joint,bone:r.bone};SK.hover=null;invalidate();
}
function skeletonAngleGeometry() {
  const r=skeletonAngleRef(SK.angleEdit);if(!r||!C.skeletonJointLimit(r.o.skel,r.joint))return null;
  const g=r.o.skel,n=g.nodes.find(n=>n.id===r.joint),ref=g.nodes.find(n=>n.id===r.ref),limit=skeletonAngleValue(r),M=matOf(r.o.t),p=skeletonScreen(r,n);
  const ray=a=>{const q=mapply(M,n.x+Math.cos(a),n.y+Math.sin(a));return Math.atan2(q[1]-mapply(M,n.x,n.y)[1],q[0]-mapply(M,n.x,n.y)[0]);};
  const base=Math.atan2(ref.y-n.y,ref.x-n.x),angles=[ray(base+limit.min),ray(base+limit.max)];
  const handles=angles.map(a=>({x:p[0]+Math.cos(a)*48,y:p[1]+Math.sin(a)*48}));
  return {r,n,ref,p,limit,base,angles,handles,ray,mirrored:r.o.t.sx*r.o.t.sy<0};
}
function skeletonAngleDown(p) {
  if(SK.shiftHeld)return false;
  if(!SK.angleEdit)return false;
  const geo=skeletonAngleGeometry();if(!geo){SK.angleEdit=null;return false;}
  for(let i=0;i<2;i++)if(Math.hypot(p.sx-geo.handles[i].x,p.sy-geo.handles[i].y)<=11){S.drag={type:'bone-limit',start:p.w,sx:p.sx,sy:p.sy,started:false,part:i,...geo};skeletonMenuSync();return true;}
  if(Math.hypot(p.sx-geo.p[0],p.sy-geo.p[1])<58)return true;
  SK.angleEdit=null;invalidate();return false;
}
function skeletonAngleDrag(p) {
  const d=S.drag;if(!d.started){if(Math.hypot(p.sx-d.sx,p.sy-d.sy)<2)return;pushUndo();d.started=true;}
  const xy=mapply(minv(matOf(d.r.o.t)),p.w.x,p.w.y),a=Math.atan2(xy[1]-d.n.y,xy[0]-d.n.x)-d.base;
  const l={...d.limit},value=C.skeletonUnwrap(a,d.part===0?d.limit.min:d.limit.max),tau=Math.PI*2;
  if(d.part===0)l.min=clamp(value,l.max-tau,l.max);
  else l.max=clamp(value,l.min,l.min+tau);
  skeletonWriteLimit(d.r,l);invalidate();
}
function skeletonAngleDraw(ctx) {
  const geo=skeletonAngleGeometry();if(!geo||S.tool!=='bone'||S.playing||SK.shiftHeld)return;
  const {p,angles,handles,limit,ray,base,mirrored}=geo;
  ctx.save();ctx.setLineDash([]);ctx.lineCap='round';
  // Draw the forbidden ring; its open mouth points along the controlled bone.
  const span=limit.max-limit.min;
  if(span<Math.PI*2-1e-5){ctx.beginPath();if(span<1e-5)ctx.arc(p[0],p[1],22,0,Math.PI*2);else ctx.arc(p[0],p[1],22,ray(base+limit.max),ray(base+limit.min),mirrored);ctx.strokeStyle=CSSV.fg;ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle=CSSV.accent;ctx.lineWidth=5;ctx.stroke();}
  for(let i=0;i<2;i++){
    ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(handles[i].x,handles[i].y);ctx.strokeStyle=CSSV.panel;ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=CSSV.accent;ctx.lineWidth=1.5;ctx.stroke();
    ctx.setLineDash([]);ctx.beginPath();ctx.arc(handles[i].x,handles[i].y,6,0,Math.PI*2);ctx.fillStyle=CSSV.panel;ctx.fill();ctx.strokeStyle=CSSV.fg;ctx.lineWidth=2;ctx.stroke();
  }
  ctx.restore();
}

function skeletonMode(r){return r?.o.skel.mode==='pose'?'pose':'edit';}
function skeletonKey(r){return r?r.lid+':'+r.id+':'+r.joint:'';}
function skeletonHoverRig(){const h=SK.hover;if(!h)return null;const r=skeletonList().find(r=>r.id===h.id&&r.lid===h.lid);return r&&r.o.skel.nodes.some(n=>n.id===h.joint)?{...r,joint:h.joint}:null;}
function skeletonHit(p,lines=false) {
  for(const r of skeletonList().reverse()) {
    if(getLayer(r.lid).locked)continue;
    const g=r.o.skel;
    for(const n of g.nodes.slice().reverse()){const q=skeletonScreen(r,n);if(Math.hypot(p.sx-q[0],p.sy-q[1])<=12)return {...r,joint:n.id};}
    if(lines)for(const n of g.nodes)if(n.parent!=null){const a=skeletonScreen(r,g.nodes.find(q=>q.id===n.parent)),b=skeletonScreen(r,n),dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((p.sx-a[0])*dx+(p.sy-a[1])*dy)/(dx*dx+dy*dy||1),0,1);if(Math.hypot(p.sx-a[0]-t*dx,p.sy-a[1]-t*dy)<7)return {...r,joint:g.nodes[0].id,line:true};}
  }
  return null;
}
function skeletonTogglePin(ref) {
  const r=skeletonList().find(r=>r.id===ref.id&&r.lid===ref.lid);if(!r||getLayer(r.lid).locked||REC.armed)return;
  const node=r.o.skel.nodes.find(n=>n.id===ref.joint);if(!node)return;
  const on=!node.pin;pushUndo();
  for(const l of layers())for(const key of l.kfs)for(const o of key.objs)if(o.id===r.id&&o.skel){
    const n=o.skel.nodes.find(n=>n.id===node.id);if(!n)continue;
    if(on){const p=mapply(matOf(o.t),n.x,n.y);n.pin=true;n.pinAt={x:p[0],y:p[1]};}
    else {delete n.pin;delete n.pinAt;}
  }
  commit();
}
function skeletonPinRefresh(g,t) {
  const M=matOf(t);for(const n of g.nodes)if(n.pin){const p=mapply(M,n.x,n.y);n.pinAt={x:p[0],y:p[1]};}
}
function skeletonBadgeSchedule(animated) {
  if(!animated||S.playing||document.hidden){clearTimeout(SK.badgeTimer);SK.badgeTimer=0;return;}
  if(!SK.badgeTimer)SK.badgeTimer=setTimeout(()=>{SK.badgeTimer=0;if(!S.playing&&!document.hidden)invalidate();},60);
}
function skeletonDrawPin(ctx,p,alpha=1) {
  ctx.save();ctx.globalAlpha*=alpha;ctx.setLineDash([]);ctx.beginPath();
  ctx.moveTo(p[0]-4,p[1]-5);ctx.lineTo(p[0]+5,p[1]-2);ctx.lineTo(p[0]+1,p[1]);ctx.lineTo(p[0],p[1]+6);ctx.lineTo(p[0]-1,p[1]-1);ctx.closePath();ctx.fillStyle=CSSV.accent;ctx.fill();ctx.strokeStyle=CSSV.panel;ctx.lineWidth=3.5;ctx.stroke();ctx.strokeStyle=CSSV.fg;ctx.lineWidth=1.3;ctx.stroke();ctx.restore();
}

/* Pick a drawing from the chosen node; attaching never moves the artwork. */
/* Slime submenu: soft attachment and per-bone bend falloff. */
function skeletonSoftFigures(r) {
  return layers().filter(l=>l.visible!==false).flatMap(l=>C.evalLayerObjs(l,S.frame).filter(o=>o.skin?.to===r.id&&o.skin.bones.some(b=>b.id===r.joint||b.parent===r.joint)).map(o=>({lid:l.id,o})));
}
/* Editor-only diagnostic view. Colors follow chain IDs, never their current
   stacking order; no temporary paint or order is written to the document. */
const softZonePalette=['#ef796f','#e7b648','#49ba9a','#56a9e4','#ac88e0','#e88bb9','#9bbd55','#d68d52'];
const softZoneSkins=new WeakMap();
function skeletonZoneScope(){return JSON.stringify(S.edit.map(e=>e.sym));}
function skeletonZoneActive(r=null){const target=SK.zoneRig;return !!target&&S.tool==='bone'&&!S.playing&&target.scope===skeletonZoneScope()&&(!r||(r.id===target.id&&r.lid===target.lid));}
function skeletonZoneToggle(r){
  if(skeletonZoneActive(r))SK.zoneRig=null;
  else SK.zoneRig={lid:r.lid,id:r.id,scope:skeletonZoneScope()};
  skeletonMenuSync();invalidate();
}
function skeletonZoneColors(skin){return new Map(C.softGroups(skin).map((g,i)=>{if(i<softZonePalette.length)return [g.id,softZonePalette[i]];const h=(i*137.508)%360/60,c=.385,x=c*(1-Math.abs(h%2-1)),m=.4575,rgb=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];return [g.id,'#'+rgb.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('')];}));}
function skeletonZoneView(o,rig){
  if(!o.skin)return o;let posed=o;
  if(!o._softParts&&o.skin.regions&&o.skin.base.length===1&&o.skin.base[0].closed){let skin=softZoneSkins.get(o.skin);if(!skin){skin={...o.skin,order:C.softOrder(o.skin)};softZoneSkins.set(o.skin,skin);}posed=C.softPoseObject({...o,skin},rig);}
  const colors=skeletonZoneColors(o.skin),groups=C.softGroups(o.skin);
  if(!posed._softParts){if(groups.length!==1)return o;const copy=Object.defineProperties({},Object.getOwnPropertyDescriptors(o));copy.fill=colors.get(groups[0].id);copy.fa=1;copy.grad=null;return copy;}
  // Zone partitions may overlap or cancel differently from the actual body.
  // Mask their colours to the normal fill and redraw the normal ink last.
  let view,base,ink;
  if(o._softParts){view=C.softView(o);base=view.children[0];ink=view.children.slice(1);}
  else{
    const style={...o,t:C.newT(),op:1,blur:0};for(const key of ['skin','arc','ellipseFrame','pivot','bind','sbind'])delete style[key];
    base={...style,stroke:null};ink=[{...style,fill:null,grad:null}];view={id:o.id,kind:'group',t:{...o.t},op:o.op??1,blur:o.blur||0};
  }
  const bounds=C.localBounds(base);if(!bounds)return o;
  const fills=posed._softParts.map(p=>({...base,id:o.id+':zone:'+p.id,contours:p.fill,fill:colors.get(p.id),fa:1,grad:null,stroke:null,nz:true}));
  const rect={...base,id:o.id+':zone:bg',fill:'#d5dbe5',fa:1,grad:null,contours:[{closed:true,nodes:[C.node(bounds.x0-1,bounds.y0-1),C.node(bounds.x1+1,bounds.y0-1),C.node(bounds.x1+1,bounds.y1+1),C.node(bounds.x0-1,bounds.y1+1)]}]};
  const mask={...base,id:o.id+':zone:mask',fill:'#fff',fa:1,grad:null,stroke:null,op:1,blur:0};
  view.children=[{id:o.id+':zones',kind:'group',t:C.newT(),op:1,children:[rect,...fills],mask:[mask]},...ink];
  if(o._mirrorCuts)Object.defineProperty(view,'_mirrorCuts',{value:o._mirrorCuts});return view;
}
function skeletonZoneEntries(entries){
  if(!skeletonZoneActive())return entries;
  const target=SK.zoneRig,rig=entries.find(e=>e.layer.id===target.lid)?.objs.find(o=>o.id===target.id&&o.skel);if(!rig)return entries;
  return entries.map(e=>e.layer.mask||e.layer.visible===false?e:{...e,objs:e.objs.map(o=>o.skin?.to===target.id&&!o.invisMask?skeletonZoneView(o,rig):o)});
}
function skeletonZoneBoneColors(r){
  if(!skeletonZoneActive(r))return new Map();const figure=layers().filter(l=>l.visible!==false&&!l.mask).flatMap(l=>C.evalLayerObjs(l,S.frame).filter(o=>o.skin?.to===r.id&&!o.invisMask).map(o=>({o}))).find(q=>C.softGroups(q.o.skin).length===1||(q.o.skin.regions&&q.o.skin.base.length===1&&q.o.skin.base[0].closed));if(!figure)return new Map();
  const colors=skeletonZoneColors(figure.o.skin),map=new Map();for(const g of C.softGroups(figure.o.skin))for(const id of g.bones)map.set(id,colors.get(g.id));return map;
}

function skeletonSoftBindStart(r) {
  if(skeletonMode(r)!=='edit'||getLayer(r.lid).locked||REC.armed)return;
  SK.softOpen=null;skeletonBindStart(r);if(SK.binding)SK.binding.soft=true;
  toast('Soft body: click one vector figure. Click its attached figure again to detach.');
}
function skeletonSoftOrder(r,delta) {
  if(REC.armed||getLayer(r.lid)?.locked)return;
  const figures=skeletonSoftFigures(r).filter(q=>!getLayer(q.lid).locked&&q.o.skin.regions&&q.o.skin.base.length===1&&q.o.skin.base[0].closed&&C.softGroups(q.o.skin).length>1&&C.softJointGroup(q.o.skin,r.joint));
  if(!figures.length){toast('Overlap order: select a limb of a branched soft body with one closed outer contour.');return;}
  const changes=[];
  for(const q of figures){const s=q.o.skin,order=C.softOrder(s),id=C.softJointGroup(s,r.joint),index=order.indexOf(id),next=clamp(index+delta,0,order.length-1);if(next!==index)[order[index],order[next]]=[order[next],order[index]];if(!s.order||next!==index)changes.push({q,order});}
  if(!changes.length)return;
  pushUndo();
  for(const {q,order} of changes){const l=getLayer(q.lid);if(!C.kfAt(l,S.frame))C.insertKeyframe(l,S.frame,false);const o=findEditable(q.lid,q.o.id);o.skin={...clone(q.o.skin),order};}
  commit();skeletonMenuSync();
}
function skeletonSoftDetachObject(o,pose) {
  if(pose._softParts){const baked=clone(C.softView(pose));for(const k of Object.keys(o))delete o[k];Object.assign(o,baked);}
  else {o.contours=clone(pose.contours);o.t={...pose.t};delete o.skin;}
}

function skeletonSoftAdaptiveToggle(r){
  if(REC.armed||getLayer(r.lid)?.locked)return;
  const figures=skeletonSoftFigures(r).filter(q=>!getLayer(q.lid).locked);if(!figures.length)return;
  const enabled=!figures.every(q=>q.o.skin.adaptive===true);pushUndo();
  for(const q of figures){const l=getLayer(q.lid);if(!C.kfAt(l,S.frame))C.insertKeyframe(l,S.frame,false);const o=findEditable(q.lid,q.o.id);o.skin=clone(q.o.skin);if(enabled)o.skin.adaptive=true;else delete o.skin.adaptive;}
  commit();skeletonMenuSync();toast(enabled?'Experimental adaptive soft contour enabled. Original nodes are preserved.':'Adaptive contour off; original deformation restored.');
}
function skeletonSoftAdjust(r,delta) {
  const figures=skeletonSoftFigures(r).filter(q=>!getLayer(q.lid).locked);if(!figures.length)return;
  const affected=figures.flatMap(q=>q.o.skin.bones.filter(b=>b.id===r.joint||(r.o.skel.nodes.find(n=>n.id===r.joint)?.parent==null&&b.parent===r.joint)));
  if(!affected.some(b=>clamp(b.stiffness+delta,0,1)!==b.stiffness))return;
  pushUndo();
  for(const q of figures){const l=getLayer(q.lid);if(!C.kfAt(l,S.frame))C.insertKeyframe(l,S.frame,false);const o=findEditable(q.lid,q.o.id);o.skin=clone(q.o.skin);for(const b of o.skin.bones)if(b.id===r.joint||(r.o.skel.nodes.find(n=>n.id===r.joint)?.parent==null&&b.parent===r.joint))b.stiffness=clamp(Math.round((b.stiffness+delta)*100)/100,0,1);}
  commit();
}

function skeletonBindStart(ref) {
  const r=skeletonList().find(r=>r.id===ref.id&&r.lid===ref.lid);
  if(!r||skeletonMode(r)!=='edit'||getLayer(r.lid).locked||REC.armed)return;
  SK.binding={lid:r.lid,id:r.id,joint:ref.joint};SK.bindTarget=null;SK.add=false;SK.placeReady=false;SK.angleHover=null;SK.angleEdit=null;
  stage.style.cursor='crosshair';skeletonMenuSync();invalidate();
}
function skeletonBindHover(p) {
  const hit=hitAt(p.w.x,p.w.y,5),candidate=hit&&!hit.o.skel&&!hit.o.rig?{lid:hit.lid,id:hit.id}:null;
  if(candidate?.id!==SK.bindTarget?.id||candidate?.lid!==SK.bindTarget?.lid){SK.bindTarget=candidate;invalidate();}
  stage.style.cursor=candidate?'pointer':'crosshair';
}
function skeletonBindPick(p) {
  const ref=SK.binding,r=skeletonList().find(r=>r.id===ref?.id&&r.lid===ref.lid);
  if(!r||skeletonMode(r)!=='edit'||getLayer(r.lid).locked||REC.armed){SK.binding=false;SK.bindTarget=null;invalidate();return;}
  const hit=hitAt(p.w.x,p.w.y,5);
  if(!hit||hit.o.skel||hit.o.rig){SK.binding=false;SK.bindTarget=null;skeletonMenuSync();invalidate();return;}
  if(ref.soft){
    if(hit.o.kind!=='path'||hit.o.rig||hit.o.skel||getLayer(hit.lid).locked){toast('Choose an unlocked vector figure.');return;}
    const detach=hit.o.skin?.to===r.id,skin=detach?null:C.softBind(hit.o,r.o);
    if(!detach&&!skin){
      const nodes=r.o.skel.nodes,branched=nodes.some(n=>nodes.filter(q=>q.parent===n.id).length>1),count=hit.o.contours.reduce((n,c)=>n+c.nodes.length,0);
      const reason=count>512?'Soft body: the figure has '+count+' nodes; simplify it to 512 or fewer.':nodes.length<2?'Soft body: add at least one bone first.':nodes.some(n=>n.parent!=null&&Math.hypot(n.x-nodes.find(p=>p.id===n.parent).x,n.y-nodes.find(p=>p.id===n.parent).y)<1e-5)?'Soft body: two connected joints overlap. Move them apart in Edit.':branched&&(!hit.o.fill||hit.o.contours.some(c=>!c.closed))?'Soft body: a branched skeleton needs one closed, filled vector figure.':'Soft body: could not map the figure. Place bones inside each filled body part, with limbs apart in the starting pose.';
      SK.binding=false;SK.bindTarget=null;stage.style.cursor='default';skeletonMenuSync();invalidate();toast(reason);return;
    }
    pushUndo();const l=getLayer(hit.lid);if(!C.kfAt(l,S.frame))C.insertKeyframe(l,S.frame,false);const o=findEditable(hit.lid,hit.id);
    o.contours=clone(hit.o.contours);o.t={...hit.o.t};delete o.sbind;delete o.bind;delete o.star;delete o.arc;delete o.ellipseFrame;
    if(detach)skeletonSoftDetachObject(o,hit.o);else{o.skin=skin;o.contours=clone(skin.base);}
    SK.binding=false;SK.bindTarget=null;SK.active=r.id;SK.hover={lid:r.lid,id:r.id,joint:ref.joint};SK.softOpen=r.id+':'+ref.joint;SK.dismissed=null;S.sel=[{lid:r.lid,id:r.id}];S.layerId=r.lid;commit();toast(detach?'Soft body detached; current shape kept.':'Soft body attached. Switch to Animate and bend the skeleton.');return;
  }
  const pose=clone(hit.o),detach=pose.sbind?.node===true&&pose.sbind.to===r.id&&pose.sbind.joint===ref.joint;
  pushUndo();C.ensureEditable(getLayer(hit.lid),S.frame);const o=findEditable(hit.lid,hit.id);
  o.t={...pose.t};if(pose.skin)skeletonSoftDetachObject(o,pose);delete o.skin;delete o.bind;
  if(detach)delete o.sbind;else o.sbind=C.skeletonOffsets(pose,r.o,ref.joint,true);
  SK.binding=false;SK.bindTarget=null;SK.active=r.id;SK.joint=ref.joint;
  S.sel=[{lid:r.lid,id:r.id}];S.layerId=r.lid;
  SK.hover={lid:r.lid,id:r.id,joint:ref.joint};SK.dismissed=null;
  commit();toast(detach?'Drawing detached; its position is unchanged.':'Drawing attached to this joint; its position is unchanged.');
}
function skeletonBindings() {
  const attached=new Set();
  for(const l of layers())for(const o of C.evalLayerObjs(l,S.frame)){if(o.sbind?.node===true)attached.add(o.sbind.to+':'+o.sbind.joint);if(o.skin)for(const b of o.skin.bones){attached.add(o.skin.to+':'+b.id);attached.add(o.skin.to+':'+b.parent);}}
  return attached;
}
function skeletonDrawAttach(ctx,p,alpha=1) {
  ctx.save();ctx.globalAlpha*=alpha;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(p[0],p[1]-6);ctx.lineTo(p[0]+6,p[1]);ctx.lineTo(p[0],p[1]+6);ctx.lineTo(p[0]-6,p[1]);ctx.closePath();ctx.fillStyle=CSSV.accent;ctx.fill();ctx.strokeStyle=CSSV.panel;ctx.lineWidth=3.5;ctx.stroke();ctx.strokeStyle=CSSV.fg;ctx.lineWidth=1.2;ctx.stroke();ctx.beginPath();ctx.moveTo(p[0]-2,p[1]-2);ctx.lineTo(p[0]+3,p[1]-2);ctx.lineTo(p[0]+3,p[1]+3);ctx.stroke();ctx.restore();
}
function skeletonBindDraw(ctx) {
  if(!SK.binding)return;
  const ref=SK.binding,r=skeletonList().find(r=>r.id===ref.id&&r.lid===ref.lid),n=r?.o.skel.nodes.find(n=>n.id===ref.joint);
  if(n){const p=skeletonScreen(r,n);ctx.save();ctx.setLineDash([]);ctx.beginPath();ctx.arc(p[0],p[1],14,0,Math.PI*2);ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle=CSSV.accent;ctx.lineWidth=2.5;ctx.stroke();ctx.restore();}
  const target=SK.bindTarget&&findEval(SK.bindTarget.lid,SK.bindTarget.id);if(!target)return;
  const corners=worldCorners(target);if(!corners)return;
  ctx.save();ctx.transform(S.view.z,0,0,S.view.z,S.view.px,S.view.py);C.drawObj(ctx,target,{tint:{c:CSSV.accent,a:.38}});ctx.restore();
  ctx.save();ctx.setLineDash([5,3]);ctx.beginPath();corners.forEach((p,i)=>{const q=w2s(p[0],p[1]);if(i)ctx.lineTo(q[0],q[1]);else ctx.moveTo(q[0],q[1]);});ctx.closePath();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=CSSV.accent;ctx.lineWidth=1.8;ctx.stroke();ctx.restore();
}

function skeletonRigidStart(ref) {
  const r=skeletonList().find(r=>r.id===ref.id&&r.lid===ref.lid);if(!r||skeletonMode(r)!=='edit'||REC.armed||getLayer(r.lid).locked)return;
  if(SK.rigidPick){skeletonRigidFinish();return;}
  const group=C.skeletonRigidGroups(r.o.skel).find(g=>g.points.some(p=>p.id===ref.joint));
  SK.rigidPick={lid:r.lid,id:r.id,joint:ref.joint,group:group?.id||null,selected:group?group.points.map(p=>p.id):[ref.joint]};
  SK.placeReady=false;SK.binding=false;SK.bindTarget=null;SK.add=false;SK.angleHover=null;SK.angleEdit=null;invalidate();skeletonMenuSync();
}
function skeletonRigidPick(p) {
  const pick=SK.rigidPick,hit=skeletonHit(p);
  if(!hit||hit.id!==pick.id||hit.lid!==pick.lid){SK.rigidPick=null;invalidate();skeletonMenuSync();return;}
  const at=pick.selected.indexOf(hit.joint);
  if(at>=0)pick.selected.splice(at,1);
  else {
    pick.selected.push(hit.joint);
    for(const group of C.skeletonRigidGroups(hit.o.skel))if(group.id!==pick.group&&group.points.some(n=>n.id===hit.joint))for(const n of group.points)if(!pick.selected.includes(n.id))pick.selected.push(n.id);
  }
  SK.hover={lid:hit.lid,id:hit.id,joint:hit.joint};invalidate();skeletonMenuSync();
}
function skeletonRigidFinish() {
  const pick=SK.rigidPick,r=pick&&skeletonList().find(r=>r.id===pick.id&&r.lid===pick.lid);if(!r||REC.armed||getLayer(r.lid).locked){SK.rigidPick=null;return;}
  const selected=new Set(pick.selected);
  if(selected.size<2&&!pick.group){SK.rigidPick=null;invalidate();skeletonMenuSync();return;}
  pushUndo();
  for(const l of layers())for(const key of l.kfs)for(const o of key.objs)if(o.id===r.id&&o.skel){
    const old=C.skeletonRigidGroups(o.skel),keep=old.filter(g=>g.id!==pick.group&&!g.points.some(p=>selected.has(p.id))),nodes=o.skel.nodes.filter(n=>selected.has(n.id));
    if(nodes.length>=2)keep.push({id:pick.group||pick.newId||(pick.newId=uid()),points:nodes.map(n=>({id:n.id,x:n.x,y:n.y}))});
    o.skel.rigids=keep;
  }
  SK.rigidPick=null;commit();
}
function skeletonRigidRefresh(g) {
  const byId=new Map(g.nodes.map(n=>[n.id,n]));
  for(const group of C.skeletonRigidGroups(g))group.points=group.points.map(p=>{const n=byId.get(p.id);return {id:n.id,x:n.x,y:n.y};});
}
function skeletonDrawRigidBadge(ctx,p,alpha=1) {
  ctx.save();ctx.globalAlpha*=alpha;ctx.setLineDash([]);ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6,x=p[0]+Math.cos(a)*6,y=p[1]+Math.sin(a)*6;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();ctx.fillStyle=CSSV.accent;ctx.fill();ctx.strokeStyle=CSSV.panel;ctx.lineWidth=3.5;ctx.stroke();ctx.strokeStyle=CSSV.fg;ctx.lineWidth=1.3;ctx.stroke();ctx.beginPath();ctx.arc(p[0],p[1],2,0,Math.PI*2);ctx.fillStyle=CSSV.panel;ctx.fill();ctx.stroke();ctx.restore();
}
function skeletonDrawRigid(ctx,r) {
  const pick=SK.rigidPick?.id===r.id?SK.rigidPick:null,g=r.o.skel,byId=new Map(g.nodes.map(n=>[n.id,n]));
  const groups=pick?[{points:pick.selected.map(id=>({id}))}]:C.skeletonRigidGroups(g);
  ctx.save();ctx.setLineDash([3,5]);ctx.strokeStyle=CSSV.accent;ctx.lineWidth=1.4;
  for(const group of groups){
    // A small group shows its closing edges, making a fixed triangle explicit.
    const points=group.points.filter(p=>byId.has(p.id));
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){const a=byId.get(points[i].id),b=byId.get(points[j].id);if(!pick&&(a.parent===b.id||b.parent===a.id))continue;const p=skeletonScreen(r,a),q=skeletonScreen(r,b);ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.stroke();}
    if(pick)for(const p of points){const q=skeletonScreen(r,byId.get(p.id));ctx.beginPath();ctx.arc(q[0],q[1],14,0,Math.PI*2);ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=CSSV.accent;ctx.lineWidth=2;ctx.stroke();}
  }
  ctx.restore();
}

function skeletonPoseStore(r,create=false){
  const key=r.id;let all=S.doc.bonePoses;
  if(!all&&create)all=S.doc.bonePoses={};
  if(!all)return null;
  if(!Object.hasOwn(all,key)&&create)all[key]={base:null,poses:[]};
  return Object.hasOwn(all,key)?all[key]:null;
}
function skeletonPoseSnapshot(g){return g.nodes.map(n=>({id:n.id,parent:n.parent,x:n.x,y:n.y}));}
function skeletonPoseBase(r){const store=skeletonPoseStore(r,true);store.base=skeletonPoseSnapshot(r.o.skel);}
function skeletonPoseSave(r){
  const live=skeletonList().find(q=>q.id===r.id&&q.lid===r.lid);if(!live||REC.armed||getLayer(r.lid).locked)return;
  pushUndo();const store=skeletonPoseStore(live,true);if(!store.base)store.base=skeletonPoseSnapshot(live.o.skel);store.poses.push({id:uid(),nodes:skeletonPoseSnapshot(live.o.skel)});commit();if(!$('#bonePoseGallery').hidden)skeletonPoseGallery(live);toast('Pose '+store.poses.length+' saved.');
}
function skeletonPoseApply(r,pose){
  const live=skeletonList().find(q=>q.id===r.id&&q.lid===r.lid);if(!live||REC.armed||getLayer(r.lid).locked)return;
  const g=clone(live.o.skel),saved=new Map((pose.nodes||[]).map(n=>[n.id,n]));
  if(saved.size!==g.nodes.length||g.nodes.some(n=>!saved.has(n.id)||saved.get(n.id).parent!==n.parent)){toast('This pose belongs to a different skeleton structure.');return;}
  for(const n of g.nodes){const p=saved.get(n.id);n.x=p.x;n.y=p.y;}
  const pins=C.skeletonPinTargets(g,matOf(live.o.t));
  if(pins.size){const [id,at]=pins.entries().next().value,n=g.nodes.find(n=>n.id===id),dx=at.x-n.x,dy=at.y-n.y;for(const q of g.nodes){q.x+=dx;q.y+=dy;}
    const driver=g.nodes.filter(n=>!pins.has(n.id)).sort((a,b)=>Math.hypot(b.x-n.x,b.y-n.y)-Math.hypot(a.x-n.x,a.y-n.y))[0];
    if(driver){if(C.skeletonRigidGroups(g).length)C.skeletonPoseRigid(g,driver.id,driver.x,driver.y,pins);else C.skeletonPosePinned(g,driver.id,driver.x,driver.y,pins);}
  }
  if(!C.skeletonPinsValid(g,pins)||!C.skeletonRigidValid(g)){toast('This pose conflicts with the current bone lengths, pins or angle limits.');return;}
  pushUndo();const layer=getLayer(live.lid),key=C.kfAt(layer,S.frame)||C.insertKeyframe(layer,S.frame,false),o=key.objs.find(o=>o.id===live.id);if(!o)return;
  const byId=new Map(g.nodes.map(n=>[n.id,n]));for(const n of o.skel.nodes){const q=byId.get(n.id);n.x=q.x;n.y=q.y;}C.skeletonBuild(o);S.sel=[{lid:live.lid,id:live.id}];commit();
}
function skeletonPoseThumb(pose){
  const nodes=pose.nodes||[],byId=new Map(nodes.map(n=>[n.id,n]));if(!nodes.length)return '';
  const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(1,Math.max(...xs)-x),h=Math.max(1,Math.max(...ys)-y),scale=62/Math.max(w,h),at=n=>[11+(62-w*scale)/2+(n.x-x)*scale,11+(62-h*scale)/2+(n.y-y)*scale];
  let svg='<svg viewBox="0 0 84 84" aria-hidden="true" style="width:84px;height:84px;pointer-events:none">';
  for(const n of nodes){const a=byId.get(n.parent);if(a){const p=at(a),q=at(n);svg+='<path d="M'+p.join(' ')+'L'+q.join(' ')+'" stroke="currentColor" stroke-width="2" fill="none"/>';}}
  for(const n of nodes){const p=at(n);svg+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="2.5" fill="currentColor"/>';}
  return svg+'</svg>';
}
function skeletonPoseGallery(r){
  SK.galleryRef={id:r.id,lid:r.lid};
  const pop=$('#bonePoseGallery'),store=skeletonPoseStore(r);pop.replaceChildren();
  const poses=store?.poses||[];
  if(!poses.length){const p=document.createElement('span');p.textContent='No poses yet. Use the camera to save one.';pop.append(p);}
  poses.forEach((pose,i)=>{const tile=document.createElement('div');tile.className='bone-pose-tile';const apply=document.createElement('button');apply.type='button';apply.className='bone-pose-image';apply.title='Apply pose '+(i+1);apply.setAttribute('aria-label',apply.title);apply.innerHTML=skeletonPoseThumb(pose);const number=document.createElement('span');number.className='bone-pose-number';number.textContent=i+1;apply.append(number);apply.addEventListener('click',()=>{skeletonPoseApply(r,pose);pop.hidden=true;});const del=document.createElement('button');del.type='button';del.className='bone-pose-delete';del.textContent='×';del.title='Delete pose '+(i+1);del.setAttribute('aria-label',del.title);del.addEventListener('click',e=>{e.stopPropagation();const current=skeletonPoseStore(r);if(!current)return;pushUndo();current.poses=current.poses.filter(p=>p.id!==pose.id);commit();skeletonPoseGallery(r);});tile.append(apply,del);pop.append(tile);});
  const menu=$('#boneMenu'),x=parseFloat(menu.style.left)||0,y=parseFloat(menu.style.top)||0;pop.style.left=(x+362<stageW?x+82:Math.max(4,x-410))+'px';pop.style.top=Math.max(4,Math.min(stageH-210,y))+'px';pop.hidden=false;
}

function skeletonMenuSync() {
  skeletonAngleMenuSync();
  const menu=$('#boneMenu');if(!menu)return;
  const r=skeletonHoverRig();
  menu.hidden=!r||SK.shiftHeld||!!SK.binding||!!SK.angleHover||!!SK.angleEdit||S.tool!=='bone'||S.playing||!!S.drag||!!SK.add||!!SK.actionDrag||skeletonKey(r)===SK.dismissed;
  if(menu.hidden)return;
  const n=r.o.skel.nodes.find(n=>n.id===r.joint),p=skeletonScreen(r,n),degree=(n.parent==null?0:1)+r.o.skel.nodes.filter(q=>q.parent===n.id).length;
  menu.style.left=p[0]+'px';menu.style.top=p[1]+'px';
  const editing=skeletonMode(r)==='edit',toggle=$('#boneMode');
  const choosing=!!SK.rigidPick;
  const poseOpen=SK.poseOpen===r.id+':'+r.joint;
  $('#bonePose').hidden=choosing;$('#bonePhoto').hidden=choosing||!poseOpen;$('#boneLibrary').hidden=choosing||!poseOpen;
  $('#boneSoft').hidden=choosing;
  const attachedSoft=skeletonSoftFigures(r);
  $('#boneSoft').setAttribute('aria-pressed',String(attachedSoft.length>0));
  const softOpen=SK.softOpen===r.id+':'+r.joint;
  $('#boneSoft').setAttribute('aria-expanded',String(softOpen));
  $('#bonePose').setAttribute('aria-pressed',String(poseOpen));
  $('#boneSoftBind').setAttribute('aria-pressed',String(attachedSoft.length>0));
  $('#boneAttach').setAttribute('aria-pressed',String(skeletonBindings().has(r.id+':'+r.joint)));
  $('#boneSoftBind').hidden=choosing||!softOpen||!editing;
  const orderedFigures=softOpen?skeletonSoftFigures(r).filter(q=>!getLayer(q.lid).locked&&q.o.skin.regions&&q.o.skin.base.length===1&&q.o.skin.base[0].closed&&C.softGroups(q.o.skin).length>1&&C.softJointGroup(q.o.skin,r.joint)):[];
  for(const id of ['boneSoftUp','boneSoftDown']){const b=$('#'+id);b.hidden=choosing||!softOpen;b.dataset.available=String(orderedFigures.length>0);b.title=(id==='boneSoftUp'?'Bring this body part forward':'Send this body part backward')+(orderedFigures.length?' — saved on this keyframe':' — needs a branched soft body with one outer contour');}
  const softFigures=softOpen?attachedSoft:[];
  const adaptive=$('#boneSoftAdaptive');adaptive.hidden=choosing||!softOpen;adaptive.dataset.available=String(softFigures.some(q=>!getLayer(q.lid).locked));adaptive.setAttribute('aria-pressed',String(softFigures.length>0&&softFigures.every(q=>q.o.skin.adaptive===true)));
  const zones=$('#boneSoftZones'),zoneOn=skeletonZoneActive(r),zoneAvailable=softFigures.filter(q=>!getLayer(q.lid).mask&&!q.o.invisMask).some(q=>C.softGroups(q.o.skin).length===1||(q.o.skin.regions&&q.o.skin.base.length===1&&q.o.skin.base[0].closed));
  zones.hidden=choosing||!softOpen;zones.dataset.available=String(zoneAvailable||zoneOn);zones.setAttribute('aria-pressed',String(zoneOn));zones.setAttribute('aria-label',zoneOn?'Hide influence zones':'Show influence zones');zones.title=zoneOn?'Hide influence zones':zoneAvailable?'Show matching body/bone colors (editor only)':'Attach a soft body with one outer contour, or one unbranched chain, to show its zones';
  for(const [id,sign] of [['boneSoftPlus',1],['boneSoftMinus',-1]]){const b=$('#'+id);b.hidden=choosing||!softOpen;const values=softFigures.flatMap(q=>q.o.skin.bones.filter(b=>b.id===r.joint||(n.parent==null&&b.parent===r.joint)).map(b=>b.stiffness));b.dataset.available=String(values.length>0&&values.some(v=>sign>0?v<1:v>0));b.title=(sign>0?'Stiffer':'Softer')+' bend'+(values.length?' ('+Math.round(values[0]*100)+'%)':' — attach a soft body first');}
  $('#boneRigid').hidden=!editing;
  $('#boneRigid').setAttribute('aria-label',choosing?'Confirm fixed joints':'Fix joints together');
  $('#boneRigid').title=choosing?'Click joints to select or remove them, including the first joint. Click this icon again to confirm. Fewer than two joints removes the group.':'Fix joints together: select joints, then click this icon again.';
  $('#boneRigid').setAttribute('aria-pressed',String(choosing||C.skeletonRigidGroups(r.o.skel).some(g=>g.points.some(p=>p.id===r.joint))));
  toggle.hidden=choosing;$('#bonePin').hidden=choosing;
  $('#boneAttach').hidden=!editing||choosing;
  $('#boneAdd').hidden=!editing||choosing;$('#boneRemove').hidden=!editing||choosing||degree>1;
  const pinned=!!n.pin,pin=$('#bonePin');pin.setAttribute('aria-pressed',String(pinned));pin.setAttribute('aria-label',pinned?'Release pinned joint':'Pin joint in place');pin.title=pinned?'Release this joint.':'Pin this joint in Animate. Edit can still reposition it.';
  const target=editing?'Animate':'Edit';
  toggle.setAttribute('aria-label','Switch to '+target);toggle.title='Switch to '+target+' for this skeleton. Drag away to hide the menu.';
  if(toggle.dataset.mode!==target){
    toggle.dataset.mode=target;
    toggle.innerHTML=editing
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9 12 3 20 9 16 21 14 10 10 10 8 21Z" fill="var(--panel)" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 15 10-11 5 5-11 10-6 2Z" fill="var(--panel)" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m12 7 5 5M5 15l4 4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  }
  const orbit=['boneMode','boneRigid','boneRemove','boneAttach','bonePin','bonePose','boneSoft','boneAdd'].map(id=>$('#'+id)).filter(b=>!b.hidden);
  orbit.forEach((b,i)=>{const a=i*Math.PI*2/orbit.length;b.style.left=(Math.sin(a)*52)+'px';b.style.top=(-Math.cos(a)*52)+'px';});
  const pose=$('#bonePose'),x=parseFloat(pose.style.left)||0,y=parseFloat(pose.style.top)||0;
  for(const [id,dy] of [['bonePhoto',-19],['boneLibrary',19]]){const b=$('#'+id);b.style.left=(x-46)+'px';b.style.top=(y+dy)+'px';}
  const slime=$('#boneSoft'),sx=parseFloat(slime.style.left)||0,sy=parseFloat(slime.style.top)||0;
  const sl=Math.hypot(sx,sy)||1,ux=sx/sl,uy=sy/sl;
  for(const [id,side] of [['boneSoftBind',0],['boneSoftMinus',-34],['boneSoftPlus',34]]){const b=$('#'+id);b.style.left=(sx+38*ux-side*uy)+'px';b.style.top=(sy+38*uy+side*ux)+'px';}
  for(const [id,offset] of [['boneSoftUp',-34],['boneSoftZones',0],['boneSoftDown',34]]){const side=offset*(ux<0?-1:1),b=$('#'+id);b.style.left=(sx+70*ux-side*uy)+'px';b.style.top=(sy+70*uy+side*ux)+'px';}
  {const b=$('#boneSoftAdaptive');b.style.left=(sx+102*ux)+'px';b.style.top=(sy+102*uy)+'px';}
  for(const b of menu.querySelectorAll('button'))b.disabled=REC.armed||(b.id.startsWith('boneSoft')&&b.dataset.available==='false');
}
function skeletonPanel(){document.body.classList.toggle('skel-selected',!!singleSel()?.o.skel);skeletonMenuSync();}
function skeletonAimClear(){clearTimeout(SK.menuAimTimer);SK.menuAimTimer=0;SK.menuAimCandidate=null;}
function skeletonAimWait(p,r){
  const hit=skeletonHit(p),angle=!hit&&skeletonAngleHit(p),candidate=hit&&skeletonKey(hit)!==skeletonKey(r)?'joint:'+skeletonKey(hit):angle?'angle:'+skeletonAngleKey(angle):null;
  if(!candidate){skeletonAimClear();return;}
  if(SK.menuAimCandidate===candidate)return;
  skeletonAimClear();SK.menuAimCandidate=candidate;const source=skeletonKey(r),pointer={...p};
  SK.menuAimTimer=setTimeout(()=>{SK.menuAimTimer=0;SK.menuAimCandidate=null;if(S.tool!=='bone'||S.playing||S.drag||SK.actionDrag||SK.add||SK.binding||SK.rigidPick||SK.ctrlHeld||SK.shiftHeld||document.hidden)return;const current=skeletonHoverRig(),now=skeletonHit(pointer),edge=!now&&skeletonAngleHit(pointer),key=now?'joint:'+skeletonKey(now):edge?'angle:'+skeletonAngleKey(edge):null;if(skeletonKey(current)===source&&key===candidate)skeletonHoverAt(pointer,false,true);},450);
}
function skeletonMenuAim(p,r){
  const menu=$('#boneMenu');if(SK.shiftHeld||menu.hidden||!r||skeletonKey(r)===SK.dismissed)return false;
  const n=r.o.skel.nodes.find(n=>n.id===r.joint),origin=skeletonScreen(r,n);
  for(const button of menu.querySelectorAll('button')){
    if(button.hidden||button.disabled)continue;const dx=parseFloat(button.style.left)||0,dy=parseFloat(button.style.top)||0,length=dx*dx+dy*dy;
    const t=length?clamp(((p.sx-origin[0])*dx+(p.sy-origin[1])*dy)/length,0,1):0;
    if(Math.hypot(p.sx-origin[0]-t*dx,p.sy-origin[1]-t*dy)<=18)return true;
  }
  return false;
}
function skeletonHudModifiers(ctrl,shift){
  skeletonAimClear();SK.ctrlHeld=ctrl;SK.shiftHeld=shift;document.body.classList.toggle('bone-hud-hidden',shift);
  if(!ctrl)SK.menuLock=null;
  else if(!SK.menuLock&&S.tool==='bone'&&!SK.rigidPick&&!SK.binding&&!SK.add){const r=skeletonHoverRig();if(r&&!$('#boneMenu').hidden)SK.menuLock={lid:r.lid,id:r.id,joint:r.joint};}
  if(shift&&SK.actionDrag)SK.actionDrag.dismissed=true;
  skeletonMenuSync();
}
function skeletonHoverAt(p,keepNodeMenu=false,allowRetarget=false) {
  if(SK.rigidPick){const hit=skeletonHit(p),pick=SK.rigidPick;if(hit?.id===pick.id&&hit.lid===pick.lid)SK.hover={lid:hit.lid,id:hit.id,joint:hit.joint};else {const r=skeletonHoverRig(),n=r?.o.skel.nodes.find(n=>n.id===r.joint),q=n&&skeletonScreen(r,n);if(q&&Math.hypot(p.sx-q[0],p.sy-q[1])>BONE_MENU_REACH)SK.hover=null;}skeletonMenuSync();return;}
  if(SK.binding){skeletonBindHover(p);skeletonMenuSync();return;}
  if(S.tool!=='bone'||S.playing||S.drag||SK.add||SK.actionDrag){skeletonMenuSync();return;}
  if(SK.placeReady&&skeletonHit(p,true))SK.placeReady=false;
  let current=skeletonHoverRig();
  if(SK.ctrlHeld&&SK.menuLock){const live=skeletonList().find(r=>r.id===SK.menuLock.id&&r.lid===SK.menuLock.lid&&r.o.skel.nodes.some(n=>n.id===SK.menuLock.joint));if(live){SK.hover={...SK.menuLock};SK.angleHover=null;skeletonMenuSync();return;}SK.menuLock=null;}
  if(!allowRetarget&&!SK.shiftHeld&&current&&(keepNodeMenu||skeletonMenuAim(p,current))){if(keepNodeMenu)skeletonAimClear();else skeletonAimWait(p,current);SK.angleHover=null;skeletonMenuSync();return;}
  skeletonAimClear();const hit=skeletonHit(p);
  if(keepNodeMenu){SK.angleHover=null;skeletonAngleMenuSync();}else skeletonAngleHover(p,hit);
  stage.style.cursor=hit?'grab':SK.placeReady?'crosshair':'default';
  if(hit){if(skeletonKey(hit)!==SK.dismissed)SK.dismissed=null;SK.hover={lid:hit.lid,id:hit.id,joint:hit.joint};if(SK.ctrlHeld)SK.menuLock={...SK.hover};}
  else if(current){const n=current.o.skel.nodes.find(n=>n.id===current.joint),q=skeletonScreen(current,n);if(Math.hypot(p.sx-q[0],p.sy-q[1])>BONE_MENU_REACH)SK.hover=null;}
  skeletonMenuSync();
}
function skeletonInsert(w) {
  if(!SK.placeReady||!canDraw()||REC.armed)return;
  const rawLength=clamp(S.doc.w*.15,40,100),length=GRID.visible&&GRID.snap?Math.max(gridStep(),Math.round(rawLength/gridStep())*gridStep()):rawLength,a={id:uid(),name:'Joint 1',parent:null,x:0,y:0,rx:0,ry:0};
  const b={id:uid(),name:'Joint 2',parent:a.id,x:length,y:0,rx:length,ry:0};
  const o=C.mkPath([],{fill:null,stroke:null,sw:0},{x:w.x,y:w.y});o.skel={version:2,name:'Skeleton',mode:'edit',nodes:[a,b]};C.skeletonBuild(o);
  if(addObject(o)){SK.placeReady=false;SK.active=o.id;SK.joint=a.id;SK.dismissed=null;SK.hover={lid:S.layerId,id:o.id,joint:a.id};skeletonMenuSync();}
}
function skeletonAppend(w) {
  const ref=SK.add,r=skeletonList().find(r=>r.id===ref?.id&&r.lid===ref.lid);if(!r||getLayer(r.lid).locked||skeletonMode(r)!=='edit'){SK.add=false;return;}
  const p=r.o.skel.nodes.find(n=>n.id===ref.joint),xy=mapply(minv(matOf(r.o.t)),w.x,w.y);
  if(!p||Math.hypot(xy[0]-p.x,xy[1]-p.y)*S.view.z<8)return;
  if(r.o.skel.nodes.length>=256){toast('A skeleton can have up to 256 joints.');return;}
  pushUndo();C.ensureEditable(getLayer(r.lid),S.frame);const o=findEditable(r.lid,r.id),parent=o.skel.nodes.find(n=>n.id===p.id);
  const n={id:uid(),name:'Joint '+(o.skel.nodes.length+1),parent:parent.id,x:xy[0],y:xy[1],rx:parent.rx+xy[0]-parent.x,ry:parent.ry+xy[1]-parent.y};
  o.skel.nodes.push(n);C.skeletonBuild(o);SK.add=false;SK.joint=n.id;SK.hover={lid:r.lid,id:r.id,joint:n.id};SK.dismissed=null;S.sel=[{lid:r.lid,id:r.id}];commit();
}
function skeletonRemove(r) {
  const n=r.o.skel.nodes.find(n=>n.id===r.joint),kids=r.o.skel.nodes.filter(q=>q.parent===n?.id);
  if(!n||(n.parent!=null&&kids.length)||kids.length>1||getLayer(r.lid).locked||REC.armed||skeletonMode(r)!=='edit')return;
  pushUndo();
  const detached=new Set([n.id,...(n.parent==null?kids.map(q=>q.id):[])]);
  for(const l of layers()) {
    const poses=C.evalLayerObjs(l,S.frame).filter(o=>(o.sbind?.to===r.id&&detached.has(o.sbind.joint))||(o.skin?.to===r.id&&o.skin.bones.some(b=>detached.has(b.id)||detached.has(b.parent))));if(!poses.length)continue;
    const key=C.ensureEditable(l,S.frame);for(const pose of poses){const o=key.objs.find(o=>o.id===pose.id);if(o){o.t={...pose.t};if(o.skin)skeletonSoftDetachObject(o,pose);delete o.sbind;}}
  }
  const key=C.ensureEditable(getLayer(r.lid),S.frame),o=key.objs.find(o=>o.id===r.id);
  o.skel.nodes=o.skel.nodes.filter(q=>q.id!==n.id);
  if(!o.skel.nodes.length){key.objs=key.objs.filter(q=>q.id!==r.id);S.sel=[];}
  else {if(n.parent==null)o.skel.nodes[0].parent=null;C.skeletonBuild(o);}
  SK.hover=null;SK.dismissed=null;commit();
}
function skeletonDown(e,p) {
  skeletonAimClear();
  if(SK.rigidPick){skeletonRigidPick(p);return;}
  if(SK.binding){skeletonBindPick(p);return;}
  if(SK.add){skeletonAppend(gridPoint(p.w));return;}
  const r=skeletonHit(p,true);
  if((e.ctrlKey||e.metaKey)&&SK.menuLock&&(!r||r.id!==SK.menuLock.id||r.lid!==SK.menuLock.lid||r.joint!==SK.menuLock.joint))return;
  if(!r){skeletonInsert(gridPoint(p.w));return;}
  SK.placeReady=false;SK.dismissed=null;SK.active=r.id;SK.joint=r.joint;SK.hover={lid:r.lid,id:r.id,joint:r.joint};
  S.sel=[{lid:r.lid,id:r.id}];selectLayer(r.lid,true);
  const n=r.o.skel.nodes.find(n=>n.id===r.joint),q=mapply(matOf(r.o.t),n.x,n.y);
  S.drag={type:skeletonMode(r)==='pose'&&n.pin?'pinned-joint':'skeleton',lid:r.lid,id:r.id,joint:r.joint,start:p.w,started:false,mode:skeletonMode(r),line:!!r.line,controlOffset:{x:q[0]-p.w.x,y:q[1]-p.w.y}};
  stage.style.cursor='grabbing';
  refreshProps();
}
function boneDown(e,p){if(!skeletonAngleDown(p))skeletonDown(e,p);}
function skeletonMoveSubtree(g,id,dx,dy,except=new Set()) {
  const ids=skeletonDesc(g,id);for(const n of g.nodes)if(ids.has(n.id)&&!except.has(n.id)){n.x+=dx;n.y+=dy;}
}
function skeletonPose(g,id,x,y) {
  const byId=new Map(g.nodes.map(n=>[n.id,n])),target=byId.get(id);if(!target)return;
  const original=new Map(g.nodes.map(n=>[n.id,{x:n.x,y:n.y}]));
  if(target.parent==null) {
    const dx=x-target.x,dy=y-target.y;
    for(const n of g.nodes){n.x+=dx;n.y+=dy;}
    // Pinned tips stay in place while the body moves.
    for(const n of g.nodes)if(n.pin&&n.parent!=null){const p=original.get(n.id);skeletonSolveChain(g,n.id,p.x,p.y);}
    return;
  }
  if(target.pin)return;
  skeletonSolveChain(g,id,x,y);
}
function skeletonSolveChain(g,id,x,y) {
  const chain=skeletonChain(g,id);if(chain.length<2)return;
  const before=new Map(g.nodes.map(n=>[n.id,{x:n.x,y:n.y}])),owned=new Set(chain.map(n=>n.id));
  const points=chain.map(n=>({x:n.x,y:n.y})),lengths=chain.slice(1).map((n,i)=>Math.max(.01,Math.hypot(n.rx-chain[i].rx,n.ry-chain[i].ry))),root={...points[0]};
  const place=(a,b,len)=>{let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<1e-7){dx=1;dy=0;d=1;}return {x:a.x+dx*len/d,y:a.y+dy*len/d};};
  const forward=i=>{
    const p=place(points[i-1],points[i],lengths[i-1]);
    if(i>=2){const a=points[i-1],r=points[i-2],ref=Math.atan2(r.y-a.y,r.x-a.x),angle=C.skeletonLimitDirection(g,chain[i-1].id,chain[i-2].id,chain[i].id,ref,Math.atan2(p.y-a.y,p.x-a.x));p.x=a.x+Math.cos(angle)*lengths[i-1];p.y=a.y+Math.sin(angle)*lengths[i-1];}
    points[i]=p;
  };
  const total=lengths.reduce((a,b)=>a+b,0);
  const elbowLimit=chain.length===3?C.skeletonJointLimit(g,chain[1].id):null;
  if(elbowLimit) {
    const [l1,l2]=lengths,distance=Math.hypot(x-root.x,y-root.y),direction=distance>1e-8?Math.atan2(y-root.y,x-root.x):Math.atan2(points[2].y-root.y,points[2].x-root.x);
    const theta=Math.acos(clamp((l1*l1+l2*l2-distance*distance)/(2*l1*l2),-1,1)),sign=elbowLimit.bone===chain[2].id?1:-1,center=(elbowLimit.min+elbowLimit.max)/2;
    const candidates=[theta,-theta].map(t=>{
      const bounded=clamp(C.skeletonUnwrap(sign*t,center),elbowLimit.min,elbowLimit.max),bend=sign*bounded;
      const reach=Math.sqrt(Math.max(0,l1*l1+l2*l2-2*l1*l2*Math.cos(bend))),d=Math.max(reach,1e-8),along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));
      const side=Math.sin(bend)>=0?1:-1,ux=Math.cos(direction),uy=Math.sin(direction),e={x:root.x+ux*along-uy*height*side,y:root.y+uy*along+ux*height*side},h={x:root.x+ux*reach,y:root.y+uy*reach};
      return {e,h,score:(reach-distance)**2+1e-5*((e.x-points[1].x)**2+(e.y-points[1].y)**2)};
    }).sort((a,b)=>a.score-b.score);
    points[1]=candidates[0].e;points[2]=candidates[0].h;
  } else if(Math.hypot(x-root.x,y-root.y)>=total) {
    for(let i=1;i<points.length;i++){points[i]={x,y};forward(i);}
  } else {
    // A small pole bias prevents a perfectly straight chain from locking up.
    if(points.length>2)for(let i=1;i<points.length-1;i++)if(Math.abs((points[i].x-root.x)*(y-root.y)-(points[i].y-root.y)*(x-root.x))<.001)points[i].x+=.1;
    for(let k=0;k<32;k++) {
      points[points.length-1]={x,y};
      for(let i=points.length-2;i>=0;i--)points[i]=place(points[i+1],points[i],lengths[i]);
      points[0]={...root};
      for(let i=1;i<points.length;i++)forward(i);
      if(Math.hypot(points.at(-1).x-x,points.at(-1).y-y)<.02)break;
    }
  }
  chain.forEach((n,i)=>{n.x=points[i].x;n.y=points[i].y;});
  // Descendant branches follow their nearest moved joint, without pulling siblings.
  for(const n of g.nodes)if(!owned.has(n.id)) {
    let p=n;while(p&&p.parent!=null&&!owned.has(p.parent))p=g.nodes.find(q=>q.id===p.parent);
    if(p?.parent&&owned.has(p.parent)){const a=g.nodes.find(q=>q.id===p.parent),b=before.get(p.parent);n.x+=a.x-b.x;n.y+=a.y-b.y;}
  }
}

function skeletonToggleMode(ref) {
  const r=skeletonList().find(r=>r.id===ref.id&&r.lid===ref.lid);
  if(!r||getLayer(r.lid).locked||REC.armed)return;
  const mode=skeletonMode(r)==='edit'?'pose':'edit';
  pushUndo();
  // Mode is a setting for the whole skeleton, not a new animation keyframe.
  // Touch only matching skeleton metadata, leaving every stored pose intact.
  for(const l of layers())for(const key of l.kfs)for(const o of key.objs)if(o.id===r.id&&o.skel){
    o.skel.mode=mode;
    if(mode==='pose'){for(const n of o.skel.nodes){n.rx=n.x;n.ry=n.y;}skeletonPinRefresh(o.skel,o.t);skeletonRigidRefresh(o.skel);}
  }
  if(mode==='pose')skeletonPoseBase(r);
  SK.add=false;SK.angleHover=null;SK.angleEdit=null;commit();
}
function skeletonDrag(w) {
  const d=S.drag;
  if(d.mode==='pose'&&findEval(d.lid,d.id)?.skel.nodes.find(n=>n.id===d.joint)?.pin)return;
  if(!d.started){if(Math.hypot(w.x-d.start.x,w.y-d.start.y)*S.view.z<2)return;pushUndo();recordDragEditable(getLayer(d.lid),S.frame);const o=findEditable(d.lid,d.id);if(!o?.skel){S.drag=null;return;}d.o=o;d.inv=minv(matOf(o.t));d.started=true;}
  const target=gridPoint({x:w.x+d.controlOffset.x,y:w.y+d.controlOffset.y}),xy=mapply(d.inv,target.x,target.y),g=d.o.skel;
  if(d.mode==='edit'){
    if(!d.art)d.art=layers().flatMap(l=>C.evalLayerObjs(l,S.frame).filter(o=>o.sbind?.to===d.id).map(o=>({lid:l.id,id:o.id,t:{...o.t},joint:o.sbind.joint})));
    const n=g.nodes.find(n=>n.id===d.joint);
    if(d.line){const dx=xy[0]-n.x,dy=xy[1]-n.y;for(const q of g.nodes){q.x+=dx;q.y+=dy;}}
    else {
      const fixed=new Set([n.id]);let expanded=true;
      while(expanded){expanded=false;for(const group of C.skeletonRigidGroups(g))if(group.points.some(p=>fixed.has(p.id)))for(const p of group.points)if(!fixed.has(p.id)){fixed.add(p.id);expanded=true;}}
      const dx=xy[0]-n.x,dy=xy[1]-n.y;for(const q of g.nodes)if(fixed.has(q.id)){q.x+=dx;q.y+=dy;}
    }
    for(const q of g.nodes){q.rx=q.x;q.ry=q.y;}skeletonPinRefresh(g,d.o.t);skeletonRigidRefresh(g);
    for(const art of d.art){C.ensureEditable(getLayer(art.lid),S.frame);const o=findEditable(art.lid,art.id);if(o){o.t={...art.t};o.sbind=C.skeletonOffsets(o,d.o,art.joint);}}
  }else if(C.skeletonRigidGroups(g).length)C.skeletonPoseRigid(g,d.joint,xy[0],xy[1],C.skeletonPinTargets(g,matOf(d.o.t)));
  else if(g.nodes.some(n=>n.pin))C.skeletonPosePinned(g,d.joint,xy[0],xy[1],C.skeletonPinTargets(g,matOf(d.o.t)));
  else skeletonPose(g,d.joint,xy[0],xy[1]);
  if(d.mode==='pose'&&!g.nodes.some(n=>n.pin)&&!C.skeletonRigidGroups(g).length)C.skeletonApplyLimits(g);
  C.skeletonBuild(d.o);invalidate();
}
function skeletonDraw(ctx) {
  if(S.playing){skeletonBadgeSchedule(false);return;}
  let animatedBadges=false;
  const attached=skeletonBindings();
  skeletonBindDraw(ctx);
  let zoneColor=null;const stroke=()=>{ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle=zoneColor||'#171721';ctx.lineWidth=2;ctx.stroke();};
  ctx.save();ctx.lineCap='round';ctx.setLineDash([9,6]);
  for(const r of skeletonList()) {
    const g=r.o.skel,pick=SK.rigidPick?.id===r.id?SK.rigidPick:null,rigidNodes=new Set(C.skeletonRigidGroups(g).filter(group=>!pick||group.id!==pick.group).flatMap(group=>group.points.map(p=>p.id)));
    if(pick&&pick.selected.length>=2)for(const id of pick.selected)rigidNodes.add(id);
    skeletonDrawRigid(ctx,r);
    const zoneColors=skeletonZoneBoneColors(r);
    for(const n of g.nodes)if(n.parent!=null){zoneColor=zoneColors.get(n.id)||null;const a=skeletonScreen(r,g.nodes.find(q=>q.id===n.parent)),b=skeletonScreen(r,n),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len>24){ctx.beginPath();ctx.moveTo(a[0]+dx*12/len,a[1]+dy*12/len);ctx.lineTo(b[0]-dx*12/len,b[1]-dy*12/len);stroke();}}
    zoneColor=null;
    for(const n of g.nodes){
      const p=skeletonScreen(r,n);ctx.beginPath();ctx.arc(p[0],p[1],10,0,Math.PI*2);stroke();
      const limit=C.skeletonJointLimit(g,n.id);
      const badges=[...(n.pin?['pin']:[]),...(limit?['angle']:[]),...(attached.has(r.id+':'+n.id)?['attach']:[]),...(rigidNodes.has(n.id)?['rigid']:[])],phase=(performance.now()-SK.badgeEpoch)%Math.max(2000,badges.length*2000),local=phase%2000,alpha=badges.length>1?Math.min(1,local/200,(2000-local)/200):1,which=badges[Math.floor(phase/2000)];
      if(badges.length>1)animatedBadges=true;
      if(which==='pin')skeletonDrawPin(ctx,p,alpha);
      if(which==='attach')skeletonDrawAttach(ctx,p,alpha);
      if(which==='rigid')skeletonDrawRigidBadge(ctx,p,alpha);
      if(which==='angle'){
        ctx.save();ctx.globalAlpha*=alpha;
        const target=skeletonScreen(r,g.nodes.find(q=>q.id===limit.bone)),a=Math.atan2(target[1]-p[1],target[0]-p[0]);
        ctx.save();ctx.setLineDash([]);ctx.beginPath();ctx.arc(p[0],p[1],5.5,a+.7,a+Math.PI*2-.7);ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle=CSSV.accent;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(p[0]+Math.cos(a)*6,p[1]+Math.sin(a)*6);ctx.strokeStyle=CSSV.fg;ctx.lineWidth=1.5;ctx.stroke();ctx.restore();ctx.restore();
      }
    }
  }
  if(SK.add&&S.cursorW){const r=skeletonList().find(r=>r.id===SK.add.id),n=r?.o.skel.nodes.find(n=>n.id===SK.add.joint);if(n){const p=skeletonScreen(r,n),q=w2s(S.cursorW.x,S.cursorW.y);ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);stroke();ctx.beginPath();ctx.arc(q[0],q[1],10,0,Math.PI*2);stroke();}}
  ctx.restore();skeletonAngleDraw(ctx);skeletonMenuSync();skeletonBadgeSchedule(animatedBadges);
}
function skeletonBindUI() {
  window.addEventListener('keydown',e=>{if(!['Control','Meta','Shift'].includes(e.key)||e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;skeletonHudModifiers(e.ctrlKey||e.metaKey,e.shiftKey);});
  window.addEventListener('keyup',e=>{if(['Control','Meta','Shift'].includes(e.key))skeletonHudModifiers(e.ctrlKey||e.metaKey,e.shiftKey);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)skeletonBadgeSchedule(false);else invalidate();});
  const menu=$('#boneMenu');
  $('#bonePhoto').innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 7h5l2-3h5l2 3h4v13H3Z" fill="var(--panel)" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="13" r="4" fill="var(--accent-soft)" stroke="currentColor" stroke-width="1.5"/></svg>';
  $('#boneLibrary').innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 5h7l2 3h9v12H3Z" fill="var(--panel)" stroke="currentColor" stroke-width="2"/></svg>';
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#bonePoseGallery,#boneMenu'))$('#bonePoseGallery').hidden=true;});
  window.addEventListener('pointermove',e=>{
    if(SK.ctrlHeld!==(e.ctrlKey||e.metaKey)||SK.shiftHeld!==e.shiftKey)skeletonHudModifiers(e.ctrlKey||e.metaKey,e.shiftKey);
    if(e.target.closest?.('#bonePoseGallery'))return;
    const p=stagePt(e),d=SK.actionDrag;
    if(d){const r=d.r,n=r?.o.skel.nodes.find(n=>n.id===r.joint),q=d.angle?d.anchor:n&&skeletonScreen(r,n);if(q&&Math.hypot(p.sx-q[0],p.sy-q[1])>BONE_MENU_REACH+(SK.softOpen===r.id+':'+r.joint?50:0)){d.dismissed=true;SK.dismissed=d.key;SK.rigidPick=null;invalidate();SK.angleHover=null;SK.angleEdit=null;skeletonMenuSync();}return;}
    if(e.target.closest?.('#boneAngle,#boneAngleRemove')){skeletonAngleMenuSync();return;}
    skeletonHoverAt(p,!!e.target.closest?.('#boneMenu'));if(SK.add)invalidate();
  });
  for(const button of [$('#boneAngle'),$('#boneAngleRemove')])button.addEventListener('pointerdown',e=>{
    const r=skeletonAngleRef(SK.angleHover)||skeletonAngleRef(SK.angleEdit);if(!r||e.button!==0||REC.armed)return;
    e.preventDefault();e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);
    const p=e.currentTarget.id==='boneAngleRemove'?skeletonAngleRemovePoint(r):skeletonAngleButtonPoint(r);SK.actionDrag={button:e.currentTarget,key:skeletonKey(r),r,dismissed:false,angle:true,anchor:p};
  });
  menu.addEventListener('pointerdown' ,e=>{
    const b=e.target.closest('button'),r=skeletonHoverRig();if(!b||!r||e.button!==0||b.disabled)return;
    e.preventDefault();e.stopPropagation();b.setPointerCapture(e.pointerId);SK.actionDrag={button:b,key:skeletonKey(r),r,dismissed:false};
  });
  window.addEventListener('pointerup',e=>{
    const d=SK.actionDrag;if(d){SK.actionDrag=null;if(!d.dismissed){if(d.button.id==='boneSoft'){SK.poseOpen=null;SK.softOpen=SK.softOpen===d.r.id+':'+d.r.joint?null:d.r.id+':'+d.r.joint;}else if(d.button.id==='boneSoftBind')skeletonSoftBindStart(d.r);else if(d.button.id==='boneSoftAdaptive')skeletonSoftAdaptiveToggle(d.r);else if(d.button.id==='boneSoftZones')skeletonZoneToggle(d.r);else if(d.button.id==='boneSoftUp')skeletonSoftOrder(d.r,1);else if(d.button.id==='boneSoftDown')skeletonSoftOrder(d.r,-1);else if(d.button.id==='boneSoftPlus')skeletonSoftAdjust(d.r,.1);else if(d.button.id==='boneSoftMinus')skeletonSoftAdjust(d.r,-.1);else if(d.button.id==='bonePose'){SK.softOpen=null;$('#bonePoseGallery').hidden=true;SK.poseOpen=SK.poseOpen===d.r.id+':'+d.r.joint?null:d.r.id+':'+d.r.joint;}else if(d.button.id==='bonePhoto')skeletonPoseSave(d.r);else if(d.button.id==='boneLibrary')skeletonPoseGallery(d.r);else if(d.button.id==='boneRigid')skeletonRigidStart(d.r);else if(d.button.id==='boneAttach')skeletonBindStart(d.r);else if(d.button.id==='bonePin')skeletonTogglePin(d.r);else if(d.button.id==='boneAngleRemove')skeletonRemoveLimit(d.r);else if(d.button.id==='boneAngle')skeletonOpenAngle(d.r);else if(d.button.id==='boneMode')skeletonToggleMode(d.r);else if(d.button.id==='boneAdd'){SK.angleHover=null;SK.angleEdit=null;SK.add={lid:d.r.lid,id:d.r.id,joint:d.r.joint};SK.hover=null;invalidate();}else skeletonRemove(d.r);}skeletonMenuSync();return;}
    if(S.tool==='bone')skeletonHoverAt(stagePt(e));
  });
  window.addEventListener('pointercancel',()=>{SK.actionDrag=null;skeletonMenuSync();});
  window.addEventListener('blur',()=>{skeletonAimClear();SK.ctrlHeld=false;SK.shiftHeld=false;SK.menuLock=null;document.body.classList.remove('bone-hud-hidden');SK.rigidPick=null;SK.binding=false;SK.bindTarget=null;SK.angleHover=null;SK.angleEdit=null;SK.actionDrag=null;SK.hover=null;SK.add=false;skeletonMenuSync();invalidate();});
}

/* ---------- live vector mirror; editor-only until confirmed ---------- */
function mirrorScope(){return JSON.stringify(S.edit.map(e=>e.sym));}
function mirrorMatrix(b=MIR.box){const a=b.r*Math.PI/180,c=Math.cos(a),s=Math.sin(a),sx=b.sx??1,sy=b.sy??1;return [c*sx,s*sx,-s*sy,c*sy,b.x,b.y];}
function mirrorReflection(){const m=mirrorMatrix();return mmul(m,mmul([-1,0,0,1,0,0],minv(m)));}
function mirrorSources(){
  if(!MIR.active||MIR.scope!==mirrorScope())return [];
  const l=getLayer(MIR.sourceLid||MIR.lid);if(!l||l.visible===false)return [];
  return C.evalLayerObjs(l,S.frame).filter(o=>o.kind==='path'&&!o.skel&&!o.invisMask&&o.fill!=null&&o.contours.some(c=>c.closed)&&(MIR.ids==null||MIR.ids.includes(o.id)));
}
function mirrorBegin(){
  if(REC.armed){toast('Leave Record mode before opening a mirror.');return false;}
  const selected=selEval(),existing=selected.length===1&&selected[0].o.mirror?selected[0]:null;
  if(existing){MIR.active=true;MIR.placing=false;MIR.id=existing.id;MIR.lid=existing.lid;MIR.scope=mirrorScope();MIR.near=true;mirrorSync();setTool('mirror');invalidate();return true;}
  if(MIR.active&&MIR.id){mirrorSync();if(!MIR.box)mirrorCancel();}
  if(MIR.active){setTool('mirror');MIR.near=true;invalidate();return true;}
  const lids=new Set(selected.map(s=>s.lid));
  if(lids.size>1){toast('Mirror: select filled vector paths on one layer.');return false;}
  const layer=selected.length?getLayer(selected[0].lid):curLayer();
  if(!layer||layer.locked||layer.visible===false){toast('Mirror: choose an unlocked visible layer.');return false;}
  if(selected.some(s=>s.o.kind!=='path'||s.o.skel||s.o.fill==null)){toast('Mirror currently works with filled vector paths.');return false;}
  MIR.active=true;MIR.placing=true;MIR.id=null;MIR.box=null;MIR.lid=MIR.sourceLid=layer.id;MIR.ids=selected.length?selected.map(s=>s.id):null;MIR.scope=mirrorScope();MIR.near=true;setTool('mirror');invalidate();return true;
}
function mirrorCancel(){MIR.active=false;MIR.placing=false;MIR.id=null;MIR.box=null;MIR.near=false;MIR.palette=null;const hud=$('#mirrorHud');if(hud)hud.hidden=true;if(S.drag?.type==='mirror')S.drag=null;}
function mirrorSync(){
  if(!MIR.active||!MIR.id||S.drag?.type==='mirror'||MIR.palette?.started)return;
  if(MIR.scope!==mirrorScope()){mirrorCancel();return;}
  const layer=getLayer(MIR.lid),o=layer&&C.evalLayerObjs(layer,S.frame).find(o=>o.id===MIR.id&&o.mirror);
  if(!o){MIR.box=null;return;}
  MIR.sourceLid=o.mirror.layer||MIR.lid;MIR.ids=o.mirror.ids||null;MIR.box={x:o.t.x,y:o.t.y,r:o.t.r,sx:o.t.sx,sy:o.t.sy,w:o.mirror.width,h:o.mirror.height};
}
function mirrorWrite(o){delete o.pivot;const b=MIR.box;o.t={...o.t,x:b.x,y:b.y,r:b.r,sx:b.sx??1,sy:b.sy??1};o.mirror={...o.mirror,width:b.w,height:b.h};}
function mirrorPersist(){
  if(!MIR.active||!MIR.box)return;
  const layer=getLayer(MIR.lid);if(!layer||layer.locked)return;
  pushUndo();if(!C.kfAt(layer,S.frame))C.insertKeyframe(layer,S.frame,false);const key=C.ensureEditable(layer,S.frame);
  let o=MIR.id&&key.objs.find(o=>o.id===MIR.id&&o.mirror);
  const created=!o;
  if(!o){o={id:uid(),kind:'group',children:[],op:1,t:{x:0,y:0,sx:1,sy:1,r:0},mirror:{layer:MIR.sourceLid||MIR.lid,ids:MIR.ids?MIR.ids.slice():null,width:MIR.box.w,height:MIR.box.h}};key.objs.push(o);MIR.id=o.id;}
  mirrorWrite(o);if(created)for(const next of layer.kfs)if(next.f>S.frame&&!next.objs.some(q=>q.id===o.id))next.objs.push(clone(o));MIR.placing=false;commit();refreshAll();
}
function mirrorDelete(){
  if(MIR.id){const layer=getLayer(MIR.lid);if(layer&&!layer.locked&&C.evalLayerObjs(layer,S.frame).some(o=>o.id===MIR.id)){pushUndo();if(!C.kfAt(layer,S.frame))C.insertKeyframe(layer,S.frame,false);const key=C.ensureEditable(layer,S.frame);key.objs=key.objs.filter(o=>o.id!==MIR.id);S.sel=S.sel.filter(s=>s.id!==MIR.id);commit();}}
  mirrorCancel();setTool('select');refreshAll();
}
function mirrorCorners(b=MIR.box){return [[0,-b.h/2],[b.w,-b.h/2],[b.w,b.h/2],[0,b.h/2]].map(p=>mapply(mirrorMatrix(b),...p));}
function mirrorHandles(){
  if(!MIR.box)return [];
  const b=MIR.box,m=mirrorMatrix(),out=mirrorCorners().map((p,i)=>({id:'corner',index:i,p}));
  for(const side of [-1,1])out.push({id:'rotate',p:mapply(m,b.w/2,side*(b.h/2+26/S.view.z))});return out;
}
function mirrorPreview(ctx){
  if(!MIR.box||MIR.scope!==mirrorScope())return;
  ctx.save();const m=mirrorMatrix(),clip=new Path2D(),rect=new Path2D();rect.rect(0,-MIR.box.h/2,MIR.box.w,MIR.box.h);clip.addPath(rect,new DOMMatrix(m));ctx.clip(clip);ctx.transform(...mirrorReflection());for(const o of mirrorSources())drawObj(ctx,o._softParts?C.softView(o):{...o},{});ctx.restore();
}
function mirrorOverlay(ctx){
  const hud=$('#mirrorHud');if(!hud)return;
  if(!MIR.active||!MIR.box||MIR.scope!==mirrorScope()||S.playing){hud.hidden=true;return;}
  const corners=mirrorCorners().map(p=>w2s(...p));ctx.save();ctx.strokeStyle=CSSV.accent;ctx.fillStyle=CSSV.panel;ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.stroke();ctx.setLineDash([]);
  if(MIR.near||S.tool==='mirror')for(const h of mirrorHandles()){const p=w2s(...h.p);ctx.beginPath();if(h.id==='corner')ctx.rect(p[0]-3,p[1]-3,6,6);else ctx.arc(p[0],p[1],4,0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.restore();hud.hidden=!MIR.near||!!S.drag;
  const p=corners[1];hud.style.left=clamp(p[0],0,stageW-76)+'px';hud.style.top=clamp(p[1],38,stageH-12)+'px';
}
function mirrorHover(p){
  if(!MIR.active||!MIR.box)return;
  const q=mapply(minv(mirrorMatrix()),p.w.x,p.w.y),b=MIR.box,pad=50/S.view.z;
  let near=q[0]>=-pad&&q[0]<=b.w+pad&&q[1]>=-b.h/2-pad&&q[1]<=b.h/2+pad;
  const hud=$('#mirrorHud');
  if(hud&&!hud.hidden){const r=hud.getBoundingClientRect(),stageRect=stage.getBoundingClientRect(),x=p.sx+stageRect.left,y=p.sy+stageRect.top;
    near=near||(x>=r.left-12&&x<=r.right+12&&y>=r.top-12&&y<=r.bottom+12);
    const a=w2s(...mirrorCorners()[1]),cx=(r.left+r.right)/2-stageRect.left,cy=(r.top+r.bottom)/2-stageRect.top,dx=cx-a[0],dy=cy-a[1],t=clamp(((p.sx-a[0])*dx+(p.sy-a[1])*dy)/(dx*dx+dy*dy||1),0,1);
    near=near||Math.hypot(p.sx-a[0]-t*dx,p.sy-a[1]-t*dy)<16;
  }
  if(near!==MIR.near){MIR.near=near;invalidate();}
}
function mirrorDown(e,p){
  mirrorSync();
  if(!MIR.active||MIR.scope!==mirrorScope()||e.ctrlKey||e.metaKey||(MIR.id&&getLayer(MIR.lid)?.locked))return false;
  if(MIR.placing&&S.tool==='mirror'){
    MIR.box={x:p.w.x,y:p.w.y+120/S.view.z,w:180/S.view.z,h:240/S.view.z,r:0};S.drag={type:'mirror',action:'place',start:p.w,base:clone(MIR.box)};invalidate();return true;
  }
  if(!MIR.box)return false;
  const h=mirrorHandles().find(h=>{const q=w2s(...h.p);return Math.hypot(q[0]-p.sx,q[1]-p.sy)<9;});
  const q=mapply(minv(mirrorMatrix()),p.w.x,p.w.y),b=MIR.box,inside=q[0]>=0&&q[0]<=b.w&&Math.abs(q[1])<=b.h/2;
  if(!h&&!(S.tool==='mirror'&&inside))return false;
  const center=mapply(mirrorMatrix(),b.w/2,0);S.drag={type:'mirror',action:h?.id||'move',index:h?.index,start:p.w,base:clone(b),center,angle:Math.atan2(p.w.y-center[1],p.w.x-center[0])};invalidate();return true;
}
function mirrorDrag(w,e){
  const d=S.drag;if(d?.type!=='mirror')return;const b=d.base;
  if(d.action==='move'){MIR.box={...b,x:b.x+w.x-d.start.x,y:b.y+w.y-d.start.y};}
  else if(d.action==='place'){
    if(Math.hypot(w.x-d.start.x,w.y-d.start.y)*S.view.z>4){const size=Math.max(30/S.view.z,Math.abs(w.x-d.start.x),Math.abs(w.y-d.start.y)*.75);MIR.box={x:Math.min(d.start.x,w.x),y:d.start.y+(w.y>=d.start.y?1:-1)*size*2/3,w:size,h:size*4/3,r:0};}
  }else if(d.action==='rotate'){
    let r=b.r+(Math.atan2(w.y-d.center[1],w.x-d.center[0])-d.angle)*180/Math.PI;if(e.shiftKey)r=Math.round(r/15)*15;const a=r*Math.PI/180;MIR.box={...b,r,x:d.center[0]-Math.cos(a)*b.w*(b.sx??1)/2,y:d.center[1]-Math.sin(a)*b.w*(b.sx??1)/2};
  }else{
    const cs=mirrorCorners(b),opposite=(d.index+2)%4,anchor=cs[opposite],v=[cs[d.index][0]-anchor[0],cs[d.index][1]-anchor[1]],factor=Math.max(.05,((w.x-anchor[0])*v[0]+(w.y-anchor[1])*v[1])/(v[0]*v[0]+v[1]*v[1]));
    const next={...b,w:b.w*factor,h:b.h*factor},local=[[0,-next.h/2],[next.w,-next.h/2],[next.w,next.h/2],[0,next.h/2]][opposite],a=b.r*Math.PI/180;next.x=anchor[0]-Math.cos(a)*(b.sx??1)*local[0]+Math.sin(a)*(b.sy??1)*local[1];next.y=anchor[1]-Math.sin(a)*(b.sx??1)*local[0]-Math.cos(a)*(b.sy??1)*local[1];MIR.box=next;
  }
  if(MIR.id){
    const layer=getLayer(MIR.lid);
    if(layer&&!layer.locked){
      if(!d.changed&&Math.hypot(w.x-d.start.x,w.y-d.start.y)*S.view.z>2){pushUndo();d.undo=true;if(!C.kfAt(layer,S.frame))C.insertKeyframe(layer,S.frame,false);d.model=C.ensureEditable(layer,S.frame).objs.find(o=>o.id===MIR.id);d.changed=true;}
      if(d.model)mirrorWrite(d.model);
    }
  }
  MIR.near=true;invalidate();
}
function mirrorBoolean(a,b,op,template){
  const build=curves=>{
    const geometry=polygonClipping[op](...(curves?curves.geometries:[eFillGeom(a,matOf(a.t)),eFillGeom(b,matOf(b.t))]));
    const inv=minv(matOf(template.t)),contours=[];
    for(const polygon of geometry)for(const ring of polygon){const c=curves?curves.reconstruct(ring,inv):{closed:true,nodes:ring.slice(0,-1).map(p=>{const q=mapply(inv,...p);return C.node(...q);})};if(c?.nodes.length>=2)contours.push(c);}
    if(!contours.length)return null;
    const out=clone(template);out.contours=contours;out.nz=true;delete out.star;delete out.arc;delete out.ellipseFrame;delete out.skin;return out;
  };
  try{return build(kroganBooleanSources([a,b]));}catch(error){return build(null);}
}
function mirrorApply(){
  mirrorSync();
  if(MIR.busy||!MIR.active||!MIR.box)return;
  const layer=getLayer(MIR.lid),sources=mirrorSources();if(sources.some(o=>o._softParts)){toast('Detach the ordered soft body before baking its mirror.');return;}if(!layer||layer.locked||!sources.length){toast('Mirror: no editable filled vector paths in the frame.');return;}
  MIR.busy=true;
  try{
    const b=MIR.box,frame=C.mkPath([{closed:true,nodes:[[0,-b.h/2],[b.w,-b.h/2],[b.w,b.h/2],[0,b.h/2]].map(p=>C.node(...p))}],{fill:'#000000'},{x:b.x,y:b.y,r:b.r,sx:b.sx??1,sy:b.sy??1}),reflection=mirrorReflection(),plans=new Map();
    for(const source of sources){
      const reflected=clone(source);C.setObjMatrix(reflected,mmul(reflection,matOf(source.t)));delete reflected.sbind;delete reflected.bind;delete reflected.skin;
      const inverse=minv(mirrorMatrix()),inside=(worldCorners(reflected)||[]).every(p=>{const q=mapply(inverse,...p);return q[0]>=0&&q[0]<=b.w&&q[1]>=-b.h/2&&q[1]<=b.h/2;});
      const clipped=inside?reflected:mirrorBoolean(reflected,frame,'intersection',reflected);
      const sourceGeom=eFillGeom(source,matOf(source.t)),frameGeom=eFillGeom(frame,matOf(frame.t));
      const covered=polygonClipping.intersection(sourceGeom,frameGeom).length>0;
      const visible=covered?mirrorBoolean(source,frame,'difference',source):clone(source);
      const overlap=clipped&&polygonClipping.intersection(sourceGeom,eFillGeom(clipped,matOf(clipped.t))).length>0;
      const objects=[];
      if(overlap){const out=visible?mirrorBoolean(visible,clipped,'union',source):clipped;if(out){out.id=source.id;objects.push(out);}}
      else {if(visible){visible.id=source.id;objects.push(visible);}if(clipped){clipped.id=uid();objects.push(clipped);}}
      plans.set(source.id,{objects});
    }
    if(!plans.size){toast('Move the mirror so the reflected drawing enters its frame.');return;}
    pushUndo();if(!C.kfAt(layer,S.frame))C.insertKeyframe(layer,S.frame,false);const key=C.ensureEditable(layer,S.frame),next=[],selected=[];
    for(const o of key.objs){if(o.id===MIR.id)continue;const plan=plans.get(o.id);if(!plan){next.push(o);continue;}next.push(...plan.objects);selected.push(...plan.objects.map(out=>({lid:layer.id,id:out.id})));}
    key.objs=next;S.sel=selected;S.nodeSel=null;S.kNodeSelection=[];mirrorCancel();setTool('select');commit();refreshAll();toast('Mirror saved as vector artwork. Overlapping reflections were joined with Union.');
  }catch(error){toast('Mirror could not be joined: '+(error.message||error));}
  finally{MIR.busy=false;}
}
function mirrorUI(){
  const hud=document.createElement('div');hud.id='mirrorHud';hud.hidden=true;hud.innerHTML='<button type="button" id="mirrorApply" title="Bake this keyframe to vector paths; Union on overlap" aria-label="Apply mirror">✓</button><button type="button" id="mirrorCancel" title="Close controls; keep the live mirror" aria-label="Close mirror controls">×</button>';$('#stagewrap').append(hud);
  $('#mirrorApply').addEventListener('click',mirrorApply);$('#mirrorCancel').addEventListener('click',()=>{mirrorCancel();setTool('select');invalidate();});hud.addEventListener('pointerenter',()=>{MIR.near=true;});
  document.addEventListener('keydown',e=>{if(MIR.active&&e.key==='Escape'){mirrorCancel();if(S.tool==='mirror')setTool('select');invalidate();e.preventDefault();e.stopImmediatePropagation();}},true);
  window.addEventListener('pointermove',e=>{const d=MIR.palette;if(!d)return;if(!d.started&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>5){if(!mirrorBegin()){MIR.palette=null;return;}d.started=true;d.button.dataset.mirrorDragged='1';}if(d.started){const p=stagePt(e);MIR.box={x:p.w.x,y:p.w.y,w:180/S.view.z,h:240/S.view.z,r:0};MIR.placing=false;MIR.near=true;invalidate();}});
  window.addEventListener('pointerup',e=>{const d=MIR.palette;if(!d)return;MIR.palette=null;if(d.started){const r=stage.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)mirrorCancel();else mirrorPersist();invalidate();setTimeout(()=>delete d.button.dataset.mirrorDragged,0);}});
  window.addEventListener('pointercancel',()=>{if(MIR.palette){MIR.palette=null;mirrorCancel();invalidate();}});
}

/* KROGAN V1.7 — context-sensitive selection transforms. Preserve the world
   position of each object's own pivot when mirroring or rotating. */
function kroganSelectionTransform(action) {
  if (S.tool !== 'select' || !S.sel.length) return;
  const targets = S.sel.filter(q => findEval(q.lid, q.id)&&getLayer(q.lid)&&!getLayer(q.lid).locked);
  if (!targets.length) return;
  pushUndo();
  for (const lid of new Set(targets.map(q => q.lid))) C.ensureEditable(getLayer(lid), S.frame);
  for (const q of targets) {
    const o = findEditable(q.lid, q.id);
    if (!o || !o.t) continue;
    const b = localBounds(o);
    const pivot = Array.isArray(o.pivot) && o.pivot.length === 2 ? o.pivot :
      b ? [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2] : [0, 0];
    const oldPos = mapply(matOf(o.t), pivot[0], pivot[1]);
    if (action === 'flipH') {o.t.sx *= -1;o.t.r *= -1;}
    else if (action === 'flipV') {o.t.sy *= -1;o.t.r *= -1;}
    else if (action === 'rotateL') o.t.r -= 90;
    else if (action === 'rotateR') o.t.r += 90;
    else continue;
    const newPos = mapply(matOf(o.t), pivot[0], pivot[1]);
    o.t.x += oldPos[0] - newPos[0];
    o.t.y += oldPos[1] - newPos[1];
    if (o.bind) C.freeBind.add(o.id);
  }
  commit();
}
/* ===== Onionskyn app, part 3: timeline, layers, properties, menus, export, import, init ===== */
