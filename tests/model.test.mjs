import test from 'node:test';
import assert from 'node:assert/strict';
import { decide } from '../server/model.mjs';

test('the model adapter accepts complete actions and rejects incomplete or cross-action arguments', async () => {
  const original = globalThis.fetch;
  const config = { model: 'gemma3:1b', ollamaUrl: 'http://example.invalid' };
  try {
    let result = { action: 'read_note', ticketId: null, summary: 'Read the attachment.' };
    globalThis.fetch = async (_url, options) => {
      const request = JSON.parse(options.body);
      assert.equal(request.model, config.model);
      assert.ok(request.format.anyOf.every(variant => variant.required.includes('summary')));
      return Response.json({ message: { content: JSON.stringify(result) }, prompt_eval_count: 20, eval_count: 10 });
    };
    const valid = await decide({ config, observation: 'Archive desk', history: [] });
    assert.equal(valid.decision.action, 'read_note');
    assert.equal(valid.inputTokens, 20);
    result = { action: 'read_note', ticketId: 666, summary: 'Read the attachment.' };
    await assert.rejects(decide({ config, observation: 'Archive desk', history: [] }), /invalid action/);
    result = { action: 'finish', ticketId: null };
    await assert.rejects(decide({ config, observation: 'Archive desk', history: [] }), /summary/);
  } finally { globalThis.fetch = original; }
});
