import test from "node:test";
import assert from "node:assert/strict";
import { activeDocSection } from "../src/lib/active-doc-section.js";
test("digest instructions stay highlighted until the next heading reaches the reading line", () => {
  const sections = [{ id: "custom-form", top: -700 }, { id: "notifications", top: 110 }, { id: "listen", top: 440 }];
  assert.equal(activeDocSection(sections, 100, 600), "notifications");
  assert.equal(activeDocSection(sections.map((section) => ({ ...section, top: section.top - 240 })), 100, 600), "listen");
});
test("tracking uses the article viewport rather than the document scroll position", () => {
  assert.equal(activeDocSection([{ id: "one", top: -100 }, { id: "two", top: 290 }], 200, 500), "two");
  assert.equal(activeDocSection([{ id: "one", top: 210 }, { id: "two", top: 500 }], 200, 500), "one");
});
