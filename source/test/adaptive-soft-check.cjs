const fs=require('fs'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{
 let h=fs.readFileSync(require('path').join(__dirname,'../dist/oskyn.html'),'utf8'),i=h.lastIndexOf('})();\n</script>');h=h.slice(0,i)+'window.T={C,S,SK,H,loadDoc,setTool,setFrame,refreshAll,w2s,skeletonMenuSync,skeletonSoftAdaptiveToggle,skeletonAngleMenuSync,skeletonTogglePin,skeletonZoneView,undo,redo,renderFrameCanvas,buildPlayer};'+h.slice(i);
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://adaptive-soft.test/',r=>r.fulfill({contentType:'text/html',body:h}));await p.goto('https://adaptive-soft.test/');
  const rows=await p.evaluate(()=>{
   const {C}=T,d=C.mkDoc(),rig=C.mkPath([],{fill:null,stroke:null},{x:320,y:80});rig.id='rig';rig.skel={version:2,mode:'edit',nodes:[{id:'root',parent:null,x:0,y:0,rx:0,ry:0},{id:'knee',parent:'root',x:0,y:100,rx:0,ry:100},{id:'foot',parent:'knee',x:0,y:200,rx:0,ry:200}]};C.skeletonBuild(rig);
   const body=C.mkPath([C.rectContour(52,220,24)],{fill:'#6440ff',stroke:'#171721',sw:3},{x:320,y:180});body.id='body';body.skin=C.softBind(body,rig);window.base=JSON.stringify(body.skin.base);window.fixture={d,rig,body};
   const hash=o=>{const cv=document.createElement('canvas');cv.width=640;cv.height=360;C.drawObj(cv.getContext('2d'),o,{});return cv.getContext('2d').getImageData(0,0,640,360).data;};
   const rows=[];for(const deg of [0,45,90,135,165]){const r=C.clone(rig),n=r.skel.nodes.at(-1),a=deg*Math.PI/180;n.x=100*Math.sin(a);n.y=100+100*Math.cos(a);C.skeletonBuild(r);const raw=C.softPoseObject(body,r),t=performance.now(),adaptive={...body,skin:{...body.skin,adaptive:true}},clean=C.softPoseObject(adaptive,r),elapsed=performance.now()-t;
    if(deg===0&&JSON.stringify(clean.contours)!==base)throw Error('rest shape changed');
    if(JSON.stringify(C.softPoseObject(adaptive,r).contours)!==JSON.stringify(clean.contours))throw Error('cache mismatch');
    const aPixels=hash(raw),bPixels=hash(clean);let changed=0,ink=0;for(let i=3;i<aPixels.length;i+=4){if(aPixels[i]||bPixels[i])ink++;if(Math.abs(aPixels[i]-bPixels[i])>32)changed++;}
    if(JSON.stringify(body.skin.base)!==base)throw Error('bind geometry changed');
    if(!clean.contours.every(c=>c.nodes.every(n=>['x','y','ix','iy','ox','oy'].every(k=>Number.isFinite(n[k])))))throw Error('non-finite curve');
    rows.push({deg,raw:raw.contours[0].nodes.length,clean:clean.contours[0].nodes.length,changed:changed/ink,ms:elapsed});
   }
   d.layers[0].kfs[0].objs=[rig,body];T.loadDoc(d);T.setTool('bone');window.ref={lid:d.layers[0].id,id:'rig',joint:'knee'};T.SK.hover={...ref};T.SK.softOpen='rig:knee';T.refreshAll();return rows;
  });
  assert(rows.slice(1).every(r=>r.clean<r.raw));assert(rows.every(r=>r.changed<.02));console.log('PASS adaptive curves reduce nodes at four bend angles, retain rest shape and bind nodes, remain finite and keep silhouette within 2% raster difference',rows);
  // A generated small loop disappears; large crossings and protected original corners remain.
  assert(await p.evaluate(()=>{const {C}=T,pts=[[0,0],[60,0],[50,10],[50,-10],[65,5],[100,0],[100,100],[0,100]],c={closed:true,nodes:pts.map(([x,y],i)=>({...C.node(x,y),...(i>=5?{softCorner:true}:{})}))},clean=C.softAdaptiveContour(c,100);return clean.nodes.length<c.nodes.length&&[pts[5],pts[6],pts[7]].every(([x,y])=>clean.nodes.some(n=>n.x===x&&n.y===y));}));
  console.log('PASS small backtracking loop repair preserves protected bind-time corners');
  const notches=await p.evaluate(()=>{
    const {C}=T,pts=[[0,0],[0,15],[0,30],[3,35],[-3,33],[0,40],[0,55],[0,70]],make=(closed=false)=>({closed,nodes:(closed?[...pts,[60,70],[60,0]]:pts).map(([x,y],i)=>({...C.node(x,y),...((i===0||i>=7)?{softCorner:true}:{})}))});
    const sample=c=>{const out=[];for(let i=0;i<(c.closed?c.nodes.length:c.nodes.length-1);i++){const a=c.nodes[i],b=c.nodes[(i+1)%c.nodes.length];for(let k=0;k<=16;k++){const t=k/16,u=1-t;out.push({x:u*u*u*a.x+3*u*u*t*(a.x+a.ox)+3*u*t*t*(b.x+b.ix)+t*t*t*b.x,y:u*u*u*a.y+3*u*u*t*(a.y+a.oy)+3*u*t*t*(b.y+b.iy)+t*t*t*b.y});}}return out;};
    const raw=make(),clean=C.softAdaptiveContour(raw,100),samples=sample(clean);
    if(samples.some((p,i)=>Math.abs(p.x)>.01||(i&&p.y<samples[i-1].y-1e-6)))throw Error('non-crossing side fold remains');
    const protectedContour=make();protectedContour.nodes[3].softCorner=true;const protectedPose=C.softAdaptiveContour(protectedContour,100);if(!protectedPose.nodes.some(n=>n.x===3&&n.y===35))throw Error('original corner erased');
    for(let shift=0;shift<10;shift++){const c=make(true);c.nodes.push(...c.nodes.splice(0,shift));const posed=C.softAdaptiveContour(c,100);if(sample(posed).some(p=>p.x<-.01))throw Error('closed contour seam kept fold');}
    return {before:raw.nodes.length,after:clean.nodes.length};
  });console.log('PASS non-self-intersecting side zigzag removed, original corner protected and closed-contour seam independent',notches);
  // Use the real radial-menu button, including its outer reach and pressed state.
  await p.locator('#boneSoftAdaptive').click();assert.equal(await p.locator('#boneSoftAdaptive').getAttribute('aria-pressed'),'true');assert.equal(await p.evaluate(()=>T.H.stack.length),1);assert(await p.evaluate(()=>T.S.doc.layers[0].kfs[0].objs.find(o=>o.id==='body').skin.adaptive));
  await p.evaluate(()=>T.undo());assert(await p.evaluate(()=>!T.S.doc.layers[0].kfs[0].objs.find(o=>o.id==='body').skin.adaptive));await p.evaluate(()=>T.redo());assert(await p.evaluate(()=>T.S.doc.layers[0].kfs[0].objs.find(o=>o.id==='body').skin.adaptive));
  await p.evaluate(()=>{const r=T.S.doc.layers[0].kfs[0].objs.find(o=>o.id==='rig');r.skel.nodes[1].pin=true;r.skel.rigids=[{id:'fixed',points:r.skel.nodes.slice(0,2).map(n=>({id:n.id,x:n.x,y:n.y}))}];T.SK.hover={...ref};T.SK.softOpen='rig:knee';T.skeletonMenuSync();});
  for(const id of ['bonePin','boneRigid','boneAttach','boneSoft','boneSoftBind','boneSoftAdaptive'])assert.equal(await p.locator('#'+id).getAttribute('aria-pressed'),'true',id);
  assert(await p.evaluate(()=>{const a=getComputedStyle(document.getElementById('bonePin')).backgroundColor,b=getComputedStyle(document.getElementById('boneAdd')).backgroundColor;return a!==b;}));
  console.log('PASS real experimental button, one Undo/Redo; saved Pin, Rigid, Attach and Soft settings stay visibly pressed when the joint menu opens');
  const extra=await p.evaluate(()=>{
    const {C}=T,rig=C.clone(fixture.rig);rig.skel.nodes=[{id:'top',parent:null,x:0,y:-70,rx:0,ry:-70},{id:'middle',parent:'top',x:0,y:0,rx:0,ry:0},{id:'left',parent:'middle',x:-75,y:50,rx:-75,ry:50},{id:'right',parent:'middle',x:75,y:50,rx:75,ry:50}];C.skeletonBuild(rig);
    const body=C.mkPath([C.ellipseContour(100,100)],{fill:'#64f',stroke:'#111',sw:2},{x:320,y:80});body.skin=C.softBind(body,rig);if(!body.skin?.regions)throw Error('branched fixture');body.skin.order=C.softOrder(body.skin);
    const bent=C.clone(rig);bent.skel.nodes[2].x=-20;bent.skel.nodes[2].y=85;bent.skel.nodes[3].x=90;bent.skel.nodes[3].y=0;C.skeletonBuild(bent);
    const raw=C.softPoseObject(body,bent),adaptive={...body,skin:{...body.skin,adaptive:true}},pose=C.softPoseObject(adaptive,bent);
    if(!raw._softParts||pose._softParts.length!==raw._softParts.length)throw Error('body part order lost');
    if(JSON.stringify(raw._softParts.map(p=>p.id))!==JSON.stringify(pose._softParts.map(p=>p.id)))throw Error('part order changed');
    for(const p of pose._softParts)for(const edge of p.outline)for(const n of edge.nodes)if(!p.fill.some(c=>c.nodes.some(q=>q.x===n.x&&q.y===n.y)))throw Error('fill/stroke boundary mismatch');
    const image=o=>{const cv=document.createElement('canvas');cv.width=640;cv.height=360;C.drawObj(cv.getContext('2d'),o,{});return cv.getContext('2d').getImageData(0,0,640,360).data;};
    for(const source of [body,adaptive,{...adaptive,skin:{...adaptive.skin,order:undefined}}]){
      const normal=C.softPoseObject(source,bent),a=image(normal),z=image(T.skeletonZoneView(normal,bent));
      for(let i=0;i<a.length;i+=4){if(a[i+3]===0&&z[i+3]>1)throw Error('zone colour escaped normal silhouette');if(a[i+3]>250&&a[i]<25&&a[i+1]<25&&a[i+2]<25&&(z[i]>45||z[i+1]>45||z[i+2]>45))throw Error('zone colour covered solid stroke');}
    }
    const before=performance.now();for(let i=0;i<100;i++)C.softPoseObject(adaptive,bent);const cachedMs=performance.now()-before;
    const chain=C.clone(fixture.rig),hole=C.mkPath([C.ellipseContour(35,110),C.ellipseContour(10,20)],{fill:'#64f'},{x:320,y:180,sx:-1.2,sy:.8,r:15});hole.skin=C.softBind(hole,chain);hole.skin.adaptive=true;chain.skel.nodes.at(-1).x=70;chain.skel.nodes.at(-1).y=130;C.skeletonBuild(chain);const holed=C.softPoseObject(hole,chain);
    if(holed.contours.length!==2||!holed.contours.every(c=>c.closed&&c.nodes.every(n=>Number.isFinite(n.x+n.y+n.ix+n.ox))))throw Error('transformed hole topology');
    const open=C.softAdaptiveContour({closed:false,nodes:[C.node(0,0),C.node(10,2),C.node(20,0)]},100);
    if(open.closed||open.nodes[0].x!==0||open.nodes.at(-1).x!==20)throw Error('open endpoints lost');
    return {parts:pose._softParts.length,cachedMs,holes:holed.contours.length};
  });
  console.log('PASS branched overlap order preserved and fill/stroke share repaired boundaries; zones cannot escape the silhouette or cover solid ink; cached evaluation; mirrored/scaled/rotated body keeps holes; open endpoints retained',extra);
  // Canonical topology stays sparse after capturing an intermediate frame, save/open and export.
  await p.evaluate(()=>{const {C,S}=T,l=S.doc.layers[0],rig=l.kfs[0].objs.find(o=>o.id==='rig');delete rig.skel.nodes[1].pin;delete rig.skel.rigids;rig.skel.mode='pose';const end=C.clone(l.kfs[0]);end.f=10;const r=end.objs.find(o=>o.id==='rig'),n=r.skel.nodes.at(-1);n.x=70.710678;n.y=29.289322;C.skeletonBuild(r);l.kfs.push(end);l.kfs[0].tween='shape';S.doc.frames=11;C.insertKeyframe(l,5,false);if(l.kfs[1].objs.find(o=>o.id==='body').contours[0].nodes.length!==JSON.parse(base)[0].nodes.length)throw Error('adaptive topology persisted');window.saved=C.clone(S.doc);T.loadDoc(C.normalizeDoc(C.clone(saved)));});
  const html=await p.evaluate(()=>T.buildPlayer({sound:false}).html),q=await b.newPage();q.on('pageerror',e=>errors.push(e.message));await q.route('https://adaptive-player.test/',r=>r.fulfill({contentType:'text/html',body:html}));await q.goto('https://adaptive-player.test/');
  for(const f of [0,2,5,7,10])assert.equal(await p.evaluate(f=>T.renderFrameCanvas(f,1).toDataURL(),f),await q.evaluate(f=>{__rt.setPaused(true);__rt.scrub(f);return document.querySelector('#cv').toDataURL();},f),'export frame '+f);
  assert.deepEqual(errors,[]);console.log('PASS sparse canonical nodes survive key insertion and Save/Open; standalone player exactly matches five tween frames; browser clean');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
