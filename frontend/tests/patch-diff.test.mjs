import test from 'node:test';
import assert from 'node:assert/strict';
import {patchRows} from '../src/lib/patch-diff.js';
import {stageEvents} from '../src/lib/fix-pipeline.js';
test('replacement diff preserves source text and marks common lines and changed words',()=>{
  const before='start\nconst text = "Save";\nend',after='start\nconst text = "Save changes";\nend';
  const rows=patchRows(before,after);
  assert.deepEqual(rows.map(row=>row.type),['ctx','del','add','ctx']);
  assert.equal(rows.filter(row=>row.type!=='add').map(row=>row.pieces.map(piece=>piece.text).join('')).join('\n'),before);
  assert.equal(rows.filter(row=>row.type!=='del').map(row=>row.pieces.map(piece=>piece.text).join('')).join('\n'),after);
  assert.equal(rows[2].pieces.find(piece=>piece.change)?.text,' changes');
  assert.equal(patchRows('delete','')[0].type,'del');assert.equal(patchRows('','add')[0].type,'add');
});
test('each step gets only its own operational trace, including legacy failures and notifications',()=>{
  const run={failedStage:'patch',events:[{status:'assessing',message:'scope'},{status:'generating',message:'patch'},{status:'failed',message:'error'},{status:'shipped',stage:'notify',message:'email'}]};
  assert.deepEqual(stageEvents(run,'scope').map(event=>event.message),['scope']);
  assert.deepEqual(stageEvents(run,'patch').map(event=>event.message),['patch','error']);
  assert.deepEqual(stageEvents(run,'notify').map(event=>event.message),['email']);
  assert.equal(stageEvents(run,'pr').length,0);
});
