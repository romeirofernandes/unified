const test = require('node:test');
const assert = require('node:assert/strict');
const {selectContext} = require('../services/pr-context');
const sha = 'a'.repeat(40);
const run = {baseBranch:'main',issue:{title:'Remove line from CTA'},acceptance:'Remove the setup guide link from the CTA.'};
const api = async path => path.startsWith('/commits/') ? {sha,commit:{tree:{sha}}} : {tree:[{type:'blob',mode:'100644',path:'src/CTA.jsx',size:15000,sha}]};
test('context budget rejects oversized selections before fetching source', async () => {
  const trace = [];
  await assert.rejects(() => selectContext(run,api,async input => {
    assert.match(input.messages[1].content,/14000 bytes/);
    assert.equal(input.maxTokens,600);
    return {paths:['src/CTA.jsx']};
  },{},async message => trace.push(message)), /14 KB AI context budget/);
  assert.ok(trace.some(message => message.includes('ranked paths')));
});
test('invalid model file selections cannot escape the source shortlist', async () => {
  await assert.rejects(() => selectContext(run,api,async () => ({paths:['.env']})), /outside the supported source shortlist/);
});
