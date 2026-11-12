const test = require('node:test');
const assert = require('node:assert/strict');
const { groqRequest } = require('../services/groq-client');
test('Groq failures expose safe actionable status and request reference, never provider body', async () => {
  const original = global.fetch;
  const key = process.env.GROQ_API_KEY, keys = process.env.GROQ_API_KEYS;
  process.env.GROQ_API_KEY = 'fixture'; delete process.env.GROQ_API_KEYS;
  try {
    for (const status of [400, 401, 413, 429, 503]) {
      global.fetch = async () => new Response('private provider payload', { status, headers: {'x-request-id':'req_fixture'} });
      await assert.rejects(() => groqRequest('chat/completions', {body:'{}'}), error => {
        assert.equal(error.status, 502);
        assert.match(error.message, new RegExp(`HTTP ${status}`));
        assert.match(error.message, /req_fixture/);
        assert.doesNotMatch(error.message, /private provider payload/);
        return true;
      });
    }
  } finally {
    global.fetch = original;
    if (key === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = key;
    if (keys === undefined) delete process.env.GROQ_API_KEYS; else process.env.GROQ_API_KEYS = keys;
  }
});
test('PR model calls request strict structured output while other callers keep JSON mode', async () => {
  const {groqJson} = require('../services/groq-client');
  const original = global.fetch;
  const key = process.env.GROQ_API_KEY, keys = process.env.GROQ_API_KEYS;
  process.env.GROQ_API_KEY = 'fixture'; delete process.env.GROQ_API_KEYS;
  const bodies = [];
  try {
    global.fetch = async (_url, options) => {bodies.push(JSON.parse(options.body));return new Response(JSON.stringify({choices:[{message:{content:'{"paths":["src/CTA.jsx"]}'}}]}));};
    const schema = require('../services/pr-ai-schemas').selection;
    await groqJson({messages:[],schema,maxTokens:600,model:'qwen/qwen3.8-27b'});
    assert.equal(bodies[0].response_format.type,'json_schema');
    assert.equal(bodies[0].reasoning_effort,'none');
    assert.equal(bodies[0].temperature,0);
    assert.equal(bodies[0].response_format.json_schema.strict,true);
    assert.deepEqual(bodies[0].response_format.json_schema.schema,schema);
    await groqJson({messages:[]});
    assert.deepEqual(bodies[1].response_format,{type:'json_object'});
  } finally {
    global.fetch = original;
    if (key === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = key;
    if (keys === undefined) delete process.env.GROQ_API_KEYS; else process.env.GROQ_API_KEYS = keys;
  }
});
test('a provider JSON validation error retries once with a trace and never exposes generated content', async () => {
  const {groqJson} = require('../services/groq-client');
  const original = global.fetch;
  const key = process.env.GROQ_API_KEY, keys = process.env.GROQ_API_KEYS;
  process.env.GROQ_API_KEY = 'fixture'; delete process.env.GROQ_API_KEYS;
  let calls = 0; const trace = [];
  try {
    global.fetch = async () => {calls++;return new Response(JSON.stringify({error:{code:'json_validate_failed',failed_generation:'private source'}}),{status:400});};
    await assert.rejects(() => groqJson({messages:[],schema:require('../services/pr-ai-schemas').review,onRetry:message => trace.push(message)}), error => {
      assert.equal(error.code,'json_validate_failed');
      assert.doesNotMatch(error.message,/private source/);
      return true;
    });
    assert.equal(calls,2); assert.equal(trace.length,1);
  } finally {
    global.fetch = original;
    if (key === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = key;
    if (keys === undefined) delete process.env.GROQ_API_KEYS; else process.env.GROQ_API_KEYS = keys;
  }
});
test('truncated or schema-invalid successful responses recover within a bounded output budget', async () => {
  const { groqJson } = require('../services/groq-client');
  const original = global.fetch;
  const key = process.env.GROQ_API_KEY, keys = process.env.GROQ_API_KEYS;
  process.env.GROQ_API_KEY = 'fixture'; delete process.env.GROQ_API_KEYS;
  const schema = require('../services/pr-ai-schemas').review;
  try {
    for (const first of [{finish_reason:'length',message:{content:'{"approved":'}}, {finish_reason:'stop',message:{content:'{"approved":"yes","reason":"wrong type"}'}}]) {
      const bodies = [];
      global.fetch = async (_url, options) => {
        bodies.push(JSON.parse(options.body));
        return new Response(JSON.stringify({ choices: [bodies.length === 1 ? first : {finish_reason:'stop',message:{content:'{"approved":true,"reason":"Scoped fix"}'}}] }));
      };
      assert.equal((await groqJson({messages:[],schema,maxTokens:2000})).approved,true);
      assert.equal(bodies.length,2);assert.equal(bodies[1].max_completion_tokens,4000);
      assert.match(bodies[1].messages.at(-1).content,/matching the required schema/);
    }
  } finally {
    global.fetch = original;
    if (key === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = key;
    if (keys === undefined) delete process.env.GROQ_API_KEYS; else process.env.GROQ_API_KEYS = keys;
  }
});
