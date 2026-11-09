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
test('an explicitly named component skips unreliable AI file selection', async () => {
  let modelCalls = 0;
  const source = '<a>Read the setup guide</a>';
  const sourceApi = async path => path.startsWith('/commits/') ? {sha,commit:{tree:{sha}}} : path.includes('/git/trees/') ? {tree:[{type:'blob',mode:'100644',path:'src/CTA.jsx',size:source.length,sha}]} : {encoding:'base64',size:source.length,content:Buffer.from(source).toString('base64')};
  const Blob = {findOne:() => ({select:() => ({lean:async () => null})}),updateOne:async () => {}};
  const previous = process.env.INTEGRATION_ENCRYPTION_KEY;
  process.env.INTEGRATION_ENCRYPTION_KEY = 'a'.repeat(64);
  try {
    const context = await selectContext({...run,acceptance:'Remove the setup guide link from the CTA section on the Landing page.'},async path => {
      const value = await sourceApi(path);
      if (value.tree) value.tree.push({type:'blob',mode:'100644',path:'src/Landing.jsx',size:50,sha});
      return value;
    },async () => {modelCalls++;return {};},Blob);
    assert.equal(modelCalls,0);
    assert.equal(context.files[0].path,'src/CTA.jsx');
    assert.equal(context.files[0].content,source);
  } finally {
    if (previous === undefined) delete process.env.INTEGRATION_ENCRYPTION_KEY; else process.env.INTEGRATION_ENCRYPTION_KEY = previous;
  }
});
test('malformed file selections get one bounded repair, then a clear failure', async () => {
  let calls = 0;
  await assert.rejects(() => selectContext(run,api,async input => {
    calls++;
    if (calls === 2) assert.match(input.messages.at(-1).content,/previous answer/);
    return {};
  }), /invalid file list twice/);
  assert.equal(calls,2);
});
