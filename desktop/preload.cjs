const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('codeDuelDesktop',{
  openChallenge: link=>ipcRenderer.invoke('duel:open',link),
  runTests: room=>ipcRenderer.invoke('duel:run',room),
  status: room=>ipcRenderer.invoke('duel:status',room),
  onEvent: callback=>{const listener=(_event,data)=>callback(data);ipcRenderer.on('duel:event',listener);return ()=>ipcRenderer.removeListener('duel:event',listener);}
});
