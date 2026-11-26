const fs=require('node:fs'),{performance}=require('node:perf_hooks'),assert=require('node:assert/strict');
const [file,topic,out]=process.argv.slice(2),tasks=require('./tasks.json'),solve=require(file);
let passed=0;const start=performance.now();
for(const [i,t] of tasks[topic].tests.entries()){try{assert.deepStrictEqual(solve(structuredClone(t.input)),t.expected);passed++;console.log('PASS '+(i+1))}catch(e){console.log('FAIL '+(i+1)+': '+String(e.message).slice(0,300))}}
fs.writeFileSync(out,JSON.stringify({passed,runtime:performance.now()-start}));
