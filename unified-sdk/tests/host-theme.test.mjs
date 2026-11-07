import test from "node:test";
import assert from "node:assert/strict";
import { readHostTheme } from "../src/hooks/use-host-theme.js";
const element = (parentElement, attributes = {}, classes = [], scheme = "normal") => ({ parentElement, getAttribute: key => attributes[key] || null, classList: { contains: key => classes.includes(key) }, scheme });
test("host theme honors the nearest explicit theme before inherited color-scheme", (t) => {
  const original = globalThis.getComputedStyle;
  globalThis.getComputedStyle = node => ({ colorScheme: node.scheme });
  t.after(() => { globalThis.getComputedStyle = original; });
  const html = element(null, {}, ["dark"]);
  const body = element(html, {}, [], "light");
  assert.equal(readHostTheme(element(body)), "dark");
  const nested = element(body, { "data-theme": "light" });
  assert.equal(readHostTheme(element(nested), true), "light");
});
test("color-scheme and OS preferences work without framework theme markers", (t) => {
  const original = globalThis.getComputedStyle;
  globalThis.getComputedStyle = node => ({ colorScheme: node.scheme });
  t.after(() => { globalThis.getComputedStyle = original; });
  assert.equal(readHostTheme(element(element(null, {}, [], "dark"))), "dark");
  assert.equal(readHostTheme(element(element(null)), true), "dark");
  assert.equal(readHostTheme(element(element(null)), false), "light");
});
