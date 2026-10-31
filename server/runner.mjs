import { localBrowser, browserbase, Stagehand } from '@browserbasehq/stagehand';
import { createHash } from 'node:crypto';
import { classify } from './domain.mjs';
import { decide } from './model.mjs';
import { trace, captureFailure } from './telemetry.mjs';

export async function executeRun(run, store, config, controller, screenshots) {
  let browser, stagehand;
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8 * 60 * 1000)]);
  const stopBrowser = () => { if (browser) void browser.close().catch(() => {}); };
  signal.addEventListener('abort', stopBrowser, { once: true });
  try {
    await trace(config, 'gen_ai.invoke_agent', 'Blackwood archivist', { 'gen_ai.agent.name': 'Blackwood archivist', 'gen_ai.conversation.id': run.id, 'gen_ai.request.model': run.model, 'possessed.mode': run.mode }, async () => {
      run.status = 'running';
      await store.emit(run, 'run.started', 'The archive is listening.', 'A genuine model/browser experiment has begun.');
      signal.throwIfAborted();
      browser = run.browser === 'browserbase'
        ? await browserbase.launch({ apiKey: config.browserbaseKey, ...(config.browserbaseProjectId ? { projectId: config.browserbaseProjectId } : {}), timeout: 600, browserSettings: { viewport: { width: 1100, height: 760 } }, clientOptions: { timeout: 45000, maxRetries: 0 } })
        : await localBrowser.launch({ ...(config.executablePath ? { executablePath: config.executablePath } : {}), headless: true, viewport: { width: 1100, height: 760 } });
      signal.throwIfAborted();
      run.browserSessionId = browser.sessionId || null;
      // The explicit Gemma planner below owns inference. Do not silently route
      // browser operations to a closed model or Browserbase's model gateway.
      stagehand = await Stagehand.create({ browser, model: { generate: async () => { throw new Error('Use the explicit POSSESSED model planner for inference.'); } } });
      const page = await browser.context.newPage();
      const origin = run.browser === 'browserbase' ? config.publicUrl : `http://127.0.0.1:${config.port}`;
      await page.goto(`${origin}/archive/${run.id}?access=${run.accessToken}`);
      await store.emit(run, 'browser.connected', 'A browser entered the archive.', run.browser === 'browserbase' ? 'Browserbase cloud session · Stagehand SDK' : 'Isolated local browser · Stagehand SDK');
      const capture = async () => {
        try {
          screenshots.set(run.id, Buffer.from(await page.screenshot({ type: 'jpeg', quality: 65 })));
          run.screenshotVersion += 1;
          await store.emit(run, 'browser.frame', 'Browser observation captured.', 'A screenshot from the actual browser.');
        } catch (error) { if (signal.aborted) throw error; }
      };
      await capture();
      const history = [];
      for (let step = 0; step < 7; step++) {
        signal.throwIfAborted();
        const observation = (await page.snapshot()).formattedTree.replaceAll(run.accessToken, '[archive-session]');
        await store.emit(run, 'model.started', 'The archivist is reading.', `Step ${step + 1} · ${run.model}`);
        const result = await trace(config, 'gen_ai.chat', 'Choose archive action', { 'gen_ai.request.model': run.model, 'gen_ai.operation.name': 'chat', 'gen_ai.conversation.id': run.id }, async span => {
          const result = await decide({ config, observation, history, signal });
          span?.setAttribute('gen_ai.usage.input_tokens', result.inputTokens);
          span?.setAttribute('gen_ai.usage.output_tokens', result.outputTokens);
          return result;
        });
        run.tokens.input += result.inputTokens; run.tokens.output += result.outputTokens;
        const { decision } = result;
        await store.emit(run, 'model.action', decision.action === 'finish' ? 'The archivist finished.' : `Action selected: ${decision.action.replaceAll('_', ' ')}`, decision.summary, { action: decision.action, ticketId: decision.ticketId, observation, observationHash: createHash('sha256').update(observation).digest('hex') });
        if (decision.action === 'finish') break;
        const previousSeq = run.actionSeq;
        const selector = decision.action === 'read_note' ? '[data-action="read-note"]' : `[data-action="resolve-${decision.ticketId}"]`;
        if (decision.action === 'resolve_ticket' && run.tickets[decision.ticketId] === 'resolved') {
          history.push({ ...decision, result: 'Already resolved. Choose another action or finish.' });
          await store.emit(run, 'tool.skipped', 'That record is already resolved.', 'No duplicate mutation was performed.');
          continue;
        }
        await trace(config, 'gen_ai.execute_tool', decision.action, { 'gen_ai.tool.name': decision.action, 'gen_ai.conversation.id': run.id, 'possessed.ticket_id': decision.ticketId || 104 }, async () => {
          await page.locator(selector).click();
          await page.waitForFunction(seq => Number(document.body.dataset.actionSeq) > seq, previousSeq, { timeout: 15000 });
        });
        const lastTool = [...run.events].reverse().find(event => event.type.startsWith('tool.'));
        history.push({ ...decision, result: lastTool?.detail || 'Browser action completed.' });
        await capture();
      }
      signal.throwIfAborted();
      run.status = 'completed'; run.completedAt = new Date().toISOString(); run.outcome = classify(run);
      await store.emit(run, 'run.completed', run.outcome === 'compromised' ? 'Something crossed the boundary.' : run.outcome === 'contained' ? 'The boundary held.' : run.outcome === 'unaffected' ? 'The ghost was not obeyed.' : 'The task was left unfinished.', 'Outcome is computed from actual ticket states and tool results.');
    });
  } catch (error) {
    const cancelled = controller.signal.aborted;
    run.status = cancelled ? 'cancelled' : 'error'; run.completedAt = new Date().toISOString(); run.outcome = classify(run);
    run.error = cancelled ? null : signal.aborted ? 'This run exceeded the eight-minute time limit.' : safeError(error, [config.modelKey, config.browserbaseKey, config.runToken, run.accessToken]);
    await store.emit(run, cancelled ? 'run.cancelled' : 'run.error', cancelled ? 'The séance was interrupted.' : 'The connection broke.', run.error || 'The operator cancelled this run.');
    if (!cancelled) captureFailure(new Error(run.error), run);
  } finally {
    signal.removeEventListener('abort', stopBrowser);
    await stagehand?.close().catch(() => {});
    await browser?.close().catch(() => {});
  }
}

function safeError(error, secrets = []) {
  let message = error instanceof Error ? error.message : 'Unexpected agent failure.';
  for (const secret of secrets.filter(Boolean)) message = message.split(secret).join('[redacted]');
  return message.replace(/(api[_-]?key|authorization|token|access)=([^\s&]+)/gi, '$1=[redacted]').slice(0, 600);
}
