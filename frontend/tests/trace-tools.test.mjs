import test from 'node:test';
import assert from 'node:assert/strict';
import {traceTools} from '../src/lib/trace-tools.js';
test('tool starts and results become one expandable operation with a real duration',()=>{
  const events=[{operation:'read-1',tool:'read',label:'Read source',target:'src/CTA.jsx',state:'running',message:'Reading source'},{operation:'read-1',tool:'read',state:'complete',message:'Read 2088 bytes',durationMs:120}];
  const rows=traceTools(events,'complete');
  assert.equal(rows.length,1);assert.equal(rows[0].state,'complete');assert.equal(rows[0].durationMs,120);
  assert.deepEqual(rows[0].messages,['Reading source','Read 2088 bytes']);
  assert.equal(rows[0].target,'src/CTA.jsx');
});
test('running work stays live, while a stopped worker cannot leave a historical spinner',()=>{
  const events=[{operation:'ai',tool:'ai',state:'running',message:'AI request started'}];
  assert.equal(traceTools(events,'active')[0].state,'running');
  assert.equal(traceTools(events,'failed')[0].state,'failed');
  assert.equal(traceTools(events,'complete')[0].state,'complete');
  assert.equal(traceTools(events,'stopped')[0].state,'stopped');
});
test('legacy AI event pairs are grouped without inventing a tool result',()=>{
  const rows=traceTools([{message:'AI request started · model · 123 input characters',status:'assessing'},{message:'AI response received in 0.3s.',status:'assessing'}],'complete');
  assert.equal(rows.length,1);assert.equal(rows[0].state,'complete');assert.equal(rows[0].messages.length,2);
});
