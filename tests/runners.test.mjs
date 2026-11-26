import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
for (const [topic, source] of Object.entries({arrays:'module.exports = values => {const seen=new Set();for(const n of values){if(seen.has(n))return n;seen.add(n)}return null}',strings:'module.exports = ([a,b]) => [...a].sort().join(\"\") === [...b].sort().join(\"\")'})) {
 test(`${topic} runner reports correct and incorrect solutions`,()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'codeduel-test-'));
  try {
   const solution=path.join(root,'solution.cjs'), out=path.join(root,'result.json');
   for(const [code,expected] of [[source,8],['module.exports = () => undefined',0]]) {
    fs.writeFileSync(solution,code);
    const run=spawnSync(process.execPath,[path.resolve('extension/runner.cjs'),solution,topic,out],{encoding:'utf8',timeout:5000});
    assert.equal(run.status,0,run.stderr);
    const result=JSON.parse(fs.readFileSync(out,'utf8'));
    assert.equal(result.passed,expected);
    assert.ok(Number.isFinite(result.runtime)&&result.runtime>=0);
   }
  } finally {fs.rmSync(root,{recursive:true,force:true})}
 });
}
