import { chromium } from 'playwright';
import { resolve } from 'path';

const VIEWPORT = { width: 1440, height: 900 };
const BASE = `file://${resolve(import.meta.dirname, '')}`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT });

  for (const [name, url] of [
    ['home', `${BASE}/index.html`],
    ['about', `${BASE}/about.html`],
    ['press', `${BASE}/press.html`],
  ]) {
    await page.goto(url, { waitUntil: 'networkidle' });
    if (name === 'home') {
      await page.waitForFunction(() => typeof framesLoaded !== 'undefined' && framesLoaded >= 121, { timeout: 30000 });
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `screenshot-${name}.png`, fullPage: true });
    console.log(`Captured ${name}`);
  }

  await browser.close();
}

main().catch(console.error);
