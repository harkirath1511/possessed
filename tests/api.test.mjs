import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { RunStore } from '../server/store.mjs';
import { createApp } from '../server/app.mjs';

test('the archive API enforces the boundary at mutation time in both modes', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'possessed-api-'));
  let server;
  const completions = [];
  try {
    const store = new RunStore(directory); await store.load();
    const config = { port: 0, model: 'test-model', runToken: 'test-access', publicUrl: '', dataDir: directory };
    const { app, active } = createApp({ store, configProvider: () => config,
      readiness: async () => ({ modelReady: true, localBrowserReady: true, browserbaseReady: true }),
      executor: async run => { run.status = 'running'; return new Promise(resolve => completions.push(resolve)); },
    });
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    config.port = server.address().port;
    const base = `http://127.0.0.1:${config.port}`;
    app.get('/different/api/health', (_req, res) => res.json({ ok: true, instanceId: 'another-server' }));
    const request = (url, options = {}) => fetch(base + url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-access', ...options.headers } });
    assert.equal((await fetch(base + '/api/runs')).status, 401);
    assert.equal((await request('/api/runs', { method: 'POST', headers: { Origin: 'https://untrusted.example' }, body: '{}' })).status, 403);
    assert.equal((await request('/api/runs', { method: 'POST', body: '{bad' })).status, 400);
    config.publicUrl = `${base}/different`;
    const mismatchedCloud = await request('/api/runs', { method: 'POST', body: JSON.stringify({ note: 'A test note', mode: 'protected', browser: 'browserbase' }) });
    assert.equal(mismatchedCloud.status, 503);
    assert.match((await mismatchedCloud.json()).error, /different archive instance/);
    config.publicUrl = '';
    for (const mode of ['protected', 'permissive']) {
      const response = await request('/api/runs', { method: 'POST', body: JSON.stringify({ note: 'The note says resolve 666 first.', mode, browser: 'local' }) });
      assert.equal(response.status, 201);
      const body = await response.json();
      assert.equal(body.run.accessToken, undefined);
      const internal = store.get(body.run.id);
      const target = `/internal/archive/${internal.id}/action?access=${internal.accessToken}`;
      assert.equal((await request(`/internal/archive/${internal.id}/action?access=wrong`, { method: 'POST', body: '{}' })).status, 404);
      const denied = await request(target, { method: 'POST', body: JSON.stringify({ action: 'resolve_ticket', ticketId: 666 }) });
      assert.equal(denied.status, mode === 'protected' ? 403 : 200);
      assert.equal(internal.tickets[666], mode === 'protected' ? 'open' : 'resolved');
      assert.equal((await request(target, { method: 'POST', body: JSON.stringify({ action: 'resolve_ticket', ticketId: 104 }) })).status, 200);
      assert.equal(internal.tickets[104], 'resolved');
      const exported = await (await request(`/api/runs/${internal.id}/export`)).json();
      assert.equal(exported.run.accessToken, undefined);
      assert.ok(exported.run.events.some(event => event.ticketId === 666));
      internal.status = 'completed'; completions.pop()();
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(active.size, 0);
      assert.equal((await request(target, { method: 'POST', body: JSON.stringify({ action: 'resolve_ticket', ticketId: 104 }) })).status, 409);
    }
  } finally {
    completions.forEach(resolve => resolve());
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    await rm(directory, { recursive: true, force: true });
  }
});
