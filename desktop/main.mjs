import {app,BrowserWindow,ipcMain,shell,dialog} from 'electron';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createBridge} from './bridge.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let origin=process.env.CODEDUEL_SERVER_URL || 'http://127.0.0.1:4317';
const allowedOrigins=['http://127.0.0.1:4317','https://code-duel-pranjal.deadpools.chatgpt.site'];
let win,backend,bridge,quitting=false;
if(!app.requestSingleInstanceLock())app.quit();
else {
 app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus();}});
 app.whenReady().then(start).catch(error=>{dialog.showErrorBox('CodeDuel could not start',error.message);app.quit();});
}
async function start(){
 if(!allowedOrigins.includes(origin))throw Error('Unsupported room server URL.');
 if(origin.startsWith('http:'))origin=await startBackend();
 bridge=createBridge(event=>{if(win&&!win.isDestroyed())win.webContents.send('duel:event',event)});
 await bridge.listen();
 win=new BrowserWindow({width:1320,height:900,minWidth:860,minHeight:640,title:'CodeDuel',backgroundColor:'#101210',autoHideMenuBar:true,
  webPreferences:{preload:path.join(root,'desktop/preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 function trusted(event){if(event.sender!==win.webContents || event.senderFrame!==win.webContents.mainFrame || new URL(event.senderFrame.url).origin!==origin)throw Error('Untrusted window.');}
 ipcMain.handle('duel:open',async(event,link)=>{
  trusted(event);const url=new URL(link);
  if(url.protocol!=='vscode:' || url.host!=='codeduel.code-duel' || url.pathname!=='/open' || url.searchParams.get('origin')!==origin)throw Error('Invalid VS Code link.');
  const pairing=bridge.pair(url.searchParams.get('room'),url.searchParams.get('topic'));
  url.searchParams.set('bridge',pairing.url);url.searchParams.set('token',pairing.token);
  await shell.openExternal(url.href);
 });
 ipcMain.handle('duel:run',(event,room)=>{trusted(event);bridge.run(room);});
 ipcMain.handle('duel:status',(event,room)=>{trusted(event);return bridge.status(room);});
 win.webContents.setWindowOpenHandler(({url})=>{openDocumentation(url);return {action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==origin){event.preventDefault();openDocumentation(url);}});
 win.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
 await win.loadURL(origin);
}
function openDocumentation(url){
 try{const u=new URL(url);if(u.protocol==='https:' && ['developer.mozilla.org','docs.python.org','docs.pydantic.dev','fastapi.tiangolo.com','code.visualstudio.com','nodejs.org'].includes(u.hostname))shell.openExternal(u.href);}catch{}
}
function startBackend(){return new Promise((resolve,reject)=>{
 backend=spawn(process.env.CODEDUEL_NODE_PATH||'node',[path.join(root,'scripts/local.mjs')],{cwd:root,windowsHide:true,env:{...process.env,CODEDUEL_PORT:'0',CODEDUEL_BIND:'127.0.0.1',CODEDUEL_PUBLIC_ORIGIN:'',CODEDUEL_DATA_DIR:path.join(app.getPath('userData'),'data')}});
 let ready=false,logs='';const timer=setTimeout(()=>{backend.kill();reject(Error('Local server startup timed out.'))},15000);
 backend.stdout.on('data',data=>{logs+=data;const match=logs.match(/CodeDuel local preview: (http:\/\/127\.0\.0\.1:\d+)/);if(match&&!ready){ready=true;clearTimeout(timer);resolve(match[1]);}});
 backend.stderr.on('data',data=>{logs=(logs+data).slice(-4000)});
 backend.on('error',error=>{clearTimeout(timer);reject(Error('Node.js 24+ is required for local mode. '+error.message));});
 backend.on('exit',()=>{clearTimeout(timer);if(!ready)reject(Error('Local server failed. Close any other CodeDuel server on port 4317.\n'+logs));else if(!quitting){dialog.showErrorBox('Room server stopped','Restart CodeDuel to reconnect.');app.quit();}});
});}
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{quitting=true;backend?.kill();bridge?.close();});
