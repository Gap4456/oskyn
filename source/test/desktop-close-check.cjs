const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{EventEmitter}=require('node:events'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const code=fs.readFileSync(path.join(__dirname,'../../desktop/main.cjs'),'utf8'),tick=()=>new Promise(setImmediate);
async function host(responses){
 const ipcMain=new EventEmitter(),app=new EventEmitter(),prompts=[],handlers=new Map();let win;
 ipcMain.handle=(name,fn)=>handlers.set(name,fn);ipcMain.removeHandler=name=>handlers.delete(name);
 app.setName=()=>{};app.whenReady=()=>Promise.resolve();app.quit=()=>{};
 class Window extends EventEmitter{
  constructor(){super();win=this;this.destroyed=false;this.closed=false;const web=new EventEmitter();web.session=new EventEmitter();web.send=(...a)=>this.sent=a;web.setWindowOpenHandler=()=>{};web.getURL=()=>'';this.webContents=web;}
  isDestroyed(){return this.destroyed;}loadFile(){}
  close(){const e={prevented:false,preventDefault(){this.prevented=true;}};this.emit('close',e);if(!e.prevented){this.closed=true;this.destroyed=true;this.emit('closed');}}
  static getAllWindows(){return win?.closed?[]:[win];}
 }
 const dialog={async showMessageBox(_win,options){prompts.push(options);return {response:options.buttons.length===3?responses.shift():0};}};
 vm.runInNewContext(code,{require(name){return name==='electron'?{app,BrowserWindow:Window,dialog,ipcMain,shell:{openExternal(){}}}:require(name);},__dirname:'/test',process:{platform:'win32'}});
 await tick();return {win,prompts,ipcMain,invoke:(name,arg)=>handlers.get(name)({sender:win.webContents},arg),dirty(value=true){ipcMain.emit('onionskyn:dirty',{sender:win.webContents},value);},ack(ok,count){ipcMain.emit('onionskyn:save-request-result',{sender:win.webContents},{ok,count});},download(){const item=new EventEmitter();item.getFilename=()=> 'project.oskyn.json';item.setSaveDialogOptions=()=>{};win.webContents.session.emit('will-download',{},item,win.webContents);return item;}};
}
(async()=>{
 let h=await host([2]);h.dirty();h.win.close();await tick();assert(!h.win.closed);assert.deepEqual(Array.from(h.prompts[0].buttons),['Save',"Don't Save",'Cancel']);
 h=await host([1]);h.dirty();h.win.close();await tick();assert(h.win.closed);
 h=await host([0]);h.dirty();h.win.close();await tick();assert.equal(h.win.sent[0],'onionskyn:save-before-close');h.ack(true,2);const a=h.download(),z=h.download();a.emit('done',{},'completed');assert(!h.win.closed);z.emit('done',{},'completed');assert(h.win.closed);assert.equal(h.ipcMain.listenerCount('onionskyn:dirty'),0);assert.equal(h.win.webContents.session.listenerCount('will-download'),0);
 h=await host([0]);h.dirty();h.win.close();await tick();h.download().emit('done',{},'completed');assert(!h.win.closed);h.ack(true,1);assert(h.win.closed);
 h=await host([0,2]);h.dirty();h.win.close();await tick();h.ack(true,2);h.download().emit('done',{},'cancelled');await tick();assert(!h.win.closed);h.win.close();await tick();assert.equal(h.prompts.filter(p=>p.buttons.length===3).length,2);
 h=await host([0]);h.dirty();h.win.close();await tick();h.ack(false,0);await tick();assert(!h.win.closed);
 h=await host([2]);h.win.webContents.emit('will-prevent-unload',{preventDefault(){throw Error('must keep open');}});await tick();assert.equal(h.prompts.length,1);assert(!h.win.closed);
 h=await host([]);let ticket=await h.invoke('oskyn:prepare-download','project.oskyn.json'),result=h.invoke('oskyn:download-result',ticket);h.download().emit('done',{},'cancelled');assert.equal(await result,false);ticket=await h.invoke('oskyn:prepare-download','project.oskyn.json');h.download().emit('done',{},'completed');assert.equal(await h.invoke('oskyn:download-result',ticket),true);
 console.log('PASS regular native saves report completed/cancelled status in either completion order');
 console.log('PASS Electron window close Save / Don’t Save / Cancel; all downloads must finish plus acknowledgement; cancellation/failure stays open; fallback and listener cleanup');
 let html=fs.readFileSync(path.join(__dirname,'../dist/oskyn.html'),'utf8'),i=html.lastIndexOf('})();\n</script>');html=html.slice(0,i)+'window.T={C,S,newOpenProject,markDirty,clearDirty,projectSession,anyProjectsDirty,saveProject};\n'+html.slice(i);
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.desktopEvents={dirty:[],acks:[]};window.onionskynDesktop={saveAllBeforeClose:true,setDirty:v=>desktopEvents.dirty.push(v),onSaveBeforeClose:fn=>window.requestCloseSave=fn,saveRequestResult:(ok,count)=>desktopEvents.acks.push({ok,count})};});
  await p.route('https://desktop-close.test/',r=>r.fulfill({contentType:'text/html',body:html}));await p.goto('https://desktop-close.test/');
  await p.evaluate(()=>{T.S.doc.name='First';T.markDirty();T.newOpenProject();T.S.doc.name='Second';T.markDirty();});
  assert.equal(await p.evaluate(()=>desktopEvents.dirty.at(-1)),true);
  const downloads=[];p.on('download',d=>downloads.push(d));await p.evaluate(()=>requestCloseSave());await p.waitForFunction(()=>desktopEvents.acks.length===1);assert.equal(downloads.length,2);assert.deepEqual(downloads.map(d=>d.suggestedFilename()).sort(),['First.oskyn.json','Second.oskyn.json']);assert.deepEqual(await p.evaluate(()=>desktopEvents.acks.at(-1)),{ok:true,count:2});assert(await p.evaluate(()=>T.anyProjectsDirty()));
  await p.evaluate(()=>{window.claude={use:async()=>({save:async()=>{const e=Error('cancelled');e.code='declined';throw e;}})};});await p.evaluate(()=>requestCloseSave());assert.deepEqual(await p.evaluate(()=>desktopEvents.acks.at(-1)),{ok:false,count:0});assert(await p.evaluate(()=>T.anyProjectsDirty()));
  await p.evaluate(()=>{delete window.claude;window.onionskynDesktop.prepareDownload=async()=>1;window.onionskynDesktop.downloadResult=async()=>false;});
  assert.equal(await p.evaluate(()=>T.saveProject()),false);assert(await p.evaluate(()=>T.anyProjectsDirty()));
  assert.equal(await p.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;}),false);
  assert.deepEqual(errors,[]);console.log('PASS HTML bridge reports inactive dirty projects, saves every dirty project before native close, preserves dirty state until completed downloads, handles save cancellation; browser clean');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
