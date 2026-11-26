import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../extension/extension.cjs',import.meta.url));
test('extension runs the real runner, delivers results, and rejects changed or unsaved code',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'codeduel-extension-'));
 try{
  await fs.writeFile(path.join(root,'.codeduel.json'),JSON.stringify({room:'ABCD1234',topic:'arrays',origin:'http://127.0.0.1:4317',bridge:'http://127.0.0.1:12345',token:'a'.repeat(64)}));
  const source='module.exports = values => {const s=new Set();for(const n of values){if(s.has(n))return n;s.add(n)}return null}';
  await fs.writeFile(path.join(root,'solution.cjs'),source);
  const commands=new Map(),events=[],errors=[];let save=true;
  const vscode={
   workspace:{isTrusted:true,workspaceFolders:[{uri:{fsPath:root}}],saveAll:async()=>save,getConfiguration:()=>({get:()=>process.execPath})},
   window:{createOutputChannel:()=>({append(){},appendLine(){},clear(){},show(){},dispose(){}}),registerUriHandler:()=>({dispose(){}}),showErrorMessage:m=>errors.push(m),showInformationMessage(){},showWarningMessage:m=>errors.push(m)},
   commands:{registerCommand:(id,fn)=>{commands.set(id,fn);return {dispose(){}}},executeCommand:async id=>commands.get(id)?.()}
  };
  const sandbox={require:name=>name==='vscode'?vscode:name==='./bridge-client.cjs'?{validBridge:()=>true,bridgeRequest:async(_c,_route,event)=>{events.push(event);return {}}}:require(name),module:{exports:{}},process,Buffer,URLSearchParams,setTimeout,clearTimeout,setInterval:()=>0,clearInterval(){}};
  vm.runInNewContext(await fs.readFile(new URL('../extension/extension.cjs',import.meta.url),'utf8'),sandbox);
  sandbox.module.exports.activate({subscriptions:[],extensionPath:path.resolve('extension')});
  await commands.get('codeduel.run')();
  assert.deepEqual(errors,[]);
  assert.equal(events[0].type,'report');assert.equal(events[0].report.passed,8);assert.equal(events[0].report.source,source);
  assert.equal(JSON.parse(await fs.readFile(path.join(root,'duel-result.json'),'utf8')).passed,8);
  await fs.writeFile(path.join(root,'solution.cjs'),source+'\n// changed');
  await commands.get('codeduel.return')();
  assert.match(errors.at(-1),/code changed/);
  save=false;await commands.get('codeduel.run')();
  assert.match(errors.at(-1),/Save your solution/);
  assert.equal(events.filter(e=>e.type==='report').length,1);
 }finally{await fs.rm(root,{recursive:true,force:true})}
});
