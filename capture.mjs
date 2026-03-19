import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const VIEWPORT = { width: 3840, height: 2160 };
const FPS = 60;
const SCROLL_DURATION_SECS = 12; // total video length
const TOTAL_SCREENSHOTS = FPS * SCROLL_DURATION_SECS; // 720 frames
const OUTPUT_DIR = resolve(import.meta.dirname, 'video-frames');
const PAGE_URL = `file://${resolve(import.meta.dirname, 'index.html')}`;

// Easing function — ease-in-out for cinematic feel
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ args: ['--force-device-scale-factor=2'] });
  const page = await browser.newPage({ viewport: VIEWPORT });

  console.log('Loading page...');
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });

  // Wait for frames to preload
  console.log('Waiting for book frames to load...');
  await page.waitForFunction(() => {
    // The page script sets framesLoaded — wait until all 121 are ready
    return typeof framesLoaded !== 'undefined' && framesLoaded >= 121;
  }, { timeout: 30000 });

  // Wait a beat for initial animations to settle
  await page.waitForTimeout(2000);

  // Get total scrollable height
  const scrollHeight = await page.evaluate(() => {
    return document.documentElement.scrollHeight - window.innerHeight;
  });

  console.log(`Scroll height: ${scrollHeight}px`);
  console.log(`Capturing ${TOTAL_SCREENSHOTS} frames at ${FPS}fps (${SCROLL_DURATION_SECS}s video)...`);

  for (let i = 0; i <= TOTAL_SCREENSHOTS; i++) {
    const t = i / TOTAL_SCREENSHOTS; // 0 → 1 linear
    const eased = easeInOutCubic(t);  // eased progress
    const scrollY = Math.round(eased * scrollHeight);

    await page.evaluate((y) => window.scrollTo(0, y), scrollY);

    // Give the lerp animation loop a moment to catch up
    await page.waitForTimeout(30);

    const frame = String(i + 1).padStart(5, '0');
    await page.screenshot({
      path: `${OUTPUT_DIR}/frame_${frame}.png`,
      fullPage: false,
    });

    if (i % 60 === 0) {
      console.log(`  ${Math.round(t * 100)}% (frame ${i}/${TOTAL_SCREENSHOTS})`);
    }
  }

  console.log('Done capturing frames.');
  await browser.close();
}

main().catch(console.error);
