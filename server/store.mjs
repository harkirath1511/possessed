import { EventEmitter } from 'node:events';
import { mkdir, readFile, readdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { publicRun } from './domain.mjs';

export class RunStore {
  runs = new Map();
  events = new EventEmitter();
  writes = new Map();
  constructor(directory) { this.directory = directory; this.events.setMaxListeners(100); }
  async load() {
    await mkdir(this.directory, { recursive: true });
    const files = (await readdir(this.directory)).filter(file => /^[a-f0-9-]{36}\.json$/.test(file));
    for (const file of files.slice(-200)) {
      try {
        const run = JSON.parse(await readFile(path.join(this.directory, file), 'utf8'));
        if (!run.id || !run.accessToken) continue;
        if (['queued', 'running'].includes(run.status)) {
          run.status = 'error'; run.error = 'The server stopped before this run finished. Start a new run to retry.';
          run.completedAt = new Date().toISOString();
        }
        this.runs.set(run.id, run);
      } catch {}
    }
  }
  get(id) { return this.runs.get(id); }
  async add(run) { this.runs.set(run.id, run); await this.save(run); return run; }
  async save(run) {
    const previous = this.writes.get(run.id) || Promise.resolve();
    const content = JSON.stringify(run, null, 2);
    const pending = previous.catch(() => {}).then(async () => {
      const target = path.join(this.directory, `${run.id}.json`);
      await writeFile(`${target}.tmp`, content, { mode: 0o600 });
      // Windows sync/indexing services can briefly hold the previous record.
      // Preserve atomic replacement; retry only transient sharing failures.
      for (let attempt = 0; ; attempt++) {
        try { await rename(`${target}.tmp`, target); break; }
        catch (error) {
          if (!['EPERM', 'EBUSY', 'EACCES'].includes(error.code) || attempt >= 6) throw error;
          await new Promise(resolve => setTimeout(resolve, 40 * 2 ** attempt));
        }
      }
    });
    this.writes.set(run.id, pending);
    await pending;
  }
  async emit(run, type, title, detail = '', extra = {}) {
    const event = { id: run.events.length + 1, type, title, detail, at: new Date().toISOString(), ...extra };
    run.events.push(event);
    await this.save(run);
    this.events.emit(run.id, { event, run: publicRun(run) });
    return event;
  }
  list() {
    return [...this.runs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 60).map(publicRun);
  }
}
