import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'dotenv';

export function getConfig() {
  let file = {};
  try { file = parse(readFileSync(path.resolve('.env'))); } catch {}
  const env = { ...file, ...process.env };
  const candidates = [env.BROWSER_EXECUTABLE_PATH, 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/chromium', '/usr/bin/google-chrome'].filter(Boolean);
  return {
    port: Number(env.PORT || 4177),
    model: env.GEMMA_MODEL || 'gemma3:4b',
    ollamaUrl: (env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
    modelUrl: env.GEMMA_API_BASE_URL?.replace(/\/$/, ''),
    modelKey: env.GEMMA_API_KEY || '',
    modelBudgetUsd: Number(env.MODEL_BUDGET_USD || 0),
    browserbaseKey: env.BROWSERBASE_API_KEY || '',
    browserbaseProjectId: env.BROWSERBASE_PROJECT_ID || undefined,
    sentryDsn: env.SENTRY_DSN || '',
    publicUrl: (env.PUBLIC_APP_URL || env.RENDER_EXTERNAL_URL)?.replace(/\/$/, ''),
    runToken: env.LIVE_RUN_TOKEN || '',
    executablePath: candidates.find(candidate => existsSync(candidate)),
    dataDir: path.resolve(env.DATA_DIR || '.data'),
  };
}

export async function getReadiness(config = getConfig()) {
  let modelReady = false;
  let modelMessage = 'Hosted endpoint configured; verify with a live run.';
  if (config.modelUrl) modelReady = Boolean(config.modelKey);
  else {
    try {
      const response = await fetch(`${config.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2500) });
      const payload = await response.json();
      modelReady = response.ok && payload.models?.some(model => model.name === config.model || model.model === config.model);
      modelMessage = modelReady ? 'Local model is installed.' : `Install ${config.model} in Ollama, or configure a hosted endpoint.`;
    } catch { modelMessage = 'Ollama is not reachable. Start it or configure a hosted endpoint.'; }
  }
  return {
    model: config.model, modelReady, modelMessage,
    modelProvider: config.modelUrl ? 'hosted' : 'ollama',
    localBrowserReady: Boolean(config.executablePath),
    browserbaseReady: Boolean(config.browserbaseKey && config.publicUrl),
    browserbaseKeyPresent: Boolean(config.browserbaseKey),
    publicUrlPresent: Boolean(config.publicUrl),
    sentryConfigured: Boolean(config.sentryDsn),
    protectedApi: Boolean(config.runToken),
  };
}
