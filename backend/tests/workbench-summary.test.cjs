const test = require('node:test');
const assert = require('node:assert/strict');
const { reconcileIssues } = require('../services/workbench-summary');
const id = 'a'.repeat(24), response = 'b'.repeat(24);
test('rephrased issues keep their IDs, human edits, completed status and verified evidence', () => {
  const summary = { evidence: [{ title: 'Repair the search input', issueId: id, responseIds: [response, response] }] };
  const issues = reconcileIssues([{ _id: id, title: 'Search freezes', status: 'done', description: 'Keep this plan', position: 42, responseIds: ['c'.repeat(24)] }], summary);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].title, 'Search freezes');
  assert.equal(issues[0].status, 'done');
  assert.equal(issues[0].description, 'Keep this plan');
  assert.deepEqual(issues[0].responseIds, [response]);
});
test('deleted issues stay deleted and unsupported suggestions cannot create cards', () => {
  const issues = reconcileIssues([{ _id: id, title: 'Fix search', deleted: true }], { evidence: [{ title: 'Search needs repair', issueId: id, responseIds: [response] }, { title: 'Invented issue', issueId: null, responseIds: [] }] });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].deleted, true);
});
