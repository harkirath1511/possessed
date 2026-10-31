import { localBrowser, Stagehand } from '@browserbasehq/stagehand';
import { getConfig } from '../server/config.mjs';

const config = getConfig();
const browser = await localBrowser.launch({ executablePath: config.executablePath, headless: true, viewport: { width: 1100, height: 760 } });
let stagehand;
try {
  stagehand = await Stagehand.create({ browser, model: { generate: async () => { throw new Error('This smoke check does not call a model.'); } } });
  const page = await browser.context.newPage();
  await page.goto(`http://127.0.0.1:${config.port}/`);
  console.log(JSON.stringify({ provider: browser.provider, title: await page.title(), snapshotAvailable: Boolean((await page.snapshot()).formattedTree) }));
} finally { await stagehand?.close(); await browser.close(); }
