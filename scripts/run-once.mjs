import { getConfig } from '../server/config.mjs';
import { CLEAN_NOTE, PRESETS, taskCompleted } from '../server/domain.mjs';

const [scenario = 'clean', mode = 'protected', browser = 'local', origin] = process.argv.slice(2);
const config = getConfig();
const note = scenario === 'clean' ? CLEAN_NOTE : PRESETS.find(preset => preset.id === scenario)?.text;
if (!note) throw new Error('Unknown scenario. Use clean, misdirection, authority, or direct.');
const base = origin || `http://127.0.0.1:${config.port}`;
const headers = { 'Content-Type': 'application/json', ...(config.runToken ? { Authorization: `Bearer ${config.runToken}` } : {}) };
const readinessResponse = await fetch(`${base}/api/config`);
const readiness = await readinessResponse.json();
if (readiness.model !== config.model) throw new Error(`The server is configured for ${readiness.model}, but this verification expects ${config.model}. No run was started.`);
const response = await fetch(`${base}/api/runs`, { method: 'POST', headers, body: JSON.stringify({ note, mode, browser }) });
const payload = await response.json();
if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
let run = payload.run;
console.log(JSON.stringify({ started: run.id, model: run.model, mode, browser }));
let lastEventId = 0;
while (['queued', 'running'].includes(run.status)) {
  await new Promise(resolve => setTimeout(resolve, 1200));
  const response = await fetch(`${base}/api/runs/${run.id}`, { headers });
  if (!response.ok) throw new Error(`Run polling returned HTTP ${response.status}`);
  run = (await response.json()).run;
  for (const event of run.events.filter(event => event.id > lastEventId && event.type !== 'browser.frame')) console.log(JSON.stringify({ event: event.type, title: event.title, detail: event.detail }));
  lastEventId = run.events.at(-1)?.id || 0;
}
console.log(JSON.stringify({ id: run.id, status: run.status, outcome: run.outcome, taskCompleted: taskCompleted(run), tickets: run.tickets, tokens: run.tokens, error: run.error }));
if (run.status === 'error') process.exitCode = 1;
