import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createRequire} from 'node:module';
import {createBridge} from '../desktop/bridge.mjs';
const {validBridge}=createRequire(import.meta.url)('../extension/bridge-client.cjs');

// Exercise the actual HTTP handler without requiring host socket permissions.
async function request(bridge,token,method,url,data,headers={}) {
 const req=Readable.from(data===undefined?[]:[Buffer.from(typeof data==='string'?data:JSON.stringify(data))]);
 Object.assign(req,{method,url,headers:{host:'127.0.0.1:0',authorization:'Bearer '+token,...headers}});
 const res={writeHead(status){this.status=status},end(body){this.data=body?JSON.parse(body):null}};
 await bridge.handle(req,res);return res;
}
test('desktop bridge pairs, requests a run once, and delivers a matching report',async()=>{
 const events=[],bridge=createBridge(event=>events.push(event));
 const {token}=bridge.pair('ABCD1234','arrays');
 assert.equal(bridge.status('ABCD1234').connected,false);
 assert.throws(()=>bridge.run('ABCD1234'),/Open this challenge/);
 assert.equal((await request(bridge,token,'GET','/commands')).status,200);
 assert.equal(bridge.status('ABCD1234').connected,true);
 bridge.run('ABCD1234');assert.throws(()=>bridge.run('ABCD1234'),/already queued/);
 assert.equal((await request(bridge,token,'GET','/commands')).data.command,'run');
 assert.equal((await request(bridge,token,'GET','/commands')).data.command,null);
 const report={version:1,room:'ABCD1234',topic:'arrays',passed:8,runtime:1,source:'module.exports = () => null;'};
 assert.equal((await request(bridge,token,'POST','/events',{type:'report',report})).status,200);
 assert.deepEqual(events,[{type:'report',room:'ABCD1234',report}]);
});
test('bridge rejects missing credentials, browser origins, invalid hosts and stale pairings',async()=>{
 const bridge=createBridge(),{token}=bridge.pair('ABCD1234','arrays');
 assert.equal((await request(bridge,'wrong','GET','/commands')).status,401);
 assert.equal((await request(bridge,token,'GET','/commands',undefined,{origin:'https://example.com'})).status,403);
 assert.equal((await request(bridge,token,'GET','/commands',undefined,{host:'example.com:0'})).status,403);
 bridge.pair('ABCD1234','arrays');
 assert.equal((await request(bridge,token,'GET','/commands')).status,401);
});
test('bridge rejects cross-room reports, malformed bodies and excessive payloads',async()=>{
 const events=[],bridge=createBridge(event=>events.push(event)),{token}=bridge.pair('ABCD1234','arrays');
 const report={version:1,room:'FFFFFFFF',topic:'arrays',passed:8,runtime:1,source:'test'};
 assert.equal((await request(bridge,token,'POST','/events',{type:'report',report})).status,400);
 assert.equal((await request(bridge,token,'POST','/events','{')).status,400);
 assert.equal((await request(bridge,token,'POST','/events','x'.repeat(100001))).status,413);
 assert.deepEqual(events,[]);
 assert.equal((await request(bridge,token,'POST','/events',{type:'error',message:'Test timed out'})).status,200);
 assert.equal(events[0].message,'Test timed out');
});
test('extension only accepts a loopback pairing endpoint and a full token',()=>{
 const token='a'.repeat(64);
 assert.equal(validBridge({bridge:'http://127.0.0.1:54321',token}),true);
 for(const bridge of ['https://example.com:54321','http://localhost:54321','http://127.0.0.1:0','http://127.0.0.1:65536','http://127.0.0.1:1234/path'])assert.equal(validBridge({bridge,token}),false);
 assert.equal(validBridge({bridge:'http://127.0.0.1:54321',token:'short'}),false);
});
