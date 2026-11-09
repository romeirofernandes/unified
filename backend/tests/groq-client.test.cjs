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
