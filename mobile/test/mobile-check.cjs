const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 let html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),end=html.lastIndexOf('\n})();');
 html=html.slice(0,end)+'\nwindow.M={C,S,H,REC,SK,CW,RH,loadDoc,setTool,setTab,setFrame,w2s,fitView,selectionControlsHidden,refreshAll,mobile,mobileMods,mobileKey,mobileTouch,mobileOpenPanel,mobileClosePanel,mobileApplyPanel,mobileSyncModifiers,clearDirty,dirty:()=>unsaved};\n'+html.slice(end);
 const desktop=fs.readFileSync(path.join(__dirname,'../../oskyn.html'),'utf8'),core=s=>s.match(/<script id="fcCore">([\s\S]*?)<\/script>/)[1];assert.equal(core(html),core(desktop));assert(!desktop.includes('mobileModifiers'));
 const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://mobile.test/',r=>r.fulfill({contentType:'text/html',body:html}));await p.goto('https://mobile.test/');await p.waitForSelector('#mobileToolsToggle');
  const cdp=await context.newCDPSession(p),touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y,id])=>({x,y,id,radiusX:4,radiusY:4,force:.5}))});
  async function center(selector){const b=await p.locator(selector).boundingBox();return [b.x+b.width/2,b.y+b.height/2];}
  async function stroke(a,b,delay=100){await touch('touchStart',[[...a,1]]);if(delay)await p.waitForTimeout(delay);await touch('touchMove',[[...b,1]]);await touch('touchEnd',[]);}
  async function at(x,y){return p.evaluate(([x,y])=>M.w2s(x,y),[x,y]);}
  async function revealTool(selector){if(!await p.locator('#mobilePanel-tools').isVisible())await p.locator('#mobileToolsToggle').tap();await p.locator(selector).evaluate(e=>e.scrollIntoView({block:'nearest'}));}
  async function chooseTool(id){await revealTool('[data-tool="'+id+'"]');await p.locator('[data-tool="'+id+'"]').tap();assert.equal(await p.evaluate(()=>M.S.tool),id);assert.equal(await p.locator('#mobilePanel-tools').isVisible(),false);}
  assert.equal(await p.evaluate(()=>M.CW),40);assert.equal(await p.evaluate(()=>M.RH),44);
  assert(await p.locator('#bUndo').isVisible());assert(await p.locator('#bRedo').isVisible());assert.equal(await p.locator('#mobilePanel-tools').isVisible(),false);
  await chooseTool('rect');await p.evaluate(()=>{M.S.view={z:1,px:100,py:50};M.S.autoFit=false;});await stroke([250,130],[330,190]);assert.equal(await p.evaluate(()=>M.S.doc.layers[0].kfs[0].objs.length),1);assert.equal(await p.evaluate(()=>M.H.stack.length),1);
  await p.locator('#bUndo').tap();await p.waitForFunction(()=>M.S.doc.layers[0].kfs[0].objs.length===0);await p.locator('#bRedo').tap();await p.waitForFunction(()=>M.S.doc.layers[0].kfs[0].objs.length===1);
  await chooseTool('brush');await stroke([380,130],[440,160]);assert.equal(await p.evaluate(()=>M.S.doc.layers[0].kfs[0].objs.length),2);
  await chooseTool('bone');await chooseTool('node');await chooseTool('select');
  console.log('PASS shared-core mobile build, full-screen canvas, all tools including Node/Bone, touch Rectangle/Brush and persistent working Undo/Redo');
  // Native panel scrolling keeps the sheet open and leaves the canvas alone.
  assert.equal(await p.locator('.mobile-nav-pad').count(),0);
  assert(await p.locator('#mobilePreview').isVisible());assert(await p.locator('#mobileDelete').isVisible());await p.locator('#mobilePreview').tap();assert(await p.locator('#prev').evaluate(e=>e.classList.contains('on')));await p.locator('#prev').evaluate(e=>e.classList.remove('on'));
  await p.evaluate(()=>{const l=M.S.doc.layers[0];M.S.sel=[{lid:l.id,id:l.kfs[0].objs[1].id}];});await p.locator('#mobileDelete').tap();assert.equal(await p.evaluate(()=>M.S.doc.layers[0].kfs[0].objs.length),1);await p.locator('#bUndo').tap();assert.equal(await p.evaluate(()=>M.S.doc.layers[0].kfs[0].objs.length),2);
  await p.locator('#mobilePropsToggle').tap();assert(await p.locator('#mobilePanel-props').isVisible());
  const view=await p.evaluate(()=>({...M.S.view})),vbox=await p.locator('#mobilePanel-props .mobile-panel-viewport').boundingBox();
  await stroke([vbox.x+10,vbox.y+vbox.height-15],[vbox.x+10,vbox.y+15],30);await p.waitForTimeout(100);
  assert(await p.locator('#mobilePanel-props').isVisible());assert.deepEqual(await p.evaluate(()=>M.S.view),view);
  await p.locator('#mobileTimelineToggle').tap();assert(await p.locator('#mobilePanel-timeline').isVisible());assert.equal(await p.locator('#mobilePanel-props').isVisible(),false);await p.getByRole('button',{name:'Close Timeline panel',exact:true}).tap();
  console.log('PASS visible Preview/Delete, Delete undo, native panel scrolling, one panel at a time');
  // Latched Shift survives closing Tools; its visual reminder never catches input.
  await revealTool('#mobileModShift');await p.locator('#mobileModShift').tap();assert(await p.evaluate(()=>M.mobileKey('Shift')));await chooseTool('rect');assert(await p.locator('#mobileReminderShift').isVisible());assert.equal(await p.locator('#mobileReminders').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
  await stroke([500,130],[580,175]);assert(await p.evaluate(()=>{const o=M.S.doc.layers[0].kfs[0].objs.at(-1),b=M.C.localBounds(o);return Math.abs((b.x1-b.x0)-(b.y1-b.y0))<1e-5;}));
  await revealTool('#mobileModShift');await p.locator('#mobileModShift').tap();assert.equal(await p.evaluate(()=>M.mobileKey('Shift')),false);await p.getByRole('button',{name:'Close Tools panel',exact:true}).tap();
  await revealTool('#mobileModShift');const held=await center('#mobileModShift');await touch('touchStart',[[...held,9]]);await touch('touchStart',[[...held,9],[560,130,1]]);await p.waitForTimeout(100);await touch('touchMove',[[...held,9],[630,175,1]]);await touch('touchEnd',[[...held,9]]);await touch('touchEnd',[]);assert.equal(await p.evaluate(()=>M.mobileKey('Shift')),false);assert(await p.evaluate(()=>{const o=M.S.doc.layers[0].kfs[0].objs.at(-1),b=M.C.localBounds(o);return Math.abs((b.x1-b.x0)-(b.y1-b.y0))<1e-5;}));await p.getByRole('button',{name:'Close Tools panel',exact:true}).tap();
  console.log('PASS tap-latched and physically held Shift constrain drawing; a UI modifier finger is excluded from canvas pinch; passive reminders');
  // A late second canvas finger rolls back an eraser edit exactly.
  await p.evaluate(()=>{const {C,S}=M,d=C.mkDoc(),o=C.mkPath([C.rectContour(180,100)],{fill:'#55cc99',stroke:null},{x:300,y:180});d.name='Phone';d.layers[0].kfs[0].objs=[o];M.loadDoc(d);S.view={z:1,px:20,py:20};S.autoFit=false;M.clearDirty();M.refreshAll();window.before=JSON.stringify(S.doc);window.historyBefore=M.H.stack.length;});
  await chooseTool('eraser');const pos=await at(300,180),other=[pos[0]+60,pos[1]];await touch('touchStart',[[...pos,1]]);await p.waitForTimeout(130);assert.notEqual(await p.evaluate(()=>JSON.stringify(M.S.doc)),await p.evaluate(()=>before));
  await touch('touchStart',[[...pos,1],[...other,2]]);assert.deepEqual(await p.evaluate(()=>M.S.doc),await p.evaluate(()=>JSON.parse(before)));assert.equal(await p.evaluate(()=>M.H.stack.length),await p.evaluate(()=>historyBefore));assert.equal(await p.evaluate(()=>M.dirty()),false);
  const v=await p.evaluate(()=>({...M.S.view}));await touch('touchMove',[[pos[0]-10,pos[1]+8,1],[other[0]+20,other[1]+8,2]]);assert(await p.evaluate(z=>M.S.view.z>z,v.z));await touch('touchEnd',[[pos[0]-10,pos[1]+8,1]]);await touch('touchMove',[[other[0]+15,other[1]+10,2]]);await touch('touchEnd',[]);assert.deepEqual(await p.evaluate(()=>M.S.doc),await p.evaluate(()=>JSON.parse(before)));assert.equal(await p.evaluate(()=>M.mobileTouch.points.size),0);
  console.log('PASS true two-pointer canvas pinch/pan; eraser edit rolled back; history/dirty preserved; no mark after one finger lifts');
  // Drag-to-record is armed by the real UI and creates real frame keys/counter.
  await chooseTool('select');await p.evaluate(()=>{const l=M.S.doc.layers[0];M.S.sel=[{lid:l.id,id:l.kfs[0].objs[0].id}];M.S.view={z:1,px:20,py:20};M.S.autoFit=false;M.refreshAll();});
  await revealTool('#pRecord');await p.locator('#pRecord').tap();assert(await p.evaluate(()=>M.REC.armed));await p.getByRole('button',{name:'Close Tools panel',exact:true}).tap();assert(await p.locator('#mobileRecordStatus').isVisible());
  const start=await at(300,180);await touch('touchStart',[[...start,1]]);await p.waitForTimeout(100);await touch('touchMove',[[start[0]+35,start[1]+10,1]]);await p.waitForFunction(()=>M.REC.running);await p.waitForTimeout(160);await touch('touchMove',[[start[0]+45,start[1]+15,1]]);assert.match(await p.locator('#mobileRecordCount').innerText(),/\d+ frames recorded/);await touch('touchEnd',[]);assert(await p.evaluate(()=>M.REC.armed&&!M.REC.running));assert(await p.evaluate(()=>M.mobile.recorded.size>=3));assert.equal(await p.evaluate(()=>M.H.stack.length),1);
  await revealTool('#pRecord');await p.locator('#pRecord').tap();await p.getByRole('button',{name:'Close Tools panel',exact:true}).tap();assert.equal(await p.evaluate(()=>M.REC.armed),false);await p.locator('#bUndo').tap();assert.equal(await p.evaluate(()=>M.S.doc.layers.length),1);
  console.log('PASS latched REC starts on a real drag, counts stored frames live, stops on release, remains armed, disarms and undoes as one take');
  // Bone uses a tap to expose its radial actions; no mouse hover is required.
  await p.evaluate(()=>{const {C}=M,d=C.mkDoc(),rig=C.mkPath([],{fill:null,stroke:null},{x:350,y:150});rig.id='rig';rig.skel={version:2,mode:'edit',nodes:[{id:'root',parent:null,x:0,y:0,rx:0,ry:0},{id:'elbow',parent:'root',x:70,y:0,rx:70,ry:0},{id:'hand',parent:'elbow',x:140,y:0,rx:140,ry:0}]};C.skeletonBuild(rig);d.layers[0].kfs[0].objs=[rig];M.loadDoc(d);M.S.view={z:1,px:0,py:0};M.S.autoFit=false;M.refreshAll();});
  await chooseTool('bone');await stroke([350,150],[350,150],0);await p.waitForSelector('#boneMenu',{state:'visible'});await p.locator('#bonePin').tap();assert(await p.evaluate(()=>M.S.doc.layers[0].kfs[0].objs[0].skel.nodes[0].pin));
  // Ctrl+Shift latches are passed into the shared Node drag implementation.
  await p.evaluate(()=>{const {C}=M,d=C.mkDoc(),o=C.mkPath([C.rectContour(100,80)],{fill:'#55cc99'},{x:300,y:180});d.name='Phone';d.layers[0].kfs[0].objs=[o];M.loadDoc(d);M.S.sel=[{lid:d.layers[0].id,id:o.id}];M.S.view={z:1,px:20,py:20};M.S.autoFit=false;M.refreshAll();});
  await revealTool('#mobileModControl');await p.locator('#mobileModControl').tap();await revealTool('#mobileModShift');await p.locator('#mobileModShift').tap();await chooseTool('node');await stroke([270,160],[300,178]);assert(await p.evaluate(()=>{const n=M.S.doc.layers[0].kfs[0].objs[0].contours[0].nodes[0];return n.x===-20&&n.y===-40;}));
  for(const key of ['Control','Shift']){await revealTool('#mobileMod'+key);await p.locator('#mobileMod'+key).tap();}await p.getByRole('button',{name:'Close Tools panel',exact:true}).tap();
  await p.setViewportSize({width:600,height:390});await p.waitForTimeout(100);
  // Hold a thick frame cell: show the original operations without needing right-click.
  await p.locator('#mobileTimelineToggle').tap();const cell=await p.locator('#tlCells').boundingBox();await touch('touchStart',[[cell.x+20,cell.y+22,1]]);await p.waitForTimeout(650);await touch('touchEnd',[]);assert(await p.getByRole('menuitem',{name:'Copy Frames',exact:true}).isVisible());assert(await p.getByRole('menuitem',{name:'Paste Frames',exact:true}).isVisible());await p.keyboard.press('Escape');
  const frameBox=await p.locator('#tlScroll').boundingBox(),barBox=await p.locator('.tl-bar').boundingBox();
  await stroke([frameBox.x+frameBox.width-70,cell.y+22],[frameBox.x+160,cell.y+22],30);await p.waitForTimeout(900);
  assert(await p.locator('#tlScroll').evaluate(e=>e.scrollLeft)>0);assert.equal(await p.locator('.tl-bar').evaluate(e=>e.scrollLeft),0);assert(await p.locator('#mobilePanel-timeline').isVisible());
  const beforeScroll=await p.locator('#tlScroll').evaluate(e=>e.scrollLeft);
  await stroke([barBox.x+barBox.width-70,barBox.y+65],[barBox.x+25,barBox.y+65],30);await p.waitForTimeout(900);
  assert(await p.locator('.tl-bar').evaluate(e=>e.scrollLeft)>0);assert.equal(await p.locator('#tlScroll').evaluate(e=>e.scrollLeft),beforeScroll);
  await p.getByRole('button',{name:'Scroll Timeline to start',exact:true}).tap();const cells=await p.locator('#tlCells').boundingBox();await stroke([cells.x+140,cells.y+22],[cells.x+140,cells.y+22],0);assert.equal(await p.evaluate(()=>M.S.frame),3);
  await p.getByRole('button',{name:'Close Timeline panel',exact:true}).tap();
  console.log('PASS Bone tap opens radial HUD and Pin works; Ctrl+Shift constrains an actual Node drag; long press on a thick frame opens Copy/Paste/Key actions');
  // Portrait save/reopen and gallery-style image import use the shared format.
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);assert(await p.locator('#bUndo').isVisible());assert(await p.locator('#projectToggle').isVisible());assert.equal(await p.locator('#stage').evaluate(e=>Math.round(e.getBoundingClientRect().width)),390);
  await p.locator('#imgIn').setInputFiles({name:'gallery.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64')});await p.waitForFunction(()=>Object.keys(M.S.doc.images).length===1);
  const download=p.waitForEvent('download');await p.locator('#mFile').tap();await p.getByRole('menuitem',{name:'Save project',exact:true}).tap();const d=await download,saved=JSON.parse(fs.readFileSync(await d.path(),'utf8'));assert.equal(saved.app,'oskyn');assert.equal(saved.appVersion,'1.0.1');assert.equal(Object.keys(saved.doc.images).length,1);
  await p.locator('#fileIn').setInputFiles({name:'Phone test.oskyn.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await p.waitForFunction(()=>M.S.projects.items.length===2);assert.equal(await p.evaluate(()=>M.S.projects.items.find(p=>p.id===M.S.projects.active).name),'Phone test');
  await p.locator('#projectToggle').tap();assert(await p.locator('#projectButtons').isVisible());const first=await p.evaluate(()=>M.S.projects.items[0].id);await p.locator('[data-project="'+first+'"]').tap();assert.equal(await p.locator('#projectButtons').isVisible(),false);
  assert.deepEqual(errors,[]);console.log('PASS portrait layout, image file import, native project download and reopen, multi-project switch auto-closes drawer; browser clean');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
