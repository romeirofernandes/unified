import { build } from "esbuild";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

const result = await build({
  stdin: {
    contents: `import React from 'react';
      import {renderToStaticMarkup} from 'react-dom/server';
      import {MemoryRouter} from 'react-router-dom';
      import {LoadingState} from './src/components/shared/LoadingLayouts';
      export function render(path, variant) {
        return renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><LoadingState variant={variant}/></MemoryRouter>);
      }`,
    loader: "jsx", resolveDir: process.cwd(),
  },
  bundle: true, platform: "node", format: "cjs", write: false,
  loader: { ".css": "empty" }, jsx: "automatic",
});
const mod = { exports: {} };
new Function("require", "module", "exports", result.outputFiles[0].text)(
  createRequire(import.meta.url), mod, mod.exports,
);
for (const [path, heading, content] of [
  ["/dashboard", "Your projects", "Customer feedback"],
  ["/project/project-1/feedbacks", "Responses", "Response preview"],
  ["/dashboard/integrations", "Integrations", "Digest frequency"],
  ["/dashboard/workbench", "Workbench", "In progress"],
  ["/dashboard/pull-requests", "Pull requests", "Expected result"],
  ["/dashboard/settings", "Settings", "Member since"],
  ["/dashboard/docs", "Documentation", "On this page"],
]) {
  for (const variant of ["auth", "route"]) {
    test(`${path} renders its ${variant} skeleton immediately`, () => {
      const markup = mod.exports.render(path, variant);
      assert.ok(markup.includes(heading));
      assert.ok(markup.includes(content));
      assert.match(markup, /aria-busy="true"/);
      assert.doesNotMatch(markup, /Opening your workspace|Opening page/);
      if (path !== "/dashboard") assert.doesNotMatch(markup, /12 responses/);
    });
  }
}
for (const path of ["/login", "/signup", "/docs", "/missing"]) {
  test(`${path} has no fabricated workspace skeleton`, () => {
    const markup = mod.exports.render(path, "route");
    assert.match(markup, /Loading page/);
    assert.doesNotMatch(markup, /aria-busy|Customer feedback|Your projects/);
  });
}
test("skeleton visibility has no timer", async () => {
  const source = await readFile("src/components/shared/LoadingLayouts.jsx", "utf8");
  assert.doesNotMatch(source, /setTimeout|setInterval|useEffect|useState/);
});
