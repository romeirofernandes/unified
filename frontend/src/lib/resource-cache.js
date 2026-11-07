import { apiRequest } from "./api.js";

const cache = new Map();
const pending = new Map();
const versions = new Map();
const lifetime = 30000;
const keyFor = (path, uid) => `${uid}:${path}`;
export function readResource(path, uid) { return uid ? cache.get(keyFor(path, uid)) : undefined; }
export function cacheResource(path, uid, data) {
  if (!uid) return;
  const key = keyFor(path, uid);
  versions.set(key, (versions.get(key) || 0) + 1);
  cache.set(key, { data, timestamp: Date.now() });
  // List responses already contain complete project documents.
  if (path === "/projects" && Array.isArray(data)) for (const project of data) cacheResource(`/projects/${project._id}`, uid, project);
}
export function forgetResource(path, uid) { const key = keyFor(path, uid); cache.delete(key); versions.set(key, (versions.get(key) || 0) + 1); }
export function prefetchResource(path, uid, force = false) {
  if (!uid) return Promise.resolve(null);
  const key = keyFor(path, uid);
  const saved = cache.get(key);
  if (!force && saved && Date.now() - saved.timestamp < lifetime) return Promise.resolve(saved.data);
  if (pending.has(key)) return pending.get(key);
  const version = versions.get(key) || 0;
  const request = apiRequest(path, { uid }).then((data) => {
    if ((versions.get(key) || 0) !== version) return cache.get(key)?.data ?? data;
    cacheResource(path, uid, data);
    return data;
  }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}
