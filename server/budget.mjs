import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

let chain = Promise.resolve();
export function reserveModelBudget(config, messages, outputTokens) {
  const operation = chain.catch(() => {}).then(() => reserve(config, messages, outputTokens));
  chain = operation;
  return operation;
}

async function reserve(config, messages, outputTokens) {
  if (config.model.endsWith(':free')) return;
  if (new URL(config.modelUrl).hostname !== 'openrouter.ai') throw new Error('Paid inference requires the supported OpenRouter budget check.');
  const limit = config.modelBudgetUsd;
  if (!Number.isFinite(limit) || limit <= 0) throw new Error('Paid inference is disabled. Set an explicitly approved MODEL_BUDGET_USD on the server.');
  const options = { signal: AbortSignal.timeout(10000) };
  const [catalogResponse, keyResponse] = await Promise.all([
    fetch('https://openrouter.ai/api/v1/models', options),
    fetch('https://openrouter.ai/api/v1/key', { ...options, headers: { Authorization: `Bearer ${config.modelKey}` } }),
  ]);
  if (!catalogResponse.ok || !keyResponse.ok) throw new Error('Could not verify model pricing and key usage. No paid inference was sent.');
  const model = (await catalogResponse.json()).data?.find(model => model.id === config.model);
  const usage = (await keyResponse.json()).data?.usage;
  const prompt = Number(model?.pricing?.prompt), completion = Number(model?.pricing?.completion), request = Number(model?.pricing?.request || 0);
  if (![prompt, completion, request, usage].every(value => Number.isFinite(value) && value >= 0)) throw new Error('Provider pricing or usage is unavailable. No paid inference was sent.');
  // Byte count conservatively bounds tokenized text; double it and include
  // protocol overhead. Reserving the full output cap overstates actual cost.
  const maximumInputTokens = 2 * Buffer.byteLength(JSON.stringify(messages), 'utf8') + 512;
  const reserved = maximumInputTokens * prompt + outputTokens * completion + request;
  const keyId = createHash('sha256').update(config.modelKey).digest('hex').slice(0, 16);
  await mkdir(config.dataDir, { recursive: true });
  const file = path.join(config.dataDir, `model-budget-${keyId}.json`);
  let spent = 0;
  try { spent = JSON.parse(await readFile(file, 'utf8')).reservedUsd; }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('The model budget record is unreadable. No paid inference was sent.'); }
  if (!Number.isFinite(spent) || spent < 0 || spent + reserved > limit || usage + reserved > 0.10) throw new Error('The approved verification budget cannot cover another request. No paid inference was sent.');
  await writeFile(file, JSON.stringify({ reservedUsd: spent + reserved, lastModel: config.model, lastKeyUsageUsd: usage, updatedAt: new Date().toISOString() }), { mode: 0o600 });
}
