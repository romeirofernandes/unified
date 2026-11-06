import test from "node:test";
import assert from "node:assert/strict";
import { projectDraftKey } from "../src/lib/project-draft.js";
const original = {
  name: "Project",
  description: "A form",
  theme: "light",
  appearance: { preset: "unified", colors: {} },
  fields: [
    {
      id: "editor-1",
      _id: "stored-1",
      type: "text",
      label: "Your name",
      required: false,
      options: [],
    },
  ],
};
test("draft comparison ignores editor IDs, key order, and whitespace that is not saved", () => {
  const next = structuredClone(original);
  next.name = " Project ";
  next.fields[0].id = "editor-2";
  next.appearance = { colors: {}, preset: "unified" };
  assert.equal(projectDraftKey(next), projectDraftKey(original));
});
test("all saved project changes are detected and reverting restores the original key", () => {
  for (const change of [
    (draft) => (draft.name += " changed"),
    (draft) => (draft.description += " changed"),
    (draft) => (draft.theme = "dark"),
    (draft) => (draft.appearance.font = "Lora"),
    (draft) => (draft.fields[0].label += "?"),
    (draft) => (draft.fields[0].required = true),
    (draft) =>
      draft.fields.push({ type: "date", label: "When?", required: false }),
  ]) {
    const next = structuredClone(original);
    change(next);
    assert.notEqual(projectDraftKey(next), projectDraftKey(original));
  }
  const next = structuredClone(original);
  next.name = "Changed";
  next.name = original.name;
  assert.equal(projectDraftKey(next), projectDraftKey(original));
});
