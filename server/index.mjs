import { getConfig } from './config.mjs';
import { RunStore } from './store.mjs';
import { createApp } from './app.mjs';
import { configureTelemetry } from './telemetry.mjs';
import path from 'node:path';
import express from 'express';

const config = getConfig();
configureTelemetry(config.sentryDsn);
const store = new RunStore(config.dataDir);
await store.load();
const { app, active } = createApp({ store });
const production = process.argv.includes('--production');
let vite;
if (production) {
  app.use(express.static(path.resolve('dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(path.resolve('dist/index.html')));
} else {
  const { createServer } = await import('vite');
  vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
const host = process.env.HOST || (process.env.RENDER ? '0.0.0.0' : '127.0.0.1');
const server = app.listen(config.port, host, () => console.log(`POSSESSED is listening at http://127.0.0.1:${config.port}`));
async function shutdown() {
  for (const controller of active.values()) controller.abort();
  await vite?.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
