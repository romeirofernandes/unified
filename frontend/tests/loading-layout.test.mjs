import { build } from 'esbuild';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import test from 'node:test';
const result = await build({stdin:{contents:`import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {MemoryRouter} from 'react-router-dom'; import {LoadingState} from './src/components/shared/LoadingLayouts'; export const markup = renderToStaticMarkup(<MemoryRouter initialEntries={['/dashboard']}><LoadingState variant="auth"/></MemoryRouter>);`,loader:'jsx',resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',write:false,loader:{'.css':'empty'},jsx:'automatic'});
const mod={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(createRequire(process.cwd()+'/package.json'),mod,mod.exports);
test('auth loading renders the Projects header and cards instead of a text fallback', () => {
  assert.match(mod.exports.markup, /Your projects/);
  assert.match(mod.exports.markup, /Customer feedback/);
  assert.match(mod.exports.markup, /Create project/);
  assert.doesNotMatch(mod.exports.markup, /Opening your workspace/);
});
