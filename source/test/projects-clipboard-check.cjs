const fs=require('fs'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{
 let h=fs.readFileSync(require('path').join(__dirname,'../dist/oskyn.html'),'utf8'),i=h.lastIndexOf('})();\n</script>');
 h=h.slice(0,i)+'window.T={C,S,H,loadDoc,openFile,openProjectDoc,newOpenProject,switchProject,captureProject,projectSession,copySel,pasteClip,undo,redo,pushUndo,commit,enterSym,setFrame,refreshAll,renderProjectButtons,askCloseProject,closeOpenProject,anyProjectsDirty,clearDirty,markDirty,buildPlayer,frameSpaceMatrix,saveProject};\n'+h.slice(i);
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const errors=[],p=await b.newPage({viewport:{width:1440,height:1000}});
  async function setup(page){page.on('pageerror',e=>errors.push(e.message));await page.route('https://projects.test/',r=>r.fulfill({contentType:'text/html',body:h}));await page.goto('https://projects.test/');await page.waitForSelector('#projectButtons [data-project]');}
  await setup(p);
  const initial=await p.evaluate(()=>{
   const {C,S}=T,d=C.mkDoc();d.name='Source';d.frames=12;
   d.images['pic.png']={name:'pic.png',mime:'image/png',b64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',w:1,h:1};
   const inner=C.mkLayer('Inside');inner.kfs[0].objs=[{id:'bitmap',kind:'image',img:'pic.png',w:40,h:40,t:C.newT(),op:1}];
   inner.kfs.push({...C.clone(inner.kfs[0]),f:4});inner.kfs[0].tween='shape';inner.kfs[0].sound={name:'beep',sync:'event'};
   d.sounds.beep={name:'beep',mime:'audio/wav',b64:'UklGRg=='};
   d.lib.Inner={layers:[inner],frames:5};const outer=C.mkLayer('Nested');
   outer.kfs[0].objs=[{id:'nested',kind:'clip',sym:'Inner',t:C.newT(),mode:'loop',first:0,op:1}];d.lib.Outer={layers:[outer],frames:9};
   d.lib.Unused={layers:[C.mkLayer('Unused')],frames:1};
   const o={id:'source-clip',kind:'clip',sym:'Outer',t:{...C.newT(),x:200,y:150},mode:'loop',first:0,op:1};
   d.layers[0].kfs[0].objs=[o];T.loadDoc(d);T.S.sel=[{lid:d.layers[0].id,id:o.id}];T.setFrame(6);T.pushUndo();o.t.x=215;T.commit();S.view={z:1.75,px:100,py:75};S.autoFit=false;T.copySel();T.renderProjectButtons();return {id:T.projectSession().active,history:T.H.stack.length};
  });
  const portable=await p.evaluate(()=>{const data=new DataTransfer();window.dispatchEvent(new ClipboardEvent('copy',{clipboardData:data,cancelable:true}));return {custom:data.getData('application/x-onionskyn-objects'),text:data.getData('text/plain')};});
  assert.equal(JSON.parse(portable.text).format,'oskyn-objects');assert.deepEqual(Object.keys(JSON.parse(portable.text).lib).sort(),['Inner','Outer']);
  await p.evaluate(async()=>{const d=T.C.mkDoc();d.name='Destination';d.lib.Outer={layers:[T.C.mkLayer('Existing')],frames:1};d.lib.Inner={layers:[T.C.mkLayer('Existing inner')],frames:1};d.images['pic.png']={name:'existing',mime:'image/png',b64:'different',w:1,h:1};d.sounds.beep={name:'old sound',b64:'different'};await T.openFile(new File([JSON.stringify({doc:d})],'destination.oskyn.json'));});
  const dest=await p.evaluate(()=>T.projectSession().active);assert.notEqual(dest,initial.id);assert.equal(await p.locator('#projectButtons [data-project]').count(),2);
  await p.evaluate(()=>T.pasteClip());
  assert(await p.evaluate(()=>{const d=T.S.doc,o=d.layers[0].kfs[0].objs[0],nested=d.lib[o.sym].layers[0].kfs[0].objs[0],def=d.lib[nested.sym],img=def.layers[0].kfs[0].objs[0];return o.sym==='Outer 2'&&nested.sym==='Inner 2'&&img.img==='pic.png 2'&&d.images[img.img].b64!==d.images['pic.png'].b64&&def.layers[0].kfs[1].f===4&&def.layers[0].kfs[1].objs[0].id===img.id&&img.id!=='bitmap'&&d.sounds['beep 2'].b64==='UklGRg=='&&def.layers[0].kfs[0].sound.name==='beep 2'&&!d.lib.Unused&&o.t.x===215;}));
  assert.equal(await p.evaluate(()=>T.H.stack.length),1);await p.evaluate(()=>T.undo());assert.equal(await p.evaluate(()=>T.S.doc.layers[0].kfs[0].objs.length),0);assert.equal(await p.evaluate(()=>Object.hasOwn(T.S.doc.lib,'Outer 2')),false);await p.evaluate(()=>T.redo());assert.equal(await p.evaluate(()=>T.S.doc.layers[0].kfs[0].objs.length),1);
  await p.locator(`[data-project="${initial.id}"]`).click();
  assert.deepEqual(await p.evaluate(()=>({name:T.S.doc.name,frame:T.S.frame,view:T.S.view,history:T.H.stack.length})),{name:'Source',frame:6,view:{z:1.75,px:100,py:75},history:initial.history});
  assert.equal(await p.evaluate(()=>T.S.doc.layers[0].kfs[0].objs[0].t.x),215);
  await p.evaluate(()=>T.enterSym('Outer'));const editView=await p.evaluate(()=>({view:{...T.S.view},frame:T.S.frame}));
  await p.evaluate(id=>T.switchProject(id),dest);await p.evaluate(id=>T.switchProject(id),initial.id);
  assert.deepEqual(await p.evaluate(()=>({view:T.S.view,frame:T.S.frame})),editView);assert.equal(await p.evaluate(()=>T.S.edit[0].sym),'Outer');
  await p.evaluate(id=>T.switchProject(id),dest);
  console.log('PASS Open keeps prior project; small buttons restore frame, view, nested symbol context and independent Undo/Redo; paste imports only dependencies with collision-safe names and shared keyframe IDs');
  // A second editor has no internal clipboard: use the plain-text OS fallback.
  const q=await b.newPage({viewport:{width:1440,height:1000}});await setup(q);
  await q.evaluate(text=>{const data=new DataTransfer();data.setData('text/plain',text);window.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,cancelable:true}));},portable.text);
  assert(await q.evaluate(()=>{const d=T.S.doc;return d.layers[0].kfs[0].objs.length===1&&d.lib.Outer&&d.lib.Inner&&d.images['pic.png']&&d.sounds.beep;}));
  await q.evaluate(()=>T.undo());assert.equal(await q.evaluate(()=>T.S.doc.layers[0].kfs[0].objs.length),0);
  await q.evaluate(()=>T.S.doc.layers[0].locked=true);await q.evaluate(text=>{const data=new DataTransfer();data.setData('application/x-onionskyn-objects',text);window.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,cancelable:true}));},portable.custom);assert.equal(await q.evaluate(()=>T.S.doc.layers[0].kfs[0].objs.length),0);assert.equal(await q.evaluate(()=>T.H.stack.length),0);
  console.log('PASS native clipboard payload works in another window without internal state; locked destination rejects paste without history changes');
  // Cancel/discard inactive projects; saving targets the named project, not the active one.
  await p.locator('#projectButtons .project-row').filter({has:p.locator(`[data-project="${initial.id}"]`)}).locator('.project-close').click();
  await p.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await p.locator('#projectButtons [data-project]').count(),2);
  await p.evaluate(id=>T.askCloseProject(id),initial.id);await p.getByRole('button',{name:'Don’t save',exact:true}).click();assert.equal(await p.locator('#projectButtons [data-project]').count(),1);assert.equal(await p.evaluate(()=>T.S.doc.name),'Destination');
  await p.evaluate(()=>T.clearDirty());assert.equal(await p.evaluate(()=>T.anyProjectsDirty()),false);
  await p.evaluate(()=>T.newOpenProject());const empty=await p.evaluate(()=>T.projectSession().active);await p.evaluate(id=>{T.switchProject(id);T.markDirty();},dest);await p.evaluate(id=>T.switchProject(id),empty);assert.equal(await p.evaluate(()=>T.anyProjectsDirty()),true);
  await p.evaluate(id=>T.askCloseProject(id),dest);const download=p.waitForEvent('download');await p.getByRole('button',{name:'Save',exact:true}).click();const file=await download;assert.equal(file.suggestedFilename(),'Destination.oskyn.json');await p.waitForFunction(id=>!T.projectSession().items.some(p=>p.id===id),dest);assert.equal(await p.evaluate(()=>T.anyProjectsDirty()),false);
  await p.evaluate(()=>T.askCloseProject(T.projectSession().active));await p.getByRole('button',{name:'Don’t save',exact:true}).click();assert.equal(await p.locator('#projectButtons [data-project]').count(),1);
  // Delayed host saving must not clear another project's dirty flag, nor discard edits made during saving.
  await q.evaluate(()=>{
    T.S.doc.layers[0].locked=false;T.markDirty();window.savedId=T.projectSession().active;
    window.claude={use:async()=>({save:()=>new Promise(resolve=>{window.finishSave=resolve;})})};
    window.pendingSave=T.saveProject();
  });
  await q.waitForFunction(()=>typeof window.finishSave==='function');
  await q.evaluate(()=>{T.newOpenProject();T.markDirty();window.finishSave();});
  await q.evaluate(()=>window.pendingSave);
  assert(await q.evaluate(()=>T.anyProjectsDirty()&&!T.projectSession().items.find(p=>p.id===window.savedId).dirty));
  await q.evaluate(()=>{window.finishSave=null;window.pendingClose=T.closeOpenProject(T.projectSession().active,true);});
  await q.waitForFunction(()=>typeof window.finishSave==='function');const count=await q.evaluate(()=>T.projectSession().items.length);
  await q.evaluate(()=>{T.markDirty();window.finishSave();});await q.evaluate(()=>window.pendingClose);
  assert.equal(await q.evaluate(()=>T.projectSession().items.length),count);assert(await q.evaluate(()=>T.anyProjectsDirty()));
  await q.evaluate(()=>{delete window.claude;});
  assert.equal(await p.evaluate(()=>T.buildPlayer({sound:false}).html.includes('id="projectButtons"')),false);
  assert.deepEqual(errors,[]);console.log('PASS delayed saves do not clear another project or discard newer edits; project buttons excluded from exported player');console.log('PASS project close Cancel/Don’t save/Save; correct project download; inactive unsaved-work guard; closing final project leaves a fresh editable document; browser clean');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
