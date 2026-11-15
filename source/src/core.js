
/* Onionskyn core: pure logic (geometry, tweens, GIF, SVG, FLA import). No DOM access except DOMParser/JSZip at import time. */
(function (root) {
'use strict';
const PI = Math.PI;
let _uid = 0;
const uid = () => 'o' + Date.now().toString(36) + (_uid++).toString(36) + Math.floor(Math.random() * 46656).toString(36);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const clone = (o) => JSON.parse(JSON.stringify(o));
const nz = (v, d) => (v == null ? d : v);
let _lib = {};            /* symbol library of the current document (name -> {layers, frames}) */
let _mctx = null;
let _ctxEl = null;        /* unwrapped elapsed frames of the enclosing clip (movie clips nested in clips keep playing) */         /* 2D context used to measure text */
function setLib(l) { _lib = l || {}; }
function setMeasure(c) { _mctx = c; }

/* ---------- colour ---------- */
function hexToRgb(h) {
  h = (h || '#000000').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
function lerpHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}
function rgba(hex, a) { const c = hexToRgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

/* ---------- matrices: [a,b,c,d,e,f] canvas convention ---------- */
function newT() { return { x: 0, y: 0, sx: 1, sy: 1, r: 0 }; }
function matOf(t) {
  const c = Math.cos(t.r * PI / 180), s = Math.sin(t.r * PI / 180);
  return [c * t.sx, s * t.sx, -s * t.sy, c * t.sy, t.x, t.y];
}
function mmul(m, n) {
  return [
    m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
}
function minv(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  if (Math.abs(det) < 1e-12) return [1, 0, 0, 1, -m[4], -m[5]];
  const id = 1 / det;
  return [m[3] * id, -m[1] * id, -m[2] * id, m[0] * id, (m[2] * m[5] - m[3] * m[4]) * id, (m[1] * m[4] - m[0] * m[5]) * id];
}
function mapply(m, x, y) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
function decompose(m) {
  const sx = Math.hypot(m[0], m[1]);
  const r = Math.atan2(m[1], m[0]);
  const det = m[0] * m[3] - m[1] * m[2];
  const sy = sx > 1e-12 ? det / sx : Math.hypot(m[2], m[3]);
  const h = sx > 1e-12 ? (m[0] * m[2] + m[1] * m[3]) / sx : 0;
  const skew = Math.abs(h) / (Math.max(Math.abs(sx), Math.abs(sy)) || 1);
  return { x: m[4], y: m[5], sx, sy, r: r * 180 / PI, skew };
}

/* ---------- paths ---------- */
function node(x, y) { return { x, y, ix: 0, iy: 0, ox: 0, oy: 0 }; }
function tracePath(p, contours) {
  for (const c of contours) {
    const n = c.nodes;
    if (!n.length) continue;
    p.moveTo(n[0].x, n[0].y);
    const cnt = c.closed ? n.length : n.length - 1;
    for (let i = 0; i < cnt; i++) {
      const a = n[i], b = n[(i + 1) % n.length];
      if (a.ox || a.oy || b.ix || b.iy) p.bezierCurveTo(a.x + a.ox, a.y + a.oy, b.x + b.ix, b.y + b.iy, b.x, b.y);
      else p.lineTo(b.x, b.y);
    }
    if (c.closed) p.closePath();
  }
}
const f2 = (v) => +v.toFixed(3);
function pathD(contours) {
  let d = '';
  for (const c of contours) {
    const n = c.nodes;
    if (!n.length) continue;
    d += 'M' + f2(n[0].x) + ' ' + f2(n[0].y);
    const cnt = c.closed ? n.length : n.length - 1;
    for (let i = 0; i < cnt; i++) {
      const a = n[i], b = n[(i + 1) % n.length];
      if (a.ox || a.oy || b.ix || b.iy) d += 'C' + f2(a.x + a.ox) + ' ' + f2(a.y + a.oy) + ' ' + f2(b.x + b.ix) + ' ' + f2(b.y + b.iy) + ' ' + f2(b.x) + ' ' + f2(b.y);
      else d += 'L' + f2(b.x) + ' ' + f2(b.y);
    }
    if (c.closed) d += 'Z';
  }
  return d;
}
function bezPt(a, b, t) {
  const u = 1 - t;
  const x1 = a.x + a.ox, y1 = a.y + a.oy, x2 = b.x + b.ix, y2 = b.y + b.iy;
  return [
    u * u * u * a.x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * b.x,
    u * u * u * a.y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * b.y];
}
function splitSeg(a, b, t) {
  const P0 = [a.x, a.y], P1 = [a.x + a.ox, a.y + a.oy], P2 = [b.x + b.ix, b.y + b.iy], P3 = [b.x, b.y];
  const L = (p, q) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
  const Q0 = L(P0, P1), Q1 = L(P1, P2), Q2 = L(P2, P3), R0 = L(Q0, Q1), R1 = L(Q1, Q2), S = L(R0, R1);
  const na = Object.assign({}, a, { ox: Q0[0] - P0[0], oy: Q0[1] - P0[1] });
  const nb = Object.assign({}, b, { ix: Q2[0] - P3[0], iy: Q2[1] - P3[1] });
  const m = { x: S[0], y: S[1], ix: R0[0] - S[0], iy: R0[1] - S[1], ox: R1[0] - S[0], oy: R1[1] - S[1], s: false };
  return [na, m, nb];
}
function contoursBounds(contours) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; };
  for (const c of contours) {
    const n = c.nodes;
    for (const q of n) add(q.x, q.y);
    const cnt = c.closed ? n.length : n.length - 1;
    for (let i = 0; i < cnt; i++) {
      const a = n[i], b = n[(i + 1) % n.length];
      if (a.ox || a.oy || b.ix || b.iy) for (let k = 1; k < 12; k++) { const p = bezPt(a, b, k / 12); add(p[0], p[1]); }
    }
  }
  return x0 === Infinity ? null : { x0, y0, x1, y1 };
}
/* ---------- bitmaps (doc.images[name] = { name, mime, b64, w, h, size }) ---------- */
let _images = {}; const _imgEls = new Map();
const _rasterJoinCache=new Map(),_rasterJoinIds=new WeakMap();let _rasterJoinPixels=0,_rasterJoinNext=0;
function releaseImage(e) {
  e.el.onload = e.el.onerror = null;
  e.el.removeAttribute('src');
  if (e.resolve) { e.resolve(false); e.resolve = null; }
}
function setImages(m) {
  _rasterJoinCache.clear();_rasterJoinPixels=0;
  _images = m || {};
  for (const [name, e] of _imgEls) {
    const rec = _images[name];
    if (!rec || !rec.b64 || e.mime !== rec.mime || e.b64 !== rec.b64) {
      _imgEls.delete(name);
      releaseImage(e);
    }
  }
}
function imgEl(name) {
  const rec = _images[name];
  if (!rec || !rec.b64 || typeof Image === 'undefined') return null;
  let e = _imgEls.get(name);
  if (!e || e.mime !== rec.mime || e.b64 !== rec.b64) {
    if (e) { _imgEls.delete(name); releaseImage(e); }
    const el = new Image();
    e = { el, mime: rec.mime, b64: rec.b64, ok: false, p: null, resolve: null };
    e.p = new Promise((res) => { e.resolve = res; });
    el.onload = () => {
      if (_imgEls.get(name) !== e) return;
      e.ok = true;
      if (e.resolve) { e.resolve(true); e.resolve = null; }
      if (root.FCCore && root.FCCore.onImageLoad) root.FCCore.onImageLoad(name);
    };
    el.onerror = () => {
      if (e.resolve) { e.resolve(false); e.resolve = null; }
    };
    _imgEls.set(name, e);
    el.src = 'data:' + rec.mime + ';base64,' + rec.b64;
  }
  return e.ok ? e.el : null;
}
function preloadImages() {
  const ps = [];
  for (const n of Object.keys(_images)) { imgEl(n); const e = _imgEls.get(n); if (e) ps.push(e.p); }
  return Promise.all(ps);
}
/* ---------- layer masks: a visible mask layer clips the contiguous 'masked' layers directly below it ---------- */
function groupEntries(entries) {
  const units = [];
  let i = entries.length - 1;
  while (i >= 0) {
    const e = entries[i], L = e.layer;
    if (L.mask) {
      let j = i - 1; const mem = [];
      while (j >= 0 && entries[j].layer.masked) { mem.unshift(entries[j]); j--; }
      if (L.visible !== false && mem.length) units.unshift({ mask: e, members: mem });
      else for (let k = mem.length - 1; k >= 0; k--) units.unshift({ e: mem[k] });
      i = j;
    } else { units.unshift({ e }); i--; }
  }
  return units;
}
const _mt = []; let _md = 0;
function maskedDraw(ctx, drawMembers, drawMask) {
  const cv = ctx.canvas, w = cv.width, h = cv.height, d = _md++;
  try {
    for (let k = d * 2; k < d * 2 + 2; k++) if (!_mt[k]) _mt[k] = document.createElement('canvas');
    const a = _mt[d * 2], b = _mt[d * 2 + 1];
    if (a.width !== w || a.height !== h) { a.width = w; a.height = h; }
    if (b.width !== w || b.height !== h) { b.width = w; b.height = h; }
    const ac = a.getContext('2d'), bc = b.getContext('2d'), M = ctx.getTransform();
    for (const c of [ac, bc]) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, w, h); c.setTransform(M); }
    drawMembers(ac); drawMask(bc);
    ac.setTransform(1, 0, 0, 1, 0, 0); ac.globalCompositeOperation = 'destination-in'; ac.drawImage(b, 0, 0); ac.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(a, 0, 0); ctx.restore();
  } finally { _md--; }
}
// KROGAN Invisibility Mask V1.3: erase only earlier objects in the SAME layer.
// Composite each layer unit separately so higher artwork remains untouched.
function invisMaskShape(o) {
  return Object.assign({}, o, { invisMask: false, fill: '#ffffff', fa: 1,
    grad: null, stroke: null, sw: 0, op: 1 });
}
// A Division partitions native pixels, but filtering the two transparent
// edges separately leaves a seam at fractional zoom. Rejoin aligned siblings
// at native resolution before the display/export transform is applied once.
function joinedRasterCuts(objects) {
  let current=objects;
  for(let pass=0;pass<16;pass++){
    const output=[];let changed=false;
    for(let i=0;i<current.length;){
      const first=current[i],meta=first.rasterJoin;
      if(first.kind!=='image'||!meta||meta.count<2){output.push(first);i++;continue;}
      let end=i+1;while(end<current.length&&current[end].rasterJoin?.batch===meta.batch)end++;
      const siblings=current.slice(i,end);
      const join=()=>{
        if(siblings.length!==meta.count||!(meta.width>0&&meta.height>0)||meta.width*meta.height>24000000)return null;
        const parts=new Set(),sources=[],M=matOf(first.t),origin=mapply(M,-meta.x*meta.logicalW/meta.width,-meta.y*meta.logicalH/meta.height);
        const base=[M[0],M[1],M[2],M[3],origin[0],origin[1]],tag=[];
        for(const o of siblings){
          const m=o.rasterJoin,el=o._rasterCanvas||imgEl(o.img);
          if(!fullImageMask(o)||o.kind!=='image'||!m||m.width!==meta.width||m.height!==meta.height||m.logicalW!==meta.logicalW||m.logicalH!==meta.logicalH||m.count!==meta.count||parts.has(m.part)||o.invisMask||nz(o.op,1)!==nz(first.op,1)||nz(o.blur,0)!==nz(first.blur,0)||!el)return null;
          if((el.naturalWidth||el.width)!==m.w||(el.naturalHeight||el.height)!==m.h)return null;
          if(Math.abs(o.w-m.w*m.logicalW/m.width)>1e-7||Math.abs(o.h-m.h*m.logicalH/m.height)>1e-7)return null;
          const t=matOf(o.t),p=mapply(base,m.x*m.logicalW/m.width,m.y*m.logicalH/m.height);
          if(t.slice(0,4).some((v,j)=>Math.abs(v-base[j])>1e-7)||Math.hypot(t[4]-p[0],t[5]-p[1])>1e-6)return null;
          parts.add(m.part);sources.push(el);tag.push([o.img,m.x,m.y,m.w,m.h]);
        }
        const sourceIds=sources.map(el=>{if(!_rasterJoinIds.has(el))_rasterJoinIds.set(el,++_rasterJoinNext);return _rasterJoinIds.get(el);});
        const signature=JSON.stringify(tag);let entry=_rasterJoinCache.get(meta.batch);
        if(entry&&(entry.signature!==signature||entry.sourceIds.some((id,j)=>id!==sourceIds[j]))){_rasterJoinPixels-=entry.canvas.width*entry.canvas.height;_rasterJoinCache.delete(meta.batch);entry=null;}
        if(!entry){
          const cv=document.createElement('canvas');cv.width=meta.width;cv.height=meta.height;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
          siblings.forEach((o,j)=>c.drawImage(sources[j],o.rasterJoin.x,o.rasterJoin.y));
          while(_rasterJoinCache.size&&(_rasterJoinCache.size>=8||_rasterJoinPixels+cv.width*cv.height>24000000)){const key=_rasterJoinCache.keys().next().value,old=_rasterJoinCache.get(key);_rasterJoinPixels-=old.canvas.width*old.canvas.height;_rasterJoinCache.delete(key);}
          entry={canvas:cv,sourceIds,signature};_rasterJoinPixels+=cv.width*cv.height;
        }else _rasterJoinCache.delete(meta.batch);
        _rasterJoinCache.set(meta.batch,entry);
        const result={...first,w:meta.logicalW,h:meta.logicalH,t:{...first.t,x:origin[0],y:origin[1]},_rasterCanvas:entry.canvas};
        delete result.contours; // The joined image has its own full-sized rectangle.
        if(meta.parent)result.rasterJoin=meta.parent;else delete result.rasterJoin;
        return result;
      };
      const combined=join();if(combined){output.push(combined);changed=true;}else output.push(...siblings);i=end;
    }
    if(!changed)return current;
    current=output;
  }
  return current;
}
function drawUnits(ctx, entries, opt, drawLayer) {
  entries=entries.map(e=>({...e,objs:joinedRasterCuts(e.objs)}));
  drawLayer = drawLayer || ((c, e, isMask) => { for (const o of e.objs) if (!o.invisMask) drawObj(c, o, isMask ? {} : opt); });
  const units = groupEntries(entries);
  const masks = [];
  entries.forEach((e, li) => {
    if (e.layer.visible === false) return;
    e.objs.forEach((o, oi) => { if (o.invisMask && o.kind === 'path') masks.push({ o, li, oi }); });
  });
  if (!masks.length) {
    for (const u of units) {
      if (!u.mask) drawLayer(ctx, u.e, false);
      else maskedDraw(ctx, c => { for (const m of u.members) drawLayer(c, m, false); }, c => drawLayer(c, u.mask, true));
    }
    return;
  }
  // Render each object independently. This also supports a mask and artwork
  // on the SAME layer: later objects are above earlier objects.
  const w = ctx.canvas.width, h = ctx.canvas.height, T = ctx.getTransform();
  const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
  const tc = tmp.getContext('2d');
  const cut = document.createElement('canvas'); cut.width = w; cut.height = h;
  const cc = cut.getContext('2d');
  function paint(draw, li, oi) {
    tc.setTransform(1,0,0,1,0,0); tc.globalAlpha = 1;
    tc.globalCompositeOperation = 'source-over'; tc.filter = 'none'; tc.clearRect(0,0,w,h);
    tc.setTransform(T); draw(tc);
    const above = masks.filter(m => m.li === li && m.oi > oi);
    if (above.length) {
      cc.setTransform(1,0,0,1,0,0); cc.globalAlpha = 1;
      cc.globalCompositeOperation = 'source-over'; cc.filter = 'none'; cc.clearRect(0,0,w,h);
      cc.setTransform(T);
      for (const m of above) drawObj(cc, invisMaskShape(m.o), {});
      tc.setTransform(1,0,0,1,0,0); tc.globalAlpha = 1;
      tc.globalCompositeOperation = 'destination-out'; tc.filter = 'none';
      tc.drawImage(cut,0,0);
    }
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(tmp,0,0); ctx.restore();
  }
  for (const u of units) {
    if (!u.mask) {
      const li = entries.indexOf(u.e);
      u.e.objs.forEach((o, oi) => {
        if (o.invisMask && o.kind === 'path') return;
        paint(c => drawLayer(c, Object.assign({}, u.e, { objs: [o] }), false), li, oi);
      });
    } else {
      const li = Math.max(...u.members.map(m => entries.indexOf(m)));
      paint(c => maskedDraw(c,
        mc => { for (const m of u.members) drawLayer(mc, m, false); },
        mc => drawLayer(mc, u.mask, true)), li, Number.MAX_SAFE_INTEGER);
    }
  }
}
function entriesToObjs(entries) {
  const out = [];
  for (const u of groupEntries(entries)) {
    if (!u.mask) { for (const o of u.e.objs) out.push(o); continue; }
    const kids = []; for (const m of u.members) for (const o of m.objs) kids.push(o);
    out.push({ id: 'mg' + u.mask.layer.id, kind: 'group', mask: u.mask.objs, children: kids, op: 1, t: newT() });
  }
  return out;
}
function kidsOf(o) {
  if (o.kind === 'group') return o.children || [];
  if (o.kind === 'clip') {
    const lib = _lib[o.sym];
    if (!lib) return [];
    const f = o._f || 0, ents = [], prev = _ctxEl;
    _ctxEl = o._el == null ? null : o._el;
    setSkeletonScope(lib.layers);
    for (const l of lib.layers) { if (l.visible === false) continue; ents.push({ layer: l, objs: evalLayerObjs(l, f) }); }
    _ctxEl = prev;
    return entriesToObjs(ents);
  }
  return [];
}
function fontStr(r) { return (r.i ? 'italic ' : '') + (r.b ? 'bold ' : '') + Math.max(1, r.size || 16) + 'px "' + (r.font || 'Arial') + '", Helvetica, Arial, sans-serif'; }
function measureW(r, str, ls) {
  if (_mctx) { _mctx.font = fontStr(r); return _mctx.measureText(str).width + (ls || 0) * str.length; }
  return str.length * (r.size || 16) * 0.55 + (ls || 0) * str.length;
}
/* distance from the top of a text line (where the canvas draws it) down to the alphabetic baseline, so SVG text sits where canvas text does; null if the browser can't measure it */
function baselineDrop(r) {
  if (!_mctx) return null;
  try {
    _mctx.font = fontStr(r); _mctx.textBaseline = 'top';
    const m = _mctx.measureText('Hg'); _mctx.textBaseline = 'alphabetic';
    return typeof m.alphabeticBaseline === 'number' && isFinite(m.alphabeticBaseline) && m.alphabeticBaseline !== 0 ? -m.alphabeticBaseline : null;
  } catch (e) { return null; }
}
function layoutText(o) {
  const lines = [];
  let cur = { segs: [], w: 0, h: 0 };
  const push = () => { lines.push(cur); cur = { segs: [], w: 0, h: 0 }; };
  const wrapW = o.w > 0 ? o.w : 0;
  for (const r of o.runs) {
    const lh = (r.size || 16) * 1.2;
    String(r.t).split(/\r\n|\r|\n/).forEach((part, pi) => {
      if (pi > 0) push();
      cur.h = Math.max(cur.h, lh);
      if (!part) return;
      if (wrapW && !o.nw) {
        for (const w of part.split(/(\s+)/)) {
          if (!w) continue;
          const ww = measureW(r, w, o.ls);
          if (cur.w + ww > wrapW && cur.w > 0 && w.trim()) push();
          cur.h = Math.max(cur.h, lh);
          cur.segs.push({ r, t: w, w: ww }); cur.w += ww;
        }
      } else { const ww = measureW(r, part, o.ls); cur.segs.push({ r, t: part, w: ww }); cur.w += ww; }
    });
  }
  lines.push(cur);
  let y = 0, mw = 0;
  for (const l of lines) { if (!l.h) l.h = ((o.runs[0] && o.runs[0].size) || 16) * 1.2; l.y = y; y += l.h; mw = Math.max(mw, l.w); }
  const bw = wrapW || mw;
  for (const l of lines) l.x = o.align === 'center' ? (bw - l.w) / 2 : o.align === 'right' ? bw - l.w : 0;
  return { lines, w: bw, h: y };
}
function localBounds(o) {
  if(o.mirror)return {x0:0,y0:-o.mirror.height/2,x1:o.mirror.width,y1:o.mirror.height/2};
  if (o.kind === 'path') {
    if(o._softParts)return contoursBounds(o._softParts.flatMap(p=>p.fill));
    const frame=o.arc||o.ellipseFrame;
    // A baked ellipse keeps its original alignment box until its actual
    // geometry changes. Transform/style edits leave this local frame intact.
    if(frame&&Number.isFinite(frame.rx)&&Number.isFinite(frame.ry)&&frame.rx>0&&frame.ry>0&&(o.arc||frame.path===JSON.stringify(o.contours)))return {x0:-frame.rx,y0:-frame.ry,x1:frame.rx,y1:frame.ry};
    return contoursBounds(o.contours);
  }
  if (o.kind === 'text') { const l = layoutText(o); return { x0: 0, y0: 0, x1: Math.max(l.w, 1), y1: Math.max(l.h, 1) }; }
  if (o.kind === 'image') return { x0: 0, y0: 0, x1: Math.max(o.w || 1, 1), y1: Math.max(o.h || 1, 1) };
  let b = null;
  for (const ch of kidsOf(o)) {
    const cb = localBounds(ch);
    if (!cb) continue;
    const m = matOf(ch.t);
    for (const [x, y] of [[cb.x0, cb.y0], [cb.x1, cb.y0], [cb.x1, cb.y1], [cb.x0, cb.y1]]) {
      const p = mapply(m, x, y);
      if (!b) b = { x0: p[0], y0: p[1], x1: p[0], y1: p[1] };
      else { b.x0 = Math.min(b.x0, p[0]); b.y0 = Math.min(b.y0, p[1]); b.x1 = Math.max(b.x1, p[0]); b.y1 = Math.max(b.y1, p[1]); }
    }
  }
  if (b && o.kind === 'clip' && o.pv) { b.x0 -= o.pv[0]; b.x1 -= o.pv[0]; b.y0 -= o.pv[1]; b.y1 -= o.pv[1]; }
  return b;
}
function worldCorners(o, pm) {
  const b = localBounds(o);
  if (!b) return null;
  const m = pm ? mmul(pm, matOf(o.t)) : matOf(o.t);
  return [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]].map((p) => mapply(m, p[0], p[1]));
}
function worldBounds(o) {
  const c = worldCorners(o);
  if (!c) return null;
  const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
/* shift a path's nodes so its bounds centre becomes the local origin */
function recenter(o) {
  if (o.kind !== 'path' || o.rig || o.skel) return o;
  const b = contoursBounds(o.contours);
  if (!b) return o;
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  for (const c of o.contours) for (const n of c.nodes) { n.x -= cx; n.y -= cy; }
  if (o.grad) o.grad.m = mmul([1, 0, 0, 1, -cx, -cy], o.grad.m);
  const p = mapply(matOf(o.t), cx, cy);
  o.t.x = p[0]; o.t.y = p[1];
  return o;
}
function applyMatrixToNodes(contours, m) {
  for (const c of contours) for (const n of c.nodes) {
    const p = mapply(m, n.x, n.y);
    const i = [m[0] * n.ix + m[2] * n.iy, m[1] * n.ix + m[3] * n.iy];
    const o = [m[0] * n.ox + m[2] * n.oy, m[1] * n.ox + m[3] * n.oy];
    n.x = p[0]; n.y = p[1]; n.ix = i[0]; n.iy = i[1]; n.ox = o[0]; n.oy = o[1];
  }
}
/* assign full matrix m to object (bakes skew into geometry when needed) */
function setObjMatrix(o, m) {
  const d = decompose(m);
  if (d.skew < 1e-3 || o.kind === 'clip' || o.kind === 'text' || o.kind === 'image') { o.t = { x: d.x, y: d.y, sx: d.sx, sy: d.sy, r: d.r }; return o; }
  if (o.kind === 'path') {
    delete o.rig;
    applyMatrixToNodes(o.contours, m);
    if (o.grad) o.grad.m = mmul(m, o.grad.m);
    o.t = newT();
  } else {
    const kids = o.children || [];
    o.t = newT();
    for (const ch of kids) setObjMatrix(ch, mmul(m, matOf(ch.t)));
  }
  return o;
}

/* ---------- object factories ---------- */
const KAPPA = 0.5522847498;
function mouthContour(a) {
  if(a.mouth<1e-8)return ellipseContour(a.rx,a.ry);
  const begin=a.start+a.mouth,sweep=Math.PI*2-a.mouth,count=Math.ceil(sweep/(Math.PI/2)),step=sweep/count;
  const nodes=[node(0,0),node(a.rx*Math.cos(begin),a.ry*Math.sin(begin))];
  for(let i=0;i<count;i++){
    const t=begin+i*step,u=t+step,k=4/3*Math.tan(step/4),last=nodes.at(-1),next=node(a.rx*Math.cos(u),a.ry*Math.sin(u));
    last.ox=-a.rx*Math.sin(t)*k;last.oy=a.ry*Math.cos(t)*k;
    next.ix=a.rx*Math.sin(u)*k;next.iy=-a.ry*Math.cos(u)*k;nodes.push(next);
  }
  return {closed:true,nodes};
}
function ellipseContour(rx, ry) {
  const kx = rx * KAPPA, ky = ry * KAPPA;
  return {
    closed: true, nodes: [
      { x: 0, y: -ry, ix: -kx, iy: 0, ox: kx, oy: 0, s: true },
      { x: rx, y: 0, ix: 0, iy: -ky, ox: 0, oy: ky, s: true },
      { x: 0, y: ry, ix: kx, iy: 0, ox: -kx, oy: 0, s: true },
      { x: -rx, y: 0, ix: 0, iy: ky, ox: 0, oy: -ky, s: true }]
  };
}
function rectContour(w, h, r) {
  const hw = w / 2, hh = h / 2;
  r = clamp(r || 0, 0, Math.min(hw, hh));
  if (r < 0.01) return { closed: true, nodes: [node(-hw, -hh), node(hw, -hh), node(hw, hh), node(-hw, hh)] };
  const k = r * KAPPA;
  const N = (x, y, ix, iy, ox, oy) => ({ x, y, ix, iy, ox, oy });
  return {
    closed: true, nodes: [
      N(-hw + r, -hh, -k, 0, 0, 0), N(hw - r, -hh, 0, 0, k, 0),
      N(hw, -hh + r, 0, -k, 0, 0), N(hw, hh - r, 0, 0, 0, k),
      N(hw - r, hh, k, 0, 0, 0), N(-hw + r, hh, 0, 0, -k, 0),
      N(-hw, hh - r, 0, k, 0, 0), N(-hw, -hh + r, 0, 0, 0, -k)]
  };
}
// Stroke dash patterns are stored as named presets on each path.
// Lengths are relative to the stroke width, matching SVG and Canvas rendering.
function dashArray(o) {
  const presets = { solid: [], dash: [5, 3], short: [2, 2], dot: [0.01, 2.5], dashdot: [5, 2, 0.01, 2], long: [9, 3] };
  const p = presets[o.dash] || presets.solid;
  return p.map(n => n * Math.max(0.1, o.sw || 1));
}
// Parametric Star/Cog: four corresponding edge families per tooth.
function starDefaults(radius=60) {
  return {points:5,outer:radius,inner:radius*.47,clip:radius,outerAngle:-PI/2,innerAngle:-PI/2,gap:0,corners:{left:{turn:0,depth:0},right:{turn:0,depth:0}},
    curves:{left:{bend:0,slide:0},right:{bend:0,slide:0},tip:{bend:0,slide:0},root:{bend:0,slide:0}}};
}
function starContour(shape) {
  const n=clamp(Math.round(shape.points||5),3,64),outer=Math.max(.1,shape.outer||60),inner=clamp(shape.inner||.01,.01,outer),clip=clamp(shape.clip??outer,inner,outer),step=2*PI/n;
  const polar=(r,a)=>({x:r*Math.cos(a),y:r*Math.sin(a)}),gap=clamp(shape.gap||0,0,.45)*step;
  const root=i=>{const angle=(shape.innerAngle??-PI/2)+(i+.5)*step;return [polar(inner,angle-gap),polar(inner,angle+gap)];};
  const trim=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,A=dx*dx+dy*dy,B=2*(a.x*dx+a.y*dy),D=B*B-4*A*(a.x*a.x+a.y*a.y-clip*clip);const t=A?clamp((-B+Math.sqrt(Math.max(0,D)))/(2*A),0,1):0;return {x:a.x+t*dx,y:a.y+t*dy};};
  const nodes=[];
  for(let i=0;i<n;i++){
    const tip=polar(outer,(shape.outerAngle??-PI/2)+i*step),before=root(i-1)[1],after=root(i);
    const corner=(p,side)=>{const c=shape.corners?.[side],r=clip*(1-clamp(c?.depth||0,0,.98)),angle=Math.atan2(p.y,p.x)+(c?.turn||0);return polar(r,angle);};
    for(const p of [corner(trim(before,tip),'left'),corner(trim(after[0],tip),'right'),after[0],after[1]])nodes.push(node(p.x,p.y));
  }
  const roles=['tip','right','root','left'];
  for(let i=0;i<nodes.length;i++){
    const a=nodes[i],b=nodes[(i+1)%nodes.length],c=shape.curves?.[roles[i%4]],bend=c?.bend||0,slide=c?.slide||0;
    if(!bend&&!slide)continue;
    const dx=b.x-a.x,dy=b.y-a.y,ox=dx*slide-dy*bend,oy=dy*slide+dx*bend;
    a.ox=dx/3+ox;a.oy=dy/3+oy;b.ix=-dx/3+ox;b.iy=-dy/3+oy;
  }
  return {closed:true,nodes};
}
function mkPath(contours, st, t) {
  contours=contours.map(c=>({...c,nodes:c.nodes.map(n=>({...n,s:false}))}));
  st = st || {};
  return {
    id: uid(), kind: 'path', contours,
    fill: st.fill === undefined ? '#3F5BFF' : st.fill, fa: nz(st.fa, 1),
    stroke: st.stroke === undefined ? null : st.stroke, sa: nz(st.sa, 1), sw: nz(st.sw, 2),
    cap: st.cap || 'round', join: st.join || 'round', dash: st.dash || 'solid', op: 1,
    t: Object.assign(newT(), t || {})
  };
}
function mkLayer(name) {
  return { id: uid(), name: name || 'Layer', visible: true, locked: false, kfs: [mkKf(0)] };
}
function mkKf(f, objs) { return { f, objs: objs || [], tween: 'none', ease: { type: 'linear', amt: 50 } }; }
function mkDoc() {
  const l = mkLayer('Layer 1');
  return { w: 640, h: 360, fps: 24, bg: '#FFFFFF', frames: 48, layers: [l], lib: {}, sounds: {}, images: {} };
}
function normalizeDoc(d) {
  d.w = clamp(+d.w || 640, 16, 4096); d.h = clamp(+d.h || 360, 16, 4096);
  d.lib = d.lib || {}; d.sounds = d.sounds || {}; d.images = d.images || {};
  d.fps = clamp(+d.fps || 24, 1, 120); d.bg = /^(#[0-9a-f]{3,8}|transparent)$/i.test(String(d.bg || '')) ? String(d.bg) : '#FFFFFF'; d.frames = clamp(Math.round(+d.frames || 1), 1, 900);
  if (!Array.isArray(d.layers) || !d.layers.length) d.layers = [mkLayer('Layer 1')];
  for (const l of d.layers) {
    l.id = l.id || uid(); l.name = l.name || 'Layer'; l.visible = l.visible !== false; l.locked = !!l.locked;
    if (!Array.isArray(l.kfs) || !l.kfs.length) l.kfs = [mkKf(0)];
    l.kfs.sort((a, b) => a.f - b.f);
    if (l.kfs[0].f !== 0) l.kfs.unshift(mkKf(0));
    for (const k of l.kfs) { k.objs = k.objs || []; k.tween = k.tween || 'none'; k.ease = k.ease || { type: 'linear', amt: 50 }; if (k.scene != null) k.scene = String(k.scene).slice(0, 80); }
    const mx = l.kfs[l.kfs.length - 1].f + 1;
    if (mx > d.frames) d.frames = mx;
  }
  d.frames = Math.min(d.frames, 900);
  for(const owner of [d,...Object.values(d.lib)])if(owner&&Array.isArray(owner.onionFrames))owner.onionFrames=Array.from(new Set(owner.onionFrames.filter(f=>Number.isInteger(f)&&f>=0&&f<(owner.frames||d.frames)))).sort((a,b)=>a-b).slice(0,10);
  normRigs(d.layers); for (const k of Object.keys(d.lib)) if (d.lib[k]) normRigs(d.lib[k].layers);
  if (d.lang !== 'as1') delete d.lang;
  return d;
}

/* ---------- easing ---------- */
function bezierEase(p, x1, y1, x2, y2) {
  if (p <= 0) return 0; if (p >= 1) return 1;
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t, dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  let t = p;
  for (let i = 0; i < 8; i++) { const e = X(t) - p; if (Math.abs(e) < 1e-6) return Y(t); const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
  let lo = 0, hi = 1; t = p;
  for (let i = 0; i < 40; i++) { const e = X(t); if (Math.abs(e - p) < 1e-6) break; if (e < p) lo = t; else hi = t; t = (lo + hi) / 2; }
  return Y(t);
}
function ease(type, amt, p, pts) {
  if (type === 'bezier' && pts && pts.length === 4) return bezierEase(p, +pts[0], +pts[1], +pts[2], +pts[3]);
  const a = clamp(amt == null ? 50 : amt, 0, 100) / 100, k = 1 + a * 3;
  switch (type) {
    case 'in': return Math.pow(p, k);
    case 'out': return 1 - Math.pow(1 - p, k);
    case 'inout': return p < 0.5 ? 0.5 * Math.pow(2 * p, k) : 1 - 0.5 * Math.pow(2 * (1 - p), k);
    case 'bounce':
      if (p < 1 / 2.75) return 7.5625 * p * p;
      if (p < 2 / 2.75) { p -= 1.5 / 2.75; return 7.5625 * p * p + 0.75; }
      if (p < 2.5 / 2.75) { p -= 2.25 / 2.75; return 7.5625 * p * p + 0.9375; }
      p -= 2.625 / 2.75; return 7.5625 * p * p + 0.984375;
    case 'elastic': return p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (2 * PI / 3)) + 1;
    default: return p;
  }
}

/* ---------- shape morphing ---------- */
function segCount(c) { return c.closed ? c.nodes.length : Math.max(0, c.nodes.length - 1); }
function segLen(a, b) {
  const x1 = a.x + a.ox, y1 = a.y + a.oy, x2 = b.x + b.ix, y2 = b.y + b.iy;
  return Math.hypot(x1 - a.x, y1 - a.y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(b.x - x2, b.y - y2);
}
function subdivideTo(c, target) {
  const nodes = c.nodes.map((n) => Object.assign({}, n));
  for (let guard = 0; guard < 5000; guard++) {
    const segs = c.closed ? nodes.length : nodes.length - 1;
    if (segs >= target) break;
    let bi = 0, bl = -1;
    for (let i = 0; i < segs; i++) { const l = segLen(nodes[i], nodes[(i + 1) % nodes.length]); if (l > bl) { bl = l; bi = i; } }
    const j = (bi + 1) % nodes.length;
    const r = splitSeg(nodes[bi], nodes[j], 0.5);
    nodes[bi] = r[0]; nodes[j] = r[2];
    nodes.splice(bi + 1, 0, r[1]);
  }
  return nodes;
}
function signedArea(nodes) {
  let s = 0;
  for (let i = 0; i < nodes.length; i++) { const a = nodes[i], b = nodes[(i + 1) % nodes.length]; s += a.x * b.y - b.x * a.y; }
  return s / 2;
}
function reverseNodes(nodes) {
  return nodes.slice().reverse().map((n) => Object.assign({}, n, { ix: n.ox, iy: n.oy, ox: n.ix, oy: n.iy }));
}
function alignNodes(A, B, closed) {
  let nb = B;
  if (closed) {
    if (signedArea(A) * signedArea(nb) < 0) nb = reverseNodes(nb);
    const n = A.length;
    if (n <= 240) {
      let best = 0, bc = Infinity;
      for (let k = 0; k < n; k++) {
        let cst = 0;
        for (let i = 0; i < n; i++) { const q = nb[(i + k) % n]; cst += (A[i].x - q.x) ** 2 + (A[i].y - q.y) ** 2; }
        if (cst < bc) { bc = cst; best = k; }
      }
      if (best) nb = nb.slice(best).concat(nb.slice(0, best));
    }
  } else {
    const n = nb.length;
    const d0 = Math.hypot(A[0].x - nb[0].x, A[0].y - nb[0].y) + Math.hypot(A[A.length - 1].x - nb[n - 1].x, A[A.length - 1].y - nb[n - 1].y);
    const d1 = Math.hypot(A[0].x - nb[n - 1].x, A[0].y - nb[n - 1].y) + Math.hypot(A[A.length - 1].x - nb[0].x, A[A.length - 1].y - nb[0].y);
    if (d1 < d0) nb = reverseNodes(nb);
  }
  return nb;
}
function lerpNode(a, b, p) {
  return { ...(a.mid&&a.mid===b.mid?{mid:a.mid,...(a.birth||b.birth?{birth:clone(a.birth||b.birth)}:{})}:{}), x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), ix: lerp(a.ix, b.ix, p), iy: lerp(a.iy, b.iy, p), ox: lerp(a.ox, b.ox, p), oy: lerp(a.oy, b.oy, p) };
}
// Inserted nodes retain their parent edge, so a tween subdivides that same
// edge at its other endpoint instead of assigning an existing corner to it.
function morphNodePair(a,b) {
  if(!a.nodes.every(n=>n.mid)||!b.nodes.every(n=>n.mid))return null;
  const na=clone(a.nodes),nb=clone(b.nodes),all=new Map([...na,...nb].map(n=>[n.mid,n]));
  // A deleted node becomes a virtual subdivision on its surviving edge.
  for(const n of [...(a.gone||[]),...(b.gone||[])])all.set(n.mid,n);
  if(new Set(na.map(n=>n.mid)).size!==na.length||new Set(nb.map(n=>n.mid)).size!==nb.length)return null;
  const expand=nodes=>{
    for(let pass=0;pass<all.size;pass++){
      const have=new Set(nodes.map(n=>n.mid));let changed=false;
      for(const [id,n] of all){
        if(have.has(id)||!n.birth)continue;
        const [left,right,t]=n.birth,i=nodes.findIndex(n=>n.mid===left),j=(i+1)%nodes.length;
        if(n.end&&!a.closed){
          const at=n.end==='start'?0:nodes.length-1;if(nodes[at].mid!==left)continue;
          const v={...nodes[at],mid:id,birth:n.birth.slice(),ix:0,iy:0,ox:0,oy:0,s:false};
          if(n.end==='start'){nodes[at].ix=nodes[at].iy=0;nodes.unshift(v);}else{nodes[at].ox=nodes[at].oy=0;nodes.push(v);}
          have.add(id);changed=true;continue;
        }
        if(i<0||(!a.closed&&j===0)||nodes[j].mid!==right)continue;
        const pending=[...all.values()].filter(q=>!have.has(q.mid)&&!q.end&&q.birth?.[0]===left&&q.birth?.[1]===right).sort((a,b)=>a.birth[2]-b.birth[2]);
        let previous=nodes[i],last=nodes[j],lastT=0;
        for(const q of pending){
          const u=clamp(q.birth[2],lastT,1),r=splitSeg(previous,last,lastT<1?(u-lastT)/(1-lastT):0);
          r[1].mid=q.mid;r[1].birth=q.birth.slice();
          const pi=nodes.indexOf(previous),li=nodes.indexOf(last);nodes[pi]=r[0];nodes[li]=r[2];nodes.splice(pi+1,0,r[1]);
          previous=r[1];last=r[2];lastT=u;have.add(q.mid);changed=true;
        }
      }
      if(!changed)break;
    }
  };
  expand(na);expand(nb);
  if(na.length!==nb.length||na.some(n=>!nb.some(m=>m.mid===n.mid)))return null;
  let aligned=nb;
  if(a.closed){
    const first=nb.findIndex(n=>n.mid===na[0].mid);aligned=nb.slice(first).concat(nb.slice(0,first));
    if(na.length>2&&aligned[1].mid!==na[1].mid){const rev=reverseNodes(nb),k=rev.findIndex(n=>n.mid===na[0].mid);aligned=rev.slice(k).concat(rev.slice(0,k));}
  } else if(aligned[0].mid!==na[0].mid)aligned=reverseNodes(aligned);
  return na.every((n,i)=>n.mid===aligned[i].mid)?[na,aligned]:null;
}
function morphContours(A, B, p) {
  if (!A.length || A.length !== B.length) return null;
  const out = [];
  for (let i = 0; i < A.length; i++) {
    const a = A[i], b = B[i];
    if (a.closed !== b.closed || a.nodes.length < 2 || b.nodes.length < 2) return null;
    const tgt = Math.max(segCount(a), segCount(b));
    const pair=morphNodePair(a,b);
    const na = pair?pair[0]:subdivideTo(a, tgt);
    const nb = pair?pair[1]:alignNodes(na, subdivideTo(b, tgt), a.closed);
    const gone=[...new Map([...(a.gone||[]),...(b.gone||[])].map(n=>[n.mid,n])).values()];
    out.push({ closed: a.closed, ...(pair&&gone.length?{gone:clone(gone)}:{}), nodes: na.map((n, j) => lerpNode(n, nb[j], p)) });
  }
  return out;
}

/* ---------- timeline evaluation ---------- */
// V2.5: Tween rotation follows the shortest angular path (degrees).
// Preserve the original direction for exact 180-degree ties.
function lerpAngleShortest(a, b, p) {
  const raw = b - a;
  let delta = ((raw % 360) + 540) % 360 - 180;
  if (delta === -180 && raw > 0) delta = 180;
  return a + delta * p;
}
// V2.6: direction and extra complete turns are per Motion Tween keyframe.
function lerpAngleTween(a, b, p, rot) {
  if(Number.isFinite(rot?.delta))return a+rot.delta*p;
  if (!rot) return lerpAngleShortest(a, b, p);
  const mode = rot.dir === 'cw' || rot.dir === 'ccw' ? rot.dir : 'short';
  const turns = Math.max(0, Math.min(100, Math.floor(Number(rot.turns) || 0)));
  const raw = b - a;
  let delta = ((raw % 360) + 360) % 360; // clockwise, 0..359
  if (mode === 'ccw') delta = delta === 0 ? 0 : delta - 360;
  if (mode === 'short') delta = lerpAngleShortest(a, b, 1) - a;
  const sign = mode === 'ccw' ? -1 : mode === 'cw' ? 1 : delta < 0 ? -1 : 1;
  return a + (delta + sign * turns * 360) * p;
}
function lerpT(a, b, p, rot) { return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), sx: lerp(a.sx, b.sx, p), sy: lerp(a.sy, b.sy, p), r: lerpAngleTween(a.r, b.r, p, rot) }; }
function lerpPaint(o, a, b, p) {
  for (const k of ['fill', 'stroke']) {
    const ak = k === 'fill' ? 'fa' : 'sa';
    const ca = a[k], cb = b[k];
    if (ca && cb) { o[k] = lerpHex(ca, cb, p); o[ak] = lerp(nz(a[ak], 1), nz(b[ak], 1), p); }
    else if (ca || cb) { o[k] = ca || cb; o[ak] = lerp(ca ? nz(a[ak], 1) : 0, cb ? nz(b[ak], 1) : 0, p); }
  }
  o.sw = lerp(a.sw || 0, b.sw || 0, p);
  o.dash = p < 0.5 ? (a.dash || 'solid') : (b.dash || 'solid');
}
/* ---------- bone arm: shoulder -> elbow -> hand with two-bone IK ----------
   A rig is an ordinary path object that also carries o.rig = { s:[x,y], h:[x,y], l1, l2, flip, w:[r0,r1,r2] } in the object's own space.
   The outline (o.contours) is derived from the rig, so every renderer and exporter draws it like any other shape; tweens interpolate the rig and rebuild it. */
function rigSolve(g) {
  const sx = g.s[0], sy = g.s[1], dx = g.h[0] - sx, dy = g.h[1] - sy, d = Math.hypot(dx, dy);
  const l1 = g.l1, l2 = g.l2, lo = Math.abs(l1 - l2) + 1e-6, hi = l1 + l2 - 1e-6;
  const ux = d > 1e-9 ? dx / d : 1, uy = d > 1e-9 ? dy / d : 0;
  const dc = Math.min(Math.max(d, lo), hi);
  const a = (l1 * l1 - l2 * l2 + dc * dc) / (2 * dc), h = Math.sqrt(Math.max(0, l1 * l1 - a * a)), fl = g.flip < 0 ? -1 : 1;
  return { s: [sx, sy], e: [sx + ux * a - uy * h * fl, sy + uy * a + ux * h * fl], h: [sx + ux * dc, sy + uy * dc], reach: d > hi || d < lo };
}
function rigContours(g) {
  const k = rigSolve(g), P = [k.s, k.e, k.h], r = g.w, out = [];
  const circ = (p, rad) => { const c = ellipseContour(rad, rad); for (const n of c.nodes) { n.x += p[0]; n.y += p[1]; } return c; };
  const seg = (A, B, ra, rb) => {
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    let q = [[A[0] + nx * ra, A[1] + ny * ra], [B[0] + nx * rb, B[1] + ny * rb], [B[0] - nx * rb, B[1] - ny * rb], [A[0] - nx * ra, A[1] - ny * ra]];
    let area = 0; for (let i = 0; i < 4; i++) { const u = q[i], v = q[(i + 1) % 4]; area += u[0] * v[1] - v[0] * u[1]; }
    if (area < 0) q = q.reverse();
    return { closed: true, nodes: q.map((u) => ({ x: u[0], y: u[1], ix: 0, iy: 0, ox: 0, oy: 0 })) };
  };
  out.push(seg(P[0], P[1], r[0], r[1]), seg(P[1], P[2], r[1], r[2]));
  for (let i = 0; i < 3; i++) out.push(circ(P[i], r[i]));
  return out;
}
function rigBuild(o) { o.contours = rigContours(o.rig); o.nz = true; return o; }
function rigValid(g) {
  const num = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
  const pt = (p) => Array.isArray(p) && p.length === 2 && num(p[0], -1e6, 1e6) && num(p[1], -1e6, 1e6);
  return !!g && pt(g.s) && pt(g.h) && num(g.l1, 1, 1e5) && num(g.l2, 1, 1e5) && Array.isArray(g.w) && g.w.length === 3 && g.w.every((v) => num(v, 0.5, 1e4));
}
function lerpRig(a, b, p) {
  const L = (x, y) => x + (y - x) * p;
  return { s: [L(a.s[0], b.s[0]), L(a.s[1], b.s[1])], h: [L(a.h[0], b.h[0]), L(a.h[1], b.h[1])], l1: L(a.l1, b.l1), l2: L(a.l2, b.l2), flip: a.flip < 0 ? -1 : 1, w: a.w.map((v, i) => L(v, b.w[i])) };
}
function normRigs(layers) {
  for (const l of layers || []) for (const k of l.kfs || []) for (const o of k.objs || []) {
    if (o.bind && !(o.kind === 'clip' && bindValid(o.bind))) delete o.bind;
    if(o.skin&&!softValid(o.skin))delete o.skin;
    if(o.sbind && !(typeof o.sbind.to==='string' && typeof o.sbind.joint==='string' && [o.sbind.lx,o.sbind.ly,o.sbind.lr].every(Number.isFinite)))delete o.sbind;
    if(o.arc&&!(o.kind==='path'&&['rx','ry','start','mouth'].every(k=>Number.isFinite(o.arc[k]))&&o.arc.rx>0&&o.arc.ry>0&&o.arc.mouth>=0&&o.arc.mouth<=359*Math.PI/180))delete o.arc;
    if(o.skel) {if(o.kind==='path'&&skeletonValid(o.skel))skeletonBuild(o);else delete o.skel;}
    if (!o.rig) continue;
    o.rig.ghost = !!o.rig.ghost;
    if (o.kind === 'path' && rigValid(o.rig)) { o.rig.flip = o.rig.flip < 0 ? -1 : 1; rigBuild(o); } else delete o.rig;
  }
}
/* Branching, editor-only skeletons. Coordinates are ordinary keyframe data;
   exports evaluate attachments but never draw the control skeleton. */
const skeletonScopes = new WeakMap();
function setSkeletonScope(ls) { for(const l of ls||[])skeletonScopes.set(l,ls); }
function skeletonValid(g) {
  if(!g||!Array.isArray(g.nodes)||!g.nodes.length||g.nodes.length>256)return false;
  if((g.stiffness!=null&&!Number.isFinite(g.stiffness))||(g.damping!=null&&!Number.isFinite(g.damping)))return false;
  const ids=new Set();
  for(const n of g.nodes) {
    if(!n||typeof n.id!=='string'||ids.has(n.id)||n.id.length>80||![n.x,n.y,n.rx,n.ry].every(v=>typeof v==='number'&&isFinite(v)&&Math.abs(v)<=1e6))return false;
    if(n.parent!=null&&!ids.has(n.parent))return false; // parents precede children: cycles cannot enter the solver
    ids.add(n.id);
  }
  return g.nodes.filter(n=>n.parent==null).length===1;
}
function skeletonBuild(o) {
  const g=o.skel,byId=new Map(g.nodes.map(n=>[n.id,n]));
  if(Array.isArray(g.rigids))g.rigids=g.rigids.filter(r=>r&&Array.isArray(r.points)).map(r=>({...r,points:r.points.filter(p=>p&&typeof p.id==='string'&&byId.has(p.id)&&Number.isFinite(p.x)&&Number.isFinite(p.y))})).filter(r=>r.points.length>=2);
  o.contours=g.nodes.filter(n=>n.parent!=null).map(n=>({closed:false,nodes:[byId.get(n.parent),n].map(p=>({x:p.x,y:p.y,ix:0,iy:0,ox:0,oy:0}))}));
  return o;
}
function skeletonFrame(o,id,atNode=false) {
  const n=o.skel.nodes.find(n=>n.id===id),p=n&&o.skel.nodes.find(p=>p.id===n.parent);
  if(!n)return null;
  const M=matOf(o.t),b=mapply(M,n.x,n.y);
  if(!p)return atNode?{x:b[0],y:b[1],r:Math.atan2(M[1],M[0])*180/PI}:null;
  const a=mapply(M,p.x,p.y);
  return {x:atNode?b[0]:a[0],y:atNode?b[1]:a[1],r:Math.atan2(b[1]-a[1],b[0]-a[0])*180/PI};
}
function skeletonOffsets(o,rig,joint,atNode=o.sbind?.node===true) {
  const f=skeletonFrame(rig,joint,atNode);if(!f)return null;
  const a=f.r*PI/180,c=Math.cos(a),s=Math.sin(a),dx=o.t.x-f.x,dy=o.t.y-f.y;
  const bind={to:rig.id,joint,lx:c*dx+s*dy,ly:-s*dx+c*dy,lr:lerpAngleShortest(f.r,o.t.r,1)-f.r};if(atNode)bind.node=true;return bind;
}
function skeletonBoundPose(o,rig) {
  const f=skeletonFrame(rig,o.sbind.joint,o.sbind.node===true);if(!f)return o.t;
  const b=o.sbind,a=f.r*PI/180,c=Math.cos(a),s=Math.sin(a);
  return {...o.t,x:f.x+c*b.lx-s*b.ly,y:f.y+s*b.lx+c*b.ly,r:f.r+b.lr};
}
function skeletonPoseObject(o,t) {
  // Graphic/movie-clip playback metadata is non-enumerable. Preserve it when
  // returning a posed copy, rather than freezing bound symbols on frame zero.
  const copy=Object.defineProperties({},Object.getOwnPropertyDescriptors(o));copy.t=t;return copy;
}
/* Soft bodies: vector contour skinning with bind-time silhouette regions.
   Only canonical bind geometry is persisted; every pose is evaluated afresh. */
/* Bind-time distances travel through the filled silhouette, never across the
   empty space between limbs. Persist only sparse contour samples, not a mesh
   or a per-frame grid. Moving/crossing limbs cannot change their ownership. */
function softRegions(s,nz=false) {
  const bounds=contoursBounds(s.base);if(!bounds)return null;
  const short=Math.min(...s.bones.map(b=>Math.hypot(b.bx-b.ax,b.by-b.ay))),span=Math.max(bounds.x1-bounds.x0,bounds.y1-bounds.y0),cell=Math.max(span/128,short/10,.001),x0=bounds.x0-cell,y0=bounds.y0-cell,W=Math.ceil((bounds.x1-bounds.x0)/cell)+2,H=Math.ceil((bounds.y1-bounds.y0)/cell)+2,size=W*H;
  const path=new Path2D();tracePath(path,s.base);const ctx=document.createElement('canvas').getContext('2d'),inside=new Uint8Array(size),cells=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(ctx.isPointInPath(path,x0+(x+.5)*cell,y0+(y+.5)*cell,nz?'nonzero':'evenodd')){inside[i]=1;cells.push(i);}}
  if(!cells.length)return null;
  const step=Math.max(.5,short/8),samples=[],regions=s.base.map(c=>c.nodes.slice(0,c.closed?c.nodes.length:c.nodes.length-1).map((a,i)=>{
    const b=c.nodes[(i+1)%c.nodes.length],length=Math.hypot(a.ox,a.oy)+Math.hypot(b.x+b.ix-a.x-a.ox,b.y+b.iy-a.y-a.oy)+Math.hypot(b.ix,b.iy),N=clamp(Math.ceil(length/step),1,32),segment=[];
    for(let j=0;j<=N;j++){
      const p=bezPt(a,b,j/N),gx=Math.floor((p[0]-x0)/cell),gy=Math.floor((p[1]-y0)/cell);let best=-1,distance=Infinity;
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=gx+dx,y=gy+dy;if(x<0||x>=W||y<0||y>=H||!inside[y*W+x])continue;const d=Math.hypot(p[0]-x0-(x+.5)*cell,p[1]-y0-(y+.5)*cell);if(d<distance){distance=d;best=y*W+x;}}
      if(best<0)return null;
      const entry=[];segment.push(entry);samples.push({cell:best,offset:distance,entry,x:p[0],y:p[1]});
    }return segment;
  }));
  if(regions.some(c=>c.some(segment=>!segment)))return null;
  const children=new Map();for(const b of s.bones){if(!children.has(b.parent))children.set(b.parent,[]);children.get(b.parent).push(b);}
  const gates=s.bones.map(b=>{const result=[];let current=b;const seen=new Set();while(current&&!seen.has(current.id)){seen.add(current.id);const incoming=s.bones.find(q=>q.id===current.parent);if(incoming&&(children.get(current.parent)?.length||0)>1){const dx=incoming.bx-incoming.ax,dy=incoming.by-incoming.ay,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;if(((b.ax+b.bx)/2-incoming.bx)*ux+((b.ay+b.by)/2-incoming.by)*uy>1e-5)result.push({x:incoming.bx,y:incoming.by,ux,uy,width:Math.max(cell*2,L*.25)});}current=incoming;}return result;});
  const neighbours=[[-1,0,1],[1,0,1],[0,-1,1],[0,1,1],[-1,-1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[1,1,Math.SQRT2]];
  for(let bi=0;bi<s.bones.length;bi++){
    const b=s.bones[bi],vx=b.bx-b.ax,vy=b.by-b.ay,l2=vx*vx+vy*vy,dist=new Float64Array(size);dist.fill(Infinity);const heap=[];
    const push=(index,d)=>{let i=heap.length;heap.push([index,d]);while(i){const p=(i-1)>>1;if(heap[p][1]<=d)break;heap[i]=heap[p];i=p;}heap[i]=[index,d];};
    const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let k=i*2+1;if(k+1<heap.length&&heap[k+1][1]<heap[k][1])k++;if(heap[k][1]>=last[1])break;heap[i]=heap[k];i=k;}heap[i]=last;}return first;};
    for(const i of cells){const x=x0+(i%W+.5)*cell,y=y0+(Math.floor(i/W)+.5)*cell,t=clamp(((x-b.ax)*vx+(y-b.ay)*vy)/l2,0,1),d=Math.hypot(x-b.ax-t*vx,y-b.ay-t*vy);if(d<=cell*.8){dist[i]=d;push(i,d);}}
    while(heap.length){const [i,d]=pop();if(d!==dist[i])continue;const x=i%W,y=Math.floor(i/W);for(const [dx,dy,length] of neighbours){const nx=x+dx,ny=y+dy,j=ny*W+nx;if(nx<0||nx>=W||ny<0||ny>=H||!inside[j]||(dx&&dy&&(!inside[y*W+nx]||!inside[ny*W+x])))continue;const nd=d+cell*length;if(nd<dist[j]){dist[j]=nd;push(j,nd);}}}
    for(const sample of samples){let gate=1;for(const g of gates[bi]){const side=(sample.x-g.x)*g.ux+(sample.y-g.y)*g.uy;gate*=clamp(1+side/g.width,0,1);}if(gate<=0)continue;const d=dist[sample.cell]+sample.offset+(1-gate)*Math.hypot(b.bx-b.ax,b.by-b.ay);if(!Number.isFinite(d))continue;sample.entry.push([bi,+d.toFixed(5)]);sample.entry.sort((a,b)=>a[1]-b[1]);if(sample.entry.length>6)sample.entry.pop();}
  }
  if(samples.some(q=>!q.entry.length))return null;
  return regions;
}
function softRegionsValid(s) {
  const regions=s.regions;if(regions==null)return true;
  return Array.isArray(regions)&&regions.length===s.base.length&&regions.every((c,ci)=>Array.isArray(c)&&c.length===(s.base[ci].closed?s.base[ci].nodes.length:s.base[ci].nodes.length-1)&&c.every(segment=>Array.isArray(segment)&&segment.length>=2&&segment.length<=33&&segment.every(sample=>Array.isArray(sample)&&sample.length>0&&sample.length<=6&&sample.every(p=>Array.isArray(p)&&p.length===2&&Number.isInteger(p[0])&&p[0]>=0&&p[0]<s.bones.length&&Number.isFinite(p[1])&&p[1]>=0))));
}

/* A branch's consecutive bones form one overlapping body part. Order belongs
   to the keyframe; generated masks/paths never enter project history. */
function softGroups(s) {
  const byId=new Map(s.bones.map(b=>[b.id,b])),children=new Map(),groups=[];
  for(const b of s.bones){if(!children.has(b.parent))children.set(b.parent,[]);children.get(b.parent).push(b.id);}
  for(const b of s.bones){let root=b,seen=new Set();while(byId.has(root.parent)&&children.get(root.parent)?.length===1&&!seen.has(root.id)){seen.add(root.id);root=byId.get(root.parent);}let group=groups.find(g=>g.id===root.id);if(!group){group={id:root.id,bones:[]};groups.push(group);}group.bones.push(b.id);}
  return groups;
}
function softJointGroup(s,joint) {
  const groups=softGroups(s),bone=s.bones.find(b=>b.id===joint)||s.bones.filter(b=>b.parent===joint).filter((b,i,a)=>a.length===1)[0];
  return bone?groups.find(g=>g.bones.includes(bone.id))?.id:null;
}
function softOrder(s) {const ids=softGroups(s).map(g=>g.id);return [...(s.order||[]).filter(id=>ids.includes(id)),...ids.filter(id=>!(s.order||[]).includes(id))];}
const softPartLabels=new WeakMap();
function softParts(o,contours,rig) {
  const s=o.skin;if(!s.order||!s.regions||s.base.length!==1||!s.base[0].closed)return null;
  const groups=softGroups(s);if(groups.length<2)return null;
  let labels=softPartLabels.get(s.regions);
  if(!labels){
    const owner=new Map();groups.forEach(g=>g.bones.forEach(id=>owner.set(id,g.id)));
    const votes=entry=>{const result=new Map(),floor=entry[0][1],L=s.bones[entry[0][0]],reach=Math.max(.5,Math.hypot(L.bx-L.ax,L.by-L.ay)*.55);for(const [i,d] of entry){const b=s.bones[i],radius=Math.hypot(b.bx-b.ax,b.by-b.ay)*.165,fade=clamp(1-(d-floor)/reach,0,1),w=fade*fade*(3-2*fade)/Math.pow(d*d+radius*radius+1e-8,2),g=owner.get(b.id);result.set(g,(result.get(g)||0)+w);}return result;};
    labels=[];for(const segment of s.regions[0])for(let j=0;j<segment.length-1;j++){const v=votes(segment[j]);for(const [id,w] of votes(segment[j+1]))v.set(id,(v.get(id)||0)+w);labels.push([...v].sort((a,b)=>b[1]-a[1])[0][0]);}
    softPartLabels.set(s.regions,labels);
  }
  const nodes=contours[0].nodes,N=nodes.length;if(labels.length!==N)return null;
  const rm=mmul(minv(s.object),matOf(rig.t)),jointPositions=new Map(rig.skel.nodes.map(n=>[n.id,mapply(rm,n.x,n.y)])),groupJoints=g=>new Set(s.bones.filter(b=>g.bones.includes(b.id)).flatMap(b=>[b.parent,b.id]));
  const graph=new Map();for(const b of s.bones){if(!graph.has(b.parent))graph.set(b.parent,[]);if(!graph.has(b.id))graph.set(b.id,[]);graph.get(b.parent).push(b.id);graph.get(b.id).push(b.parent);}
  const route=(start,end)=>{if(start===end)return [start];const parent=new Map([[start,null]]),queue=[start];for(let i=0;i<queue.length&&!parent.has(end);i++)for(const n of graph.get(queue[i])||[])if(!parent.has(n)){parent.set(n,queue[i]);queue.push(n);}if(!parent.has(end))return [start];const out=[];for(let n=end;n!=null;n=parent.get(n))out.unshift(n);return out;};
  const junction=(group,otherId)=>{const own=groupJoints(group),other=groups.find(g=>g.id===otherId);if(!other)return [...own][0];const target=groupJoints(other),common=[...target].find(j=>own.has(j));if(common)return common;let best=null;for(const a of own)for(const b of target){const path=route(a,b);if(!best||path.length<best.length)best=path;}return best?.[0]||[...own][0];};
  const parts=[];
  for(const id of softOrder(s)){

    if(labels.every(g=>g===id)){parts.push({id,fill:[contours[0]],outline:[contours[0]]});continue;}
    const runs=[];
    for(let i=0;i<N;i++)if(labels[i]===id&&labels[(i+N-1)%N]!==id){let end=i;const run=[{...nodes[i],ix:0,iy:0}];while(labels[end%N]===id){end++;run.push({...nodes[end%N]});}run.at(-1).ox=run.at(-1).oy=0;runs.push({closed:false,nodes:run,before:labels[(i+N-1)%N],after:labels[end%N]});}
    const group=groups.find(g=>g.id===id),bridges=[];for(let i=0;i<N;i++){const before=labels[(i+N-1)%N],after=labels[i];if(before===after||before===id||after===id)continue;const a=groups.find(g=>g.id===before),b=groups.find(g=>g.id===after),path=route(junction(a,after),junction(b,before));let first=-1,last=-1;for(let j=0;j<path.length-1;j++)if(s.bones.some(b=>group.bones.includes(b.id)&&((b.parent===path[j]&&b.id===path[j+1])||(b.id===path[j]&&b.parent===path[j+1])))){if(first<0)first=j;last=j+1;}if(first>=0){const joints=path.slice(first,last+1).map(j=>node(...jointPositions.get(j))),v={...nodes[i],ix:0,iy:0,ox:0,oy:0};bridges.push({closed:true,nodes:[joints[0],v,...joints.slice(1).reverse()]});}}
    if(runs.length){const fill=[];for(let ri=0;ri<runs.length;ri++){const run=runs[ri],next=runs[(ri+1)%runs.length];fill.push(...run.nodes.map(n=>({...n})));for(const joint of route(junction(group,run.after),junction(group,next.before))){const p=jointPositions.get(joint);if(p)fill.push(node(...p));}}parts.push({id,fill:[{closed:true,nodes:fill},...bridges],outline:runs.map(({closed,nodes})=>({closed,nodes}))});}else if(bridges.length)parts.push({id,fill:bridges,outline:[]});
  }
  return parts.length>1?parts:null;
}
/* Experimental, pose-only contour repair. Bind geometry is never rewritten.
   Small new backtracking loops are removed before bounded-error cubic fitting. */
function softBaseCorner(nodes,i,closed){
  if(!closed&&(i===0||i===nodes.length-1))return true;
  const p=nodes[(i+nodes.length-1)%nodes.length],n=nodes[i],q=nodes[(i+1)%nodes.length];
  const ax=n.ix||n.iy?-n.ix:n.x-p.x,ay=n.ix||n.iy?-n.iy:n.y-p.y;
  const bx=n.ox||n.oy?n.ox:q.x-n.x,by=n.ox||n.oy?n.oy:q.y-n.y;
  const length=Math.hypot(ax,ay)*Math.hypot(bx,by);
  return length>1e-12&&(ax*bx+ay*by)/length<Math.cos(Math.PI/5);
}
function softAdaptiveContour(contour,scale){
  const tolerance=clamp(scale*.003,.015,.65),source=contour.nodes,closed=!!contour.closed;
  if(source.length<2)return contour;
  const points=[],dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const lineDistance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,t=d?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/d,0,1):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
  const push=p=>{if(points.length&&dist(points.at(-1),p)<1e-9){points.at(-1).corner||=p.corner;return;}points.push(p);};
  const flatten=(a,b,c,d,depth=0)=>{
    if(depth>=9||Math.max(lineDistance(b,a,d),lineDistance(c,a,d))<=tolerance*.2){push(d);return;}
    const mix=(p,q)=>({x:(p.x+q.x)/2,y:(p.y+q.y)/2}),ab=mix(a,b),bc=mix(b,c),cd=mix(c,d),abc=mix(ab,bc),bcd=mix(bc,cd),mid=mix(abc,bcd);
    flatten(a,ab,abc,mid,depth+1);flatten(mid,bcd,cd,d,depth+1);
  };
  push({x:source[0].x,y:source[0].y,corner:!!source[0].softCorner});
  for(let i=0;i<(closed?source.length:source.length-1);i++){
    const a=source[i],b=source[(i+1)%source.length];
    flatten({x:a.x,y:a.y},{x:a.x+a.ox,y:a.y+a.oy},{x:b.x+b.ix,y:b.y+b.iy},{x:b.x,y:b.y,corner:!!b.softCorner});
    if(points.length>4096)return contour;
  }
  if(closed&&dist(points[0],points.at(-1))<1e-8)points.pop();
  // Do not bridge large limb crossings or erase intentional bind-time corners.
  for(let pass=0;pass<12;pass++){
    let repaired=false;const n=points.length,count=closed?n:n-1;
    for(let i=0;i<count&&!repaired;i++){
      const a=points[i],b=points[(i+1)%n];let arc=dist(a,b);
      for(let j=i+2;j<count&&arc<scale*1.25;j++){
        arc+=dist(points[j-1],points[j]);if(closed&&i===0&&j===n-1)continue;
        const c=points[j],d=points[(j+1)%n],rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,det=rx*sy-ry*sx;
        if(Math.abs(det)<1e-12)continue;
        const dx=c.x-a.x,dy=c.y-a.y,t=(dx*sy-dy*sx)/det,u=(dx*ry-dy*rx)/det;
        if(t<=1e-7||t>=1-1e-7||u<=1e-7||u>=1-1e-7)continue;
        const q={x:a.x+t*rx,y:a.y+t*ry},loop=[q,...points.slice(i+1,j+1)];
        if(loop.some(p=>p.corner))continue;
        let area=0;for(let k=0;k<loop.length;k++){const p=loop[k],z=loop[(k+1)%loop.length];area+=p.x*z.y-p.y*z.x;}
        if(Math.abs(area)/2>scale*scale*.08)continue;
        points.splice(i+1,j-i,q);repaired=true;break;
      }
    }
    if(!repaired)break;
  }
  if(points.length<(closed?3:2))return contour;
  const unit=(x,y)=>{const l=Math.hypot(x,y);return l>1e-12?[x/l,y/l]:[1,0];};
  const tangent=i=>{const n=points.length,p=points[(i+n-1)%n],q=points[i],r=points[(i+1)%n];if(!closed&&i===0)return unit(r.x-q.x,r.y-q.y);if(!closed&&i===n-1)return unit(q.x-p.x,q.y-p.y);const a=unit(q.x-p.x,q.y-p.y),b=unit(r.x-q.x,r.y-q.y);return unit(a[0]+b[0],a[1]+b[1]);};
  const cuts=new Set(points.flatMap((p,i)=>p.corner?[i]:[]));
  if(closed){for(const key of ['x','y'])for(const sign of [-1,1]){let best=0;for(let i=1;i<points.length;i++)if(sign*points[i][key]>sign*points[best][key])best=i;cuts.add(best);}cuts.add(0);}else {cuts.add(0);cuts.add(points.length-1);}
  const indices=[...cuts].sort((a,b)=>a-b),nodes=[];
  const emit=(a,c1,c2,b)=>{if(!nodes.length)nodes.push(node(a.x,a.y));const last=nodes.at(-1);last.ox=c1.x-a.x;last.oy=c1.y-a.y;last.s=!a.corner;const next={...node(b.x,b.y),ix:c2.x-b.x,iy:c2.y-b.y};next.s=!b.corner;nodes.push(next);};
  const fit=(pts,t0,t1,depth=0)=>{
    const a=pts[0],b=pts.at(-1),lengths=[0];for(let i=1;i<pts.length;i++)lengths.push(lengths.at(-1)+dist(pts[i-1],pts[i]));
    const length=lengths.at(-1),ts=lengths.map(x=>length?x/length:0);let aa=0,ab=0,bb=0,ra=0,rb=0;
    for(let i=1;i<pts.length-1;i++){
      const t=ts[i],u=1-t,A=3*u*u*t,B=3*u*t*t,dx=pts[i].x-(u*u*u+A)*a.x-(B+t*t*t)*b.x,dy=pts[i].y-(u*u*u+A)*a.y-(B+t*t*t)*b.y;
      aa+=A*A;ab-=A*B*(t0[0]*t1[0]+t0[1]*t1[1]);bb+=B*B;ra+=A*(t0[0]*dx+t0[1]*dy);rb-=B*(t1[0]*dx+t1[1]*dy);
    }
    const det=aa*bb-ab*ab,chord=dist(a,b);let alpha=det>1e-14?(ra*bb-rb*ab)/det:chord/3,beta=det>1e-14?(rb*aa-ra*ab)/det:chord/3;
    if(alpha<0||beta<0||alpha>length*1.5||beta>length*1.5)alpha=beta=chord/3;
    const c1={x:a.x+t0[0]*alpha,y:a.y+t0[1]*alpha},c2={x:b.x-t1[0]*beta,y:b.y-t1[1]*beta};
    const point=t=>{const u=1-t;return {x:u*u*u*a.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*b.x,y:u*u*u*a.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*b.y};};
    let error=0,split=Math.floor(pts.length/2);
    for(let i=1;i<pts.length-1;i++){const e=dist(point(ts[i]),pts[i]);if(e>error){error=e;split=i;}}
    if(error<=tolerance)for(let i=1;i<16;i++){const p=point(i/16);let e=Infinity;for(let j=1;j<pts.length;j++)e=Math.min(e,lineDistance(p,pts[j-1],pts[j]));error=Math.max(error,e);}
    if(error<=tolerance){emit(a,c1,c2,b);return;}
    if(pts.length===2||depth>=16){for(let i=1;i<pts.length;i++){const p=pts[i-1],q=pts[i];emit(p,{x:lerp(p.x,q.x,1/3),y:lerp(p.y,q.y,1/3)},{x:lerp(p.x,q.x,2/3),y:lerp(p.y,q.y,2/3)},q);}return;}
    split=clamp(split,1,pts.length-2);const before=pts[split-1],after=pts[split+1],middle=unit(after.x-before.x,after.y-before.y);
    fit(pts.slice(0,split+1),t0,middle,depth+1);fit(pts.slice(split),middle,t1,depth+1);
  };
  for(let j=0;j<(closed?indices.length:indices.length-1);j++){
    const start=indices[j],end=j+1<indices.length?indices[j+1]:points.length,pts=[];
    for(let i=start;i<=end;i++)pts.push(points[i%points.length]);
    const a=pts[0],b=pts.at(-1),t0=a.corner?unit(pts[1].x-a.x,pts[1].y-a.y):tangent(start),last=end%points.length,t1=b.corner?unit(b.x-pts.at(-2).x,b.y-pts.at(-2).y):tangent(last);
    fit(pts,t0,t1);
  }
  if(closed){const last=nodes.pop();nodes[0].ix=last.ix;nodes[0].iy=last.iy;}
  if(nodes.length<(closed?3:2)||nodes.some(n=>!['x','y','ix','iy','ox','oy'].every(k=>Number.isFinite(n[k]))))return contour;
  return {...contour,nodes};
}
const softAdaptiveCache=new WeakMap();

function softWithParts(o,contours,rig,adaptive=true) {
  const copy=Object.defineProperties({},Object.getOwnPropertyDescriptors(o));copy.contours=contours;delete copy.arc;delete copy.ellipseFrame;
  let parts=softParts(o,contours,rig);
  if(adaptive&&o.skin.adaptive){
    let clean=softAdaptiveCache.get(contours);
    if(!clean){const scale=Math.min(...o.skin.bones.map(b=>Math.hypot(b.bx-b.ax,b.by-b.ay)));clean={contours:contours.map(c=>softAdaptiveContour(c,scale)),parts:parts?.map(p=>({...p,outline:p.outline.map(c=>softAdaptiveContour(c,scale))}))};softAdaptiveCache.set(contours,clean);}
    copy.contours=clean.contours;parts=clean.parts;
  }
  if(parts)Object.defineProperty(copy,'_softParts',{value:parts,enumerable:false,configurable:true});else if(copy._softParts)delete copy._softParts;
  return copy;
}
function softView(o) {
  const parts=o._softParts;if(!parts?.length)return o;
  const style={...o,t:newT(),op:1,blur:0};for(const k of ['skin','arc','ellipseFrame','pivot','bind','sbind'])delete style[k];
  const fill={...style,contours:parts.flatMap(p=>p.fill),stroke:null,nz:true,_softFill:true},children=[fill],b=contoursBounds(o.contours),scale=Math.max(.001,Math.min(Math.abs(o.t.sx),Math.abs(o.t.sy))),pad=100+((o.sw||0)*6+(o.blur||0)*8)/scale;
  const outside=[node(b.x0-pad,b.y0-pad),node(b.x1+pad,b.y0-pad),node(b.x1+pad,b.y1+pad),node(b.x0-pad,b.y1+pad)];
  for(let i=0;i<parts.length;i++){
    if(!parts[i].outline.length)continue;
    let ink={...style,contours:parts[i].outline,fill:null,grad:null,cap:'butt'};
    for(let j=i+1;j<parts.length;j++)for(const contour of parts[j].fill)ink={id:o.id+':cover:'+i+':'+j,kind:'group',softClip:true,op:1,t:newT(),children:[ink],mask:[{id:o.id+':cut:'+j,kind:'path',t:newT(),op:1,fill:'#ffffff',stroke:null,fa:1,contours:[{closed:true,nodes:outside},contour],nz:false}]};
    children.push(ink);
  }
  return {id:o.id,kind:'group',t:{...o.t},op:nz(o.op,1),blur:o.blur||0,children,...(o.pivot?{pivot:o.pivot}:{}),_softFill:false};
}

function softValid(s) {
  const matrix=m=>Array.isArray(m)&&m.length===6&&m.every(Number.isFinite)&&Math.abs(m[0]*m[3]-m[1]*m[2])>1e-10;
  return !!s&&s.version===1&&(s.adaptive==null||typeof s.adaptive==='boolean')&&typeof s.to==='string'&&matrix(s.object)&&Array.isArray(s.bones)&&s.bones.length>0&&s.bones.length<=255&&s.bones.every(b=>b&&typeof b.id==='string'&&typeof b.parent==='string'&&[b.ax,b.ay,b.bx,b.by,b.stiffness].every(Number.isFinite)&&Math.hypot(b.bx-b.ax,b.by-b.ay)>1e-5)&&Array.isArray(s.base)&&s.base.length>0&&s.base.reduce((n,c)=>n+(c?.nodes?.length||0),0)<=512&&s.base.every(c=>c&&Array.isArray(c.nodes)&&c.nodes.length>1&&c.nodes.every(n=>['x','y','ix','iy','ox','oy'].every(k=>Number.isFinite(n[k]))))&&softRegionsValid(s)&&(s.order==null||(Array.isArray(s.order)&&s.order.length<=s.bones.length&&new Set(s.order).size===s.order.length&&s.order.every(id=>typeof id==='string'&&softGroups(s).some(g=>g.id===id))));
}
function softBind(o,rig) {
  if(o.kind!=='path'||o.skel||o.rig||o.mirror||!rig.skel)return null;
  const nodes=rig.skel.nodes;
  if(nodes.length<2)return null;
  const branched=nodes.some(n=>nodes.filter(q=>q.parent===n.id).length>1);
  if(branched&&(!o.fill||o.contours.some(c=>!c.closed)))return null;
  const M=matOf(o.t);if(Math.abs(M[0]*M[3]-M[1]*M[2])<1e-10)return null;
  const m=mmul(minv(M),matOf(rig.t)),byId=new Map(nodes.map(n=>[n.id,n]));
  const bones=nodes.filter(n=>n.parent!=null).map(n=>{const p=byId.get(n.parent),a=mapply(m,p.x,p.y),b=mapply(m,n.x,n.y);return {id:n.id,parent:n.parent,ax:a[0],ay:a[1],bx:b[0],by:b[1],stiffness:.5};});
  const s={version:1,to:rig.id,object:M,base:clone(o.contours),bones};if(!softValid(s))return null;
  if(branched){s.regions=softRegions(s,!!o.nz);if(!s.regions)return null;}return s;
}
const softPoseCache=new WeakMap();
function softPoseObject(o,rig) {
  const skin=o.skin;if(!skin||!rig?.skel)return o;
  const key=JSON.stringify([rig.t,rig.skel.nodes.map(n=>[n.id,n.parent,n.x,n.y]),skin.order,!!skin.adaptive]),cached=softPoseCache.get(skin);
  if(cached?.key===key)return softWithParts(o,cached.contours,rig,cached.adaptive);
  const byId=new Map(rig.skel.nodes.map(n=>[n.id,n])),m=mmul(minv(skin.object),matOf(rig.t)),bones=[];
  for(const b of skin.bones){const p=byId.get(b.parent),n=byId.get(b.id);if(!p||!n)return o;const a=mapply(m,p.x,p.y),z=mapply(m,n.x,n.y),dx=b.bx-b.ax,dy=b.by-b.ay,L=Math.hypot(dx,dy),q=Math.hypot(z[0]-a[0],z[1]-a[1]);if(q<1e-6)return o;const angle=Math.atan2(z[1]-a[1],z[0]-a[0])-Math.atan2(dy,dx);bones.push({...b,a,z,L,ux:dx/L,uy:dy/L,c:Math.cos(angle),s:Math.sin(angle),stretch:q/L,radius:L*(.025+.28*(1-clamp(b.stiffness,0,1)))});}
  const finish=(contours,adaptive=true)=>{softPoseCache.set(skin,{key,contours,adaptive});return softWithParts(o,contours,rig,adaptive);};
  const transforms=bones.map(b=>{const f=(x,y)=>{const dx=x-b.ax,dy=y-b.ay,along=dx*b.ux+dy*b.uy,across=-dx*b.uy+dy*b.ux,vx=b.ux*along*b.stretch-b.uy*across,vy=b.uy*along*b.stretch+b.ux*across;return [b.a[0]+b.c*vx-b.s*vy,b.a[1]+b.s*vx+b.c*vy];},a=f(0,0),x=f(1,0),y=f(0,1);return [x[0]-a[0],x[1]-a[1],y[0]-a[0],y[1]-a[1],a[0],a[1]];});
  if(!(skin.order&&skin.regions)&&transforms.every(m=>m.every((v,i)=>Math.abs(v-transforms[0][i])<1e-8))){const M=transforms[0];if(M.every((v,i)=>Math.abs(v-[1,0,0,1,0,0][i])<1e-8))return finish(skin.base,false);return finish(skin.base.map(c=>({...c,nodes:c.nodes.map(n=>{const p=mapply(M,n.x,n.y);return {...n,x:p[0],y:p[1],ix:M[0]*n.ix+M[2]*n.iy,iy:M[1]*n.ix+M[3]*n.iy,ox:M[0]*n.ox+M[2]*n.oy,oy:M[1]*n.ox+M[3]*n.oy};})})),false);}
  const regionWeights=sample=>{
    const nearest=sample[0],reach=Math.max(.5,bones[nearest[0]].L*.55),floor=nearest[1];let total=0;
    const values=sample.map(([i,d])=>{const b=bones[i],fade=clamp(1-(d-floor)/reach,0,1),w=fade*fade*(3-2*fade)/Math.pow(d*d+b.radius*b.radius+1e-8,2);total+=w;return [i,w];});return values.map(([i,w])=>[i,w/total]);
  };
  const map=(x,y,influences=null)=>{
    let sx=0,sy=0,total=0;
    for(let bi=0;bi<bones.length;bi++){const b=bones[bi];if(influences&&!influences.has(bi))continue;const dx=x-b.ax,dy=y-b.ay,along=dx*b.ux+dy*b.uy,across=-dx*b.uy+dy*b.ux,t=clamp(along,0,b.L),dist2=(along-t)**2+across*across,w=influences?influences.get(bi):1/Math.pow(dist2+b.radius*b.radius+1e-8,2),vx=b.ux*along*b.stretch-b.uy*across,vy=b.uy*along*b.stretch+b.ux*across;sx+=w*(b.a[0]+b.c*vx-b.s*vy);sy+=w*(b.a[1]+b.s*vx+b.c*vy);total+=w;}
    return [sx/total,sy/total];
  };
  const step=Math.max(.5,Math.min(...bones.map(b=>b.L))/8),epsilon=1e-4;
  const contours=skin.base.map((c,ci)=>{
    const source=c.nodes,nodes=[],cnt=c.closed?source.length:source.length-1;
    for(let i=0;i<cnt;i++){
      const a=source[i],b=source[(i+1)%source.length],length=Math.hypot(a.ox,a.oy)+Math.hypot(b.x+b.ix-a.x-a.ox,b.y+b.iy-a.y-a.oy)+Math.hypot(b.ix,b.iy),N=skin.regions?skin.regions[ci][i].length-1:clamp(Math.ceil(length/step),1,32);
      const region=skin.regions?.[ci]?.[i]?.map(regionWeights),influenceAt=t=>{const at=clamp(t,0,1)*N,j=Math.min(N-1,Math.floor(at)),f=at-j,weights=new Map();for(const [index,w] of region[j])weights.set(index,w*(1-f));for(const [index,w] of region[j+1])weights.set(index,(weights.get(index)||0)+w*f);return weights;};
      const sample=t=>{
        if(region){const point=bezPt(a,b,t),q=map(...point,influenceAt(t)),lo=Math.max(0,t-epsilon),hi=Math.min(1,t+epsilon),p0=map(...bezPt(a,b,lo),influenceAt(lo)),p1=map(...bezPt(a,b,hi),influenceAt(hi));return {x:q[0],y:q[1],vx:(p1[0]-p0[0])/((hi-lo)*3*N),vy:(p1[1]-p0[1])/((hi-lo)*3*N)};}
const p=bezPt(a,b,t),q=map(...p),u=1-t,dx=3*(u*u*a.ox+2*u*t*(b.x+b.ix-a.x-a.ox)+t*t*(-b.ix)),dy=3*(u*u*a.oy+2*u*t*(b.y+b.iy-a.y-a.oy)+t*t*(-b.iy)),d0=map(p[0]-epsilon*dx,p[1]-epsilon*dy),d1=map(p[0]+epsilon*dx,p[1]+epsilon*dy);return {x:q[0],y:q[1],vx:(d1[0]-d0[0])/(2*epsilon*3*N),vy:(d1[1]-d0[1])/(2*epsilon*3*N)};};
      for(let j=0;j<=N;j++){const p=sample(j/N);if(j===0&&nodes.length){nodes.at(-1).ox=p.vx;nodes.at(-1).oy=p.vy;continue;}nodes.push({x:p.x,y:p.y,ix:j?-p.vx:0,iy:j?-p.vy:0,ox:j<N?p.vx:0,oy:j<N?p.vy:0,s:j>0&&j<N,...(skin.adaptive&&((j===0&&softBaseCorner(source,i,c.closed))||(j===N&&softBaseCorner(source,(i+1)%source.length,c.closed)))?{softCorner:true}:{})});}
    }
    if(c.closed){const last=nodes.pop();nodes[0].ix=last.ix;nodes[0].iy=last.iy;}
    return {closed:c.closed,nodes};
  });
  return finish(contours);
}

function resolveSkeletonBinds(objs,layer,t) {
  if(!objs.some(o=>o.sbind||o.skin))return objs;
  const scope=skeletonScopes.get(layer)||[layer],rigs=new Map();
  // Hidden original Take layers must not override their visible replacement.
  for(const l of scope.filter(l=>l.visible===false).concat(scope.filter(l=>l.visible!==false)))
    for(const o of evalLayerRaw(l,t))if(o.skel)rigs.set(o.id,o);
  return objs.map(o=>{
    if(o.skin){const rig=rigs.get(o.skin.to);return rig?softPoseObject(o,rig):o;}
    if(!o.sbind||freeBind.has(o.id))return o;
    const r=rigs.get(o.sbind.to);if(!r)return o;
    return skeletonPoseObject(o,skeletonBoundPose(o,r));
  });
}
/* Per-joint angular limits are relative to the other bone, never the page. */
function skeletonUnwrap(angle,center) { return center+Math.atan2(Math.sin(angle-center),Math.cos(angle-center)); }
function skeletonJointLimit(g,id) {
  const joint=g.nodes.find(n=>n.id===id),limit=joint?.limit;if(!limit)return null;
  const neighbors=g.nodes.filter(n=>n.id===joint.parent||n.parent===id).map(n=>n.id);
  if(neighbors.length!==2||limit.bone===limit.ref||!neighbors.includes(limit.bone)||!neighbors.includes(limit.ref)||
    ![limit.min,limit.max].every(Number.isFinite)||limit.max<limit.min||limit.max-limit.min>Math.PI*2+1e-6)return null;
  return limit;
}
function skeletonLimitDirection(g,joint,reference,target,referenceAngle,direction) {
  const l=skeletonJointLimit(g,joint);if(!l)return direction;
  const sign=l.bone===target&&l.ref===reference?1:l.bone===reference&&l.ref===target?-1:0;
  if(!sign)return direction;
  const relative=skeletonUnwrap(sign*(direction-referenceAngle),(l.min+l.max)/2);
  return referenceAngle+sign*Math.min(l.max,Math.max(l.min,relative));
}
function skeletonApplyLimits(g,fixed=new Set()) {
  const byId=new Map(g.nodes.map(n=>[n.id,n]));
  for(const joint of g.nodes) {
    const limit=skeletonJointLimit(g,joint.id);if(!limit)continue;
    // Keep the root side fixed, rotating the child component. For a two-way
    // root joint, the explicitly selected bone is the component that moves.
    const child=joint.parent!=null?g.nodes.find(n=>n.parent===joint.id):byId.get(limit.bone);
    const reference=joint.parent!=null?byId.get(joint.parent):byId.get(limit.ref);
    if(!child||!reference)continue;
    const refAngle=Math.atan2(reference.y-joint.y,reference.x-joint.x),old=Math.atan2(child.y-joint.y,child.x-joint.x);
    const next=skeletonLimitDirection(g,joint.id,reference.id,child.id,refAngle,old),delta=Math.atan2(Math.sin(next-old),Math.cos(next-old));
    if(Math.abs(delta)<1e-10)continue;
    let ids=new Set([child.id]);for(const n of g.nodes)if(ids.has(n.parent))ids.add(n.id);
    let rotation=delta;
    if(Array.from(fixed).some(id=>ids.has(id))){ids=new Set(g.nodes.filter(n=>n.id!==joint.id&&!ids.has(n.id)).map(n=>n.id));rotation=-delta;if(Array.from(fixed).some(id=>ids.has(id)))continue;}
    const c=Math.cos(rotation),s=Math.sin(rotation);
    for(const n of g.nodes)if(ids.has(n.id)){const dx=n.x-joint.x,dy=n.y-joint.y;n.x=joint.x+c*dx-s*dy;n.y=joint.y+s*dx+c*dy;}
  }
  return g;
}

function skeletonSolvePinnedPath(g,ids,x,y,graph) {
  const byId=new Map(g.nodes.map(n=>[n.id,n])),chain=ids.map(id=>byId.get(id));if(chain.length<2)return;
  const before=new Map(g.nodes.map(n=>[n.id,{x:n.x,y:n.y}])),owned=new Set(chain.map(n=>n.id));
  const points=chain.map(n=>({x:n.x,y:n.y})),lengths=chain.slice(1).map((n,i)=>Math.max(.01,Math.hypot(n.rx-chain[i].rx,n.ry-chain[i].ry))),root={...points[0]};
  const place=(a,b,len)=>{let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<1e-7){dx=1;dy=0;d=1;}return {x:a.x+dx*len/d,y:a.y+dy*len/d};};
  const forward=i=>{
    const p=place(points[i-1],points[i],lengths[i-1]);
    if(i>=2){const a=points[i-1],r=points[i-2],ref=Math.atan2(r.y-a.y,r.x-a.x),angle=skeletonLimitDirection(g,chain[i-1].id,chain[i-2].id,chain[i].id,ref,Math.atan2(p.y-a.y,p.x-a.x));p.x=a.x+Math.cos(angle)*lengths[i-1];p.y=a.y+Math.sin(angle)*lengths[i-1];}
    points[i]=p;
  };
  const total=lengths.reduce((a,b)=>a+b,0);
  const elbowLimit=chain.length===3?skeletonJointLimit(g,chain[1].id):null;
  if(elbowLimit) {
    const [l1,l2]=lengths,distance=Math.hypot(x-root.x,y-root.y),direction=distance>1e-8?Math.atan2(y-root.y,x-root.x):Math.atan2(points[2].y-root.y,points[2].x-root.x);
    const theta=Math.acos(clamp((l1*l1+l2*l2-distance*distance)/(2*l1*l2),-1,1)),sign=elbowLimit.bone===chain[2].id?1:-1,center=(elbowLimit.min+elbowLimit.max)/2;
    const candidates=[theta,-theta].map(t=>{
      const bounded=clamp(skeletonUnwrap(sign*t,center),elbowLimit.min,elbowLimit.max),bend=sign*bounded;
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
  // Carry every off-path component with its attachment joint. This also
  // works when solving backwards from a pinned foot toward the body root.
  const owners=new Map(chain.map(n=>[n.id,n.id])),queue=chain.map(n=>n.id);
  for(let i=0;i<queue.length;i++)for(const id of graph.get(queue[i])||[])if(!owners.has(id)){owners.set(id,owners.get(queue[i]));queue.push(id);}
  for(const n of g.nodes)if(!owned.has(n.id)){const anchor=byId.get(owners.get(n.id)),old=before.get(anchor?.id);if(anchor&&old){n.x+=anchor.x-old.x;n.y+=anchor.y-old.y;}}
}

function skeletonGraph(g) {
  const graph=new Map(g.nodes.map(n=>[n.id,[]]));
  for(const n of g.nodes)if(n.parent!=null&&graph.has(n.parent)){graph.get(n.id).push(n.parent);graph.get(n.parent).push(n.id);}
  return graph;
}
function skeletonPath(graph,start,end) {
  const parents=new Map([[start,null]]),queue=[start];
  for(let i=0;i<queue.length&&!parents.has(end);i++)for(const id of graph.get(queue[i])||[])if(!parents.has(id)){parents.set(id,queue[i]);queue.push(id);}
  if(!parents.has(end))return [];
  const path=[];for(let id=end;id!=null;id=parents.get(id))path.unshift(id);return path;
}
function skeletonPinTargets(g,matrix) {
  const inverse=matrix?minv(matrix):null,targets=new Map();
  for(const n of g.nodes)if(n.pin){const at=n.pinAt;const p=at&&Number.isFinite(at.x)&&Number.isFinite(at.y)?(inverse?mapply(inverse,at.x,at.y):[at.x,at.y]):[n.x,n.y];targets.set(n.id,{x:p[0],y:p[1]});}
  return targets;
}
function skeletonPinsValid(g,targets) {
  const byId=new Map(g.nodes.map(n=>[n.id,n]));
  for(const n of g.nodes){if(!Number.isFinite(n.x)||!Number.isFinite(n.y))return false;
    const fixed=targets.get(n.id);if(fixed&&Math.hypot(n.x-fixed.x,n.y-fixed.y)>.005)return false;
    const p=byId.get(n.parent);if(p&&Math.abs(Math.hypot(n.x-p.x,n.y-p.y)-Math.hypot(n.rx-p.rx,n.ry-p.ry))>.005)return false;
    const limit=skeletonJointLimit(g,n.id);if(limit){const a=byId.get(limit.ref),b=byId.get(limit.bone),angle=skeletonUnwrap(Math.atan2(b.y-n.y,b.x-n.x)-Math.atan2(a.y-n.y,a.x-n.x),(limit.min+limit.max)/2);if(angle<limit.min-1e-5||angle>limit.max+1e-5)return false;}
  }
  return true;
}
function skeletonPosePinned(g,id,x,y,targets) {
  if(!targets.size)return false;
  const graph=skeletonGraph(g),candidates=Array.from(targets.keys()).map(pin=>skeletonPath(graph,pin,id)).filter(p=>p.length).sort((a,b)=>a.length-b.length),path=candidates[0];
  if(!path)return false;
  const original=g.nodes.map(n=>({...n})),base={...g,nodes:original},fixedIds=new Set(targets.keys());
  if(targets.has(id)){const n=g.nodes.find(n=>n.id===id),p=targets.get(id),dx=p.x-n.x,dy=p.y-n.y;for(const q of g.nodes){q.x+=dx;q.y+=dy;}return true;}
  const rootTarget=targets.get(path[0]);
  const attempt=(tx,ty)=>{
    g.nodes=original.map(n=>({...n}));
    const anchor=g.nodes.find(n=>n.id===path[0]),dx=rootTarget.x-anchor.x,dy=rootTarget.y-anchor.y;
    for(const n of g.nodes){n.x+=dx;n.y+=dy;}
    skeletonSolvePinnedPath(g,path,tx,ty,graph);
    skeletonApplyLimits(g,fixedIds);
    // Other pins get priority over the pointer target. Reconcile their paths
    // from the same fixed anchor before accepting any new pose.
    for(let iteration=0;iteration<16&&!skeletonPinsValid(g,targets);iteration++){
      for(const [pin,target] of targets)if(pin!==path[0])skeletonSolvePinnedPath(g,skeletonPath(graph,path[0],pin),target.x,target.y,graph);
      skeletonApplyLimits(g,fixedIds);
    }
    return skeletonPinsValid(g,targets);
  };
  if(attempt(x,y))return true;
  // Reject an impossible drag rather than stretching a bone or moving a pin.
  // A short search still allows motion up to the nearest feasible boundary.
  const start=original.find(n=>n.id===id);let lo=0,hi=1,best=skeletonPinsValid(base,targets)?original:null;
  for(let i=0;i<10;i++){const t=(lo+hi)/2;if(attempt(start.x+(x-start.x)*t,start.y+(y-start.y)*t)){lo=t;best=g.nodes.map(n=>({...n}));}else hi=t;}
  g.nodes=best||original;return true;
}

/* A rigid group adds distances between every selected pair, including pairs
   without a visible bone. Tree parentage and artwork attachment IDs stay intact. */
function skeletonRigidGroups(g) {
  const ids=new Set(g.nodes.map(n=>n.id));
  return (Array.isArray(g.rigids)?g.rigids:[]).filter(r=>r&&typeof r.id==='string'&&Array.isArray(r.points)&&r.points.length>=2&&r.points.length<=g.nodes.length&&r.points.every(p=>p&&typeof p.id==='string'&&ids.has(p.id)&&Number.isFinite(p.x)&&Number.isFinite(p.y))&&new Set(r.points.map(p=>p.id)).size===r.points.length);
}
function skeletonRigidValid(g) {
  const byId=new Map(g.nodes.map(n=>[n.id,n]));
  for(const group of skeletonRigidGroups(g))for(let i=0;i<group.points.length;i++)for(let j=i+1;j<group.points.length;j++){
    const a=group.points[i],b=group.points[j],p=byId.get(a.id),q=byId.get(b.id);
    if(Math.abs(Math.hypot(p.x-q.x,p.y-q.y)-Math.hypot(a.x-b.x,a.y-b.y))>1e-5)return false;
  }
  return true;
}
function skeletonRigidFit(g,group,fixed=new Map()) {
  const byId=new Map(g.nodes.map(n=>[n.id,n])),pins=group.points.filter(p=>fixed.has(p.id));
  let rx=0,ry=0,x=0,y=0;
  if(pins.length){const p=pins[0],q=fixed.get(p.id);rx=p.x;ry=p.y;x=q.x;y=q.y;}
  else {for(const p of group.points){const q=byId.get(p.id);rx+=p.x;ry+=p.y;x+=q.x;y+=q.y;}const n=group.points.length;rx/=n;ry/=n;x/=n;y/=n;}
  let dot=0,cross=0;
  for(const p of (pins.length>1?pins:group.points)){const q=fixed.get(p.id)||byId.get(p.id),ax=p.x-rx,ay=p.y-ry,bx=q.x-x,by=q.y-y;dot+=ax*bx+ay*by;cross+=ax*by-ay*bx;}
  const angle=Math.atan2(cross,dot),c=Math.cos(angle),s=Math.sin(angle),out=new Map();
  for(const p of group.points)out.set(p.id,{x:x+c*(p.x-rx)-s*(p.y-ry),y:y+s*(p.x-rx)+c*(p.y-ry)});
  return out;
}
function skeletonPoseRigid(g,id,x,y,pins=new Map(),search=true) {
  const groups=skeletonRigidGroups(g);if(!groups.length)return false;
  if(pins.has(id))return true;
  const original=g.nodes.map(n=>({...n})),byId=new Map(original.map(n=>[n.id,n])),parent=new Map(original.map(n=>[n.id,n.id]));
  const root=id=>{while(parent.get(id)!==id)id=parent.get(id);return id;};
  for(const group of groups){const r=root(group.points[0].id);for(const p of group.points)parent.set(root(p.id),r);}
  const buckets=new Map();for(const n of original){const r=root(n.id);if(!buckets.has(r))buckets.set(r,[]);buckets.get(r).push(n);}
  const bodies=[],owner=new Map();
  for(const ns of buckets.values()){
    const fixed=ns.filter(n=>pins.has(n.id));let cx=0,cy=0;for(const n of ns){cx+=n.x;cy+=n.y;}cx/=ns.length;cy/=ns.length;
    const pivot=fixed[0],origin=pivot?{x:pivot.x,y:pivot.y}:{x:cx,y:cy},at=pivot?pins.get(pivot.id):origin;
    const body={x:at.x,y:at.y,a:0,inv:fixed.length?0:1/ns.length,spin:0,local:new Map()};let inertia=0;
    for(const n of ns){const p={x:n.x-origin.x,y:n.y-origin.y};body.local.set(n.id,p);inertia+=p.x*p.x+p.y*p.y;owner.set(n.id,body);}
    if(fixed.length>1){const p=fixed[1],target=pins.get(p.id);body.a=Math.atan2(target.y-at.y,target.x-at.x)-Math.atan2(p.y-origin.y,p.x-origin.x);}
    body.spin=ns.length>1&&fixed.length<2?1/Math.max(1,inertia):0;bodies.push(body);
  }
  const point=id=>{const b=owner.get(id),p=b.local.get(id),c=Math.cos(b.a),s=Math.sin(b.a);return {x:b.x+c*p.x-s*p.y,y:b.y+s*p.x+c*p.y};};
  const project=(terms,error)=>{
    const gradients=new Map();for(const [id,gx,gy] of terms){const b=owner.get(id),p=point(id);let q=gradients.get(b);if(!q){q={x:0,y:0,a:0};gradients.set(b,q);}q.x+=gx;q.y+=gy;q.a+=(p.x-b.x)*gy-(p.y-b.y)*gx;}
    let weight=0;for(const [b,q] of gradients)weight+=b.inv*(q.x*q.x+q.y*q.y)+b.spin*q.a*q.a;
    if(weight<1e-14)return;const lambda=error/weight;
    for(const [b,q] of gradients){b.x-=lambda*b.inv*q.x;b.y-=lambda*b.inv*q.y;b.a-=Math.max(-.25,Math.min(.25,lambda*b.spin*q.a));}
  };
  const edges=original.filter(n=>n.parent!=null&&owner.get(n.id)!==owner.get(n.parent)).map(n=>({a:n.parent,b:n.id,length:Math.hypot(n.rx-byId.get(n.parent).rx,n.ry-byId.get(n.parent).ry)}));
  const limits=original.map(n=>({id:n.id,l:skeletonJointLimit(g,n.id)})).filter(q=>q.l);
  const settle=()=>{
    let error=0;
    for(const e of edges){const a=point(e.a),b=point(e.b),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1e-8,d=len-e.length;error=Math.max(error,Math.abs(d));project([[e.a,-dx/len,-dy/len],[e.b,dx/len,dy/len]],d);}
    for(const {id,l} of limits){const j=point(id),a=point(l.ref),b=point(l.bone),ax=a.x-j.x,ay=a.y-j.y,bx=b.x-j.x,by=b.y-j.y,aa=ax*ax+ay*ay,bb=bx*bx+by*by;if(aa<1e-12||bb<1e-12)continue;
      const angle=skeletonUnwrap(Math.atan2(by,bx)-Math.atan2(ay,ax),(l.min+l.max)/2),d=angle-Math.max(l.min,Math.min(l.max,angle));if(Math.abs(d)<1e-8)continue;error=Math.max(error,Math.abs(d)*10);
      const ga=[ay/aa,-ax/aa],gb=[-by/bb,bx/bb];project([[l.ref,...ga],[l.bone,...gb],[id,-ga[0]-gb[0],-ga[1]-gb[1]]],d);
    }return error;
  };
  for(let i=0;i<100;i++){let p=point(id);project([[id,1,0]],(p.x-x)*.8);p=point(id);project([[id,0,1]],(p.y-y)*.8);const e=settle();if(e<1e-5&&Math.hypot(point(id).x-x,point(id).y-y)<.01)break;}
  // Release only the pointer target when it is unreachable; never release an
  // actual pin, distort a rigid body, or manufacture anchors at group members.
  for(let i=0;i<160;i++)if(settle()<1e-7)break;
  g.nodes=original.map(n=>({...n,...point(n.id)}));
  if(!skeletonPinsValid(g,pins)||!skeletonRigidValid(g)){
    g.nodes=original;
    if(search){const from=byId.get(id);let lo=0,hi=1,best=original;for(let i=0;i<6;i++){const t=(lo+hi)/2;g.nodes=original.map(n=>({...n}));skeletonPoseRigid(g,id,from.x+(x-from.x)*t,from.y+(y-from.y)*t,pins,false);const end=g.nodes.find(n=>n.id===id);if(Math.hypot(end.x-from.x,end.y-from.y)>1e-7){lo=t;best=g.nodes.map(n=>({...n}));}else hi=t;}g.nodes=best;}
  }
  return true;
}
function skeletonRigidTween(g,matrix,start,end,p) {
  const groups=skeletonRigidGroups(g);if(!groups.length)return g;
  const pins=skeletonPinTargets(g,matrix),starts=new Map(start.nodes.map(n=>[n.id,n])),ends=new Map(end.nodes.map(n=>[n.id,n]));
  const desired=pins.size?{...g,nodes:g.nodes.map(n=>{const a=starts.get(n.id),b=ends.get(n.id);return {...n,x:lerp(a.x,b.x,p),y:lerp(a.y,b.y,p)};})}:g;
  const targets=new Map();for(const group of groups)for(const [id,at] of skeletonRigidFit(desired,group,pins))targets.set(id,at);
  for(const n of g.nodes)if(targets.has(n.id)){const at=targets.get(n.id);n.x=at.x;n.y=at.y;}
  if(skeletonRigidValid(g)&&skeletonPinsValid(g,pins))return g;
  const drivers=Array.from(targets,([id,at])=>({id,at,delta:Math.hypot(at.x-starts.get(id).x,at.y-starts.get(id).y)})).filter(q=>!pins.has(q.id)).sort((a,b)=>b.delta-a.delta);
  const driver=drivers[0]||g.nodes.filter(n=>!pins.has(n.id)).map(n=>({id:n.id,at:{x:n.x,y:n.y}}))[0];
  if(driver)skeletonPoseRigid(g,driver.id,driver.at.x,driver.at.y,pins,false);
  if(!skeletonRigidValid(g)||!skeletonPinsValid(g,pins)){g.nodes=start.nodes.map(n=>({...n}));if(driver)skeletonPoseRigid(g,driver.id,driver.at.x,driver.at.y,pins);}
  return g;
}

// Captured poses take precedence over later rig settings. Only constraints
// compatible with both endpoints participate in playback; stored keys stay intact.
function skeletonTweenCompatible(a,b,matrixA,matrixB) {
  const start=new Map(a.nodes.map(n=>[n.id,n])),end=new Map(b.nodes.map(n=>[n.id,n]));
  const nodes=a.nodes.map(n=>{
    const out={...n},q=end.get(n.id);
    const pinMatches=(node,matrix)=>{if(!node?.pinAt||!matrix)return !!node?.pinAt;const p=mapply(matrix,node.x,node.y);return Math.hypot(p[0]-node.pinAt.x,p[1]-node.pinAt.y)<.01;};
    if(!q?.pin||!pinMatches(n,matrixA)||!pinMatches(q,matrixB)){delete out.pin;delete out.pinAt;}
    const l=skeletonJointLimit(a,n.id),r=skeletonJointLimit(b,n.id);
    const legal=(byId,limit)=>{const c=byId.get(n.id),u=byId.get(limit.ref),v=byId.get(limit.bone);if(!c||!u||!v)return false;const angle=skeletonUnwrap(Math.atan2(v.y-c.y,v.x-c.x)-Math.atan2(u.y-c.y,u.x-c.x),(limit.min+limit.max)/2);return angle>=limit.min-1e-5&&angle<=limit.max+1e-5;};
    if(!l||!r||l.bone!==r.bone||l.ref!==r.ref||Math.abs(l.min-r.min)>1e-8||Math.abs(l.max-r.max)>1e-8||!legal(start,l)||!legal(end,l))delete out.limit;
    return out;
  });
  const other=skeletonRigidGroups(b),rigids=skeletonRigidGroups(a).filter(group=>{
    const ids=group.points.map(n=>n.id),match=other.find(g=>g.points.length===ids.length&&g.points.every(n=>ids.includes(n.id)));if(!match)return false;
    for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const x=start.get(ids[i]),y=start.get(ids[j]),u=end.get(ids[i]),v=end.get(ids[j]);const p=group.points[i],q=group.points[j],length=Math.hypot(x.x-y.x,x.y-y.y);if(!u||!v||Math.abs(length-Math.hypot(u.x-v.x,u.y-v.y))>1e-4||Math.abs(length-Math.hypot(p.x-q.x,p.y-q.y))>1e-4)return false;}
    return true;
  });
  return {...a,nodes,rigids};
}

function lerpSkeleton(a,b,p,matrix,matrixA,matrixB) {
  a=skeletonTweenCompatible(a,b,matrixA,matrixB);
  // Tween joint rotations, then rebuild the tree from the root. Interpolating
  // joint x/y directly traces chords and shortens bones between their poses.
  const start=new Map(a.nodes.map(n=>[n.id,n])),end=new Map(b.nodes.map(n=>[n.id,n]));
  const posed=new Map(),angles=new Map();
  const angle=(nodes,n)=>{
    const parent=n&&nodes.get(n.parent);
    return parent?Math.atan2(n.y-parent.y,n.x-parent.x):0;
  };
  const turn=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
  const nodes=a.nodes.map(n=>{
    const q=end.get(n.id),out={...n};
    if(n.pin&&q?.pin&&n.pinAt&&q.pinAt&&[n.pinAt.x,n.pinAt.y,q.pinAt.x,q.pinAt.y].every(Number.isFinite))out.pinAt={x:lerp(n.pinAt.x,q.pinAt.x,p),y:lerp(n.pinAt.y,q.pinAt.y,p)};
    if(q&&q.parent===n.parent) {
      if(n.parent==null){out.x=lerp(n.x,q.x,p);out.y=lerp(n.y,q.y,p);}
      else {
        const pa=start.get(n.parent),pb=end.get(q.parent),parent=posed.get(n.parent);
        if(pa&&pb&&parent) {
          const aa=angle(start,n),ab=angle(end,q);
          const localA=turn(angle(start,pa),aa),localB=turn(angle(end,pb),ab);
          let direction=(angles.get(n.parent)||0)+localA+turn(localA,localB)*p;
          const limit=skeletonJointLimit(a,pa.id),sign=limit&&pa.parent!=null?(limit.bone===n.id&&limit.ref===pa.parent?1:limit.bone===pa.parent&&limit.ref===n.id?-1:0):0;
          if(sign){
            const center=(limit.min+limit.max)/2;
            const from=Math.min(limit.max,Math.max(limit.min,skeletonUnwrap(sign*(localA-Math.PI),center)));
            const to=Math.min(limit.max,Math.max(limit.min,skeletonUnwrap(sign*(localB-Math.PI),center)));
            // Travel within the legal interval, even when it spans more than
            // 180 degrees; the shorter geometric arc may cross its forbidden gap.
            direction=(angles.get(n.parent)||0)+Math.PI+sign*lerp(from,to,p);
          }
          // Equal-length poses keep an exactly fixed bone length. Genuine
          // length edits and recorded springs may still change length.
          const length=lerp(Math.hypot(n.x-pa.x,n.y-pa.y),Math.hypot(q.x-pb.x,q.y-pb.y),p);
          out.x=parent.x+Math.cos(direction)*length;out.y=parent.y+Math.sin(direction)*length;
        }
      }
    }
    posed.set(n.id,out);
    const parent=posed.get(n.parent);
    angles.set(n.id,parent?Math.atan2(out.y-parent.y,out.x-parent.x):0);
    return out;
  });
  // Use this transition’s lengths, rather than a later edit’s rest geometry.
  for(const n of nodes){n.rx=n.x;n.ry=n.y;}
  const g=skeletonApplyLimits({...a,nodes},new Set(nodes.filter(n=>n.pin).map(n=>n.id)));
  if(!skeletonRigidGroups(g).length&&nodes.some(n=>n.pin)){const root=g.nodes.find(n=>n.parent==null),control=root.pin?(g.nodes.find(n=>!n.pin)||root):root;skeletonPosePinned(g,control.id,control.x,control.y,skeletonPinTargets(g,matrix));}
  return skeletonRigidTween(g,matrix,a,b,p);
}

/* ---------- attaching symbols to bones ----------
   A symbol instance with o.bind = { to: <rig object id>, bone: 0|1, lx, ly, lr } is held rigidly in the bone's frame (bone 0 = shoulder->elbow, 1 = elbow->hand).
   The rig must be on the same layer. Evaluation overrides the instance's x, y and rotation from the rig's evaluated pose, so tweens and every renderer follow along. */
const freeBind = new Set(); /* ids being dragged in the editor: shown where the pointer puts them until the drag is committed */
function boneFrame(rigObj, bone) {
  const k = rigSolve(rigObj.rig), M = matOf(rigObj.t), A = bone ? k.e : k.s, B = bone ? k.h : k.e;
  const a = mapply(M, A[0], A[1]), b = mapply(M, B[0], B[1]);
  return { x: a[0], y: a[1], r: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / PI };
}
function bindPose(o, rigObj) {
  const f = boneFrame(rigObj, o.bind.bone), th = f.r * PI / 180, c = Math.cos(th), s = Math.sin(th), b = o.bind;
  return { x: f.x + c * b.lx - s * b.ly, y: f.y + s * b.lx + c * b.ly, r: f.r + b.lr };
}
function resolveBinds(objs) {
  let any = false;
  for (const o of objs) if (o.bind) { any = true; break; }
  if (!any) return objs;
  for (const o of objs) {
    if (!o.bind || o.kind !== 'clip' || freeBind.has(o.id)) continue;
    const r = objs.find((x) => x.id === o.bind.to && x.rig && x.kind === 'path');
    if (!r) continue;
    const q = bindPose(o, r);
    o.t = Object.assign({}, o.t, { x: q.x, y: q.y, r: q.r });
  }
  return objs;
}
function bindOffsets(o, rigObj, bone) {
  const f = boneFrame(rigObj, bone), th = f.r * PI / 180, c = Math.cos(th), s = Math.sin(th), dx = o.t.x - f.x, dy = o.t.y - f.y;
  return { to: rigObj.id, bone, lx: c * dx + s * dy, ly: -s * dx + c * dy, lr: o.t.r - f.r };
}
/* attach (or move to another bone) on every keyframe of the layer that has both objects */
function bindBone(layer, clipId, rigId, bone) {
  let n = 0;
  for (const k of layer.kfs) {
    const o = k.objs.find((x) => x.id === clipId && x.kind === 'clip'), r = k.objs.find((x) => x.id === rigId && x.rig && x.kind === 'path');
    if (!o || !r) continue;
    o.bind = bindOffsets(o, r, bone === 1 ? 1 : 0); n++;
  }
  return n;
}
function unbindBone(layer, clipId) {
  for (const k of layer.kfs) for (const o of k.objs) if (o.id === clipId && o.bind) delete o.bind;
}
function setRigGhost(layer, rigId, v) {
  for (const k of layer.kfs) for (const o of k.objs) if (o.id === rigId && o.rig) o.rig.ghost = !!v;
}
/* keep stored x/y/rotation of bound instances in step with the pose; an instance in `edited` that the user moved is re-attached from where it now is */
function settleBinds(objs, edited) {
  for (const o of objs) {
    if (!o.bind || o.kind !== 'clip') continue;
    const r = objs.find((x) => x.id === o.bind.to && x.rig && x.kind === 'path');
    if (!r) continue;
    const q = bindPose(o, r);
    if (edited && edited.has(o.id) && (Math.abs(q.x - o.t.x) > 0.01 || Math.abs(q.y - o.t.y) > 0.01 || Math.abs(q.r - o.t.r) > 0.01)) o.bind = bindOffsets(o, r, o.bind.bone);
    else { o.t.x = q.x; o.t.y = q.y; o.t.r = q.r; }
  }
}
function bindValid(b) {
  const num = (v) => typeof v === 'number' && isFinite(v) && Math.abs(v) < 1e7;
  return !!b && typeof b.to === 'string' && b.to.length < 80 && (b.bone === 0 || b.bone === 1) && num(b.lx) && num(b.ly) && num(b.lr);
}
// Bitmap geometry is a non-destructive mask in image-local coordinates.
function imageContours(o) {
  return o.contours || [{closed:true,nodes:[node(0,0),node(o.w,0),node(o.w,o.h),node(0,o.h)]}];
}
// Discard retraced, zero-area straight bridges before rasterizing a mask.
// Keep the editable nodes intact, including curves and separate visible lobes.
function imageMaskContours(o) {
  const source=imageContours(o),eps=1e-7,edges=[];
  // A subpixel remainder against the bitmap border should close cleanly.
  // Adjust only the rendered mask; preserve every editable node and handle.
  const contours=source.map(c=>{
    const nodes=c.nodes.map(n=>({...n}));let changed=false;
    for(let i=0;i<c.nodes.length;i++){
      const a=c.nodes[i],b=c.nodes[(i+1)%c.nodes.length];
      for(const [axis,limit] of [['x',o.w],['y',o.h]])for(const edge of [0,limit]){
        const other=axis==='x'?'y':'x';
        if(Math.abs(a[other]-b[other])<1)continue;
        const values=[a[axis],a[axis]+(a['o'+axis]||0),b[axis]+(b['i'+axis]||0),b[axis]];
        if(!values.every(v=>Math.abs(v-edge)<=.5))continue;
        const shared=c.nodes.some((p,j)=>{
          if(j===i)return false;
          const q=c.nodes[(j+1)%c.nodes.length];
          if([p[axis],p[axis]+(p['o'+axis]||0),q[axis]+(q['i'+axis]||0),q[axis]].some(v=>Math.abs(v-edge)>eps))return false;
          return Math.min(Math.max(a[other],b[other]),Math.max(p[other],q[other]))-
            Math.max(Math.min(a[other],b[other]),Math.min(p[other],q[other]))>1;
        });
        if(!shared)continue;
        const na=nodes[i],nb=nodes[(i+1)%nodes.length];
        na[axis]=nb[axis]=edge;na['o'+axis]=nb['i'+axis]=0;changed=true;
      }
    }
    return changed?{...c,nodes}:c;
  });
  for(const c of contours)for(let i=0;i<c.nodes.length;i++){
    const a=c.nodes[i],b=c.nodes[(i+1)%c.nodes.length];
    const curved=!!(a.ox||a.oy||b.ix||b.iy);
    if(curved||Math.hypot(b.x-a.x,b.y-a.y)>eps)edges.push({a,b,curved,ts:[0,1]});
  }
  let overlap=false;
  for(let i=0;i<edges.length;i++){
    const e=edges[i];if(e.curved)continue;
    const dx=e.b.x-e.a.x,dy=e.b.y-e.a.y,len=Math.hypot(dx,dy),len2=len*len;
    for(let j=i+1;j<edges.length;j++){
      const f=edges[j];if(f.curved)continue;
      const distance=p=>Math.abs(dx*(p.y-e.a.y)-dy*(p.x-e.a.x))/len;
      if(distance(f.a)>eps||distance(f.b)>eps)continue;
      const at=p=>((p.x-e.a.x)*dx+(p.y-e.a.y)*dy)/len2;
      const a=at(f.a),b=at(f.b);
      if(Math.min(1,Math.max(a,b))-Math.max(0,Math.min(a,b))<=eps/len)continue;
      overlap=true;
      for(const t of [a,b])if(t>0&&t<1)e.ts.push(t);
      const fx=f.b.x-f.a.x,fy=f.b.y-f.a.y,fl2=fx*fx+fy*fy;
      for(const p of [e.a,e.b]){const t=((p.x-f.a.x)*fx+(p.y-f.a.y)*fy)/fl2;if(t>0&&t<1)f.ts.push(t);}
    }
  }
  if(!overlap)return contours;
  const key=p=>Math.round(p.x/eps)+','+Math.round(p.y/eps),pieces=[];
  for(const e of edges){
    if(e.curved){pieces.push({...e,start:key(e.a),end:key(e.b)});continue;}
    const ts=e.ts.sort((a,b)=>a-b);
    for(let i=1;i<ts.length;i++){
      const point=t=>node(e.a.x+(e.b.x-e.a.x)*t,e.a.y+(e.b.y-e.a.y)*t);
      const a=point(ts[i-1]),b=point(ts[i]),start=key(a),end=key(b);
      if(start!==end)pieces.push({a,b,start,end});
    }
  }
  const pairs=new Map();let cancelled=false;
  for(const e of pieces){
    if(e.curved)continue;
    const k=e.start<e.end?e.start+'|'+e.end:e.end+'|'+e.start;
    const previous=pairs.get(k);
    if(previous){previous.removed=e.removed=true;pairs.delete(k);cancelled=true;}else pairs.set(k,e);
  }
  if(!cancelled)return contours;
  const pending=pieces.filter(e=>!e.removed),starts=new Map();
  for(const e of pending){if(!starts.has(e.start))starts.set(e.start,[]);starts.get(e.start).push(e);}
  const result=[];
  for(const first of pending){
    if(first.used)continue;
    const loop=[];let e=first;
    while(e&&!e.used){e.used=true;loop.push(e);if(e.end===first.start)break;e=starts.get(e.end)?.find(q=>!q.used);}
    if(loop.at(-1)?.end!==first.start)return contours;
    if(loop.length>1||loop[0]?.curved)result.push({closed:true,nodes:loop.map((edge,i)=>{
      const previous=loop[(i+loop.length-1)%loop.length];
      return {...edge.a,ix:previous.b.ix||0,iy:previous.b.iy||0,ox:edge.a.ox||0,oy:edge.a.oy||0};
    })});
  }
  return result;
}
function fullImageMask(o) {
  if(!o.contours)return true;
  const c=o.contours[0],points=[[0,0],[o.w,0],[o.w,o.h],[0,o.h]];
  return o.contours.length===1&&c.closed&&c.nodes.length===4&&c.nodes.every((n,i)=>n.x===points[i][0]&&n.y===points[i][1]&&!n.ix&&!n.iy&&!n.ox&&!n.oy);
}
function constrainImageMask(o) {
  if(o?.kind!=='image'||!o.contours)return;
  // The mask may cross itself or extend beyond the image. Only the image's
  // original rectangle limits painted pixels, never the editable geometry.
  for(const c of o.contours)c.closed=true;
}
// Match bitmap mask spans between surviving anchors before adding virtual
// subdivisions. A new eraser indentation grows from its own edge, never from
// an unrelated image corner. Stored keyframe contours are not rewritten.
function morphImageMask(A,B,p) {
  if(A.length!==1||B.length!==1||!A[0].closed||!B[0].closed)return null;
  const a=A[0],b=B[0];
  if(a.nodes.length<3||b.nodes.length<3||morphNodePair(a,b))return null;
  const na=a.nodes,nb=signedArea(na)*signedArea(b.nodes)<0?reverseNodes(b.nodes):b.nodes;
  const diagonal=Math.max(1,...na.map(n=>Math.hypot(n.x,n.y)),...nb.map(n=>Math.hypot(n.x,n.y)));
  const eps=diagonal*1e-8,used=new Set(),matches=[];
  for(let i=0;i<na.length;i++){
    const n=na[i];let j=n.mid?nb.findIndex((q,j)=>!used.has(j)&&q.mid===n.mid):-1;
    if(j<0)j=nb.findIndex((q,j)=>!used.has(j)&&Math.hypot(q.x-n.x,q.y-n.y)<=eps);
    if(j>=0){matches.push({a:i,b:j});used.add(j);}
  }
  if(matches.length<2)return null;
  // Reject incompatible anchor order rather than twisting the boundary.
  const start=matches[0].b,order=matches.map(q=>(q.b-start+nb.length)%nb.length);
  if(order.some((v,i)=>i>0&&v<=order[i-1]))return null;
  const span=(nodes,start,end)=>{
    const result=[{...nodes[start]}];let i=start;
    do{i=(i+1)%nodes.length;result.push({...nodes[i]});}while(i!==end);
    return result;
  };
  function expand(short,long) {
    if(short.length===long.length)return short;
    if(short.length===2){
      const a=short[0],b=short[1],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
      const distance=q=>Math.abs(dx*(q.y-a.y)-dy*(q.x-a.x))/Math.sqrt(len2||1);
      const controlA={x:a.x+(a.ox||0),y:a.y+(a.oy||0)},controlB={x:b.x+(b.ix||0),y:b.y+(b.iy||0)};
      const along=q=>((q.x-a.x)*dx+(q.y-a.y)*dy)/(len2||1);
      const straight=len2>eps*eps&&distance(controlA)<=eps&&distance(controlB)<=eps&&along(controlA)>=0&&along(controlB)<=1&&along(controlA)<=along(controlB);
      if(straight){
        const ts=long.map(n=>clamp(((n.x-a.x)*dx+(n.y-a.y)*dy)/len2,0,1));
        if(ts.every((v,i)=>!i||v>=ts[i-1]-1e-9)){
          const nodes=ts.map(t=>node(a.x+t*dx,a.y+t*dy));
          nodes[0].ix=a.ix;nodes[0].iy=a.iy;
          nodes[nodes.length-1].ox=b.ox;nodes[nodes.length-1].oy=b.oy;
          return nodes;
        }
      }
    }
    return subdivideTo({closed:false,nodes:short},long.length-1);
  }
  const nodes=[];
  for(let i=0;i<matches.length;i++){
    const first=matches[i],last=matches[(i+1)%matches.length];
    let x=span(na,first.a,last.a),y=span(nb,first.b,last.b);
    if(x.length<y.length)x=expand(x,y);else if(y.length<x.length)y=expand(y,x);
    const blended=x.map((n,j)=>lerpNode(n,y[j],p));
    if(nodes.length){nodes[nodes.length-1].ox=blended[0].ox;nodes[nodes.length-1].oy=blended[0].oy;nodes.push(...blended.slice(1));}
    else nodes.push(...blended);
  }
  const closing=nodes.pop();nodes[0].ix=closing.ix;nodes[0].iy=closing.iy;
  return [{closed:true,nodes}];
}
function lerpObj(a, b, p, mode, rot) {
  const o = Object.assign({}, a);
  const rotation=rot?.deltas&&Number.isFinite(rot.deltas[a.id])?{delta:rot.deltas[a.id]}:rot;
  o.t = lerpT(a.t, b.t, p, mode === 'motion' ? rotation : null);
  if(a.mirror&&b.mirror)o.mirror={...a.mirror,width:lerp(a.mirror.width,b.mirror.width,p),height:lerp(a.mirror.height,b.mirror.height,p)};
  // The editor rotates/scales about the bounds centre unless a custom pivot
  // was set. Tween that same world-space anchor, not the top-left registration
  // point of bitmaps/text. Keep ordinary shape morphing unchanged.
  const customPivot = obj => Array.isArray(obj.pivot) && obj.pivot.length === 2 && obj.pivot.every(Number.isFinite);
  if (mode === 'motion' || (customPivot(a) && customPivot(b))) {
    const pivotOf = obj => {
      if (customPivot(obj)) return obj.pivot;
      const bounds = localBounds(obj);
      return bounds ? [(bounds.x0+bounds.x1)/2,(bounds.y0+bounds.y1)/2] : [0,0];
    };
    const pa = pivotOf(a), pb = pivotOf(b);
    const startPivot = mapply(matOf(a.t),pa[0],pa[1]);
    const endPivot = mapply(matOf(b.t),pb[0],pb[1]);
    o.pivot = [lerp(pa[0],pb[0],p),lerp(pa[1],pb[1],p)];
    const actualPivot = mapply(matOf(o.t),o.pivot[0],o.pivot[1]);
    o.t.x += lerp(startPivot[0],endPivot[0],p)-actualPivot[0];
    o.t.y += lerp(startPivot[1],endPivot[1],p)-actualPivot[1];
  }
  o.op = lerp(nz(a.op, 1), nz(b.op, 1), p);
  o.blur = lerp(nz(a.blur, 0), nz(b.blur, 0), p);
  if (a.bind && b.bind && a.bind.to === b.bind.to && a.bind.bone === b.bind.bone) o.bind = { to: a.bind.to, bone: a.bind.bone, lx: lerp(a.bind.lx, b.bind.lx, p), ly: lerp(a.bind.ly, b.bind.ly, p), lr: lerpAngleShortest(a.bind.lr, b.bind.lr, p) };
  if(a.sbind&&b.sbind&&a.sbind.to===b.sbind.to&&a.sbind.joint===b.sbind.joint&&!!a.sbind.node===!!b.sbind.node)o.sbind={...a.sbind,lx:lerp(a.sbind.lx,b.sbind.lx,p),ly:lerp(a.sbind.ly,b.sbind.ly,p),lr:lerpAngleShortest(a.sbind.lr,b.sbind.lr,p)};
  if(a.skin&&b.skin&&a.skin.to===b.skin.to){o.skin={...a.skin,base:mode==='shape'?(morphContours(a.skin.base,b.skin.base,p)||a.skin.base):a.skin.base,bones:a.skin.bones.map(x=>{const y=b.skin.bones.find(y=>y.id===x.id);return y?{...x,stiffness:lerp(x.stiffness,y.stiffness,p)}:x;})};}
  if(a.kind==='image'&&b.kind==='image'){
    // Eraser masks are frame-by-frame cels; keep normal transform animation.
    o.contours=mode==='shape'&&!a.eraserMask&&!b.eraserMask?((a.img===b.img&&a.w===b.w&&a.h===b.h?morphImageMask(imageContours(a),imageContours(b),p):null)||morphContours(imageContours(a),imageContours(b),p)||clone(imageContours(a))):clone(imageContours(a));
    constrainImageMask(o);return o;
  }
  if(a.star&&b.star&&a.star.points===b.star.points){
    o.star={...a.star,curves:{},corners:{}};
    for(const side of ['left','right']){const x=a.star.corners?.[side]||{},y=b.star.corners?.[side]||{};o.star.corners[side]={turn:lerp(x.turn||0,y.turn||0,p),depth:lerp(x.depth||0,y.depth||0,p)};}
    for(const key of ['outer','inner','clip','gap'])o.star[key]=lerp(a.star[key],b.star[key],p);
    for(const key of ['outerAngle','innerAngle'])o.star[key]=a.star[key]+Math.atan2(Math.sin(b.star[key]-a.star[key]),Math.cos(b.star[key]-a.star[key]))*p;
    for(const key of ['left','right','tip','root']){const x=a.star.curves?.[key]||{},y=b.star.curves?.[key]||{};o.star.curves[key]={bend:lerp(x.bend||0,y.bend||0,p),slide:lerp(x.slide||0,y.slide||0,p)};}
    o.contours=[starContour(o.star)];lerpPaint(o,a,b,p);return o;
  }
  if(a.star||b.star)delete o.star;
  if(a.arc&&b.arc){o.arc={rx:lerp(a.arc.rx,b.arc.rx,p),ry:lerp(a.arc.ry,b.arc.ry,p),start:a.arc.start+Math.atan2(Math.sin(b.arc.start-a.arc.start),Math.cos(b.arc.start-a.arc.start))*p,mouth:lerp(a.arc.mouth,b.arc.mouth,p)};o.contours=[mouthContour(o.arc)];lerpPaint(o,a,b,p);return o;}
  if(a.arc||b.arc)delete o.arc;
  if(a.skel&&b.skel){o.skel=lerpSkeleton(a.skel,b.skel,p,matOf(o.t),matOf(a.t),matOf(b.t));skeletonBuild(o);return o;}
  if (a.kind === 'text' && b.kind === 'text') { lerpPaint(o, a, b, p); return o; }
  if (a.kind === 'path' && b.kind === 'path') {
    lerpPaint(o, a, b, p);
    if (a.grad && b.grad && a.grad.type === b.grad.type && a.grad.stops.length === b.grad.stops.length) {
      o.grad = { type: a.grad.type, stops: a.grad.stops.map((s, i) => ({ o: lerp(s.o, b.grad.stops[i].o, p), c: lerpHex(s.c, b.grad.stops[i].c, p), a: lerp(nz(s.a, 1), nz(b.grad.stops[i].a, 1), p) })), m: a.grad.m && b.grad.m ? a.grad.m.map((v, i) => lerp(v, b.grad.m[i], p)) : (a.grad.m || b.grad.m) };
    }
    if(o.skin)o.contours=o.skin.base;else if (mode === 'shape') { const m = morphContours(a.contours, b.contours, p); if (m) o.contours = m; }
    if (a.rig && b.rig) { o.rig = lerpRig(a.rig, b.rig, p); rigBuild(o); }
  }
  return o;
}
function kfIndexAt(layer, t) {
  let idx = -1;
  for (let i = 0; i < layer.kfs.length; i++) { if (layer.kfs[i].f <= t) idx = i; else break; }
  return idx;
}
function kfAt(layer, f) { return layer.kfs.find((k) => k.f === f) || null; }
function kfFor(layer, f) { const i = kfIndexAt(layer, f); return i < 0 ? null : layer.kfs[i]; }
function withClips(layer, i, t, objs) {
  let any = false;
  for (const o of objs) if (o.kind === 'clip') { any = true; break; }
  if (!any) return objs;
  return objs.map((o) => {
    if (o.kind !== 'clip') return o;
    const lib = _lib[o.sym], n = lib ? lib.frames : 1;
    let start;
    if (o.mc) { let j = i; while (j > 0 && layer.kfs[j - 1].objs.some((x) => x.id === o.id && x.kind === 'clip')) j--; start = layer.kfs[j].f; }
    else start = layer.kfs[i].f;
    /* playback mode and first frame belong to graphic symbols (as in Animate); a movie clip always loops from its first frame */
    const el = Math.max(0, (o.mc && _ctxEl != null ? _ctxEl : t) - start), first = o.mc ? 0 : (o.first || 0), mode = o.mc ? 'loop' : o.mode;
    const f = mode === 'single' ? first : mode === 'once' ? Math.min(first + el, n - 1) : (first + el) % n;
    const c = Object.assign({}, o);
    Object.defineProperty(c, '_f', { value: f, enumerable: false });
    Object.defineProperty(c, '_el', { value: el, enumerable: false });
    return c;
  });
}
/* which object in the next keyframe each object tweens to: same id first; for a shape tween, leftover shapes pair up in drawing order, so drawing a new shape in a blank keyframe still morphs */
function tweenPairs(kf, next) {
  const byId = new Map(next.objs.map((o) => [o.id, o])), pairs = new Map(), used = new Set();
  for (const a of kf.objs) { const b = byId.get(a.id); if (b && b.kind === a.kind) { pairs.set(a, b); used.add(b); } }
  if (kf.tween === 'shape') {
    const free = next.objs.filter((o) => o.kind === 'path' && !used.has(o));
    let q = 0;
    for (const a of kf.objs) if (!pairs.has(a) && a.kind === 'path' && q < free.length) pairs.set(a, free[q++]);
  }
  return pairs;
}
/* how many shapes in a shape tween cannot morph smoothly (different part counts or open/closed mismatch) */
function shapeTweenIssues(layer, f) {
  const i = kfIndexAt(layer, f); if (i < 0) return 0;
  const kf = layer.kfs[i], next = layer.kfs[i + 1]; if (!next) return 0;
  let n = 0;
  for (const [a, b] of tweenPairs(kf, next)) if (a.kind === 'path' && b.kind === 'path' && !morphContours(a.contours, b.contours, 0.5)) n++;
  return n;
}
let renderEvalCache=null,renderRawCache=null;
function beginRenderEval(){renderEvalCache=new WeakMap();renderRawCache=new WeakMap();}
function endRenderEval(){renderEvalCache=null;renderRawCache=null;}
function resolveMirrors(objs,layer,t){
  if(!objs.some(o=>o.mirror))return objs;
  const mirrors=objs.filter(o=>o.mirror);
  return objs.map(o=>{
    if(!o.mirror){
      if(o.kind!=='path'||o.skel||o.invisMask)return o;
      const cuts=mirrors.filter(q=>(!q.mirror.layer||q.mirror.layer===layer.id)&&(!q.mirror.ids||q.mirror.ids.includes(o.id))).map(q=>({matrix:matOf(q.t),width:q.mirror.width,height:q.mirror.height}));
      if(!cuts.length)return o;
      const copy=Object.defineProperties({},Object.getOwnPropertyDescriptors(o));Object.defineProperty(copy,'_mirrorCuts',{value:cuts,enumerable:false});return copy;
    }
    const m=o.mirror,w=Math.max(.0001,m.width),h=Math.max(.0001,m.height),M=matOf(o.t),det=M[0]*M[3]-M[1]*M[2];
    let children=[];
    if(Math.abs(det)>1e-12){
      const source=(skeletonScopes.get(layer)||[layer]).find(l=>l.id===m.layer)||layer;
      const poses=source===layer?objs:resolveSkeletonBinds(resolveBinds(evalLayerRaw(source,t)),source,t),reflect=mmul([-1,0,0,1,0,0],minv(M));
      children=poses.filter(q=>q.kind==='path'&&!q.skel&&!q.invisMask&&q.fill!=null&&(!m.ids||m.ids.includes(q.id))).map(q=>{const child=clone(softView(q));delete child.bind;delete child.sbind;delete child.skin;setObjMatrix(child,mmul(reflect,matOf(q.t)));delete child.arc;delete child.ellipseFrame;return child;});
    }
    const mask=mkPath([{closed:true,nodes:[node(0,-h/2),node(w,-h/2),node(w,h/2),node(0,h/2)]}],{fill:'#ffffff',stroke:null});
    mask.crispMask=true;
    const result={...o};Object.defineProperties(result,{children:{value:children,enumerable:false,configurable:true},mask:{value:[mask],enumerable:false,configurable:true}});return result;
  });
}
function evalLayerObjs(layer,t) {
  const cache=renderEvalCache,scope=skeletonScopes.get(layer),rows=cache?.get(layer);
  if(rows){const hit=rows.find(r=>r.t===t&&r.el===_ctxEl&&r.lib===_lib&&r.scope===scope);if(hit)return hit.objs;}
  const el=_ctxEl,lib=_lib,objs=resolveMirrors(resolveSkeletonBinds(resolveBinds(evalLayerRaw(layer,t)),layer,t),layer,t);
  if(cache){const entry={t,el,lib,scope,objs};if(rows)rows.push(entry);else cache.set(layer,[entry]);}
  return objs;
}
// Share raw poses across attached artwork only inside the current render pass.
function evalLayerRaw(layer,t) {
  const cache=renderRawCache;if(!cache)return evalLayerRawUncached(layer,t);
  const el=_ctxEl,lib=_lib,scope=skeletonScopes.get(layer),rows=cache.get(layer),hit=rows?.find(r=>r.t===t&&r.el===el&&r.lib===lib&&r.scope===scope);if(hit)return hit.objs;
  const objs=evalLayerRawUncached(layer,t),entry={t,el,lib,scope,objs};if(rows)rows.push(entry);else cache.set(layer,[entry]);return objs;
}
function sameSkeletonBinding(a,b) {
  return (!a&&!b)||!!(a&&b&&a.to===b.to&&a.joint===b.joint&&!!a.node===!!b.node);
}
// A newly attached/detached/rebound object must tween to the pose actually
// displayed at the endpoint, not its stale pre-binding registration transform.
function tweenBindingEndpoint(layer,key,o) {
  if(!o.sbind||freeBind.has(o.id))return o;
  const scope=skeletonScopes.get(layer)||[layer];let rig=null;
  for(const l of scope.filter(l=>l.visible===false).concat(scope.filter(l=>l.visible!==false))){
    let objects=key.objs;
    if(l!==layer){
      // Evaluate rig channels only. Evaluating attached artwork here would
      // recursively resolve the same cross-layer binding transition.
      if(!l.kfs.some(k=>k.objs.some(o=>o.skel)))continue;
      const rigs={...l,kfs:l.kfs.map(k=>({...k,objs:k.objs.filter(o=>o.skel)}))};
      objects=evalLayerRawUncached(rigs,key.f);
    }
    for(const q of objects)if(q.skel&&q.id===o.sbind.to)rig=q;
  }
  return rig?{...o,t:skeletonBoundPose(o,rig)}:o;
}
function tweenLayerObject(layer,key,next,a,b,p,mode,rot) {
  if(!a.skin&&!b.skin&&!sameSkeletonBinding(a.sbind,b.sbind)){
    const start={...tweenBindingEndpoint(layer,key,a)},end={...tweenBindingEndpoint(layer,next,b)};
    delete start.sbind;delete end.sbind;
    return lerpObj(start,end,p,mode,rot);
  }
  return lerpObj(a,b,p,mode,rot);
}
function evalLayerRawUncached(layer, t) {
  const i = kfIndexAt(layer, t);
  if (i < 0) return [];
  const kf = layer.kfs[i], next = layer.kfs[i + 1];
  const editableImages=objs=>objs.map(o=>o.kind==='image'&&!o.contours?{...o,contours:imageContours(o)}:o);
  if (kf.tween && kf.tween !== 'none' && next && t > kf.f) {
    const p = (t - kf.f) / (next.f - kf.f);
    const e = keyframeEase(kf,p);
    const pairs = tweenPairs(kf, next);
    return withClips(layer, i, t, editableImages(kf.objs.map((a) => { const b = pairs.get(a); return b ? tweenLayerObject(layer,kf,next,a,b,e,kf.tween,kf.rot) : a; })));
  }
  return withClips(layer, i, t, editableImages(kf.objs));
}
const notGhost = (o) => !o.skel && !(o.rig && o.rig.ghost);
/* in the editor a bone arm is always drawn semi-transparent so the artwork under it stays visible; exports draw it as it really is */
const fadeGhost = (o) => (o.rig ? Object.assign({}, o, { op: nz(o.op, 1) * 0.35 }) : o);
function evalDoc(doc, t, ghosts) {
  const ownPass=!renderEvalCache;if(ownPass)beginRenderEval();
  try {
    _lib = doc.lib || {};
    setSkeletonScope(doc.layers);
    return doc.layers.map((layer) => ({ layer, objs: layer.visible === false ? [] : ghosts ? evalLayerObjs(layer, t).map(fadeGhost) : evalLayerObjs(layer, t).filter(notGhost) }));
  } finally {if(ownPass)endRenderEval();}
}
function sortKfs(layer) { layer.kfs.sort((a, b) => a.f - b.f); }

/* ---------- keyframe editing ---------- */
function ensureEditable(layer, f) {
  const i = kfIndexAt(layer, f);
  if (i < 0) { const k = mkKf(f); layer.kfs.push(k); sortKfs(layer); return k; }
  const kf = layer.kfs[i], next = layer.kfs[i + 1];
  if (kf.f !== f && kf.tween !== 'none' && next) {
    const k = { f, objs: clone(evalLayerObjs(layer, f).map(o=>o.skin?{...o,contours:o.skin.base}:o)), tween: kf.tween, rot: kf.rot ? { ...kf.rot } : undefined, ease: Object.assign({}, kf.ease, kf.ease && kf.ease.p ? { p: kf.ease.p.slice() } : {}) };
    layer.kfs.splice(i + 1, 0, k);
    return k;
  }
  return kf;
}
function insertKeyframe(layer, f, blank) {
  const ex = kfAt(layer, f);
  if (ex) { if (blank) { ex.objs = []; ex.tween = 'none'; } return ex; }
  const cur = kfFor(layer, f);
  const k = mkKf(f, blank ? [] : clone(evalLayerObjs(layer, f).map(o=>o.skin?{...o,contours:o.skin.base}:o)));
  if (cur && cur.tween !== 'none' && !blank) {
    const next = layer.kfs[layer.kfs.indexOf(cur) + 1];
    if (next) { k.tween = cur.tween; k.rot = cur.rot ? { ...cur.rot } : undefined; k.ease = Object.assign({}, cur.ease, cur.ease && cur.ease.p ? { p: cur.ease.p.slice() } : {}); }
  }
  layer.kfs.push(k); sortKfs(layer);
  return k;
}
function insertFrames(layer, f, n, doc) {
  for (const k of layer.kfs) if (k.f > f) k.f += n;
  doc.frames += n;
}
function removeFrames(layer, f, n, doc) {
  layer.kfs = layer.kfs.filter((k) => k.f === 0 || k.f < f || k.f >= f + n);
  for (const k of layer.kfs) if (k.f >= f + n) k.f -= n;
  const mx = Math.max(...doc.layers.map((l) => l.kfs[l.kfs.length - 1].f)) + 1;
  doc.frames = Math.max(mx, doc.frames - n, 1);
}
function clearKeyframe(layer, f) {
  const k = kfAt(layer, f);
  if (!k || f === 0) return false;
  layer.kfs.splice(layer.kfs.indexOf(k), 1);
  return true;
}
function moveKeyframe(layer, from, to) {
  const k = kfAt(layer, from);
  if (!k || from === 0 || to <= 0 || kfAt(layer, to)) return false;
  k.f = to; sortKfs(layer);
  return true;
}
/* frame ranges: reverse the order of the keyframes inside frames a..b, or slide a block of keyframes together */
function keyframeEase(kf,p) {
  const e=kf.ease||{},value=t=>ease(e.type,e.amt,t,e.p),range=e.window;
  if(Array.isArray(range)&&range.length===2&&range.every(Number.isFinite)){
    const a=value(range[0]),b=value(range[1]),d=b-a;
    return Math.abs(d)>1e-12?(value(range[0]+(range[1]-range[0])*p)-a)/d:p;
  }
  return value(p);
}
function reverseFrames(layers,a,b,doc) {
  a=Math.max(0,Math.round(a));b=Math.min(Math.round(b),doc.frames-1);if(!(b>a))return 0;
  let count=0;
  for(const layer of layers){
    if(layer.locked)continue;
    const source={...layer,kfs:clone(layer.kfs)},mirror=f=>a+b-f,times=new Set([a,b]);
    const sample=f=>{const exact=kfAt(source,f),key=exact?clone(exact):mkKf(f);key.f=f;key.objs=clone(evalLayerRaw(source,f));key.tween='none';key.ease={type:'linear',amt:50};delete key.rot;return key;};
    const transition=(key,from,to)=>{
      const i=kfIndexAt(source,(from+to)/2),old=source.kfs[i],next=source.kfs[i+1];if(!old||!next||!old.tween||old.tween==='none')return;
      const u=(from-old.f)/(next.f-old.f),v=(to-old.f)/(next.f-old.f),window=old.ease?.window||[0,1];
      key.tween=old.tween;key.ease={...clone(old.ease||{}),window:[window[0]+(window[1]-window[0])*u,window[0]+(window[1]-window[0])*v]};
      if(old.tween==='motion'){
        const deltas={},fraction=keyframeEase(old,v)-keyframeEase(old,u);
        for(const [x,y] of tweenPairs(old,next)){const rotation=old.rot?.deltas&&Number.isFinite(old.rot.deltas[x.id])?{delta:old.rot.deltas[x.id]}:old.rot;const delta=(lerpAngleTween(x.t.r,y.t.r,1,rotation)-x.t.r)*fraction;if(Math.abs(delta)>1e-10)deltas[x.id]=delta;}
        if(old.rot||Object.keys(deltas).length)key.rot={...clone(old.rot||{}),dir:from>to?(old.rot?.dir==='cw'?'ccw':old.rot?.dir==='ccw'?'cw':'short'):(old.rot?.dir||'short'),deltas};
      }
    };
    for(let i=0;i<source.kfs.length;i++){const k=source.kfs[i];if(k.f<a||k.f>b)continue;times.add(mirror(k.f));if(i&&source.kfs[i-1].tween==='none'&&mirror(k.f)+1<=b)times.add(mirror(k.f)+1);}
    const positions=Array.from(times).sort((x,y)=>x-y),output=positions.map(f=>{const k=sample(mirror(f));k.f=f;return k;});
    for(let i=0;i<output.length-1;i++)transition(output[i],mirror(output[i].f),mirror(output[i+1].f));
    const outside=clone(source.kfs.filter(k=>k.f<a||k.f>b));
    // Preserve the samples immediately outside a partial selection. A guard
    // on the preceding frame prevents its old tween from targeting the new pose.
    if(a>0){const guard=sample(a-1),previous=outside.filter(k=>k.f<a-1).at(-1);if(previous)transition(previous,previous.f,a-1);const at=outside.findIndex(k=>k.f===a-1);if(at>=0)outside[at]=guard;else outside.push(guard);}
    if(b+1<doc.frames){const guard=sample(b+1),next=source.kfs.find(k=>k.f>b+1);if(next)transition(guard,b+1,next.f);const at=outside.findIndex(k=>k.f===b+1);if(at>=0)outside[at]=guard;else outside.push(guard);}
    const compact=[];
    for(const key of output){const previous=compact.at(-1),plain=Object.keys(key).every(k=>['f','objs','tween','ease','rot'].includes(k));if(previous&&previous.tween==='none'&&key.tween==='none'&&plain&&JSON.stringify(previous.objs)===JSON.stringify(key.objs))continue;compact.push(key);}
    layer.kfs=[...outside,...compact];sortKfs(layer);count++;
  }
  return count;
}

function moveKeyframes(layers, a, b, delta, doc, only) {
  if (!delta) return true;
  const plan = [];
  let top = 0;
  for (const layer of layers) {
    const mv = layer.kfs.filter((k) => k.f > 0 && (only ? only.has(k) : k.f >= a && k.f <= b));
    if (!mv.length) continue;
    const stay = new Set(layer.kfs.filter((k) => !mv.includes(k)).map((k) => k.f));
    for (const k of mv) { const t = k.f + delta; if (t < 1 || stay.has(t)) return false; top = Math.max(top, t); }
    plan.push([layer, mv]);
  }
  if (!plan.length || top + 1 > 900) return false;
  for (const [layer, mv] of plan) { for (const k of mv) k.f += delta; sortKfs(layer); }
  if (top + 1 > doc.frames) doc.frames = top + 1;
  return true;
}
/* returns {ok, msg}; if none follows, the playhead chooses the new end keyframe. */
function setTweenAt(doc, layer, f, type) {
  const i = kfIndexAt(layer, f);
  if (i < 0) return { ok: false, msg: 'No keyframe here.' };
  const kf = layer.kfs[i];
  if (type === 'none') { kf.tween = 'none'; return { ok: true }; }
  let next = layer.kfs[i + 1];
  let msg = '';
  if (!next) {
    const last=Math.min(Math.round(f),doc.frames-1);
    if(last<=kf.f)return {ok:false,msg:'Move the playhead after this keyframe to choose where the tween ends.'};
    next = mkKf(last, clone(kf.objs));
    layer.kfs.push(next); sortKfs(layer);
    msg = 'Added an end keyframe at frame ' + (last + 1) + '.';
  }
  kf.tween = type;
  return { ok: true, msg };
}

/* ---------- drawing ---------- */
/* draw `draw` into a scratch canvas and composite it once at alpha `a`, so overlapping parts of one object fade together like a single layer (as in Animate and in the SVG export).
   `rect` (device pixels) limits the scratch work to where the object can paint; without it the whole canvas is used. */
function groupAlpha(ctx, a, draw, rect) {
  if (a >= 0.999) { draw(ctx); return; }
  if (a <= 0.001) return;
  const cv = ctx.canvas, w = cv.width, h = cv.height, d = _md++;
  try {
    if (!_mt[d * 2]) _mt[d * 2] = document.createElement('canvas');
    const c = _mt[d * 2];
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const r = rect || { x: 0, y: 0, w, h };
    const cc = c.getContext('2d');
    cc.setTransform(1, 0, 0, 1, 0, 0); cc.globalCompositeOperation = 'source-over'; cc.globalAlpha = 1; cc.clearRect(r.x, r.y, r.w, r.h);
    cc.setTransform(ctx.getTransform());
    draw(cc);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha *= a; ctx.drawImage(c, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h); ctx.restore();
  } finally { _md--; }
}
/* extra room (in the object's own units) its strokes and glyphs can paint beyond its bounds */
function paintPad(o) {
  if (o.kind === 'path') return o.stroke && o.sw > 0 ? o.sw * 1.5 : 0;
  if (o.kind === 'text') return Math.max(8, ...((o.runs || []).map((r) => (r.size || 16) * 0.5)));
  if (o.kind === 'group' || o.kind === 'clip') {
    let m = 0;
    for (const ch of kidsOf(o)) m = Math.max(m, paintPad(ch) * Math.max(1, Math.abs(ch.t.sx), Math.abs(ch.t.sy)));
    return m;
  }
  return 0;
}
function deviceRect(ctx, o, strokeBase) {
  const b = localBounds(o);
  if (!b) return null;
  const T = ctx.getTransform(), m = matOf(o.t);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]]) {
    const q = mapply(m, x, y), p = T.transformPoint({ x: q[0], y: q[1] });
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
  }
  const sc = Math.max(Math.hypot(T.a, T.b), Math.hypot(T.c, T.d), 1) * Math.max(1, Math.abs(o.t.sx), Math.abs(o.t.sy));
  const baseScale = strokeBase ? Math.max(Math.hypot(strokeBase.a,strokeBase.b),Math.hypot(strokeBase.c,strokeBase.d)) : 0;
  const pad = paintPad(o) * Math.max(sc,baseScale) + 3;
  const cw = ctx.canvas.width, ch = ctx.canvas.height;
  x0 = Math.max(0, Math.floor(x0 - pad)); y0 = Math.max(0, Math.floor(y0 - pad)); x1 = Math.min(cw, Math.ceil(x1 + pad)); y1 = Math.min(ch, Math.ceil(y1 + pad));
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : { x: 0, y: 0, w: 0, h: 0 };
}
function mirrorCutPath(cut){const rect=new Path2D(),path=new Path2D();rect.rect(0,-cut.height/2,cut.width,cut.height);path.addPath(rect,new DOMMatrix(cut.matrix));return path;}
/* Mirror cuts share pixel ownership in device space. Complementary soft clips
   otherwise leave a translucent seam when their coverages are composited. */
const mirrorPixelCache=new Map();
function mirrorPixelPath(ctx,cut) {
  const M=ctx.getTransform().multiply(new DOMMatrix(cut.matrix)),W=ctx.canvas.width,H=ctx.canvas.height,key=[W,H,M.a,M.b,M.c,M.d,M.e,M.f,cut.width,cut.height].join(',');
  if(mirrorPixelCache.has(key)){const p=mirrorPixelCache.get(key);mirrorPixelCache.delete(key);mirrorPixelCache.set(key,p);return p;}
  const path=new Path2D(),det=M.a*M.d-M.b*M.c;
  if(Number.isFinite(det)&&Math.abs(det)>1e-12){
    const inv=M.inverse(),corners=[[0,-cut.height/2],[cut.width,-cut.height/2],[cut.width,cut.height/2],[0,cut.height/2]].map(([x,y])=>M.transformPoint({x,y})),first=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.y)))),end=Math.min(H,Math.ceil(Math.max(...corners.map(p=>p.y))));
    for(let y=first;y<end;y++){
      let lo=0,hi=W,valid=true;
      for(const [a,offset,min,max] of [[inv.a,inv.c*(y+.5)+inv.e,0,cut.width],[inv.b,inv.d*(y+.5)+inv.f,-cut.height/2,cut.height/2]]){
        if(Math.abs(a)<1e-12){if(offset<min||offset>=max){valid=false;break;}}
        else {const p=(min-offset)/a,q=(max-offset)/a;lo=Math.max(lo,Math.min(p,q));hi=Math.min(hi,Math.max(p,q));}
      }
      const x0=Math.max(0,Math.ceil(lo-.5-1e-9)),x1=Math.min(W,Math.ceil(hi-.5-1e-9));if(valid&&x1>x0)path.rect(x0,y,x1-x0,1);
    }
  }
  mirrorPixelCache.set(key,path);if(mirrorPixelCache.size>16)mirrorPixelCache.delete(mirrorPixelCache.keys().next().value);return path;
}
function mirrorPixelClip(ctx,cut,outside=false) {
  const path=mirrorPixelPath(ctx,cut),M=ctx.getTransform();ctx.setTransform(1,0,0,1,0,0);
  if(outside){const all=new Path2D();all.rect(0,0,ctx.canvas.width,ctx.canvas.height);all.addPath(path);ctx.clip(all,'evenodd');}else ctx.clip(path);
  ctx.setTransform(M);
}

function drawMirrorExcluded(ctx,o,opt){
  ctx.save();
  try{
    for(const cut of o._mirrorCuts)mirrorPixelClip(ctx,cut,true);
    const descriptors=Object.getOwnPropertyDescriptors(o);delete descriptors._mirrorCuts;drawObj(ctx,Object.defineProperties({},descriptors),opt);
  }finally{ctx.restore();}
}
function drawObj(ctx, o, opt) {
  if(o._mirrorCuts?.length){drawMirrorExcluded(ctx,o,opt);return;}
  if(o.skel)return;
  if(o._softParts){drawObj(ctx,softView(o),opt);return;}
  if(opt?.onion&&o.blur>0)o={...o,blur:0};
  // Keep the document/view transform separate from all object/group scaling.
  opt = opt && opt.strokeBase ? opt : Object.assign({},opt,{strokeBase:ctx.getTransform()});
  const op = nz(o.op, 1);
  const multi = o.kind === 'group' || o.kind === 'clip' || (o.kind !== 'text' && o.kind !== 'image' && o.fill && o.stroke && o.sw > 0);
  if (op < 0.999 && multi) {
    const r = deviceRect(ctx, o, opt.strokeBase);
    if (r && (r.w <= 0 || r.h <= 0)) return; /* entirely off canvas */
    groupAlpha(ctx, op, (c) => drawObjRaw(c, o, opt, true), r || undefined);
    return;
  }
  drawObjRaw(ctx, o, opt, false);
}
function onionOutline(ctx,path,opt){
  if(!opt?.onion)return;
  const base=opt.strokeBase||ctx.getTransform(),outline=new Path2D();outline.addPath(path,base.inverse().multiply(ctx.getTransform()));
  const w=opt.onion.width||1,a=opt.tint?.a||.28;
  ctx.save();ctx.setTransform(base);ctx.setLineDash([]);ctx.lineCap='round';ctx.lineJoin='round';
  for(const [color,width,alpha] of [['#ffffff',4,1.4],['#111111',2.5,1.7],[opt.tint?.c||'#6554c0',1.2,2.2]]){ctx.strokeStyle=rgba(color,Math.min(.85,a*alpha));ctx.lineWidth=w*width;ctx.stroke(outline);}
  ctx.restore();
}
function drawObjRaw(ctx, o, opt, noOp) {
  opt = opt || {};
  ctx.save();
  const blur = Math.max(0, Math.min(30, Number(o.blur) || 0));
  // KROGAN V1.1: render gradient paths into a transparent object-sized layer first.
  // Blurring the finished layer (not the giant gradient fillRect) preserves soft outer edges.
  if (blur > 0 && o.kind === 'path' && o.fill && o.grad && 'filter' in ctx) {
    const r = deviceRect(ctx, o, opt.strokeBase);
    if (r && r.w > 0 && r.h > 0) {
      const T = ctx.getTransform();
      const scale = Math.max(Math.hypot(T.a, T.b), Math.hypot(T.c, T.d), 1);
      const radius = blur * scale;
      const pad = Math.ceil(radius * 3 + 4);
      const x = Math.floor(r.x - pad), y = Math.floor(r.y - pad);
      const w = Math.ceil(r.w + pad * 2), h = Math.ceil(r.h + pad * 2);
      // Limit temporary allocations if a transformed object becomes enormous.
      if (w > 0 && h > 0 && w * h <= 24000000) {
        const layer = document.createElement('canvas');
        layer.width = w; layer.height = h;
        const lc = layer.getContext('2d');
        if (lc) {
          lc.setTransform(T.a, T.b, T.c, T.d, T.e - x, T.f - y);
          drawObjRaw(lc, Object.assign({}, o, { blur: 0 }), opt, noOp);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.filter = 'blur(' + radius + 'px)';
          ctx.drawImage(layer, x, y);
          ctx.restore();
          return;
        }
      }
    }
  }
  if (blur > 0 && 'filter' in ctx) ctx.filter = 'blur(' + blur + 'px)';
  const m = matOf(o.t);
  ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
  if (!noOp) ctx.globalAlpha *= nz(o.op, 1);
  if (o.kind === 'group' || o.kind === 'clip') {
    if (o.kind === 'clip' && o.pv) ctx.translate(-o.pv[0], -o.pv[1]);
    if(o.mirror){ctx.save();mirrorPixelClip(ctx,{matrix:[1,0,0,1,0,0],width:Math.max(.0001,o.mirror.width),height:Math.max(.0001,o.mirror.height)});for(const ch of o.children)drawObj(ctx,ch,opt);ctx.restore();}
    else if(o.softClip&&o.mask){ctx.save();for(const mask of o.mask){const local=new Path2D(),path=new Path2D();tracePath(local,mask.contours);path.addPath(local,new DOMMatrix(matOf(mask.t)));ctx.clip(path,mask.nz?'nonzero':'evenodd');}for(const ch of o.children)drawObj(ctx,ch,opt);ctx.restore();}
    else if (o.mask) maskedDraw(ctx, (c) => { for (const ch of joinedRasterCuts(o.children)) drawObj(c, ch, opt); }, (c) => { for (const m of o.mask) drawObj(c, m, {strokeBase:opt.strokeBase}); });
    else for (const ch of joinedRasterCuts(kidsOf(o))) drawObj(ctx, ch, opt);
  } else if (o.kind === 'image') {
    ctx.save();
    if(o.contours){const mask=new Path2D();tracePath(mask,imageMaskContours(o));ctx.clip(mask,'evenodd');}
    ctx.beginPath();ctx.rect(0,0,o.w,o.h);ctx.clip();
    const el = o._rasterCanvas || imgEl(o.img);
    if (el) { ctx.save();if (opt.tint) ctx.globalAlpha *= Math.min(0.5, opt.tint.a * 1.5); ctx.drawImage(el, 0, 0, o.w, o.h);ctx.restore(); }
    else if (!_images[o.img]) { ctx.fillStyle = 'rgba(128,128,128,.25)'; ctx.fillRect(0, 0, o.w, o.h); }
    if(opt.onion){const border=new Path2D();if(o.contours)tracePath(border,o.contours);else border.rect(0,0,o.w,o.h);onionOutline(ctx,border,opt);}
    ctx.restore();
  } else if (o.kind === 'text') {
    const lay = layoutText(o);
    ctx.textBaseline = 'top';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (o.ls || 0) + 'px';
    for (const l of lay.lines) {
      let x = l.x;
      for (const sg of l.segs) {
        ctx.font = fontStr(sg.r);
        ctx.fillStyle = opt.tint ? rgba(opt.tint.c, opt.tint.a) : rgba(sg.r.c || o.fill || '#000000', nz(o.fa, 1));
        if(opt.onion){ctx.save();const T=ctx.getTransform(),B=opt.strokeBase||T,scale=Math.max(Math.hypot(T.a,T.b),Math.hypot(T.c,T.d))/Math.max(.001,Math.hypot(B.a,B.b),Math.hypot(B.c,B.d)),w=(opt.onion.width||1)/Math.max(.001,scale),a=opt.tint?.a||.28;ctx.setLineDash([]);ctx.lineJoin='round';for(const [c,width,alpha] of [['#ffffff',4,1.4],['#111111',2.5,1.7],[opt.tint?.c||'#6554c0',1.2,2.2]]){ctx.strokeStyle=rgba(c,Math.min(.85,a*alpha));ctx.lineWidth=w*width;ctx.strokeText(sg.t,x,l.y);}ctx.restore();}
        ctx.fillText(sg.t, x, l.y); x += sg.w;
      }
    }
  } else {
    const p = new Path2D();
    tracePath(p, o.contours);
    if (o.fill) {
      const g = o.grad;
      if (g && !opt.tint && Math.abs(g.m[0] * g.m[3] - g.m[1] * g.m[2]) > 1e-12) {
        ctx.save();
        ctx.clip(p, o.nz ? 'nonzero' : 'evenodd');
        ctx.transform(g.m[0], g.m[1], g.m[2], g.m[3], g.m[4], g.m[5]);
        const gr = g.type === 'radial' ? ctx.createRadialGradient(0, 0, 0, 0, 0, 819.2) : ctx.createLinearGradient(-819.2, 0, 819.2, 0);
        for (const st of g.stops) gr.addColorStop(clamp(st.o, 0, 1), rgba(st.c, st.a * nz(o.fa, 1)));
        ctx.fillStyle = gr;
        ctx.fillRect(-1e6, -1e6, 2e6, 2e6);
        ctx.restore();
      } else {
        ctx.fillStyle = opt.tint ? rgba(opt.tint.c, opt.tint.a * nz(o.fa, 1)) : rgba(o.fill, nz(o.fa, 1));
        ctx.fill(p, o.nz ? 'nonzero' : 'evenodd');
      }
    }
    if (o.stroke && o.sw > 0) {
      ctx.strokeStyle = opt.tint ? rgba(opt.tint.c, opt.tint.a * nz(o.sa, 1)) : rgba(o.stroke, nz(o.sa, 1));
      ctx.lineWidth = o.sw; ctx.lineCap = o.cap || 'round'; ctx.lineJoin = o.join || 'round';
      ctx.setLineDash(dashArray(o));
      // Transform the centreline, then stroke it in document units. This also
      // handles unequal X/Y scaling and nested group transforms.
      const base = opt.strokeBase || ctx.getTransform();
      const outline = new Path2D();
      outline.addPath(p,base.inverse().multiply(ctx.getTransform()));
      ctx.save(); ctx.setTransform(base); ctx.stroke(outline); ctx.restore();
    }
    if(!o._softFill)onionOutline(ctx,p,opt);
  }
  ctx.restore();
}
function hitObj(o, x, y, tol, hctx, anyAlpha, parentMatrix) {
  if(o._mirrorCuts?.length){const q=parentMatrix?mapply(minv(parentMatrix),x,y):[x,y];if(o._mirrorCuts.some(cut=>{const p=mapply(minv(cut.matrix),...q);return p[0]>=0&&p[0]<=cut.width&&Math.abs(p[1])<=cut.height/2;}))return false;}

  if(o.skel)return false;
  if(o._softParts){const filled={...o,contours:o._softParts.flatMap(p=>p.fill),nz:true,stroke:null};if(hitObj(filled,x,y,tol,hctx,anyAlpha,parentMatrix))return true;return hitObj({...o,fill:null},x,y,tol,hctx,anyAlpha,parentMatrix);}
  const world = parentMatrix ? mmul(parentMatrix,matOf(o.t)) : matOf(o.t);
  const p = mapply(minv(world),x,y);
  if(o.mirror&&(p[0]<0||p[0]>o.mirror.width||Math.abs(p[1])>o.mirror.height/2))return false;
  const sc = Math.max(Math.hypot(world[0],world[1]),Math.hypot(world[2],world[3]),1e-6);
  const lt = tol / sc;
  if (o.kind === 'group' || o.kind === 'clip') {
    const childMatrix = o.kind === 'clip' && o.pv ? mmul(world,[1,0,0,1,-o.pv[0],-o.pv[1]]) : world;
    const kids = kidsOf(o);
    for(let i=kids.length-1;i>=0;i--)if(hitObj(kids[i],x,y,tol,hctx,anyAlpha,childMatrix))return true;
    return false;
  }
  if (o.kind === 'text' || o.kind === 'image') {
    if(o.kind==='image'&&o.contours){const mask=new Path2D();tracePath(mask,imageMaskContours(o));if(!hctx.isPointInPath(mask,p[0],p[1],'evenodd'))return false;}
    const b = localBounds(o);
    return !!b && p[0]>=b.x0-lt && p[0]<=b.x1+lt && p[1]>=b.y0-lt && p[1]<=b.y1+lt;
  }
  const path = new Path2D();
  tracePath(path,o.contours);
  hctx.save();
  try {
    hctx.setTransform(1,0,0,1,0,0);
    if(o.fill && (anyAlpha || nz(o.fa,1)>0.02) && hctx.isPointInPath(path,p[0],p[1],o.nz?'nonzero':'evenodd'))return true;
    const outline = new Path2D();
    outline.addPath(path,new DOMMatrix(world));
    hctx.lineWidth = (o.stroke ? (o.sw || 0) : 0) + 2*tol;
    hctx.lineCap = o.cap || 'round'; hctx.lineJoin = o.join || 'round';
    return hctx.isPointInStroke(outline,x,y);
  } finally { hctx.restore(); }
}

/* ---------- SVG ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
let _gid = 0;
function svgMasked(maskObjs, inner) {
  const id = 'm' + (++_gid);
  return '<mask id="' + id + '" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="-100000" y="-100000" width="200000" height="200000">' + maskObjs.map(objSVG).join('') + '</mask><g mask="url(#' + id + ')">' + inner + '</g>';
}
function layersSVG(entries) {
  let body = '';
  const masks = [];
  entries.forEach((e, li) => {
    if (e.layer.visible === false) return;
    e.objs.forEach((o, oi) => { if (o.invisMask && o.kind === 'path') masks.push({ o, li, oi }); });
  });
  function applyMasks(inner, li, oi) {
    if (!inner) return '';
    const above = masks.filter(m => m.li === li && m.oi > oi);
    if (!above.length) return inner;
    const id = 'invis' + (++_gid);
    const shapes = above.map(m => objSVG(Object.assign({}, invisMaskShape(m.o), { fill: '#000000' }))).join('');
    return '<defs><mask id="' + id + '" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" style="mask-type:luminance" x="-100000" y="-100000" width="200000" height="200000"><rect x="-100000" y="-100000" width="200000" height="200000" fill="white"/>' + shapes + '</mask></defs><g mask="url(#' + id + ')">' + inner + '</g>';
  }
  for (const u of groupEntries(entries)) {
    if (!u.mask) {
      const li = entries.indexOf(u.e);
      u.e.objs.forEach((o, oi) => {
        if (!o.invisMask) body += applyMasks(objSVG(o), li, oi);
      });
    } else {
      let contents = '';
      for (const m of u.members) contents += m.objs.filter(o => !o.invisMask).map(objSVG).join('');
      const li = Math.max(...u.members.map(m => entries.indexOf(m)));
      body += applyMasks(svgMasked(u.mask.objs, contents), li, Number.MAX_SAFE_INTEGER);
    }
  }
  return body;
}
function objSVG(o) {
  if(o._mirrorCuts?.length){
    const plain={...o};if(o._softParts)Object.defineProperty(plain,'_softParts',{value:o._softParts});const b=worldBounds(plain);if(!b)return '';const pad=100+(Math.max(0,o.sw||0)*5+Math.max(0,o.blur||0)*4)*Math.max(1,Math.abs(o.t.sx),Math.abs(o.t.sy)),id='mc'+(++_gid);
    const holes=o._mirrorCuts.map(cut=>{const points=[[0,-cut.height/2],[cut.width,-cut.height/2],[cut.width,cut.height/2],[0,cut.height/2]].map(p=>mapply(cut.matrix,...p).join(',')).join(' ');return '<polygon points="'+points+'" fill="black" shape-rendering="crispEdges"/>';}).join('');
    const x=b.x0-pad,y=b.y0-pad,w=b.x1-b.x0+pad*2,h=b.y1-b.y0+pad*2;
    return '<mask id="'+id+'" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="white"/>'+holes+'</mask><g mask="url(#'+id+')">'+objSVG(plain)+'</g>';
  }

  if(o.skel)return '';
  if(o._softParts)return objSVG(softView(o));
  const m = matOf(o.t), tr = 'matrix(' + m.map((n) => +n.toFixed(5)).join(' ') + ')', op = nz(o.op, 1);
  const opa = op < 1 ? ' opacity="' + +op.toFixed(3) + '"' : '';
  const blur = Math.max(0, Math.min(30, Number(o.blur) || 0));
  const blurId = blur > 0 ? 'blur' + (++_gid) : '';
  const blurDef = blurId ? '<defs><filter id="' + blurId + '" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="' + blur + '"/></filter></defs>' : '';
  const blurAttr = blurId ? ' filter="url(#' + blurId + ')"' : '';
  const wrapBlur = (svg) => blurId ? blurDef + '<g' + blurAttr + '>' + svg + '</g>' : svg;
  if (o.kind === 'group') { const inner = o.children.map(objSVG).join(''); return wrapBlur('<g transform="' + tr + '"' + opa + '>' + (o.mask ? svgMasked(o.mask, inner) : inner) + '</g>'); }
  if (o.kind === 'clip') {
    const pv = o.pv ? '<g transform="translate(' + -o.pv[0] + ' ' + -o.pv[1] + ')">' : '<g>';
    return wrapBlur('<g transform="' + tr + '"' + opa + '>' + pv + kidsOf(o).map(objSVG).join('') + '</g></g>');
  }
  if (o.kind === 'image') {
    const rec = _images[o.img];
    if(!rec?.b64)return '';
    const id='imageMask'+(++_gid),mask=o.contours?'<defs><clipPath id="'+id+'"><path d="'+pathD(imageMaskContours(o))+'" clip-rule="evenodd"/></clipPath></defs>':'';
    return wrapBlur('<g transform="'+tr+'"'+opa+'>'+mask+'<image width="'+o.w+'" height="'+o.h+'" preserveAspectRatio="none"'+(o.contours?' clip-path="url(#'+id+')"':'')+' xlink:href="data:'+rec.mime+';base64,'+rec.b64+'"/></g>');
  }
  if (o.kind === 'text') {
    const lay = layoutText(o);
    let out = '<g transform="' + tr + '"' + opa + '>';
    for (const l of lay.lines) {
      let x = l.x;
      for (const sg of l.segs) {
        const r = sg.r;
        const drop = baselineDrop(r);
        out += '<text x="' + +x.toFixed(2) + '" y="' + +(drop == null ? l.y : l.y + drop).toFixed(2) + '"' + (drop == null ? ' dominant-baseline="text-before-edge"' : '') + ' xml:space="preserve" font-family="' + esc(r.font || 'Arial') + ', Helvetica, sans-serif" font-size="' + (r.size || 16) + '"' + (r.b ? ' font-weight="bold"' : '') + (r.i ? ' font-style="italic"' : '') + ' fill="' + esc(r.c || o.fill || '#000000') + '" fill-opacity="' + +nz(o.fa, 1).toFixed(3) + '">' + String(sg.t).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text>';
        x += sg.w;
      }
    }
    return wrapBlur(out + '</g>');
  }
  let defs = '', fillAttr;
  if (o.fill && o.grad) {
    const id = 'g' + (++_gid), g = o.grad;
    const stops = g.stops.map((st) => '<stop offset="' + +st.o.toFixed(4) + '" stop-color="' + esc(st.c) + '" stop-opacity="' + +(st.a * nz(o.fa, 1)).toFixed(3) + '"/>').join('');
    defs = g.type === 'radial'
      ? '<radialGradient id="' + id + '" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="819.2" gradientTransform="matrix(' + g.m.map((n) => +n.toFixed(6)).join(' ') + ')">' + stops + '</radialGradient>'
      : '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="-819.2" y1="0" x2="819.2" y2="0" gradientTransform="matrix(' + g.m.map((n) => +n.toFixed(6)).join(' ') + ')">' + stops + '</linearGradient>';
    defs = '<defs>' + defs + '</defs>';
    fillAttr = 'fill="url(#' + id + ')" fill-rule="' + (o.nz ? 'nonzero' : 'evenodd') + '"';
  } else fillAttr = o.fill ? 'fill="' + esc(o.fill) + '" fill-opacity="' + +nz(o.fa, 1).toFixed(3) + '" fill-rule="' + (o.nz ? 'nonzero' : 'evenodd') + '"' : 'fill="none"';
  const stroke = o.stroke && o.sw > 0 ? ' stroke="' + esc(o.stroke) + '" stroke-opacity="' + +nz(o.sa, 1).toFixed(3) + '" vector-effect="non-scaling-stroke" stroke-width="' + +o.sw.toFixed(3) + '" stroke-linecap="' + (o.cap || 'round') + '" stroke-linejoin="' + (o.join || 'round') + '"' + (dashArray(o).length ? ' stroke-dasharray="' + dashArray(o).map(n => +n.toFixed(3)).join(' ') + '"' : '') : '';
  return wrapBlur(defs + '<path'+(o.crispMask?' shape-rendering="crispEdges"':'')+' transform="' + tr + '" d="' + pathD(o.contours) + '" ' + fillAttr + stroke + opa + '/>');
}
function frameSVG(doc, t) {
  _gid = 0;
  let body = '';
  body = layersSVG(evalDoc(doc, t));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + doc.w + '" height="' + doc.h + '" viewBox="0 0 ' + doc.w + ' ' + doc.h + '">\n' + (doc.bg && doc.bg !== 'transparent' ? '<rect width="100%" height="100%" fill="' + esc(doc.bg) + '"/>\n' : '') + body + '\n</svg>\n';
}

/* ---------- GIF encoder ---------- */
function quantize(rgba, n, maxC) {
  maxC = Math.max(2, Math.min(256, maxC | 0 || 256));
  const hist = new Map();
  for (let i = 0; i < n; i++) {
    const k = (rgba[i * 4] << 16) | (rgba[i * 4 + 1] << 8) | rgba[i * 4 + 2];
    hist.set(k, (hist.get(k) || 0) + 1);
  }
  const keys = Array.from(hist.keys());
  const palette = new Uint8Array(256 * 3);
  const lut = new Map();
  let count = 0;
  if (keys.length <= maxC) {
    count = keys.length;
    keys.forEach((k, i) => { palette[i * 3] = k >> 16; palette[i * 3 + 1] = (k >> 8) & 255; palette[i * 3 + 2] = k & 255; lut.set(k, i); });
  } else {
    // median cut on 15-bit reduced colours
    const red = new Map();
    for (const [k, c] of hist) {
      const r = k >> 16, g = (k >> 8) & 255, b = k & 255;
      const rk = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      let e = red.get(rk);
      if (!e) { e = { rk, c: 0, r: 0, g: 0, b: 0 }; red.set(rk, e); }
      e.c += c; e.r += r * c; e.g += g * c; e.b += b * c;
    }
    const items = Array.from(red.values());
    const boxes = [items];
    const range = (box) => {
      let rl = 255, rh = 0, gl = 255, gh = 0, bl = 255, bh = 0;
      for (const e of box) {
        const r = e.r / e.c, g = e.g / e.c, b = e.b / e.c;
        if (r < rl) rl = r; if (r > rh) rh = r; if (g < gl) gl = g; if (g > gh) gh = g; if (b < bl) bl = b; if (b > bh) bh = b;
      }
      return [rh - rl, gh - gl, bh - bl];
    };
    while (boxes.length < maxC) {
      let bi = -1, bs = 0, bch = 0;
      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i].length < 2) continue;
        const rg = range(boxes[i]);
        const mx = Math.max(rg[0], rg[1], rg[2]);
        if (mx > bs) { bs = mx; bi = i; bch = rg.indexOf(mx); }
      }
      if (bi < 0) break;
      const box = boxes[bi];
      const key = bch === 0 ? (e) => e.r / e.c : bch === 1 ? (e) => e.g / e.c : (e) => e.b / e.c;
      box.sort((a, b) => key(a) - key(b));
      let tot = 0; for (const e of box) tot += e.c;
      let acc = 0, cut = 1;
      for (let i = 0; i < box.length - 1; i++) { acc += box[i].c; if (acc >= tot / 2) { cut = i + 1; break; } cut = i + 1; }
      boxes.splice(bi, 1, box.slice(0, cut), box.slice(cut));
    }
    count = boxes.length;
    const rkIndex = new Map();
    boxes.forEach((box, i) => {
      let c = 0, r = 0, g = 0, b = 0;
      for (const e of box) { c += e.c; r += e.r; g += e.g; b += e.b; rkIndex.set(e.rk, i); }
      palette[i * 3] = Math.round(r / c); palette[i * 3 + 1] = Math.round(g / c); palette[i * 3 + 2] = Math.round(b / c);
    });
    for (const k of keys) {
      const r = k >> 16, g = (k >> 8) & 255, b = k & 255;
      lut.set(k, rkIndex.get(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)));
    }
  }
  const idx = new Uint8Array(n);
  for (let i = 0; i < n; i++) idx[i] = lut.get((rgba[i * 4] << 16) | (rgba[i * 4 + 1] << 8) | rgba[i * 4 + 2]);
  return { palette, idx, count };
}
/* remap pixels to a palette with dithering: mode 'diffusion' (Floyd-Steinberg) or 'pattern' (ordered 4x4); skip = mask of transparent pixels */
function remapDither(rgba, w, h, q, mode, amt, skip) {
  const pal = q.palette, cnt = q.count, cache = new Int16Array(32768).fill(-1), idx = new Uint8Array(w * h);
  const near = (r, g, b) => {
    r = r < 0 ? 0 : r > 255 ? 255 : r | 0; g = g < 0 ? 0 : g > 255 ? 255 : g | 0; b = b < 0 ? 0 : b > 255 ? 255 : b | 0;
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let v = cache[k]; if (v >= 0) return v;
    let best = 0, bd = 1e9;
    for (let i = 0; i < cnt; i++) { const dr = pal[i * 3] - r, dg = pal[i * 3 + 1] - g, db = pal[i * 3 + 2] - b, d = dr * dr * 3 + dg * dg * 4 + db * db * 2; if (d < bd) { bd = d; best = i; } }
    cache[k] = best; return best;
  };
  if (mode === 'pattern') {
    const M = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x; if (skip && skip[p]) continue;
      const o = ((M[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5) * 72 * amt;
      idx[p] = near(rgba[p * 4] + o, rgba[p * 4 + 1] + o, rgba[p * 4 + 2] + o);
    }
    return idx;
  }
  const buf = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h; i++) { buf[i * 3] = rgba[i * 4]; buf[i * 3 + 1] = rgba[i * 4 + 1]; buf[i * 3 + 2] = rgba[i * 4 + 2]; }
  const spread = (p, er, eg, eb, f) => { buf[p * 3] += er * f; buf[p * 3 + 1] += eg * f; buf[p * 3 + 2] += eb * f; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x; if (skip && skip[p]) continue;
    const r = buf[p * 3], g = buf[p * 3 + 1], b = buf[p * 3 + 2], i = near(r, g, b);
    idx[p] = i;
    const er = (r - pal[i * 3]) * amt, eg = (g - pal[i * 3 + 1]) * amt, eb = (b - pal[i * 3 + 2]) * amt;
    if (x + 1 < w) spread(p + 1, er, eg, eb, 7 / 16);
    if (y + 1 < h) { if (x > 0) spread(p + w - 1, er, eg, eb, 3 / 16); spread(p + w, er, eg, eb, 5 / 16); if (x + 1 < w) spread(p + w + 1, er, eg, eb, 1 / 16); }
  }
  return idx;
}
function lzw(indices, minCode) {
  const clear = 1 << minCode, eoi = clear + 1;
  let codeSize = minCode + 1, next = eoi + 1;
  const out = [];
  let cur = 0, bits = 0;
  const emit = (code) => {
    cur |= code << bits; bits += codeSize;
    while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; }
  };
  let dict = new Map();
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i], key = (prefix << 8) | k;
    const found = dict.get(key);
    if (found === undefined) {
      emit(prefix);
      if (next === 4096) {
        emit(clear); dict = new Map(); next = eoi + 1; codeSize = minCode + 1;
      } else {
        if (next >= (1 << codeSize)) codeSize++;
        dict.set(key, next++);
      }
      prefix = k;
    } else prefix = found;
  }
  emit(prefix); emit(eoi);
  if (bits > 0) out.push(cur & 255);
  return out;
}
/* GifWriter: header(w,h,loops) -> addFrame(rgba, delayCs) -> finish() */
function gifWriter(w, h, o) {
  if (typeof o !== 'object' || o === null) o = { loop: o ? 0 : -1 };
  const loop = o.loop == null ? 0 : o.loop, maxC = Math.max(2, Math.min(256, o.colors | 0 || 256)), tr = !!o.transparent;
  const matte = o.matte || [255, 255, 255], dith = o.dither || 'none', amt = o.ditherAmt == null ? 1 : o.ditherAmt;
  const bytes = [];
  const push = (...a) => { for (const v of a) bytes.push(v); };
  const w16 = (v) => push(v & 255, (v >> 8) & 255);
  push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61); w16(w); w16(h); push(0x00, 0, 0);
  if (loop >= 0) { push(0x21, 0xff, 0x0b, 0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30, 3, 1); w16(loop); push(0); }
  return {
    addFrame(rgbaData, delayCs) {
      const n = w * h;
      let src = rgbaData, skip = null;
      if (tr) {
        src = new Uint8ClampedArray(rgbaData); skip = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
          const a = src[i * 4 + 3];
          if (a < 128) { skip[i] = 1; src[i * 4] = matte[0]; src[i * 4 + 1] = matte[1]; src[i * 4 + 2] = matte[2]; }
          else if (a < 255) for (let c = 0; c < 3; c++) src[i * 4 + c] = Math.round((src[i * 4 + c] * a + matte[c] * (255 - a)) / 255);
        }
      }
      const q = quantize(src, n, tr ? maxC - 1 : maxC);
      const idx = dith === 'none' || q.count <= 1 ? q.idx : remapDither(src, w, h, q, dith, amt, skip);
      let ti = -1;
      if (tr) { ti = q.count; for (let i = 0; i < n; i++) if (skip[i]) idx[i] = ti; }
      const total = q.count + (tr ? 1 : 0);
      let bits = 1; while ((1 << bits) < total) bits++;
      push(0x21, 0xf9, 4, tr ? 0x09 : 0x04, delayCs & 255, (delayCs >> 8) & 255, tr ? ti : 0, 0);
      push(0x2c); w16(0); w16(0); w16(w); w16(h); push(0x80 | (bits - 1));
      for (let i = 0; i < (1 << bits) * 3; i++) bytes.push(i < q.count * 3 ? q.palette[i] : 0);
      const minCode = Math.max(2, bits);
      push(minCode);
      const data = lzw(idx, minCode);
      for (let i = 0; i < data.length; i += 255) {
        const len = Math.min(255, data.length - i);
        bytes.push(len);
        for (let j = 0; j < len; j++) bytes.push(data[i + j]);
      }
      bytes.push(0);
    },
    finish() { bytes.push(0x3b); return new Uint8Array(bytes); }
  };
}

/* ---------- FLA / XFL import ---------- */
function parseNum(s) {
  if (s[0] === '#') {
    const parts = s.slice(1).split('.');
    let ip = parseInt(parts[0], 16);
    const nd = parts[0].length;
    if (nd >= 6 && ip >= Math.pow(2, nd * 4 - 1)) ip -= Math.pow(2, nd * 4);
    const frac = parts[1] ? parseInt(parts[1], 16) / Math.pow(16, parts[1].length) : 0;
    return ip + frac;
  }
  return parseFloat(s);
}
function parseEdges(str) {
  const chains = [];
  str = str.replace(/S\d+/g, '');
  const re = /([!|\/\[\]])([^!|\/\[\]]*)/g;
  let m, cur = null, px = 0, py = 0;
  while ((m = re.exec(str))) {
    const cmd = m[1];
    const nums = m[2].trim().split(/\s+/).filter(Boolean).map(parseNum);
    if (cmd === '!') { px = nums[0]; py = nums[1]; cur = []; chains.push(cur); }
    else if ((cmd === '|' || cmd === '/') && nums.length >= 2) { cur.push({ x0: px, y0: py, x1: nums[0], y1: nums[1] }); px = nums[0]; py = nums[1]; }
    else if ((cmd === '[' || cmd === ']') && nums.length >= 4) { cur.push({ x0: px, y0: py, cx: nums[0], cy: nums[1], x1: nums[2], y1: nums[3] }); px = nums[2]; py = nums[3]; }
  }
  return chains.filter((c) => c.length);
}
const skey = (x, y) => x.toFixed(2) + '|' + y.toFixed(2);
function assembleLoops(segs) {
  const map = new Map();
  segs.forEach((s, i) => { const k = skey(s.x0, s.y0); let a = map.get(k); if (!a) { a = []; map.set(k, a); } a.push(i); });
  const used = new Uint8Array(segs.length), loops = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const loop = [segs[i]];
    const startKey = skey(segs[i].x0, segs[i].y0);
    let end = skey(segs[i].x1, segs[i].y1);
    while (end !== startKey) {
      const cand = map.get(end);
      let nx = -1;
      if (cand) for (const j of cand) if (!used[j]) { nx = j; break; }
      if (nx < 0) break;
      used[nx] = 1; loop.push(segs[nx]); end = skey(segs[nx].x1, segs[nx].y1);
    }
    loops.push({ segs: loop, closed: end === startKey });
  }
  return loops;
}
/* segments (twips) -> contour (px) with cubic handles */
function segsToContour(segs, closed, scale) {
  const nodes = [];
  const cn = (s) => ({ x: s.x0 * scale, y: s.y0 * scale, ix: 0, iy: 0, ox: 0, oy: 0 });
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const n = cn(s);
    nodes.push(n);
    if (s.cx !== undefined) {
      const c1x = s.x0 + 2 / 3 * (s.cx - s.x0), c1y = s.y0 + 2 / 3 * (s.cy - s.y0);
      const c2x = s.x1 + 2 / 3 * (s.cx - s.x1), c2y = s.y1 + 2 / 3 * (s.cy - s.y1);
      n.ox = (c1x - s.x0) * scale; n.oy = (c1y - s.y0) * scale;
      s._in = [(c2x - s.x1) * scale, (c2y - s.y1) * scale];
    }
  }
  const last = segs[segs.length - 1];
  if (!closed) nodes.push({ x: last.x1 * scale, y: last.y1 * scale, ix: 0, iy: 0, ox: 0, oy: 0 });
  for (let i = 0; i < segs.length; i++) {
    const tgt = nodes[(i + 1) % nodes.length];
    if (segs[i]._in) { tgt.ix = segs[i]._in[0]; tgt.iy = segs[i]._in[1]; }
  }
  return { closed, nodes };
}
function xmlKids(el, name) {
  const out = [];
  if (!el) return out;
  for (const c of Array.from(el.children)) if (c.localName === name) out.push(c);
  return out;
}
function xmlKid(el, name) { return xmlKids(el, name)[0] || null; }
function attr(el, name, d) { const v = el && el.getAttribute(name); return v == null || v === '' ? d : v; }
function parseMatrixEl(el) {
  const M = el && xmlKid(xmlKid(el, 'matrix'), 'Matrix') || (el && el.localName === 'Matrix' ? el : null);
  if (!M) return [1, 0, 0, 1, 0, 0];
  return [+attr(M, 'a', 1), +attr(M, 'b', 0), +attr(M, 'c', 0), +attr(M, 'd', 1), +attr(M, 'tx', 0), +attr(M, 'ty', 0)];
}
function colorOf(el, rep) {
  if (!el) return { c: '#000000', a: 1 };
  const sc = el.localName === 'SolidColor' ? el : xmlKid(el, 'SolidColor');
  if (sc) return { c: attr(sc, 'color', '#000000').toUpperCase(), a: +attr(sc, 'alpha', 1) };
  const ents = xmlKids(el, 'GradientEntry');
  if (ents.length) {
    rep.gradient++;
    const stops = ents.map((e, i) => ({ o: clamp(+attr(e, 'ratio', i / Math.max(1, ents.length - 1)), 0, 1), c: attr(e, 'color', '#000000').toUpperCase(), a: +attr(e, 'alpha', 1) })).sort((x, y) => x.o - y.o);
    let r = 0, g = 0, bl = 0, al = 0;
    for (const st of stops) { const c = hexToRgb(st.c); r += c[0]; g += c[1]; bl += c[2]; al += st.a; }
    const n = stops.length;
    const out = { c: rgbToHex(r / n, g / n, bl / n), a: al / n };
    const m = parseMatrixEl(el);
    if (Math.abs(m[0] * m[3] - m[1] * m[2]) > 1e-12) out.grad = { type: el.localName === 'RadialGradient' ? 'radial' : 'linear', stops, m };
    return out;
  }
  if (el.localName === 'BitmapFill') { rep.bitmap++; return { c: '#999999', a: 1 }; }
  return { c: '#000000', a: 1 };
}
function importShape(el, idBase, rep) {
  const fills = new Map(), strokes = new Map();
  const fe = xmlKid(el, 'fills');
  for (const fs of xmlKids(fe, 'FillStyle')) fills.set(+attr(fs, 'index', 1), colorOf(fs.firstElementChild, rep));
  const se = xmlKid(el, 'strokes');
  for (const ss of xmlKids(se, 'StrokeStyle')) {
    const sol = ss.firstElementChild;
    if (!sol) continue;
    const fillEl = xmlKid(sol, 'fill');
    const col = colorOf(fillEl ? fillEl.firstElementChild : null, rep);
    const caps = attr(sol, 'caps', 'round'), joints = attr(sol, 'joints', 'round');
    strokes.set(+attr(ss, 'index', 1), { c: col.c, a: col.a, w: Math.max(+attr(sol, 'weight', 1), 0.25), cap: caps === 'none' ? 'butt' : caps, join: joints === 'miter' ? 'miter' : joints === 'bevel' ? 'bevel' : 'round' });
  }
  const fillSegs = new Map(), strokeContours = new Map();
  const ee = xmlKid(el, 'edges');
  for (const ed of xmlKids(ee, 'Edge')) {
    const s = attr(ed, 'edges', '');
    if (!s) continue;
    const chains = parseEdges(s);
    const f0 = +attr(ed, 'fillStyle0', 0), f1 = +attr(ed, 'fillStyle1', 0), st = +attr(ed, 'strokeStyle', 0);
    for (const ch of chains) {
      if (f1) { const a = fillSegs.get(f1) || []; fillSegs.set(f1, a); for (const sg of ch) a.push(Object.assign({}, sg)); }
      if (f0) {
        const a = fillSegs.get(f0) || []; fillSegs.set(f0, a);
        for (let i = ch.length - 1; i >= 0; i--) { const sg = ch[i]; a.push({ x0: sg.x1, y0: sg.y1, x1: sg.x0, y1: sg.y0, cx: sg.cx, cy: sg.cy }); }
      }
      if (st && strokes.has(st)) {
        const a = strokeContours.get(st) || []; strokeContours.set(st, a);
        const closed = skey(ch[0].x0, ch[0].y0) === skey(ch[ch.length - 1].x1, ch[ch.length - 1].y1) && ch.length > 1;
        a.push(segsToContour(ch.map((x) => Object.assign({}, x)), closed, 0.05));
      }
    }
  }
  const mat = parseMatrixEl(el);
  const out = [];
  const idents = Math.abs(mat[0] - 1) + Math.abs(mat[3] - 1) + Math.abs(mat[1]) + Math.abs(mat[2]) + Math.abs(mat[4]) + Math.abs(mat[5]) < 1e-9;
  const fin = (o) => { if (!idents) setObjMatrix(o, mat); recenter(o); out.push(o); };
  for (const k of Array.from(fillSegs.keys()).sort((a, b) => a - b)) {
    const st = fills.get(k);
    if (!st) continue;
    const loops = assembleLoops(fillSegs.get(k));
    const contours = loops.filter((l) => l.segs.length >= 2).map((l) => segsToContour(l.segs, true, 0.05));
    if (!contours.length) continue;
    const o = mkPath(contours, { fill: st.c, fa: st.a, stroke: null });
    if (st.grad) o.grad = { type: st.grad.type, stops: clone(st.grad.stops), m: st.grad.m.slice() };
    o.id = idBase + '-f' + k;
    fin(o);
  }
  for (const k of Array.from(strokeContours.keys()).sort((a, b) => a - b)) {
    const st = strokes.get(k);
    const contours = strokeContours.get(k).filter((c) => c.nodes.length >= 2);
    if (!contours.length) continue;
    const o = mkPath(contours, { fill: null, stroke: st.c, sa: st.a, sw: st.w, cap: st.cap, join: st.join });
    o.id = idBase + '-s' + k;
    fin(o);
  }
  return out;
}
function importElements(els, ctx, depth, idBase) {
  const out = [];
  let ei = 0;
  for (const el of els) {
    const id = idBase + '-' + ei++;
    const nm = el.localName;
    if (nm === 'DOMShape') out.push(...importShape(el, id, ctx.rep));
    else if (nm === 'DOMGroup') {
      const mem = xmlKid(el, 'members');
      const kids = importElements(mem ? Array.from(mem.children) : [], ctx, depth, id);
      if (kids.length) { const g = { id, kind: 'group', children: kids, op: 1, t: newT() }; setObjMatrix(g, parseMatrixEl(el)); out.push(g); }
    } else if (nm === 'DOMSymbolInstance') {
      const g = importInstance(el, ctx, depth, id);
      if (g) out.push(g);
    } else if (nm === 'DOMBitmapInstance') {
      const bm = ctx.bitmaps && ctx.bitmaps[attr(el, 'libraryItemName', '')];
      if (bm) { const g = { id, kind: 'image', img: bm.key, w: bm.w, h: bm.h, op: 1, t: newT() }; setObjMatrix(g, parseMatrixEl(el)); out.push(g); ctx.rep.images++; }
      else ctx.rep.bitmapMissing++;
    }
    else if (nm === 'DOMStaticText' || nm === 'DOMDynamicText' || nm === 'DOMInputText') { const t = importText(el, ctx, id); if (t) out.push(t); }
    else if (nm === 'DOMTLFText') ctx.rep.tlf++;
    else ctx.rep.other++;
  }
  return out;
}
function fontFace(face, attrs) {
  let f = String(face || 'Arial'), bold = false, italic = false;
  const parts = f.split('-');
  f = parts[0];
  const suf = (parts[1] || '').toLowerCase();
  if (/bold|black|heavy/.test(suf)) bold = true;
  if (/italic|oblique/.test(suf)) italic = true;
  f = f.replace(/MT$/, '').replace(/PS$/, '');
  if (f === 'Arial' && /^arial/i.test(face) === false) f = 'Arial';
  return { font: f || 'Arial', bold, italic };
}
function importText(el, ctx, id) {
  const runsEl = xmlKid(el, 'textRuns');
  const runs = [];
  let align = 'left', ls = 0;
  for (const tr of xmlKids(runsEl, 'DOMTextRun')) {
    const chars = xmlKid(tr, 'characters');
    const txt = chars ? chars.textContent : '';
    const ta = xmlKid(xmlKid(tr, 'textAttrs'), 'DOMTextAttrs');
    const ff = fontFace(attr(ta, 'face', 'Arial'));
    const r = { t: txt, font: ff.font, size: +attr(ta, 'size', 12) || 12, c: attr(ta, 'fillColor', '#000000').toUpperCase(), b: attr(ta, 'bold', 'false') === 'true' || ff.bold, i: attr(ta, 'italic', 'false') === 'true' || ff.italic };
    if (ta) { align = attr(ta, 'alignment', align); ls = +attr(ta, 'letterSpacing', ls) || 0; }
    runs.push(r);
  }
  if (!runs.length || !runs.some((r) => r.t)) return null;
  const dyn = el.localName !== 'DOMStaticText';
  const w = +attr(el, 'width', 0) || 0;
  const o = { id, kind: 'text', name: attr(el, 'name', ''), runs, align: align === 'center' || align === 'right' ? align : 'left', ls, fill: runs[0].c, fa: 1, op: 1, t: newT() };
  if (w && (dyn || o.align !== 'left')) { o.w = w; if (!dyn) o.nw = true; }
  let M = parseMatrixEl(el);
  if (dyn) { const isMulti = attr(el, 'lineType', 'single line') !== 'single line'; if (!isMulti) o.nw = true; }
  setObjMatrix(o, M);
  ctx.rep.textCount++;
  return o;
}
const RESERVED_SYM = /^(__proto__|constructor|prototype|toString|valueOf|hasOwnProperty|__defineGetter__|__defineSetter__|__lookupGetter__|__lookupSetter__|isPrototypeOf|propertyIsEnumerable|toLocaleString)$/;
function importInstance(el, ctx, depth, id) {
  const rawName = attr(el, 'libraryItemName', '');
  const name = RESERVED_SYM.test(rawName) ? rawName + '_' : rawName;
  const item = ctx.lib.get(rawName);
  if (!item || depth > 12 || ctx.inProg.has(name)) { ctx.rep.missing++; return null; }
  const type = attr(el, 'symbolType', 'movie clip');
  if (!ctx.libOut[name]) {
    ctx.inProg.add(name);
    const tlEl = xmlKid(xmlKid(item, 'timeline'), 'DOMTimeline');
    ctx.libOut[name] = tlEl ? importTimeline(tlEl, ctx, depth + 1) : { layers: [], frames: 1 };
    ctx.inProg.delete(name);
  }
  const g = { id, kind: 'clip', sym: name, name: attr(el, 'name', ''), mc: type === 'movie clip', mode: 'loop', first: 0, pv: [0, 0], op: 1, t: newT() };
  { const ae = xmlKid(el, 'Actionscript'), tx = ae ? (xmlKid(ae, 'script') || ae).textContent.trim() : ''; if (tx) { g.script = tx; ctx.rep.instScripts++; ctx.scripts.push(tx); } }
  if (type === 'button') { g.mode = 'single'; g.btn = true; ctx.rep.buttons++; }
  else if (type === 'graphic') {
    const lm = attr(el, 'loop', 'loop');
    g.mode = lm === 'single frame' ? 'single' : lm === 'play once' ? 'once' : 'loop';
    g.first = Math.max(0, parseInt(attr(el, 'firstFrame', 0), 10) || 0);
  }
  if (ctx.libOut[name].frames > 1 && g.mode !== 'single') ctx.rep.animatedSyms.add(name);
  const colorEl = xmlKid(el, 'color');
  const colEl = colorEl && xmlKid(colorEl, 'Color');
  if (colEl) g.op = clamp(+attr(colEl, 'alphaMultiplier', 1), 0, 1);
  let M = parseMatrixEl(el);
  const tp = xmlKid(xmlKid(el, 'transformationPoint'), 'Point');
  const px = tp ? +attr(tp, 'x', 0) : 0, py = tp ? +attr(tp, 'y', 0) : 0;
  if (px || py) { g.pv = [px, py]; M = mmul(M, [1, 0, 0, 1, px, py]); }
  setObjMatrix(g, M);
  return g;
}
function importTimeline(tl, ctx, depth) {
  const layersEl = xmlKid(tl, 'layers');
  const out = [];
  let maxF = 1;
  let li = 0; const types = {};
  for (const le of xmlKids(layersEl, 'DOMLayer')) {
    const idx = li++;
    const type = attr(le, 'layerType', 'normal');
    if (type === 'folder') continue;
    if (type === 'guide') { ctx.rep.guide++; continue; }
    const layer = mkLayer(attr(le, 'name', 'Layer'));
    types[idx] = type;
    if (type === 'mask') { layer.mask = true; ctx.rep.mask++; }
    else { const par = attr(le, 'parentLayerIndex', ''); if (par !== '' && types[+par] === 'mask') { layer.masked = true; ctx.rep.masked++; } }
    layer.visible = attr(le, 'visible', 'true') !== 'false';
    layer.locked = attr(le, 'locked', 'false') === 'true';
    layer.kfs = [];
    let end = 0;
    for (const fe of xmlKids(xmlKid(le, 'frames'), 'DOMFrame')) {
      const f = parseInt(attr(fe, 'index', 0), 10) || 0, dur = parseInt(attr(fe, 'duration', 1), 10) || 1;
      end = Math.max(end, f + dur);
      const els = xmlKid(fe, 'elements');
      const objs = els ? importElements(Array.from(els.children), ctx, depth, 'L' + idx) : [];
      const tt = attr(fe, 'tweenType', '');
      let tween = tt === 'motion' ? 'motion' : tt === 'shape' ? 'shape' : 'none';
      if (tt === 'motion object') ctx.rep.motionObject++;
      const acc = +attr(fe, 'acceleration', 0);
      const kf = mkKf(f, objs);
      const scEl = xmlKid(fe, 'Framescript') || xmlKid(fe, 'Actionscript');
      const scTxt = scEl ? (xmlKid(scEl, 'script') || scEl).textContent.trim() : '';
      if (scTxt) { kf.script = scTxt; ctx.rep.scripts++; ctx.scripts.push(scTxt); }
      const sn = attr(fe, 'soundName', '');
      if (sn) {
        const lm = attr(fe, 'soundLoopMode', ''), cnt = parseInt(attr(fe, 'soundLoop', 0), 10) || 0;
        kf.sound = { name: sn, sync: attr(fe, 'soundSync', 'event'), loop: lm === 'loop' ? -1 : Math.max(0, cnt - 1) };
        ctx.rep.soundFrames++;
      }
      const lbl = attr(fe, 'name', ''); if (lbl && attr(fe, 'labelType', 'name') === 'name') kf.label = lbl;
      kf.tween = tween;
      kf.ease = { type: acc > 0 ? 'out' : acc < 0 ? 'in' : 'linear', amt: clamp(Math.abs(acc), 0, 100) };
      layer.kfs.push(kf);
    }
    if (!layer.kfs.length) layer.kfs.push(mkKf(0));
    layer.kfs.sort((a, b) => a.f - b.f);
    if (layer.kfs[0].f > 0) layer.kfs.unshift(mkKf(0));
    layer._end = end;
    maxF = Math.max(maxF, end);
    out.push(layer);
  }
  for (const l of out) {
    if (l._end > 0 && l._end < maxF) l.kfs.push(mkKf(l._end));
    delete l._end;
  }
  return { layers: out.reverse(), frames: maxF };
}
function parseXML(str) {
  const d = new DOMParser().parseFromString(str, 'application/xml');
  if (d.getElementsByTagName('parsererror').length) throw new Error('badxml');
  return d.documentElement;
}
/* tolerant ZIP reader: walks central-directory records directly, ignoring the (sometimes wrong) end record */
function looseZip(buf) {
  const b = new Uint8Array(buf), dv = new DataView(buf), ents = new Map();
  for (let i = 0; i + 46 <= b.length; i++) {
    if (b[i] === 0x50 && b[i + 1] === 0x4b && b[i + 2] === 1 && b[i + 3] === 2) {
      const method = dv.getUint16(i + 10, true), csize = dv.getUint32(i + 20, true), nl = dv.getUint16(i + 28, true), xl = dv.getUint16(i + 30, true), cl = dv.getUint16(i + 32, true), off = dv.getUint32(i + 42, true);
      if (off + 30 > b.length || b[off] !== 0x50 || b[off + 1] !== 0x4b || b[off + 2] !== 3 || b[off + 3] !== 4) continue;
      const name = new TextDecoder().decode(b.subarray(i + 46, i + 46 + nl));
      ents.set(name, { method, csize, off });
      i += 45 + nl + xl + cl;
    }
  }
  if (!ents.size) return null;
  const files = {};
  for (const n of ents.keys()) files[n] = { dir: n.endsWith('/') };
  const read = async (n) => {
    const e = ents.get(n);
    const start = e.off + 30 + dv.getUint16(e.off + 26, true) + dv.getUint16(e.off + 28, true);
    let data = b.subarray(start, start + e.csize);
    if (e.method === 8) {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      data = new Uint8Array(await new Response(stream).arrayBuffer());
    } else if (e.method !== 0) throw new Error('Unsupported ZIP compression method ' + e.method);
    return data;
  };
  return { files, file: (n) => (ents.has(n) ? { async: async (t) => { const d = await read(n); return t === 'string' ? new TextDecoder().decode(d) : d; } } : null) };
}
function b64enc(u8) { let s = ''; const CH = 0x8000; for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s); }
function pcmToWav(pcm, rate, ch) {
  const out = new Uint8Array(44 + pcm.length), dv = new DataView(out.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) out[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, pcm.length, true);
  out.set(pcm, 44);
  return out;
}
async function importSounds(rootEl, zip, base, names, rep) {
  const out = {}, norm = new Map();
  for (const n of names) norm.set(n.replace(/\\/g, '/'), n);
  const read = async (rel) => { const n = norm.get((base + rel).replace(/\\/g, '/')); return n ? zip.file(n).async('uint8array') : null; };
  const isMp3 = (d) => d && d.length > 4 && ((d[0] === 0xff && (d[1] & 0xe0) === 0xe0) || (d[0] === 0x49 && d[1] === 0x44 && d[2] === 0x33));
  for (const it of xmlKids(xmlKid(rootEl, 'media'), 'DOMSoundItem')) {
    try {
      const name = attr(it, 'name', '');
      if (!name) continue;
      const hr = attr(it, 'soundDataHRef', ''), href = attr(it, 'href', '');
      const data = hr ? await read('bin/' + hr) : null;
      const fm = /(\d+)\s*kHz\s+(\d+)\s*bit\s+(Mono|Stereo)/i.exec(attr(it, 'format', ''));
      const len = +attr(it, 'dataLength', 0);
      let bytes = null, mime = null;
      if (isMp3(data)) { bytes = len > 0 && len <= data.length ? data.subarray(0, len) : data; mime = 'audio/mpeg'; }
      else if (data && fm && +fm[2] === 16) {
        const rate = { 5: 5512, 11: 11025, 22: 22050, 44: 44100 }[+fm[1]] || 44100;
        bytes = pcmToWav(len > 0 && len <= data.length ? data.subarray(0, len) : data, rate, /stereo/i.test(fm[3]) ? 2 : 1); mime = 'audio/wav';
      }
      if (!bytes && href) {
        const o = (await read('LIBRARY/' + href)) || (await read(href));
        if (o) { bytes = o; mime = /\.wav$/i.test(href) ? 'audio/wav' : /\.ogg$/i.test(href) ? 'audio/ogg' : 'audio/mpeg'; }
      }
      if (!bytes) { rep.soundMissing++; continue; }
      out[name] = { name, mime, b64: b64enc(bytes), size: bytes.length, ids: [attr(it, 'linkageIdentifier', ''), attr(it, 'linkageClassName', '')].filter(Boolean) };
    } catch (e) { rep.soundMissing++; }
  }
  return out;
}
function imgDims(u) {
  try {
    if (u[0] === 0x89 && u[1] === 0x50) return [((u[16] << 24) | (u[17] << 16) | (u[18] << 8) | u[19]) >>> 0, ((u[20] << 24) | (u[21] << 16) | (u[22] << 8) | u[23]) >>> 0];
    if (u[0] === 0x47 && u[1] === 0x49) return [u[6] | (u[7] << 8), u[8] | (u[9] << 8)];
    if (u[0] === 0xff && u[1] === 0xd8) {
      let i = 2;
      while (i + 9 < u.length) {
        if (u[i] !== 0xff) { i++; continue; }
        const m = u[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [(u[i + 7] << 8) | u[i + 8], (u[i + 5] << 8) | u[i + 6]];
        i += 2 + ((u[i + 2] << 8) | u[i + 3]);
      }
    }
  } catch (e) { /* fall through */ }
  return null;
}
async function importBitmaps(rootEl, zip, base, names, rep) {
  const images = {}, map = {}, norm = new Map();
  for (const n of names) norm.set(n.replace(/\\/g, '/'), n);
  const read = async (rel) => { const n = norm.get((base + rel).replace(/\\/g, '/')); return n ? zip.file(n).async('uint8array') : null; };
  for (const it of xmlKids(xmlKid(rootEl, 'media'), 'DOMBitmapItem')) {
    try {
      const name = attr(it, 'name', ''), href = attr(it, 'href', '') || name;
      if (!name) continue;
      const data = (await read('LIBRARY/' + href)) || (await read(href));
      if (!data || data.length < 16) { rep.bitmapMissing++; continue; }
      const ext = (href.split('.').pop() || '').toLowerCase();
      const mime = data[0] === 0x89 ? 'image/png' : data[0] === 0xff ? 'image/jpeg' : data[0] === 0x47 ? 'image/gif' : ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
      const dm = imgDims(data) || [Math.round(+attr(it, 'frameRight', 0) / 20) || 100, Math.round(+attr(it, 'frameBottom', 0) / 20) || 100];
      images[name] = { name, mime, b64: b64enc(data), w: dm[0], h: dm[1], size: data.length };
      map[name] = { key: name, w: dm[0], h: dm[1] };
    } catch (e) { rep.bitmapMissing++; }
  }
  return { images, map };
}
async function importFLA(buf) {
  const bytes = new Uint8Array(buf);
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf) throw new Error('legacy');
  let zip;
  try { zip = await JSZip.loadAsync(buf); }
  catch (e) {
    /* some Animate builds write a wrong central-directory size; read entries by their own headers instead */
    zip = looseZip(buf);
    if (!zip) { const er = new Error('notzip'); er.detail = String(e && e.message || e); throw er; }
  }
  const names = Object.keys(zip.files);
  const domName = names.find((n) => /(^|\/)DOMDocument\.xml$/i.test(n) && !zip.files[n].dir);
  if (!domName) { const er = new Error('nodom'); er.detail = names.slice(0, 25).join(', ') || '(empty archive)'; throw er; }
  const base = domName.slice(0, domName.length - 'DOMDocument.xml'.length);
  let root;
  try { root = parseXML((await zip.file(domName).async('string')).replace(/^\uFEFF/, '')); }
  catch (e) { const er = new Error('badxml'); er.detail = String(e && e.message || e); throw er; }
  const rep = { soundFrames: 0, soundMissing: 0, sounds: 0, gradient: 0, bitmap: 0, images: 0, bitmapMissing: 0, tlf: 0, textCount: 0, mask: 0, masked: 0, guide: 0, missing: 0, other: 0, motionObject: 0, scripts: 0, instScripts: 0, buttons: 0, animatedSyms: new Set() };
  const lib = new Map();
  for (const name of Object.keys(zip.files)) {
    if (!name.startsWith(base) || !/^LIBRARY\/.*\.xml$/i.test(name.slice(base.length)) || zip.files[name].dir) continue;
    try {
      const el = parseXML(await zip.file(name).async('string'));
      if (el.localName === 'DOMSymbolItem') lib.set(attr(el, 'name', name.slice(base.length + 8, -4)), el);
    } catch (e) { /* skip unreadable library item */ }
  }
  const bms = await importBitmaps(root, zip, base, names, rep);
  const ctx = { rep, lib, libOut: {}, inProg: new Set(), bitmaps: bms.map, scripts: [] };
  const timelines = xmlKid(root, 'timelines');
  const tls = xmlKids(timelines, 'DOMTimeline');
  if (!tls.length) throw new Error('nodom');
  /* scenes are joined into one timeline, as Flash does when it publishes: each scene's layers only have content inside that scene's frame range, and the first keyframe of each scene carries a scene marker */
  const multi = tls.length > 1, parts = [];
  let total = 0;
  tls.forEach((te, i) => {
    const t = importTimeline(te, ctx, 0), nm = attr(te, 'name', 'Scene ' + (i + 1));
    if (!t.layers.length) { const l = mkLayer('Layer 1'); l.kfs = [mkKf(0)]; t.layers.push(l); }
    parts.push({ t, nm, start: total }); total += t.frames;
  });
  const layers = [];
  for (const { t, nm, start } of parts) {
    const end = start + t.frames;
    t.layers.forEach((l, li) => {
      if (start > 0) { for (const k of l.kfs) k.f += start; l.kfs.unshift(mkKf(0)); }
      if (end < total && !l.kfs.some((k) => k.f === end)) l.kfs.push(mkKf(end));
      if (multi) l.name = nm + ': ' + l.name;
      if (li === 0) { const k0 = l.kfs.find((k) => k.f === start); if (k0) k0.scene = nm; }
      layers.push(l);
    });
  }
  const doc = {
    w: Math.round(+attr(root, 'width', 550)), h: Math.round(+attr(root, 'height', 400)), fps: +attr(root, 'frameRate', 24),
    bg: attr(root, 'backgroundColor', '#FFFFFF'), frames: total, layers, lib: ctx.libOut
  };
  /* scripts written for ActionScript 1/2 (the document says so, or the code gives it away) run through the player's AS1 layer */
  { let asv = '';
    try { const pf = zip.file(base + 'PublishSettings.xml'); if (pf) { const m = /<ActionScriptVersion>\s*(\d)/.exec(await pf.async('string')); if (m) asv = m[1]; } } catch (e) { /* no publish settings */ }
    if (asv === '1' || asv === '2') { doc.lang = 'as1'; rep.lang = 'ActionScript ' + asv; }
    else if (ctx.scripts.some(as1Looks)) { doc.lang = 'as1'; rep.lang = 'ActionScript 1/2 (detected)'; } }
  normalizeDoc(doc);
  doc.images = bms.images;
  doc.sounds = await importSounds(root, zip, base, names, rep);
  rep.sounds = Object.keys(doc.sounds).length;
  rep.scenes = tls.length;
  if (total > 900) rep.truncated = total;
  rep.animatedSyms = Array.from(rep.animatedSyms);
  return { doc, report: rep };
}


/* ---------- ActionScript 1 / 2 support (parsing helpers; the runtime provides the AS1 environment) ---------- */
const AS1_MARK = /\b(getURL|_root|_parent|_level0|onClipEvent|tellTarget|loadMovie|loadVariables|duplicateMovieClip|attachMovie|removeMovieClip|setProperty|getProperty|stopAllSounds|prevScene|nextScene)\b|\bon\s*\(\s*(press|release|releaseOutside|rollOver|rollOut|dragOver|dragOut|keyPress)\b|\b_(x|y|alpha|rotation|xscale|yscale|visible|currentframe|totalframes|xmouse|ymouse)\b|\.on(Press|Release|RollOver|RollOut|EnterFrame|Load)\s*=/;
function as1Looks(src) { return AS1_MARK.test(String(src || '')); }
function as1EndStr(s, i) { const q = s[i]; let j = i + 1; while (j < s.length && s[j] !== q) { if (s[j] === '\\') j++; j++; } return Math.min(s.length, j + 1); }
function as1MatchBrace(s, i) { /* s[i] is '{' (or '('); returns the index after its partner */
  const open = s[i], close = open === '{' ? '}' : ')'; let d = 0, j = i;
  while (j < s.length) {
    const c = s[j];
    if (c === '"' || c === "'") { j = as1EndStr(s, j); continue; }
    if (c === '/' && s[j + 1] === '/') { while (j < s.length && s[j] !== '\n') j++; continue; }
    if (c === '/' && s[j + 1] === '*') { const e = s.indexOf('*/', j + 2); j = e < 0 ? s.length : e + 2; continue; }
    if (c === open) d++; else if (c === close) { d--; if (d === 0) return j + 1; }
    j++;
  }
  return -1;
}
/* drop AS2 type annotations: var x:Type, function f(a:Type):Type */
function as1StripTypes(src) {
  const T = '[A-Za-z_$][\\w$.]*';
  const fix = (code) => code
    .replace(new RegExp('\\bvar\\s+([\\w$]+)\\s*:\\s*' + T, 'g'), 'var $1')
    .replace(new RegExp('\\bfunction\\s*([\\w$]*)\\s*\\(([^()]*)\\)\\s*(?::\\s*' + T + ')?', 'g'), (m, n, ps) => 'function ' + n + '(' + ps.replace(new RegExp('\\s*:\\s*' + T, 'g'), '') + ')');
  let out = '', i = 0, seg = 0; const s = String(src);
  while (i < s.length) {
    const c = s[i];
    let e = -1;
    if (c === '"' || c === "'") e = as1EndStr(s, i);
    else if (c === '/' && s[i + 1] === '/') { e = s.indexOf('\n', i); if (e < 0) e = s.length; }
    else if (c === '/' && s[i + 1] === '*') { e = s.indexOf('*/', i + 2); e = e < 0 ? s.length : e + 2; }
    if (e < 0) { i++; continue; }
    out += fix(s.slice(seg, i)) + s.slice(i, e); i = seg = e;
  }
  return out + fix(s.slice(seg));
}
/* rewrite one AS1 script into JavaScript for the player's AS1 scope:
   on(...) / onClipEvent(...) blocks -> __on / __clip registrations; top-level function and var become timeline variables;
   tellTarget(x) { } -> with (__tt(x)) { } */
function as1Prepare(src, inner) {
  const s = inner ? String(src) : as1StripTypes(src), n = s.length;
  let out = '', i = 0, depth = 0, stmt = true; const fns = [];
  const ws = (j) => { while (j < n && /\s/.test(s[j])) j++; return j; };
  const wordAt = (j) => { let k = j; while (k < n && /[\w$]/.test(s[k])) k++; return k; };
  while (i < n) {
    const c = s[i];
    if (c === '"' || c === "'") { const e = as1EndStr(s, i); out += s.slice(i, e); i = e; stmt = false; continue; }
    if (c === '/' && s[i + 1] === '/') { let e = s.indexOf('\n', i); if (e < 0) e = n; out += s.slice(i, e); i = e; continue; }
    if (c === '/' && s[i + 1] === '*') { let e = s.indexOf('*/', i + 2); e = e < 0 ? n : e + 2; out += s.slice(i, e); i = e; continue; }
    if (/[A-Za-z_$]/.test(c)) {
      const j = wordAt(i), w = s.slice(i, j), prev = out.replace(/\s+$/, '').slice(-1);
      const top = !inner && depth === 0 && prev !== '.';
      if (top && (w === 'on' || w === 'onClipEvent')) {
        const k = ws(j);
        if (s[k] === '(') {
          const pe = as1MatchBrace(s, k);
          const b = pe < 0 ? -1 : ws(pe);
          if (pe > 0 && s[b] === '{') {
            const be = as1MatchBrace(s, b);
            if (be > 0) {
              const raw = s.slice(k + 1, pe - 1), evs = [];
              raw.replace(/(\w+)(?:\s*"([^"]*)")?/g, (m, e, key) => { evs.push(key != null ? e + ':' + key : e); return m; });
              out += (w === 'on' ? '__on(' : '__clip(') + JSON.stringify(evs) + ', function () {' + as1Prepare(s.slice(b + 1, be - 1), true) + '});';
              i = be; stmt = true; continue;
            }
          }
        }
      }
      if (top && w === 'function') {
        const k = ws(j), e2 = wordAt(k);
        if (e2 > k && s[ws(e2)] === '(') {
          const name = s.slice(k, e2), pk = ws(e2), pe = as1MatchBrace(s, pk), b = pe < 0 ? -1 : ws(pe);
          if (pe > 0 && s[b] === '{') {
            const be = as1MatchBrace(s, b);
            if (be > 0) { fns.push(name + ' = function ' + s.slice(pk, pe) + ' {' + as1Prepare(s.slice(b + 1, be - 1), true) + '};'); i = be; stmt = true; continue; }
          }
        }
      }
      if (top && w === 'var' && stmt) { i = ws(j); continue; }
      if (w === 'tellTarget' && prev !== '.') {
        const k = ws(j);
        if (s[k] === '(') { const pe = as1MatchBrace(s, k); if (pe > 0) { out += 'with (__tt(' + s.slice(k + 1, pe - 1) + '))'; i = pe; stmt = false; continue; } }
      }
      out += w; i = j; stmt = false; continue;
    }
    if (c === '{') { depth++; stmt = true; }
    else if (c === '}') { depth--; stmt = true; }
    else if (c === ';') stmt = true;
    else if (!/\s/.test(c)) stmt = false;
    out += c; i++;
  }
  return fns.join('\n') + (fns.length ? '\n' : '') + out;
}


/* Curve-aware simplification: preserve corners/extrema and fit original samples.
   Mirror-related anchors are removed together; this is not Inkscape source code. */
function kroganSimplifyContour(contour, maxError) {
  const original = contour.nodes, closed = !!contour.closed, count = original.length;
  const unchanged = () => ({ contour: { ...contour, nodes: original.map(n => ({ ...n })) }, removed: 0 });
  if (count < 3 || original.some(n => ![n.x, n.y, n.ix || 0, n.iy || 0, n.ox || 0, n.oy || 0].every(Number.isFinite))) return unchanged();
  const xs = original.map(n => n.x), ys = original.map(n => n.y);
  const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
  const diagonal = Math.hypot(xmax - xmin, ymax - ymin);
  if (diagonal < 1e-9) return unchanged();
  const tolerance = Number.isFinite(maxError) && maxError > 0 ? maxError : diagonal * 0.004, eps = diagonal * 1e-7;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const unit = v => { const l = Math.hypot(v.x, v.y); return l > eps ? { x: v.x / l, y: v.y / l } : null; };
  const dot = (a, b) => a.x * b.x + a.y * b.y;
  const controls = (a, b) => [a, { x: a.x + (a.ox || 0), y: a.y + (a.oy || 0) }, { x: b.x + (b.ix || 0), y: b.y + (b.iy || 0) }, b];
  const point = (c, t) => { const u = 1 - t; return { x: u*u*u*c[0].x + 3*u*u*t*c[1].x + 3*u*t*t*c[2].x + t*t*t*c[3].x, y: u*u*u*c[0].y + 3*u*u*t*c[1].y + 3*u*t*t*c[2].y + t*t*t*c[3].y }; };
  const derivative = (c, t) => { const u = 1 - t; return { x: 3*(u*u*(c[1].x-c[0].x)+2*u*t*(c[2].x-c[1].x)+t*t*(c[3].x-c[2].x)), y: 3*(u*u*(c[1].y-c[0].y)+2*u*t*(c[2].y-c[1].y)+t*t*(c[3].y-c[2].y)) }; };
  const second = (c, t) => ({ x: 6*((1-t)*(c[2].x-2*c[1].x+c[0].x)+t*(c[3].x-2*c[2].x+c[1].x)), y: 6*((1-t)*(c[2].y-2*c[1].y+c[0].y)+t*(c[3].y-2*c[2].y+c[1].y)) });
  const entries = original.map((n, i) => {
    const prev = original[(i-1+count)%count], next = original[(i+1)%count];
    const incoming = unit({ x: -(n.ix || 0), y: -(n.iy || 0) }) || unit({ x: n.x-prev.x, y: n.y-prev.y });
    const outgoing = unit({ x: n.ox || 0, y: n.oy || 0 }) || unit({ x: next.x-n.x, y: next.y-n.y });
    const endpoint = !closed && (i === 0 || i === count-1);
    const corner = !endpoint && (!incoming || !outgoing || dot(incoming, outgoing) < Math.cos(Math.PI / 5));
    const extremum = !endpoint && ['x','y'].some(k => (n[k]-prev[k] > eps && n[k]-next[k] > eps) || (prev[k]-n[k] > eps && next[k]-n[k] > eps));
    const smooth = incoming && outgoing ? unit({ x: incoming.x+outgoing.x, y: incoming.y+outgoing.y }) : null;
    // Polygonal arcs need a shared tangent; true handles retain their direction.
    const out = unit({ x:n.ox||0, y:n.oy||0 }) || (!corner && !endpoint && smooth) || outgoing;
    const into = unit({ x:-(n.ix||0), y:-(n.iy||0) }) || (!corner && !endpoint && smooth) || incoming;
    const c = controls(n, next), samples = [];
    for (let j=0;j<=16;j++) samples.push(point(c,j/16));
    return { id:i, n:{...n}, keep:endpoint||corner||extremum, out, into, samples, cached:undefined };
  });
  // A reflection reverses contour direction and swaps incoming/outgoing handles.
  // Only recognise genuine node-and-handle symmetry; never force arbitrary art.
  const mirrors = [];
  if (closed) for (const axis of ['x','y']) {
    const center = axis === 'x' ? (xmin+xmax)/2 : (ymin+ymax)/2;
    const other = axis === 'x' ? 'y' : 'x', match = [];
    for (let i=0;i<count;i++) {
      const n=original[i], reflected={x:n.x,y:n.y}; reflected[axis]=2*center-n[axis];
      const found=original.findIndex(m => dist(m,reflected)<=eps*10 &&
        Math.abs((n['o'+axis]||0)+(m['i'+axis]||0))<=eps*10 && Math.abs((n['i'+axis]||0)+(m['o'+axis]||0))<=eps*10 &&
        Math.abs((n['o'+other]||0)-(m['i'+other]||0))<=eps*10 && Math.abs((n['i'+other]||0)-(m['o'+other]||0))<=eps*10);
      if(found<0) break; match.push(found);
    }
    if(match.length===count && new Set(match).size===count && match.every((j,i)=>match[(i+1)%count]===(j-1+count)%count)) mirrors.push(match);
  }
  const orbit = id => {
    const ids = new Set([id]);
    for (const j of ids) for (const map of mirrors) ids.add(map[j]);
    return [...ids];
  };
  const byId = new Map(entries.map(e=>[e.id,e]));
  for (const e of entries) if (e.keep) for (const id of orbit(e.id)) byId.get(id).keep=true;
  function fit(e, a, b, sourceSamples) {
    if(!a.out || !b.into) return null;
    const samples=sourceSamples || a.samples.concat(e.samples.slice(1)), lengths=[0]; let length=0;
    for(let j=1;j<samples.length;j++){length+=dist(samples[j],samples[j-1]);lengths.push(length);}
    if(length<eps) return null;
    let ts=lengths.map(v=>v/length), curve=null, error=Infinity;
    for(let iteration=0;iteration<5;iteration++) {
      let aa=0,ab=0,bb=0,ra=0,rb=0;
      for(let j=1;j<samples.length-1;j++) {
        const t=ts[j],u=1-t,A=3*u*u*t,B=3*u*t*t;
        const base={x:(u*u*u+A)*a.n.x+(B+t*t*t)*b.n.x,y:(u*u*u+A)*a.n.y+(B+t*t*t)*b.n.y};
        const v={x:samples[j].x-base.x,y:samples[j].y-base.y};
        aa+=A*A;ab-=A*B*dot(a.out,b.into);bb+=B*B;ra+=A*dot(a.out,v);rb-=B*dot(b.into,v);
      }
      const det=aa*bb-ab*ab;if(Math.abs(det)<1e-12)return null;
      let alpha=(ra*bb-rb*ab)/det,beta=(rb*aa-ra*ab)/det;
      if(alpha<-eps||beta<-eps||alpha>length*1.5||beta>length*1.5)return null;
      alpha=Math.max(0,alpha);beta=Math.max(0,beta);
      curve=[a.n,{x:a.n.x+a.out.x*alpha,y:a.n.y+a.out.y*alpha},{x:b.n.x-b.into.x*beta,y:b.n.y-b.into.y*beta},b.n];
      error=0;
      const next=ts.slice();
      for(let j=1;j<samples.length-1;j++) {
        let t=ts[j];
        for(let k=0;k<3;k++) {
          const q=point(curve,t),d=derivative(curve,t),dd=second(curve,t),v={x:q.x-samples[j].x,y:q.y-samples[j].y};
          const den=dot(d,d)+dot(v,dd);if(Math.abs(den)<1e-12)break;
          t=Math.max(0,Math.min(1,t-dot(v,d)/den));
        }
        next[j]=t;error=Math.max(error,dist(point(curve,t),samples[j]));
      }
      if(next.some((v,j)=>j>0&&v<next[j-1]))return null;
      ts=next;
      if(error<=tolerance*0.5)break;
    }
    if(error>tolerance)return null;
    // Also test curve -> original, preventing bulges between source samples.
    const distanceToSamples = p => {
      let best=Infinity;
      for(let j=1;j<samples.length;j++) {
        const a=samples[j-1],b=samples[j],dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
        const t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;
        best=Math.min(best,Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy));
      }
      return best;
    };
    for(let j=1;j<40;j++) if(distanceToSamples(point(curve,j/40))>tolerance)return null;
    return {curve,samples,error};
  }
  const candidate = i => {
    const e=entries[i];if(e.keep)return null;
    if(e.cached!==undefined)return e.cached;
    return e.cached=fit(e,entries[(i-1+entries.length)%entries.length],entries[(i+1)%entries.length]);
  };
  let removed=0;
  while(entries.length>(closed?3:2) && removed<512) {
    const indices=new Map(entries.map((e,i)=>[e.id,i]));let best=null;const visited=new Set();
    for(let i=0;i<entries.length;i++) {
      const e=entries[i];if(visited.has(e.id)||e.keep)continue;
      const group=orbit(e.id);for(const id of group)visited.add(id);
      const positions=group.map(id=>indices.get(id));
      if(positions.some(i=>i===undefined)||entries.length-group.length<(closed?3:2))continue;
      const ids=new Set(group);
      const actions=[];
      if(!positions.some(i=>ids.has(entries[(i+1)%entries.length].id))) {
        const fits=positions.map(candidate);if(fits.some(f=>!f))continue;
        positions.forEach((i,j)=>actions.push({a:entries[(i-1+entries.length)%entries.length],b:entries[(i+1)%entries.length],fit:fits[j]}));
      } else {
        // Adjacent mirror partners form one longer arc (e.g. a rectangle side).
        for(let j=0;j<entries.length;j++) {
          if(ids.has(entries[j].id)||!ids.has(entries[(j+1)%entries.length].id))continue;
          const a=entries[j];let k=(j+1)%entries.length,samples=a.samples.slice();
          while(ids.has(entries[k].id)){samples.push(...entries[k].samples.slice(1));k=(k+1)%entries.length;}
          const b=entries[k],fitResult=fit(null,a,b,samples);
          if(!fitResult){actions.length=0;break;}
          actions.push({a,b,fit:fitResult});
        }
        if(!actions.length)continue;
      }
      const score=Math.max(...actions.map(a=>a.fit.error));
      if(!best||score<best.score)best={actions,group,score};
    }
    if(!best)break;
    const actions=best.actions;
    for(const {a,b,fit} of actions) {
      a.n.ox=fit.curve[1].x-a.n.x;a.n.oy=fit.curve[1].y-a.n.y;
      b.n.ix=fit.curve[2].x-b.n.x;b.n.iy=fit.curve[2].y-b.n.y;
      a.samples=fit.samples;a.cached=b.cached=undefined;
    }
    const deleted=new Set(best.group);
    for(let i=entries.length-1;i>=0;i--)if(deleted.has(entries[i].id))entries.splice(i,1);
    removed+=best.group.length;
  }
  return {contour:{...contour,nodes:entries.map(e=>e.n)},removed};
}

/* KROGAN Bézier intersection engine — isolated from existing drawing and tween logic. */
const KroganBezier = (() => {
/* KROGAN step 1: independent cubic Bézier intersection solver.
   Coordinates are in pixels. No application state is modified. */
'use strict';
function point(a,b,c,d,t) {const s=1-t;return {x:s*s*s*a.x+3*s*s*t*b.x+3*s*t*t*c.x+t*t*t*d.x,y:s*s*s*a.y+3*s*s*t*b.y+3*s*t*t*c.y+t*t*t*d.y};}
function derivative(c,t){const s=1-t;return {x:3*(s*s*(c[1].x-c[0].x)+2*s*t*(c[2].x-c[1].x)+t*t*(c[3].x-c[2].x)),y:3*(s*s*(c[1].y-c[0].y)+2*s*t*(c[2].y-c[1].y)+t*t*(c[3].y-c[2].y))};}
function evalC(c,t){return point(...c,t);}
function split(c){const mix=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});const a=mix(c[0],c[1]),b=mix(c[1],c[2]),d=mix(c[2],c[3]),e=mix(a,b),f=mix(b,d),g=mix(e,f);return [[c[0],a,e,g],[g,f,d,c[3]]];}
function bounds(c){return {minx:Math.min(...c.map(p=>p.x)),maxx:Math.max(...c.map(p=>p.x)),miny:Math.min(...c.map(p=>p.y)),maxy:Math.max(...c.map(p=>p.y))};}
function overlap(a,b,eps){return a.maxx+eps>=b.minx&&b.maxx+eps>=a.minx&&a.maxy+eps>=b.miny&&b.maxy+eps>=a.miny;}
function refine(a,b,t,u){for(let k=0;k<16;k++){const p=evalC(a,t),q=evalC(b,u),v=derivative(a,t),w=derivative(b,u),dx=q.x-p.x,dy=q.y-p.y,det=v.y*w.x-v.x*w.y;if(Math.abs(det)<1e-13)break;const dt=(-dx*w.y+dy*w.x)/det,du=(v.x*dy-v.y*dx)/det;t=Math.max(0,Math.min(1,t+dt));u=Math.max(0,Math.min(1,u+du));if(Math.max(Math.abs(dt),Math.abs(du))<1e-12)break;}const p=evalC(a,t),q=evalC(b,u);return {t,u,x:(p.x+q.x)/2,y:(p.y+q.y)/2,error:Math.hypot(p.x-q.x,p.y-q.y)};}
function intersections(a,b,{tolerance=1e-5,maxDepth=40}={}){
 if(!Array.isArray(a)||!Array.isArray(b)||a.length!==4||b.length!==4||![...a,...b].every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))throw new TypeError('Expected two cubic curves of four finite {x,y} points');
 const found=[],stack=[{a,b,ta:0,tb:1,ua:0,ub:1,depth:0}];
 while(stack.length){const n=stack.pop(),ba=bounds(n.a),bb=bounds(n.b);if(!overlap(ba,bb,tolerance))continue;
 const sa=Math.max(ba.maxx-ba.minx,ba.maxy-ba.miny),sb=Math.max(bb.maxx-bb.minx,bb.maxy-bb.miny);
 if((sa<=tolerance&&sb<=tolerance)||n.depth>=maxDepth){const r=refine(a,b,(n.ta+n.tb)/2,(n.ua+n.ub)/2);if(r.error<=tolerance*2&&!found.some(z=>Math.hypot(z.x-r.x,z.y-r.y)<tolerance*3))found.push(r);continue;}
 if(sa>=sb){const [l,r]=split(n.a),mid=(n.ta+n.tb)/2;stack.push({...n,a:r,ta:mid,depth:n.depth+1},{...n,a:l,tb:mid,depth:n.depth+1});}
 else{const [l,r]=split(n.b),mid=(n.ua+n.ub)/2;stack.push({...n,b:r,ua:mid,depth:n.depth+1},{...n,b:l,ub:mid,depth:n.depth+1});}
 }
 return found.sort((p,q)=>p.t-q.t);
}
function fromOnionskynNodes(start,end){return [{x:start.x,y:start.y},{x:start.x+(start.ox||0),y:start.y+(start.oy||0)},{x:end.x+(end.ix||0),y:end.y+(end.iy||0)},{x:end.x,y:end.y}];}
/* Split one original segment at sorted, unique t-values, without polygonizing.
   Each new node carries the exact de Casteljau handles. Original nodes are copied. */
function splitAtParameters(start, end, parameters, epsilon=1e-8) {
  if (!Array.isArray(parameters) || parameters.some(t => !Number.isFinite(t)))
    throw new TypeError('Expected finite Bézier parameters');
  const ts = [...parameters].filter(t => t > epsilon && t < 1-epsilon).sort((a,b)=>a-b);
  const unique = ts.filter((t,i)=>i===0 || t-ts[i-1]>epsilon);
  let a={...start}, b={...end}, previous=0;
  const result=[];
  for (const t of unique) {
    const local=(t-previous)/(1-previous);
    const [left, middle, right]=splitSeg(a,b,local);
    result.push(left);
    a=middle; b=right; previous=t;
  }
  result.push(a,b);
  return result;
}
/* Insert intersection nodes into a contour, retaining its closed/open state.
   cuts: [{segment: 0-based index, t: parameter}, ...].
   Only interior intersections require inserted nodes. */
function splitContourAtParameters(contour,cuts,epsilon=1e-8) {
  if (!contour || !Array.isArray(contour.nodes) || !Array.isArray(cuts))
    throw new TypeError('Expected contour and cuts array');
  const n=contour.nodes, count=contour.closed?n.length:Math.max(0,n.length-1);
  const grouped=new Map();
  for(const cut of cuts){
    if(!Number.isInteger(cut.segment)||cut.segment<0||cut.segment>=count)
      throw new RangeError('Invalid contour segment index');
    if(!grouped.has(cut.segment))grouped.set(cut.segment,[]);
    grouped.get(cut.segment).push(cut.t);
  }
  if(!count)return {...contour,nodes:n.map(v=>({...v}))};
  const output=[];
  let lastEnd=null;
  for(let i=0;i<count;i++){
    const parts=splitAtParameters(n[i],n[(i+1)%n.length],grouped.get(i)||[],epsilon);
    if(i===0)output.push(parts[0]);
    else output[output.length-1]=parts[0];
    output.push(...parts.slice(1));
    lastEnd=parts[parts.length-1];
  }
  if(contour.closed){
    const first=output[0], closing=output.pop();
    first.ix=closing.ix;first.iy=closing.iy;
  }
  return {...contour,nodes:output};
}
/* STEP 4: classify exact Bézier segments against another closed contour.
   Only the point-in-shape test is approximated; geometry and handles remain untouched.
   Boundary/tangency and coincident edges require separate Boolean handling. */
function pointInContour(pt, contour, steps=48) {
  if (!contour || !contour.closed || !Array.isArray(contour.nodes) || contour.nodes.length < 2)
    return false;
  let inside=false;
  const nodes=contour.nodes;
  for(let i=0;i<nodes.length;i++){
    const curve=fromOnionskynNodes(nodes[i],nodes[(i+1)%nodes.length]);
    let prev=curve[0];
    for(let k=1;k<=steps;k++){
      const next=evalC(curve,k/steps);
      if ((prev.y>pt.y)!==(next.y>pt.y)) {
        const x=prev.x+(pt.y-prev.y)*(next.x-prev.x)/(next.y-prev.y);
        if(x>pt.x) inside=!inside;
      }
      prev=next;
    }
  }
  return inside;
}
function classifySegments(contour, other) {
  if (!contour || !Array.isArray(contour.nodes)) throw new TypeError('Expected contour');
  const nodes=contour.nodes, count=contour.closed?nodes.length:Math.max(0,nodes.length-1);
  const result=[];
  for(let i=0;i<count;i++){
    const start=nodes[i],end=nodes[(i+1)%nodes.length];
    const midpoint=evalC(fromOnionskynNodes(start,end),0.5);
    result.push({segment:i,inside:pointInContour(midpoint,other),midpoint});
  }
  return result;
}

return { intersections, fromOnionskynNodes, split, evalC, splitAtParameters, splitContourAtParameters, pointInContour, classifySegments };
})();

root.FCCore = {
  KroganBezier, kroganSimplifyContour,
  uid, clamp, lerp, clone, nz, hexToRgb, rgbToHex, lerpHex, rgba,
  newT, matOf, mmul, minv, mapply, decompose, node, mouthContour, tracePath, pathD, bezPt, splitSeg, contoursBounds, localBounds, worldCorners, worldBounds,
  starDefaults, starContour, imageContours, imageMaskContours, constrainImageMask, recenter, applyMatrixToNodes, setObjMatrix, ellipseContour, rectContour, mkPath, mkLayer, mkKf, mkDoc, normalizeDoc,
  groupEntries, drawUnits, maskedDraw, groupAlpha, tweenPairs, shapeTweenIssues, ease, bezierEase, morphContours, evalLayerObjs, evalDoc, kfIndexAt, kfAt, kfFor, sortKfs, ensureEditable, insertKeyframe, insertFrames, removeFrames,
  beginRenderEval, endRenderEval,
  skeletonRigidGroups, skeletonRigidValid, skeletonPoseRigid,
  skeletonGraph, skeletonPath, skeletonPinTargets, skeletonPinsValid, skeletonPosePinned,
  skeletonUnwrap, skeletonJointLimit, skeletonLimitDirection, skeletonApplyLimits,
  softGroups, softJointGroup, softOrder, softView, softValid, softBind, softPoseObject, softAdaptiveContour,
  setSkeletonScope, skeletonValid, skeletonBuild, skeletonFrame, skeletonOffsets, skeletonBoundPose, skeletonPoseObject,
  rigSolve, rigBuild, rigValid, boneFrame, bindBone, unbindBone, setRigGhost, settleBinds, freeBind, notGhost, resolveBinds, clearKeyframe, moveKeyframe, reverseFrames, moveKeyframes, setTweenAt, drawObj, hitObj, frameSVG, objSVG, quantize, lzw, gifWriter, parseNum, parseEdges, assembleLoops,
  as1Looks, as1StripTypes, as1Prepare, importFLA, setImages, preloadImages, setLib, setMeasure, kidsOf, layoutText
};
})(typeof window !== 'undefined' ? window : globalThis);
