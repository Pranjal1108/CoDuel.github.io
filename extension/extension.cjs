const vscode=require('vscode'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const tasks=require('./tasks.json');
const {bridgeRequest,validBridge}=require('./bridge-client.cjs');
const allowedOrigin=o=>o==='https://pranjal1108.github.io/CodeDuel'||o==='https://code-duel-pranjal.deadpools.chatgpt.site'||/^http:\/\/127\.0\.0\.1:([1-9]\d{0,4})$/.test(o)&&Number(o.split(':').at(-1))<=65535;
function activate(context){
 const output=vscode.window.createOutputChannel('CodeDuel');context.subscriptions.push(output);
 let running=false;
 function spawn(exe,args,cwd,timeout=15000){return new Promise((resolve,reject)=>{let tail='',done=false;const child=cp.spawn(exe,args,{cwd,shell:false,windowsHide:true,env:{...process.env,ELECTRON_RUN_AS_NODE:'1'}});const timer=setTimeout(()=>{if(done)return;done=true;if(process.platform==='win32')cp.spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,shell:false});else child.kill('SIGKILL');reject(Error('Test process exceeded its time limit.'));},timeout);for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{const t=b.toString();tail=(tail+t).slice(-12000);output.append(t.slice(0,12000))});child.on('error',e=>{clearTimeout(timer);if(!done){done=true;reject(e)}});child.on('close',code=>{clearTimeout(timer);if(!done){done=true;code===0?resolve(tail):reject(Error('Process exited with code '+code+'. See CodeDuel output.'))}})})}
 async function info(){if(!vscode.workspace.isTrusted)throw Error('Trust this challenge workspace before running tests.');const root=vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;if(!root)throw Error('Open a challenge from your CodeDuel room first.');const c=JSON.parse(await fs.readFile(path.join(root,'.codeduel.json'),'utf8'));if(!allowedOrigin(c.origin)||!tasks[c.topic]||!/^([A-F0-9]{8}|PRACTICE)$/.test(c.room))throw Error('Invalid challenge workspace.');return {root,c}}
 const wrap=f=>async()=>{try{await f()}catch(e){vscode.window.showErrorMessage('CodeDuel: '+e.message);try{const {c}=await info();await bridgeRequest(c,'/events',{type:'error',message:e.message.slice(0,1000)})}catch{}}};

 context.subscriptions.push(vscode.window.registerUriHandler({handleUri:async uri=>{try{
 const q=new URLSearchParams(uri.query),room=q.get('room'),topic=q.get('topic'),origin=q.get('origin');
 const pairing=q.has('bridge')?{bridge:q.get('bridge'),token:q.get('token')}:{};
 if(q.has('bridge')&&!validBridge(pairing))throw Error('Invalid desktop pairing.');
 if(uri.path!=='/open'||!/^([A-F0-9]{8}|PRACTICE)$/.test(room||'')||!tasks[topic]||!allowedOrigin(origin))throw Error('This challenge link is not valid.');
 const choice=await vscode.window.showOpenDialog({canSelectFolders:true,canSelectFiles:false,canSelectMany:false,openLabel:'Choose parent folder for CodeDuel'});if(!choice)return;
 const root=path.join(choice[0].fsPath,'codeduel-'+room.toLowerCase());try{await fs.mkdir(root)}catch(e){if(e.code!=='EEXIST')throw e;const existing=JSON.parse(await fs.readFile(path.join(root,'.codeduel.json'),'utf8'));if(existing.room!==room||existing.topic!==topic||existing.origin!==origin)throw Error('This folder belongs to another challenge. Choose another parent folder.');await fs.writeFile(path.join(root,'.codeduel.json'),JSON.stringify({room,topic,origin,...pairing},null,2));await vscode.commands.executeCommand('vscode.openFolder',vscode.Uri.file(root),{forceNewWindow:false});return;}
 const t=tasks[topic];await fs.writeFile(path.join(root,'.codeduel.json'),JSON.stringify({room,topic,origin,...pairing},null,2),{flag:'wx'});
 await fs.writeFile(path.join(root,(topic==='fastapi'||topic.startsWith('py-'))?'solution.py':'solution.cjs'),t.signature+((topic==='fastapi'||topic.startsWith('py-'))?'':'\nmodule.exports = solve;\n'),{flag:'wx'});
 await fs.writeFile(path.join(root,'README.md'),'# '+t.title+'\n\n'+t.text+'\n\nExample: '+t.example+'\n\nRun **CodeDuel: Run tests** from the Command Palette. Then **CodeDuel: Return result to room**.\n\n'+(topic==='fastapi'?'First run **CodeDuel: Set up Python environment**.\n':'Requires Node.js installed on PATH.\n')+'\nOnly this solution and test summary are returned when you choose to do so. Local code runs with your user permissions.\n',{flag:'wx'});
 await vscode.commands.executeCommand('vscode.openFolder',vscode.Uri.file(root),{forceNewWindow:true});
 }catch(e){vscode.window.showErrorMessage('CodeDuel: '+e.message)}}}));
 context.subscriptions.push(vscode.commands.registerCommand('codeduel.python',wrap(async()=>{
 const {root,c}=await info();if(c.topic!=='fastapi')throw Error('This challenge uses JavaScript.');
 const approve=await vscode.window.showInformationMessage('Create .venv in this challenge folder and install pydantic-settings from PyPI?','Set up environment');if(approve!=='Set up environment')return;
 output.show();await spawn(vscode.workspace.getConfiguration('codeduel').get('pythonPath'),' -m venv .venv'.trim().split(' '),root,60000);
 const py=path.join(root,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
 await spawn(py,['-m','pip','install','pydantic-settings>=2,<3'],root,120000);vscode.window.showInformationMessage('CodeDuel: Python environment ready.');
 })));
 context.subscriptions.push(vscode.commands.registerCommand('codeduel.run',wrap(async()=>{
 if(running)throw Error('A test run is already active.');const {root,c}=await info();if(!await vscode.workspace.saveAll(false))throw Error('Save your solution before running tests.');
 const filename=(c.topic==='fastapi'||c.topic.startsWith('py-'))?'solution.py':'solution.cjs',source=await fs.readFile(path.join(root,filename),'utf8');if(source.length>20000)throw Error('Keep the solution under 20,000 characters.');
 running=true;let temp;try{
 output.clear();output.show();output.appendLine('Running '+tasks[c.topic].title+'…');temp=await fs.mkdtemp(path.join(os.tmpdir(),'codeduel-'));await fs.writeFile(path.join(temp,filename),source);
 const resultPath=path.join(temp,'result.json');
 const exe=c.topic==='fastapi'?path.join(root,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python'):vscode.workspace.getConfiguration('codeduel').get(c.topic.startsWith('py-')?'pythonPath':'nodePath');
 const runner=path.join(context.extensionPath,c.topic==='fastapi'?'runner.py':c.topic.startsWith('py-')?'standard.py':'runner.cjs');
 await spawn(exe,[runner,path.join(temp,filename),c.topic,resultPath],root);
 const data=JSON.parse(await fs.readFile(resultPath,'utf8'));const report={version:1,room:c.room,topic:c.topic,passed:data.passed,runtime:data.runtime,source};
 await fs.writeFile(path.join(root,'duel-result.json'),JSON.stringify(report,null,2));
 output.appendLine('\n'+data.passed+'/'+(c.topic==='fastapi'?5:8)+' tests passed. '+data.runtime.toFixed(2)+' ms locally.');output.appendLine('Report: duel-result.json');
 if(validBridge(c)){try{await bridgeRequest(c,'/events',{type:'report',report});vscode.window.showInformationMessage('CodeDuel: Results sent to the desktop app. Review and submit there.')}catch{vscode.window.showWarningMessage('CodeDuel desktop is disconnected. Reopen the challenge from the app, or import duel-result.json.')}}else vscode.window.showInformationMessage('CodeDuel: '+data.passed+' tests passed. Use Return result to room when ready.');
 }finally{running=false;if(temp)await fs.rm(temp,{recursive:true,force:true})}
 })));
 context.subscriptions.push(vscode.commands.registerCommand('codeduel.return',wrap(async()=>{
 const {root,c}=await info();if(!await vscode.workspace.saveAll(false))throw Error('Save your solution before returning a result.');const file=path.join(root,'duel-result.json'),report=JSON.parse(await fs.readFile(file,'utf8'));
 const current=await fs.readFile(path.join(root,(c.topic==='fastapi'||c.topic.startsWith('py-'))?'solution.py':'solution.cjs'),'utf8');if(current!==report.source)throw Error('Your code changed after the last test run. Run tests again.');
 if(validBridge(c)){await bridgeRequest(c,'/events',{type:'report',report});vscode.window.showInformationMessage('CodeDuel: Result returned to the desktop app.');return;}
 const encoded=encodeURIComponent(Buffer.from(JSON.stringify(report),'utf8').toString('base64'));
 if(encoded.length>6000){vscode.window.showInformationMessage('Report is too large for a browser link. Import duel-result.json in your room.');await vscode.commands.executeCommand('revealFileInOS',vscode.Uri.file(file));return;}
 await vscode.env.openExternal(vscode.Uri.parse(c.origin+'/#report='+encoded));
 })));
 let polling=false;
 const timer=setInterval(async()=>{if(polling||running||!vscode.workspace.isTrusted)return;polling=true;try{const {c}=await info();if(validBridge(c)){const response=await bridgeRequest(c,'/commands');if(response.command==='run')await vscode.commands.executeCommand('codeduel.run');}}catch{}finally{polling=false}},1500);
 context.subscriptions.push({dispose(){clearInterval(timer)}});
}
module.exports={activate};
