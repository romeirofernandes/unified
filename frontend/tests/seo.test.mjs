import test from 'node:test';
import assert from 'node:assert/strict';
import { pageMetadata, siteUrl } from '../src/lib/seo.js';

test('public pages have distinct metadata and normalized canonicals', () => {
  assert.notEqual(pageMetadata('/').title, pageMetadata('/docs').title);
  assert.equal(pageMetadata('/docs/').url, `${siteUrl}/docs`);
  assert.match(pageMetadata('/docs').robots, /^index,/);
});

test('workspace, authentication and unknown routes are excluded from indexing', () => {
  for (const path of ['/dashboard', '/dashboard/docs', '/project/123/feedbacks', '/login', '/signup', '/missing']) {
    assert.match(pageMetadata(path).robots, /^noindex,/);
  }
});
