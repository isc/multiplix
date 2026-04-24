#!/usr/bin/env node
/**
 * Generates a side-by-side comparison HTML page (mockup vs generated user-guide)
 * for manual visual diffing of the redesign.
 *
 * Prerequisites:
 *   - Mockup reference images at /tmp/mockup-refs/*.png
 *     (produced by scripts/capture-mockup.mjs from Redesign Multiplix.html)
 *   - User-guide screenshots at dist/guide/screenshots/*.png
 *     (produced by `npm run user-guide`)
 *
 * Output: /tmp/multiplix-compare/index.html
 *
 * Usage:
 *   node scripts/capture-mockup.mjs   # once, to generate mockup refs
 *   npm run build && npm run user-guide
 *   node scripts/compare-mockup.mjs
 *   open /tmp/multiplix-compare/index.html
 */

import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const MOCKUP_DIR = '/tmp/mockup-refs';
const GUIDE_DIR = join(ROOT, 'dist', 'guide', 'screenshots');
const OUT_DIR = '/tmp/multiplix-compare';
const OUT_MOCKUP = join(OUT_DIR, 'mockup');
const OUT_GUIDE = join(OUT_DIR, 'guide');

const SCREENS = [
  { id: '01-welcome-intro', label: 'Onboarding — Intro' },
  { id: '02-welcome-name', label: 'Onboarding — Prénom' },
  { id: '03-welcome-ready', label: 'Onboarding — Avant test' },
  { id: '04-welcome-test', label: 'Onboarding — Test' },
  { id: '05-home', label: 'Accueil' },
  { id: '06-session-intro', label: 'Session — Intro fait' },
  { id: '06b-session-intro-strategy', label: 'Session — Intro stratégie' },
  { id: '07-session-question', label: 'Session — Question' },
  { id: '08-session-feedback-correct', label: 'Session — Feedback correct' },
  { id: '09-session-feedback-incorrect', label: 'Session — Feedback incorrect' },
  { id: '10-progress', label: 'Image mystère' },
  { id: '11-badges', label: 'Badges' },
  { id: '12-rules', label: 'Règles' },
  { id: '13-parent-dashboard', label: 'Parent' },
  { id: '14-recap', label: 'Récap' },
];

await mkdir(OUT_MOCKUP, { recursive: true });
await mkdir(OUT_GUIDE, { recursive: true });

const rows = [];
for (const { id, label } of SCREENS) {
  const mockupSrc = join(MOCKUP_DIR, `${id}.png`);
  const guideSrc = join(GUIDE_DIR, `${id}.png`);
  const mockupOk = existsSync(mockupSrc);
  const guideOk = existsSync(guideSrc);
  if (mockupOk) await copyFile(mockupSrc, join(OUT_MOCKUP, `${id}.png`));
  if (guideOk) await copyFile(guideSrc, join(OUT_GUIDE, `${id}.png`));
  rows.push({ id, label, mockupOk, guideOk });
}

function html(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[c]));
}

const body = rows
  .map(({ id, label, mockupOk, guideOk }) => {
    const mockupCell = mockupOk
      ? `<img src="mockup/${html(id)}.png" alt="Mockup ${html(label)}">`
      : '<div class="missing">(mockup manquant — lance scripts/capture-mockup.mjs)</div>';
    const guideCell = guideOk
      ? `<img src="guide/${html(id)}.png" alt="App ${html(label)}">`
      : '<div class="missing">(guide manquant — npm run user-guide)</div>';
    return `
    <section class="row" id="s-${html(id)}">
      <h2><span class="idx">${html(id.split('-')[0])}</span>${html(label)}</h2>
      <div class="pair">
        <figure>
          <figcaption>Mockup</figcaption>
          ${mockupCell}
        </figure>
        <figure>
          <figcaption>App</figcaption>
          ${guideCell}
        </figure>
      </div>
    </section>`;
  })
  .join('\n');

const nav = rows
  .map(({ id, label }) => `<a href="#s-${html(id)}">${html(label)}</a>`)
  .join('');

const page = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Multiplix — Mockup vs App</title>
  <style>
    :root {
      --bg: #F3EADB;
      --fg: #1E1A2E;
      --muted: #8A8295;
      --line: #E6DECE;
      --accent: #4F46BA;
    }
    html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); font: 15px/1.5 system-ui, sans-serif; }
    header { position: sticky; top: 0; background: var(--bg); border-bottom: 1px solid var(--line); padding: 10px 20px; z-index: 10; }
    header h1 { margin: 0 0 6px; font-size: 16px; }
    nav { display: flex; flex-wrap: wrap; gap: 6px; font-size: 12px; }
    nav a { color: var(--accent); text-decoration: none; padding: 2px 8px; border: 1px solid var(--line); border-radius: 999px; background: #fff; }
    nav a:hover { background: var(--accent); color: #fff; }
    main { max-width: 1400px; margin: 0 auto; padding: 20px; }
    .row { margin-bottom: 48px; }
    .row h2 { margin: 0 0 10px; font-size: 18px; display: flex; align-items: baseline; gap: 10px; }
    .idx { display: inline-block; font-size: 11px; font-weight: 800; color: var(--muted); letter-spacing: 0.6px; text-transform: uppercase; background: #fff; border: 1px solid var(--line); padding: 2px 8px; border-radius: 999px; }
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    figure { margin: 0; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 10px; }
    figcaption { font-size: 11px; font-weight: 800; color: var(--muted); letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 8px; }
    figure img { width: 100%; display: block; border-radius: 8px; }
    .missing { color: var(--muted); font-style: italic; padding: 20px; text-align: center; border: 1px dashed var(--line); border-radius: 8px; }
  </style>
</head>
<body>
  <header>
    <h1>Multiplix — Mockup vs App (redesign)</h1>
    <nav>${nav}</nav>
  </header>
  <main>
    ${body}
  </main>
</body>
</html>`;

await writeFile(join(OUT_DIR, 'index.html'), page);
console.log('Wrote', join(OUT_DIR, 'index.html'));
console.log(`Open it with: open ${join(OUT_DIR, 'index.html')}`);
