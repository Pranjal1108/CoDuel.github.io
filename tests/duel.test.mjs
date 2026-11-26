import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import worker from '../dist/server/index.js';
import {compare} from '../src/content.js';
function fixture(){
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('drizzle/0000_duel.sql','utf8'));
const DB={prepare(sql){let a=[];return{bind(...x){a=x;return this},async first(){return db.prepare(sql).get(...a)||null},async run(){return{meta:{changes:Number(db.prepare(sql).run(...a).changes)}}}}}};
async function call(id,b,code){const r=await worker.fetch(new Request('https://test.local/api/duel'+(code?'?code='+code:''),{method:b?'POST':'GET',headers:{origin:'https://test.local',...(id?{'oai-authenticated-user-id':id}:{})},...(b?{body:JSON.stringify(b)}:{})}),{DB});return{status:r.status,data:await r.json()}}
return {db,call};
}
test('room lifecycle, authorization, timing and immutable submissions',async()=>{
const {db,call}=fixture();
assert.equal((await call(null,{action:'create'})).status,401);
for(const id of ['host','guest','third'])await call(id,{action:'profile',name:id,skills:['arrays']});
const {data:{code}}=await call('host',{action:'create',mode:'normal',topic:'arrays',study:1,duration:10});
assert.ok(code);
assert.equal((await call('third',null,code)).status,403);
assert.equal((await call('host',{action:'start',code})).status,400);
assert.equal((await call('guest',{action:'join',code})).status,200);
assert.equal((await call('third',{action:'join',code})).status,409);
assert.equal((await call('guest',{action:'start',code})).status,400);
assert.equal((await call('host',{action:'start',code})).status,200);
const report={action:'submit',code,passed:8,timeRank:2,spaceRank:2,source:'test',runtime:1};
assert.equal((await call('host',report)).status,400);
db.prepare('UPDATE rooms SET starts=? WHERE code=?').run(Date.now()-5000,code);
assert.equal((await call('host',{...report,passed:99})).status,400);
assert.equal((await call('host',report)).status,200);
assert.equal((await call('host',report)).status,409);
assert.equal((await call('guest',null,code)).data.hostResult.source,undefined);
assert.equal((await call('guest',report)).status,200);
const result=(await call('host',null,code)).data;
assert.equal(result.done,true);assert.equal(result.guestResult.source,'test');assert.ok(result.hostResult.elapsed>=5000);
});
test('scoring prioritizes correctness, time complexity, space and elapsed time',()=>{
const a={passed:8,timeRank:2,spaceRank:2,elapsed:5000};
assert.equal(compare(a,{...a,passed:7,timeRank:0}),'host');
assert.equal(compare(a,{...a,timeRank:1}),'guest');
assert.equal(compare(a,{...a,spaceRank:1}),'guest');
assert.equal(compare(a,{...a,elapsed:6000}),'host');assert.equal(compare(a,a),'draw');
});
test('all served artifacts exist',async()=>{for(const p of ['/','/app.js','/content.js','/code-duel-0.1.0.vsix']){const r=await worker.fetch(new Request('https://test.local'+p),{});assert.equal(r.status,200);assert.ok((await r.arrayBuffer()).byteLength>100)}});
