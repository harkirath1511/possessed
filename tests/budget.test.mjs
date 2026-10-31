import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { reserveModelBudget } from '../server/budget.mjs';

test('paid model calls reserve durable worst-case cost and stop before the approved allowance', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'possessed-budget-'));
  const original = globalThis.fetch;
  const config = { model: 'test/paid', modelUrl: 'https://openrouter.ai/api/v1', modelKey: 'test-only-key', modelBudgetUsd: 0.001, dataDir: directory };
  let usage = 0;
  try {
    globalThis.fetch = async url => Response.json(url.endsWith('/models') ? { data: [{ id: config.model, pricing: { prompt: '0.0000001', completion: '0.0000001' } }] } : { data: { usage } });
    await reserveModelBudget(config, [{ role: 'user', content: 'A fictional test' }], 20);
    assert.equal((await readdir(directory)).length, 1);
    await assert.rejects(reserveModelBudget(config, [{ role: 'user', content: 'x'.repeat(10000) }], 420), /cannot cover/);
    usage = 0.10;
    await assert.rejects(reserveModelBudget(config, [{ role: 'user', content: 'Test' }], 20), /cannot cover/);
    await assert.rejects(reserveModelBudget({ ...config, modelBudgetUsd: 0 }, [], 20), /disabled/);
  } finally { globalThis.fetch = original; await rm(directory, { recursive: true, force: true }); }
});
