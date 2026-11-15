const {app,BrowserWindow,dialog,ipcMain,shell}=require('electron');
const path=require('node:path');
app.setName('oskyn');
function createWindow(){
  const win=new BrowserWindow({width:1360,height:860,minWidth:800,minHeight:550,title:'oskyn',autoHideMenuBar:true,
    webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,preload:path.join(__dirname,'preload.cjs')}});
  const session=win.webContents.session,tickets=new Map();let ticketId=0;
  let dirty=false,allowClose=false,prompting=false,save=null;
  ipcMain.handle('oskyn:prepare-download',(event,name)=>{
    if(event.sender!==win.webContents||typeof name!=='string'||!name||name!==path.basename(name))throw Error('Invalid download');
    const id=++ticketId;tickets.set(id,{name,started:false,result:null,resolve:null});return id;
  });
  ipcMain.handle('oskyn:download-result',(event,id)=>{
    if(event.sender!==win.webContents||!tickets.has(id))return false;
    const ticket=tickets.get(id);
    if(ticket.result!==null){tickets.delete(id);return ticket.result;}
    return new Promise(resolve=>{ticket.resolve=ok=>{tickets.delete(id);resolve(ok);};});
  });
  function failedSave(){
    save=null;
    dialog.showMessageBox(win,{type:'warning',title:'Project not saved',message:'oskyn stays open. A project was not saved, or changed during saving.',buttons:['OK']}).catch(()=>{});
  }
  function finishSave(){
    if(!save)return;
    if(save.failed){failedSave();return;}
    // Wait for every project download AND the renderer acknowledgement.
    if(save.expected!==null&&save.started===save.expected&&save.completed===save.expected){save=null;dirty=false;allowClose=true;win.close();}
  }
  async function promptClose(){
    if(prompting||save||win.isDestroyed())return;
    prompting=true;
    try{
      const {response}=await dialog.showMessageBox(win,{type:'warning',title:'Save your work?',message:'Save open projects before closing oskyn?',
        detail:'All open projects with unsaved changes need to be saved.',buttons:['Save',"Don't Save",'Cancel'],defaultId:0,cancelId:2,noLink:true});
      if(win.isDestroyed())return;
      if(response===1){allowClose=true;win.close();}
      else if(response===0){save={started:0,completed:0,expected:null,failed:false};win.webContents.send('onionskyn:save-before-close');}
    }finally{prompting=false;}
  }
  const onDirty=(event,value)=>{if(event.sender===win.webContents)dirty=!!value;};
  const onSaveResult=(event,result)=>{
    if(event.sender!==win.webContents||!save)return;
    const ok=typeof result==='boolean'?result:result?.ok;
    const count=typeof result==='boolean'?1:result?.count;
    if(!ok||!Number.isInteger(count)||count<0)save.failed=true;else save.expected=count;
    finishSave();
  };
  ipcMain.on('onionskyn:dirty',onDirty);ipcMain.on('onionskyn:save-request-result',onSaveResult);
  win.on('close',event=>{if(allowClose||!dirty)return;event.preventDefault();promptClose().catch(()=>{});});
  // Fallback when the page reports unsaved work before the IPC dirty notification arrives.
  win.webContents.on('will-prevent-unload',event=>{if(allowClose)event.preventDefault();else promptClose().catch(()=>{});});
  const onDownload=(_event,item,source)=>{
    if(source&&source!==win.webContents)return;
    item.setSaveDialogOptions({title:'Save oskyn file'});
    const ticket=[...tickets.values()].find(t=>!t.started&&t.name===item.getFilename());
    if(ticket){ticket.started=true;item.once('done',(_e,state)=>{ticket.result=state==='completed';if(ticket.resolve)ticket.resolve(ticket.result);});}
    if(!save||!item.getFilename().endsWith('.oskyn.json'))return;
    const attempt=save;attempt.started++;
    item.once('done',(_e,state)=>{
      if(save!==attempt)return;
      if(state==='completed')attempt.completed++;else attempt.failed=true;
      finishSave();
    });
  };
  session.on('will-download',onDownload);
  win.on('closed',()=>{ipcMain.removeListener('onionskyn:dirty',onDirty);ipcMain.removeListener('onionskyn:save-request-result',onSaveResult);session.removeListener('will-download',onDownload);ipcMain.removeHandler('oskyn:prepare-download');ipcMain.removeHandler('oskyn:download-result');for(const t of tickets.values())if(t.resolve)t.resolve(false);tickets.clear();});
  win.webContents.on('will-navigate',(event,url)=>{if(url!==win.webContents.getURL())event.preventDefault();});
  win.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'};});
  win.loadFile(path.join(__dirname,'oskyn.html'));
}
app.whenReady().then(()=>{createWindow();app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)createWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
