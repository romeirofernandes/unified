const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const Project = require('../models/Project');
const Feedback = require('../models/Feedback');
let mongo, server, base;
const userId = new mongoose.Types.ObjectId();
const realFetch = global.fetch;
let reply;
test.before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
  const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.user = { id: userId }; next(); });
  app.use('/feedback', require('../routes/feedback'));
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { global.fetch = realFetch; await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); await mongo.stop(); });
test('analysis atomically reuses completed issues and tags only responses with verified original evidence', async () => {
  const originalKeys = process.env.GROQ_API_KEYS;
  process.env.GROQ_API_KEYS = 'fixture';
  global.fetch = async (url, options) => {
    assert.match(String(url), /^https:\/\/api.groq.com/);
    const body = JSON.parse(options.body);
    assert.equal(body.response_format.json_schema.strict, true);
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(reply) } }] }) };
  };
  try {
    const project = await Project.create({ userId, name: 'Analysis', fields: [{ type: 'textarea', label: 'Problem' }], workbenchIssues: [{ title: 'Search freezes', status: 'done', sourceKey: 'legacy-key', description: 'Human-written plan' }] });
    const issueId = String(project.workbenchIssues[0]._id), field = String(project.fields[0]._id);
    const [search, unrelated] = await Feedback.create([{ projectId: project._id, formAnswers: { [field]: 'Search freezes when I type.' } }, { projectId: project._id, formAnswers: { [field]: 'I like the new layout.' } }]);
    reply = { tldr: 'Search has a reported fault.', features: ['Repair the search field'], evidence: [{ title: 'Repair the search field', issueId, support: [{ responseId: String(search._id), quote: 'Search freezes when I type.' }, { responseId: String(unrelated._id), quote: 'Search freezes when I type.' }] }] };
    const generate = () => realFetch(`${base}/feedback/project/${project._id}/summary`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const first = await generate(); assert.equal(first.status, 200);
    const saved = await Project.findById(project._id).select('+workbenchIssues').lean();
    assert.equal(saved.workbenchIssues.length, 1); assert.equal(saved.workbenchIssues[0].status, 'done'); assert.equal(saved.workbenchIssues[0].description, 'Human-written plan');
    assert.deepEqual((await Feedback.findById(search._id)).issueIds.map(String), [issueId]);
    assert.deepEqual((await Feedback.findById(unrelated._id)).issueIds, []);
    const next = await Feedback.create({ projectId: project._id, formAnswers: { [field]: 'The search still freezes.' } });
    reply.features = ['Fix frozen search']; reply.evidence[0].title = 'Fix frozen search'; reply.evidence[0].support.push({ responseId: String(next._id), quote: 'The search still freezes.' });
    assert.equal((await generate()).status, 200);
    assert.equal((await Project.findById(project._id).select('+workbenchIssues')).workbenchIssues.length, 1);
    const responses = await (await realFetch(`${base}/feedback/project/${project._id}`)).json();
    const tagged = responses.find(response => response._id === String(next._id));
    assert.equal(tagged.formAnswers[field], 'The search still freezes.');
    assert.equal(tagged.issues[0]._id, issueId); assert.equal(tagged.issues[0].status, 'done');
  } finally { if (originalKeys === undefined) delete process.env.GROQ_API_KEYS; else process.env.GROQ_API_KEYS = originalKeys; global.fetch = realFetch; }
});
