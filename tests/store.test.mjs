import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { RunStore } from '../server/store.mjs';
import { newRun } from '../server/domain.mjs';

test('evidence survives restart and unfinished work is not presented as complete', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'possessed-store-'));
  try {
    const store = new RunStore(directory); await store.load();
    const run = newRun({ note: 'A test note', mode: 'protected', browser: 'local' }, 'gemma');
    await store.add(run); run.status = 'running';
    await Promise.all([store.emit(run, 'tool.read', 'Read note'), store.emit(run, 'tool.blocked', 'Denied', 'Not authorized')]);
    const restarted = new RunStore(directory); await restarted.load();
    const loaded = restarted.get(run.id);
    assert.equal(loaded.events.length, 2);
    assert.equal(loaded.status, 'error');
    assert.match(loaded.error, /server stopped/);
    assert.equal(restarted.list()[0].accessToken, undefined);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
