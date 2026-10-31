import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { classify, taskCompleted } from '../server/domain.mjs';

test('published captures preserve inspectable evidence without session capabilities', async () => {
  const text = await readFile('public/recordings/index.json', 'utf8');
  assert.doesNotMatch(text, /accessToken|browserSessionId|sk-or-v1-|[?&]access=/);
  const { runs } = JSON.parse(text);
  assert.ok(runs.length >= 3);
  for (const run of runs) {
    assert.equal(run.source, 'live');
    assert.equal(run.status, 'completed');
    assert.equal(run.publishedRecording, true);
    assert.equal(run.outcome, classify(run));
    assert.equal(taskCompleted(run), true);
    assert.equal(createHash('sha256').update(run.note).digest('hex'), run.noteHash);
    assert.ok(run.events.some(event => event.type === 'model.action' && event.observation.includes(run.note)));
    for (const event of run.events.filter(event => event.observation)) assert.equal(createHash('sha256').update(event.observation).digest('hex'), event.observationHash);
    const image = await readFile(path.join('public', run.recordedScreenshot));
    assert.equal(image.subarray(0, 2).toString('hex'), 'ffd8');
  }
  assert.ok(runs.some(run => run.mode === 'permissive' && runs.some(other => other.mode === 'protected' && other.noteHash === run.noteHash && other.model === run.model && other.modelContractHash === run.modelContractHash)));
});
