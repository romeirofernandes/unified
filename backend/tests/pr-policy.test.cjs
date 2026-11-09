const test = require("node:test");
const assert = require("node:assert/strict");
const { safePath, writablePath, applyPatch, validateAssessment, repositoryName, sensitive } = require("../services/pr-policy");
test("source policy excludes secrets, sensitive systems, generated code and path escapes", () => {
  for (const path of ["../src/Button.tsx", "src/../Button.tsx", "src\\Button.tsx", ".env", ".github/workflows/test.yml", "backend/form.jsx", "src/auth/Button.tsx", "src/Payment.tsx", "dist/widget.js", "src/config.ts", "src/api/route.ts"]) assert.equal(safePath(path), false, path);
  for (const path of ["frontend/src/components/Button.tsx", "src/pages/Feedbacks.jsx", "README.md", "src/Button.test.tsx"]) assert.equal(safePath(path), true, path);
  for (const path of ["src/Button.test.tsx", "src/__tests__/Button.tsx", "src/helper.ts", "app/page.tsx"]) assert.equal(writablePath(path), false, path);
  assert.equal(writablePath("src/components/Button.tsx"), true);
});
test("patches require unique exact source and stay inside the saved bounded context", () => {
  const files = [{ path: "src/Button.tsx", sha: "abc", content: '<button>Save</button>\n' }];
  assert.equal(applyPatch(files, [{ path: files[0].path, before: "Save", after: "Save changes" }])[0].content, '<button>Save changes</button>\n');
  for (const edits of [[], [{ path: "README.md", before: "Save", after: "Next" }], [{ path: files[0].path, before: "save", after: "Next" }], [{ path: files[0].path, before: "", after: "Next" }], [{ path: files[0].path, before: files[0].content, after: "" }], [{ path: files[0].path, before: "Save", after: "Next\n".repeat(121) }]]) assert.throws(() => applyPatch(files, edits));
  assert.throws(() => applyPatch([{ ...files[0], content: "Save Save" }], [{ path: files[0].path, before: "Save", after: "Next" }]));
});
test("the model cannot approve unsupported scope or incomplete assessments", () => {
  const value = { suitable: true, category: "ui_copy", reason: "The label is in this file.", plan: ["Correct the label."] };
  assert.equal(validateAssessment(value, [{ path: "src/Button.tsx" }]).suitable, true);
  assert.throws(() => validateAssessment({ ...value, category: "database" }, [{ path: "src/Button.tsx" }]));
  assert.throws(() => validateAssessment({ ...value, plan: [] }, [{ path: "src/Button.tsx" }]));
  assert.throws(() => validateAssessment(value, [{ path: "src/Button.test.tsx" }]));
  assert.throws(() => repositoryName("https://github.com/owner/repo"));
  assert.equal(repositoryName("owner/repo"), "owner/repo");
  assert.equal(sensitive("ghp_" + "x".repeat(30)), true);
});
