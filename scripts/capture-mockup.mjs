import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = '/tmp/mockup-refs';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2000, height: 2000 }, deviceScaleFactor: 2 });

// Mockup image references use `current/mystery-image.png` — intercept to serve local file
await page.route('**/current/mystery-image.png', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'image/png',
    path: '/tmp/multiplix-redesign/design_handoff_multiplix_redesign/assets/mystery-image.png',
  });
});
// Any other 'current/*.png' references (existing app shots) can be stubs
await page.route('**/current/*.png', async (route) => {
  // Return a 1x1 transparent png
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  );
  await route.fulfill({ status: 200, contentType: 'image/png', body: png });
});

await page.goto('file:///tmp/mockup.html', { waitUntil: 'networkidle' });
// Wait for fonts + react render
await page.waitForTimeout(2500);

// Each Phone component renders a div whose innermost content matches width=360 height=760.
// We find every such frame by scanning for elements with computed style matching the phone bezel.
// Simpler: the Phone() component returns a specific structure — a 360x760 white box nested.
// Use a different approach: get all DCArtboard-like divs, iterate them.
// Easiest: Phone contents are inside a div with `style="width: 360px; height: 760px"`. Look for those.

const frames = await page.$$eval('div', (divs) => {
  const out = [];
  for (const d of divs) {
    const s = d.getAttribute('style') || '';
    if (s.includes('width: 360px') && s.includes('height: 760px') && s.includes('overflow: hidden')) {
      const rect = d.getBoundingClientRect();
      out.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
    }
  }
  return out;
});

console.log('Found', frames.length, 'phone frames');

// Actually the Phone wraps content — there's usually an outer bezel too. Look for boundaries.
// Let me just screenshot the full page and see the layout first.
await page.evaluate(() => {
  // Reset any DesignCanvas zoom: find scrollable container and record all phone rects via class
  const allDivs = document.querySelectorAll('div');
  const markers = [];
  for (const d of allDivs) {
    const s = d.getAttribute('style') || '';
    if (s.includes('width: 360px') && s.includes('height: 760px') && s.includes('overflow: hidden')) {
      const r = d.getBoundingClientRect();
      markers.push({ x: r.x, y: r.y, w: r.width, h: r.height });
    }
  }
  window.__phoneFrames = markers;
});

// Bigger viewport to see the whole canvas
await page.setViewportSize({ width: 8000, height: 8000 });
await page.waitForTimeout(500);

// Use DesignCanvas's "Reset view" — or try to set zoom to 1
// The DesignCanvas stores its transform state. Let's just compute positions and screenshot.
const phoneLabels = [
  '01-welcome-intro',
  '02-welcome-name',
  '03-welcome-ready',
  '04-welcome-test',
  '05-home',
  '06-session-intro',
  '06b-session-intro-strategy',
  '07-session-question',
  '08-session-feedback-correct',
  '09-session-feedback-incorrect',
  '10-progress',
  '11-badges',
  '12-rules',
  '14-recap',
];

// Both CurrentShot (img) and Phone (redesign) frames have width:360px;height:760px;overflow:hidden.
// Skip CurrentShot: it has a single <img> direct child.
const phones = await page.$$eval('div', (divs) => {
  const out = [];
  for (const d of divs) {
    const s = d.getAttribute('style') || '';
    if (s.includes('width: 360px') && s.includes('height: 760px') && s.includes('overflow: hidden')) {
      const onlyImg =
        d.children.length === 1 && d.children[0].tagName.toLowerCase() === 'img';
      if (onlyImg) continue;
      const r = d.getBoundingClientRect();
      out.push({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
    }
  }
  return out;
});

console.log('Phones at:', phones.slice(0, 20));
// The layout has a ScreenPair with "Actuel" (img) + "Redesign" (Phone), so phones are only on the right.
// phones should have ~14 entries (one per redesigned screen). Sort them by y then x:
phones.sort((a, b) => a.y - b.y || a.x - b.x);

for (let i = 0; i < phones.length && i < phoneLabels.length; i++) {
  const p = phones[i];
  const buf = await page.screenshot({ clip: { x: p.x, y: p.y, width: p.w, height: p.h } });
  await writeFile(`${OUT}/${phoneLabels[i]}.png`, buf);
  console.log('✓', phoneLabels[i]);
}

await browser.close();
console.log('Done');
