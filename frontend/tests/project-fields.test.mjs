import test from "node:test";
import assert from "node:assert/strict";
import {
  createField,
  validateFields,
  serializeFields,
} from "../src/lib/project-fields.js";
import { integrationCode } from "../src/lib/integration-code.js";

test("field drafts have independent identities and nested data", () => {
  const first = createField();
  const second = createField();
  assert.notEqual(first.id, second.id);
  first.options.push({ label: "One" });
  first.config.max = 20;
  assert.deepEqual(second.options, []);
  assert.equal(second.config.max, 100);
});

test("the default email field is required and serializes without editor metadata", () => {
  const email = createField("email");
  assert.equal(validateFields([email]), "");
  assert.deepEqual(serializeFields([email]), [
    { type: "email", label: "Email", required: true },
  ]);
});

test("choice fields cannot be saved empty or with blank options", () => {
  const field = { ...createField("mcq"), label: "Favourite feature" };
  assert.match(validateFields([field]), /option/);
  field.options = [{ id: "one", label: " ", value: "" }];
  assert.match(validateFields([field]), /option/);
  field.options = [{ id: "one", label: " Search ", value: " Search " }];
  assert.equal(validateFields([field]), "");
  assert.deepEqual(serializeFields([field])[0].options, [
    { label: "Search", value: "Search" },
  ]);
});

test("slider configuration rejects invalid ranges and preserves zero bounds", () => {
  const field = { ...createField("slider"), label: "Rating" };
  for (const config of [
    { min: 5, max: 5, step: 1 },
    { min: 6, max: 5, step: 1 },
    { min: 0, max: 5, step: 0 },
    { min: NaN, max: 5, step: 1 },
    { min: 0, max: 5, step: 6 },
  ]) {
    assert.match(validateFields([{ ...field, config }]), /positive step/);
  }
  field.config = { min: -5, max: 0, step: 0.5 };
  assert.equal(validateFields([field]), "");
  assert.deepEqual(serializeFields([field])[0].config, field.config);
});

test("integration snippets keep the project settings and SDK stylesheet", () => {
  const code = integrationCode({
    projectId: "project-1",
    uid: "user-1",
    theme: "dark",
  });
  assert.match(code, /projectId="project-1"/);
  assert.match(code, /firebaseUid="user-1"/);
  assert.match(code, /theme="dark"/);
  assert.match(code, /unified-sdk\/dist\/unified-sdk.css/);
});
