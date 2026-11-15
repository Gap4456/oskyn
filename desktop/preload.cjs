const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('onionskynDesktop',{
  saveAllBeforeClose:true,
  prepareDownload:name=>ipcRenderer.invoke('oskyn:prepare-download',name),
  downloadResult:id=>ipcRenderer.invoke('oskyn:download-result',id),
  setDirty:value=>ipcRenderer.send('onionskyn:dirty',!!value),
  onSaveBeforeClose:callback=>ipcRenderer.on('onionskyn:save-before-close',()=>callback()),
  saveRequestResult:(ok,count=1)=>ipcRenderer.send('onionskyn:save-request-result',{ok:!!ok,count})
});
