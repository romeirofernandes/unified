const test = require('node:test');
const assert = require('node:assert/strict');
const {createHmac} = require('node:crypto');
const express = require('express');
const {createWebhook} = require('../routes/github-webhook');
const key = 'fixture-webhook-secret';
let server, base, updates=[];
test.before(async () => {
  const app=express();app.post('/webhook',express.raw({type:'application/json'}),createWebhook({secret:()=>key,Run:{updateMany:async (...args)=>updates.push(args)}}));
  server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));base=`http://127.0.0.1:${server.address().port}/webhook`;
});
test.after(async()=>new Promise(resolve=>server.close(resolve)));
async function send(payload,event='pull_request',signature) {
  const body=JSON.stringify(payload);
  return fetch(base,{method:'POST',headers:{'Content-Type':'application/json','x-github-event':event,'x-hub-signature-256':signature||`sha256=${createHmac('sha256',key).update(body).digest('hex')}`},body});
}
test('signed PR events queue only the matching repository, installation and PR',async()=>{
  updates=[];
  const payload={repository:{id:1},installation:{id:2},pull_request:{number:7,merged:true}};
  assert.equal((await send(payload)).status,202);
  assert.equal(updates.length,1);
  const [filter,update]=updates[0];
  assert.equal(filter.repositoryId,1);assert.equal(filter.installationId,2);assert.equal(filter.prNumber,7);
  assert.equal(filter.active,false);assert.ok(update.$set.nextCheckAt instanceof Date);
  assert.equal(update.$set.status,undefined);assert.equal(update.$set.notification,undefined);
});
test('tampered signatures and malformed identities never queue work',async()=>{
  updates=[];
  assert.equal((await send({repository:{id:1}},'pull_request','sha256='+'0'.repeat(64))).status,401);
  assert.equal((await send({repository:{id:1},installation:{id:2}})).status,400);
  assert.equal((await send(null)).status,400);
  assert.equal(updates.length,0);
});
test('check events target the exact commit and replayed deliveries remain safe scheduling reads',async()=>{
  updates=[];const payload={repository:{id:1},installation:{id:2},check_run:{head_sha:'a'.repeat(40)}};
  await send(payload,'check_run');await send(payload,'check_run');
  assert.equal(updates.length,2);assert.equal(updates[0][0].headSha,'a'.repeat(40));
  assert.equal(updates[0][1].$push,undefined);
  assert.equal((await send({},'ping')).status,200);
  assert.equal((await send({},'push')).status,202);
  assert.equal(updates.length,2);
});
