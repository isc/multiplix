#!/usr/bin/env node
/**
 * Generates an HTML user guide with screenshots of every screen of the app.
 *
 * Steps:
 *   1. Spawns a `vite preview` server on the built `dist/` folder.
 *   2. Drives the app with Playwright, seeding localStorage to reach the
 *      various screens, and captures a screenshot for each.
 *   3. Writes an HTML guide at `dist/guide/index.html` with the screenshots.
 *
 * Usage:
 *   npm run build
 *   npm run user-guide
 *
 * The guide is then deployed as part of the `dist/` output to GitHub Pages
 * at https://isc.github.io/multiplix/guide/.
 */

import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'dist', 'guide');
const SHOTS_DIR = join(OUT_DIR, 'screenshots');

const PORT = Number(process.env.GUIDE_PORT ?? 4173);
// Matches the base baked in at build time (see vite.config.ts). For main
// deploys this is `/multiplix/`; for branch previews it's overridden via
// the `VITE_BASE_PATH` env variable.
const BASE_PATH = process.env.VITE_BASE_PATH ?? '/multiplix/';
const BASE_URL = `http://localhost:${PORT}${BASE_PATH}`;

// Mobile-ish portrait viewport so screenshots match how kids use the PWA.
const VIEWPORT = { width: 420, height: 900 };
const DEVICE_SCALE = 2;

// Anchor date for seed data — single source of truth for every capture.
const SEED_TODAY = '2026-04-12';
const SEED_YESTERDAY = '2026-04-11';

// --- Utilities --------------------------------------------------------------

function log(...args) {
  console.log('[user-guide]', ...args);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForUrl(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* server not up yet */
    }
    await sleep(300);
  }
  throw new Error(`Server never became ready at ${url}`);
}

function startPreviewServer() {
  log(`starting vite preview on port ${PORT}`);
  const proc = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  proc.stdout.on('data', (d) => process.stdout.write(`[preview] ${d}`));
  proc.stderr.on('data', (d) => process.stderr.write(`[preview] ${d}`));
  return proc;
}

// --- Seed data --------------------------------------------------------------

/** Deterministic box level from operand pair — keeps screenshots stable. */
function seededBox(a, b) {
  const s = (a * 7 + b * 13 + a * b) % 100;
  if (s < 12) return { box: 1, introduced: false };
  if (s < 25) return { box: 1, introduced: true };
  if (s < 45) return { box: 2, introduced: true };
  if (s < 65) return { box: 3, introduced: true };
  if (s < 85) return { box: 4, introduced: true };
  return { box: 5, introduced: true };
}

function buildSampleProfile({ sessionAvailable = true } = {}) {
  const today = SEED_TODAY;
  const yesterday = SEED_YESTERDAY;
  const facts = [];
  for (let a = 2; a <= 9; a++) {
    for (let b = a; b <= 9; b++) {
      const { box, introduced } = seededBox(a, b);
      facts.push({
        a,
        b,
        product: a * b,
        box,
        introduced,
        lastSeen: introduced ? yesterday : '',
        // Due today so a session is always available.
        nextDue: introduced ? today : '',
        history: introduced
          ? [
              {
                date: yesterday,
                correct: box >= 3,
                responseTimeMs: 2500,
                answeredWith: box >= 3 ? a * b : null,
              },
            ]
          : [],
      });
    }
  }

  const sessionHistory = Array.from({ length: 8 }, (_, i) => {
    const d = new Date('2026-04-04');
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      questionsCount: 13 + (i % 3),
      correctCount: 11 + (i % 3),
      averageTimeMs: 2600 - i * 80,
      newFactsIntroduced: i % 2 === 0 ? 2 : 1,
      factsPromoted: 3 + (i % 3),
      factsDemoted: i % 4 === 0 ? 1 : 0,
    };
  });

  return {
    name: 'Léa',
    startDate: '2026-03-15',
    facts,
    totalSessions: 14,
    currentStreak: 5,
    longestStreak: 7,
    lastSessionDate: sessionAvailable ? yesterday : today,
    badges: [
      { id: 'premier-pas', name: 'Premier pas', description: 'Terminer la première séance', earnedDate: '2026-03-15', icon: '🌱' },
      { id: 'machine', name: 'Machine', description: '10 bonnes réponses de suite', earnedDate: '2026-03-22', icon: '⚡' },
      { id: 'table-2', name: 'Table de 2', description: 'Maîtriser la table de 2', earnedDate: '2026-04-01', icon: '⭐' },
      { id: 'veloce', name: 'Véloce', description: '5 réponses < 2s de suite', earnedDate: '2026-04-05', icon: '🚀' },
      { id: 'exploration', name: 'Exploration', description: 'Avoir vu tous les faits', icon: '🗺️', earnedDate: '2026-04-08' },
    ],
    sessionHistory,
    // Image mystère réservée au guide : évite de spoiler market/ocean qui
    // sont tirés au sort à la création d'un vrai profil.
    mysteryTheme: 'village',
  };
}

// --- Page helpers -----------------------------------------------------------

async function seedProfile(page, profile) {
  await page.addInitScript(({ p, mockTodayIso }) => {
    // Deterministic Math.random so session composition / fact ordering is
    // stable across CI runs. Seeded mulberry32.
    let rngState = 0x5EED1337;
    Math.random = () => {
      rngState |= 0;
      rngState = (rngState + 0x6D2B79F5) | 0;
      let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    // Freeze the wall clock to SEED_TODAY so `nextDue` / `lastSeen` / "due"
    // logic behaves identically regardless of when CI happens to run.
    const frozen = new Date(`${mockTodayIso}T09:00:00.000Z`).getTime();
    const RealDate = Date;
    // eslint-disable-next-line no-global-assign
    Date = class extends RealDate {
      constructor(...args) {
        if (args.length === 0) return new RealDate(frozen);
        return new RealDate(...args);
      }
      static now() { return frozen; }
      static UTC(...args) { return RealDate.UTC(...args); }
      static parse(s) { return RealDate.parse(s); }
    };

    if (p === null) {
      localStorage.removeItem('multiplix-profile');
    } else {
      localStorage.setItem('multiplix-profile', JSON.stringify(p));
    }
    // Mute sounds to avoid anything weird in headless.
    localStorage.setItem('multiplix-muted', 'true');
  }, { p: profile, mockTodayIso: SEED_TODAY });
}

/** Returns the Leitner box of the currently displayed question's fact. */
async function readCurrentFactBox(page, q) {
  return page.evaluate((qq) => {
    const raw = localStorage.getItem('multiplix-profile');
    if (!raw) return null;
    const profile = JSON.parse(raw);
    const a = Math.min(qq.a, qq.b);
    const b = Math.max(qq.a, qq.b);
    const fact = profile.facts.find((f) => f.a === a && f.b === b);
    return fact ? fact.box : null;
  }, q);
}

/**
 * Facts that `getStrategy()` returns non-null for (see lib/strategies.ts):
 * all facts except the ×2 table and 3×3 (base facts — grid + repeated
 * addition is already the best intro).
 */
function factHasStrategy(a, b) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  if (lo === 2) return false;
  if (lo === 3 && hi === 3) return false;
  return true;
}

// Disable CSS animations everywhere. This keeps clicks from being rejected as
// "unstable" and keeps screenshots visually consistent across runs.
const DISABLE_ANIMATIONS_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`;

async function gotoHome(page) {
  await page.goto(BASE_URL, { waitUntil: 'load' });
  await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });
}

async function shot(page, name, locator) {
  const path = join(SHOTS_DIR, `${name}.png`);
  const target = locator ?? page;
  await target.screenshot({ path, animations: 'disabled' });
  log(`✓ ${name}.png`);
}

async function readQuestion(page) {
  await page.waitForSelector('.session-question-text');
  const txt = await page.locator('.session-question-text').innerText();
  const nums = (txt.match(/\d+/g) ?? []).map(Number);
  return { a: nums[0], b: nums[1] };
}

// The numpad auto-submits at 2 digits; single-digit answers need Enter.
async function answerWith(page, value) {
  const s = String(value);
  for (const ch of s) await page.keyboard.press(ch);
  if (s.length === 1) await page.keyboard.press('Enter');
}

async function clickAllIntroSteps(page) {
  while (await page.locator('.session-intro-btn').count()) {
    await page.click('.session-intro-btn');
    await sleep(250);
  }
}

// --- Capture sequences ------------------------------------------------------

async function captureWelcomeScreens(page) {
  await seedProfile(page, null);
  await gotoHome(page);
  await page.waitForSelector('.welcome-screen');
  await shot(page, '01-welcome-intro');

  await page.click('.welcome-btn-primary');
  await page.waitForSelector('.welcome-input');
  await shot(page, '02-welcome-name');

  await page.fill('.welcome-input', 'Léa');
  await page.click('.welcome-btn-primary');
  // Step 2: "Salut Léa"
  await page.waitForSelector('.welcome-title:has-text("Salut")');
  await shot(page, '03-welcome-ready');

  // Placement test
  await page.click('.welcome-btn-primary');
  await page.waitForSelector('.welcome-test-question');
  await shot(page, '04-welcome-test');
}

async function captureHome(page) {
  await seedProfile(page, buildSampleProfile());
  await gotoHome(page);
  await page.waitForSelector('.home-screen');
  await shot(page, '05-home');
}

const NAV_SCREENS = [
  { navText: 'Mon image', screenSel: '.progress-screen', backSel: '.progress-back-btn', shot: '10-progress' },
  { navText: 'Badges',  screenSel: '.badges-screen',   backSel: '.badges-back-btn',   shot: '11-badges'   },
  { navText: 'Règles',  screenSel: '.rules-screen',    backSel: '.rules-back-btn',    shot: '12-rules'    },
];

async function captureNavScreen(page, { navText, screenSel, backSel, shot: shotName }) {
  await page.click(`.home-nav-btn:has-text("${navText}")`);
  await page.waitForSelector(screenSel);
  await shot(page, shotName);
  await page.click(backSel);
  await page.waitForSelector('.home-screen');
}

async function captureParentDashboard(page) {
  // Long press on the gear button (1.5s).
  const btn = page.locator('.home-parent-btn');
  const box = await btn.boundingBox();
  if (!box) throw new Error('parent gear button not found');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // 2s with buffer over the app's 1.5s threshold — slow CI schedulers can
  // stretch timers, so a tight 1.7s margin occasionally under-shoots.
  await sleep(2000);
  await page.mouse.up();
  await page.waitForSelector('.parent-dashboard');
  await shot(page, '13-parent-dashboard');
  await page.click('.parent-back-btn');
  await page.waitForSelector('.home-screen');
}

async function captureSessionScreens(page) {
  // Pre-introduce ×2 and 3×3 (no strategy → would skip the strategy step) and
  // pin the 8 due facts at box 2 (strategy hint only shows for box ≤ 2).
  // Source of truth for the no-strategy rule: src/lib/strategies.ts.
  const profile = buildSampleProfile();
  const longAgo = '2026-04-05';
  const future = '2026-04-20';
  const hasNoStrategy = (f) =>
    f.a === 2 || f.b === 2 || (f.a === 3 && f.b === 3);
  for (const f of profile.facts) {
    if (hasNoStrategy(f) && !f.introduced) {
      f.introduced = true;
      f.box = 2;
      f.lastSeen = longAgo;
      f.nextDue = future;
      f.history = [
        { date: longAgo, correct: true, responseTimeMs: 2500, answeredWith: f.product },
      ];
    }
  }
  let dueCount = 0;
  for (const f of profile.facts) {
    if (!f.introduced) continue;
    f.lastSeen = longAgo;
    if (dueCount < 8) {
      f.box = 2;
      f.nextDue = SEED_TODAY;
      dueCount++;
    } else {
      if (f.box < 2) f.box = 2;
      f.nextDue = future;
    }
  }
  let notIntroducedCount = profile.facts.filter((f) => !f.introduced).length;
  if (notIntroducedCount < 3) {
    for (const f of profile.facts) {
      if (notIntroducedCount >= 4) break;
      if (f.a + f.b >= 14 && !hasNoStrategy(f)) {
        f.introduced = false;
        f.box = 1;
        f.history = [];
        f.lastSeen = '';
        f.nextDue = '';
        notIntroducedCount++;
      }
    }
  }
  await seedProfile(page, profile);
  await gotoHome(page);
  await page.waitForSelector('.home-start-btn');
  await page.click('.home-start-btn');
  await page.waitForSelector('.session-screen');

  if (await page.locator('.session-intro').count()) {
    // The DotGrid has a JS-driven row-by-row reveal — wait for the result
    // ("= N") to become visible before taking the screenshot.
    await page.waitForSelector('.dot-grid-result.visible', { timeout: 5000 }).catch(() => {
      log('WARN: DotGrid result did not appear in time');
    });
    await shot(page, '06-session-intro');

    // Walk to the strategy step (grid → commute → strategy ; squares skip commute).
    await page.click('.session-intro-btn');
    const reachedStrategy = await page
      .waitForSelector('.strategy-hint', { timeout: 1000 })
      .then(() => true)
      .catch(() => false);
    if (!reachedStrategy) {
      await page.click('.session-intro-btn');
      await page.waitForSelector('.strategy-hint', { timeout: 2000 }).catch(() => {});
    }
    if (await page.locator('.strategy-hint').count()) {
      await shot(page, '06b-session-intro-strategy');
    } else {
      log('WARN: strategy step not reached — 06b-session-intro-strategy missing');
    }
    await clickAllIntroSteps(page);
  } else {
    log('WARN: no intro step found — 06-session-intro will be missing');
  }

  const q1 = await readQuestion(page);
  await shot(page, '07-session-question');

  await answerWith(page, q1.a * q1.b);
  await page.waitForSelector('.feedback-overlay.correct', { timeout: 3000 });
  await shot(page, '08-session-feedback-correct');
  await page.click('.feedback-overlay');
  await page.waitForSelector('.feedback-overlay', { state: 'detached', timeout: 3000 });

  // Walk past any intros that might follow. Then scan forward until we land
  // on a question whose fact is both in box ≤ 2 AND has a derivation strategy
  // — that guarantees the incorrect-feedback overlay shows a non-empty
  // strategy hint in the screenshot.
  await clickAllIntroSteps(page);
  const MAX_SCAN = 20;
  let q2 = null;
  for (let i = 0; i < MAX_SCAN; i++) {
    const q = await readQuestion(page);
    const box = await readCurrentFactBox(page, q);
    if (box !== null && box <= 2 && factHasStrategy(q.a, q.b)) {
      q2 = q;
      break;
    }
    // Not a good candidate — answer correctly and advance.
    await answerWith(page, q.a * q.b);
    await page.waitForSelector('.feedback-overlay.correct', { timeout: 3000 });
    await page.click('.feedback-overlay');
    await page.waitForSelector('.feedback-overlay', { state: 'detached', timeout: 3000 });
    await clickAllIntroSteps(page);
  }
  if (!q2) {
    log('WARN: no box≤2 fact with strategy found — 09-session-feedback-incorrect may miss the hint');
    q2 = await readQuestion(page);
  }

  const wrong = q2.a * q2.b === 1 ? 2 : 1;
  await answerWith(page, wrong);
  await page.waitForSelector('.feedback-overlay.incorrect', { timeout: 3000 });
  await shot(page, '09-session-feedback-incorrect');
  // Incorrect overlay only dismisses via the explicit OK button (no auto-dismiss).
  await page.click('.feedback-ok-btn');
  await page.waitForSelector('.feedback-overlay', { state: 'detached', timeout: 3000 });
}

async function captureRecap(page) {
  // Drive a complete (short-ish) session. We seed a profile where only a
  // handful of facts are due & introduced to keep the session short.
  const profile = buildSampleProfile();
  // Force *all* facts introduced and mostly at box 4 so there are no
  // introduction steps (keeps the drive loop simple) and few facts due.
  for (const f of profile.facts) {
    f.introduced = true;
    f.box = Math.max(2, f.box);
    f.nextDue = SEED_TODAY;
    f.lastSeen = SEED_YESTERDAY;
    if (!f.history.length) {
      f.history = [{ date: SEED_YESTERDAY, correct: true, responseTimeMs: 2500, answeredWith: f.product }];
    }
  }
  await seedProfile(page, profile);
  await gotoHome(page);
  await page.waitForSelector('.home-start-btn');
  await page.click('.home-start-btn');

  for (let i = 0; i < 60; i++) {
    await sleep(200);

    if (await page.locator('.recap-screen').count()) break;

    if (await page.locator('.session-intro').count()) {
      await clickAllIntroSteps(page);
      continue;
    }

    if (await page.locator('.feedback-overlay').count()) {
      await page.click('.feedback-overlay');
      await sleep(200);
      continue;
    }

    if (await page.locator('.session-question-text').count()) {
      const { a, b } = await readQuestion(page);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        await answerWith(page, a * b);
        await sleep(100);
      }
    }
  }

  await page.waitForSelector('.recap-screen', { timeout: 5000 });
  // Give the confetti animation a moment to settle.
  await sleep(800);
  await shot(page, '14-recap');
}

// --- HTML guide generator ---------------------------------------------------

const SECTIONS = [
  {
    id: 'principes',
    title: 'Les principes',
    body: `
      <p>Multiplix n'est pas un simple quiz. Chaque choix de conception s'appuie
      sur la recherche en psychologie cognitive et en didactique des
      mathématiques. Cinq piliers portent l'application :</p>
      <ul class="principles">
        <li>
          <strong>Répétition espacée.</strong> Chaque fait est revu juste avant
          d'être oublié, via un système de boîtes (Leitner) aux intervalles
          croissants : 0, 1, 3, 7 puis 21 jours. L'erreur renvoie le fait en
          boîte 1. Bien plus durable que le bachotage en une soirée.
          <span class="cite">Kang (2016) ; Cepeda et al. (2008) ; Rea &amp; Modigliani (1985)</span>
        </li>
        <li>
          <strong>Faible interférence.</strong> Les faits qui se ressemblent
          (même opérande, résultats proches) ne sont jamais introduits la même
          semaine. Une séance contient uniquement des faits suffisamment
          dissemblables pour que l'enfant ne les confonde pas en mémoire.
          <span class="cite">Dotan &amp; Zviran-Ginat (2022)</span>
        </li>
        <li>
          <strong>Entrelacement.</strong> Les tables sont mélangées au sein
          d'une même séance plutôt que travaillées l'une après l'autre. L'enfant
          doit aller chercher la bonne opération à chaque question, ce qui
          solidifie le rappel à long terme.
          <span class="cite">Rohrer &amp; Taylor (2007) ; Rohrer, Dedrick &amp; Burgess (2014)</span>
        </li>
        <li>
          <strong>Comprendre avant de mémoriser.</strong> Chaque nouveau fait
          est d'abord présenté comme une grille de points (addition répétée),
          puis par la commutativité (3 × 5 = 5 × 3), enfin par une astuce de
          dérivation adaptée (× 9 = × 10 − n, × 4 = double-double, × 6 = × 5 + n,
          etc.). Quelques faits-repères (doubles, × 5, × 9, carrés) servent
          d'appui aux faits dérivés. L'échafaudage disparaît quand le rappel
          devient automatique.
          <span class="cite">Van de Walle via Wichita Public Schools (2014) ; Brendefur et al. (2015)</span>
        </li>
        <li>
          <strong>Feedback orienté progrès, pas performance.</strong> Pas de
          score chiffré côté enfant, pas d'étoiles calculées sur le taux de
          réussite : uniquement des encouragements constants et la mise en
          avant des faits appris. L'objectif est la motivation intrinsèque et
          la maîtrise, pas la note. Les chiffres bruts restent disponibles
          dans l'espace parent.
          <span class="cite">Butler (1988) ; Hattie &amp; Timperley (2007)</span>
        </li>
      </ul>
      <p class="principles-footer">Détails et justifications dans
      <a href="https://github.com/isc/multiplix/blob/main/audit-scientifique.md"><code>audit-scientifique.md</code></a>
      et <a href="https://github.com/isc/multiplix/blob/main/specs-multiplix.md"><code>specs-multiplix.md</code></a>.</p>
    `,
    shots: [],
  },
  {
    id: 'welcome',
    title: 'Bienvenue',
    description: `À la toute première ouverture, Multiplix déroule un parcours
      d'accueil en quatre étapes : une salutation de la mascotte, la saisie du
      prénom, une présentation du test de positionnement, puis le test lui-même
      (15 questions bien réparties). Le résultat sert à placer les faits déjà
      connus directement dans les boîtes supérieures du système de Leitner.`,
    shots: [
      { file: '01-welcome-intro', caption: 'La mascotte se présente à l\'enfant.' },
      { file: '02-welcome-name', caption: 'Saisie du prénom.' },
      { file: '03-welcome-ready', caption: 'Annonce du test de positionnement.' },
      { file: '04-welcome-test', caption: 'Test de positionnement (15 questions).' },
    ],
  },
  {
    id: 'home',
    title: 'Écran d\'accueil',
    description: `Le hub quotidien. La mascotte est un compagnon stable —
      elle accueille l'enfant à chaque session, réagit aux bonnes réponses,
      encourage en cas d'erreur, sans jamais juger. La flamme affiche la
      série en cours. Le gros bouton lance la séance du jour, et la barre du
      bas donne accès aux progrès, aux badges et aux règles ×1 / ×10. L'icône
      engrenage (appui long de 1,5 s) ouvre l'espace parent.`,
    shots: [
      { file: '05-home', caption: 'Accueil avec la mascotte et la série de 5 jours.' },
    ],
  },
  {
    id: 'session',
    title: 'La séance',
    description: `Une séance contient 12 à 15 questions. Quand un fait
      nouveau apparaît, il est introduit en trois temps : une grille de points
      qui montre la multiplication comme une addition répétée, la propriété de
      commutativité (3×5 = 5×3, sauf pour les carrés), et une astuce de
      dérivation adaptée au fait (par exemple « × 9 = × 10 moins une fois »).
      Ensuite viennent les questions. Une bonne réponse rapide donne une étoile
      dorée. En cas d'erreur, la bonne réponse est affichée avec la grille de
      points et — tant que le fait est en début d'apprentissage — l'astuce de
      dérivation est rappelée. Le fait est re-posé un peu plus loin dans la
      séance.`,
    shots: [
      { file: '06-session-intro', caption: 'Introduction d\'un nouveau fait — étape 1 : grille de points et addition répétée.' },
      { file: '06b-session-intro-strategy', caption: 'Introduction — étape 3 : astuce de dérivation pour mémoriser le fait.' },
      { file: '07-session-question', caption: 'Question standard et pavé numérique.' },
      { file: '08-session-feedback-correct', caption: 'Bonne réponse rapide — étoile dorée.' },
      { file: '09-session-feedback-incorrect', caption: 'Réponse incorrecte — grille de points et rappel de l\'astuce.' },
    ],
  },
  {
    id: 'recap',
    title: 'Bilan de séance',
    description: `À la fin d'une séance, l'écran de bilan affiche les
      éventuels nouveaux faits, invite à aller voir l'image mystère (avec
      une mention spéciale quand elle a changé) et déclenche les confettis
      si une table est entièrement maîtrisée, si l'image mystère est
      complétée, ou pour un nouveau badge. La progression globale est
      affichée via une barre « X faits connus sur 36 ».`,
    shots: [
      { file: '14-recap', caption: 'Bilan d\'une séance avec barre de progression.' },
    ],
  },
  {
    id: 'progress',
    title: 'Mon image mystère',
    description: `Une grille 8×8 (tables 2 à 9) où chaque case est un
      fragment d'une image cachée. Plus l'enfant maîtrise un fait, plus
      son fragment gagne en finesse — silhouette floue, aplat, couleurs,
      ombres, détails complets, en miroir des 5 boîtes Leitner. Un fait
      oublié voit son fragment se re-flouter un peu, sans notion d'échec.
      Quand les 36 faits sont maîtrisés, l'image est entièrement révélée.
      Les totaux « découverts / maîtrisés / total » sont affichés en haut.`,
    shots: [
      { file: '10-progress', caption: 'Image mystère qui se révèle au fur et à mesure des progrès.' },
    ],
  },
  {
    id: 'badges',
    title: 'Les badges',
    description: `18 badges au total, répartis en trois familles : jalons
      (première séance, 7 jours, 30 jours), performance (10 réponses de suite,
      5 réponses < 2 s), et maîtrise (un badge par table + un badge « génie des
      maths » quand tout est en boîte 5).`,
    shots: [
      { file: '11-badges', caption: 'Collection de badges — obtenus et à débloquer.' },
    ],
  },
  {
    id: 'rules',
    title: 'Les règles ×1 et ×10',
    description: `Deux règles que l'app met en avant dès le début pour
      alléger la charge mnésique : multiplier par 1 (le nombre ne change pas)
      et multiplier par 10 (les chiffres glissent d'une place vers la gauche,
      un 0 prend la place des unités). Ces tables ne font donc pas partie
      des 36 faits appris.`,
    shots: [
      { file: '12-rules', caption: 'Règles pour ×1 et ×10.' },
    ],
  },
  {
    id: 'parent',
    title: 'Espace parent',
    description: `Accessible depuis l'accueil par un appui long sur
      l'engrenage (1,5 s). On y retrouve : les statistiques générales, un
      histogramme des boîtes Leitner, l'évolution du taux de réussite,
      les faits les plus difficiles (avec possibilité de les réinitialiser),
      les temps de réponse moyens par table, l'historique des 10 dernières
      séances, et les actions export / import du profil (JSON).`,
    shots: [
      { file: '13-parent-dashboard', caption: 'Tableau de bord parent complet.' },
    ],
  },
];

function buildHtml({ generatedAt }) {
  const sectionHtml = SECTIONS.map((s) => {
    const textContent = s.body
      ? s.body.trim()
      : `<p>${s.description.trim().replace(/\s+/g, ' ')}</p>`;
    if (!s.shots.length) {
      return `
      <section id="${s.id}" class="section section-full">
        <div class="section-text">
          <h2>${s.title}</h2>
          ${textContent}
        </div>
      </section>`;
    }
    const shots = s.shots
      .map(
        (sh) => `
          <figure class="shot">
            <img src="screenshots/${sh.file}.png" alt="${sh.caption.replace(/"/g, '&quot;')}" loading="lazy" />
            <figcaption>${sh.caption}</figcaption>
          </figure>`,
      )
      .join('\n');
    const shotsClass = `shots shots-${s.shots.length}`;
    return `
      <section id="${s.id}" class="section">
        <div class="section-text">
          <h2>${s.title}</h2>
          ${textContent}
        </div>
        <div class="${shotsClass}">
          ${shots}
        </div>
      </section>`;
  }).join('\n');

  const toc = SECTIONS.map((s) => `<li><a href="#${s.id}">${s.title}</a></li>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Multiplix — Guide d'utilisation</title>
<link rel="icon" href="../favicon.svg" />
<style>
  :root {
    --primary: #6C63FF;
    --bg: #F8F9FF;
    --surface: #FFFFFF;
    --border: #E3E4F5;
    --text: #2A2A3C;
    --text-muted: #6E7189;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Nunito, Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.55;
  }
  header {
    background: linear-gradient(135deg, #6C63FF 0%, #8B83FF 100%);
    color: white;
    padding: 48px 24px;
    text-align: center;
  }
  header h1 { margin: 0 0 8px; font-size: 2.2rem; }
  header p { margin: 0; opacity: 0.92; }
  header a { color: #FFEB8A; }
  main { max-width: 1200px; margin: 0 auto; padding: 24px; }
  nav.toc {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 32px;
  }
  nav.toc ul { margin: 0; padding-left: 20px; columns: 2; }
  nav.toc li { margin: 4px 0; }
  nav.toc a { color: var(--primary); text-decoration: none; }
  nav.toc a:hover { text-decoration: underline; }
  section.section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 24px;
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    gap: 40px;
    align-items: start;
  }
  .section-text { max-width: 55ch; }
  .section-text h2 {
    margin: 0 0 12px;
    color: var(--primary);
    font-size: 1.6rem;
  }
  .section-text p { color: var(--text-muted); margin: 0 0 12px; }
  .section-text p:last-child { margin-bottom: 0; }
  .section.section-full {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .section-full .section-text { max-width: 72ch; margin: 0 auto; }
  ul.principles {
    list-style: none;
    padding: 0;
    margin: 0 0 16px;
    display: grid;
    gap: 14px;
  }
  ul.principles li {
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
  }
  ul.principles li strong { color: var(--primary); }
  ul.principles .cite {
    display: block;
    margin-top: 6px;
    color: var(--text-muted);
    font-size: 0.82rem;
    font-style: italic;
  }
  .principles-footer {
    font-size: 0.88rem;
    color: var(--text-muted);
  }
  .principles-footer a { color: var(--primary); text-decoration: none; }
  .principles-footer a:hover { text-decoration: underline; }
  .principles-footer code {
    background: var(--bg);
    padding: 1px 5px;
    border-radius: 4px;
  }
  .shots {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    justify-items: center;
  }
  .shots-1 { grid-template-columns: minmax(0, 320px); justify-content: center; }
  figure.shot {
    margin: 0;
    background: #F0F1FB;
    border-radius: 12px;
    padding: 12px;
    text-align: center;
    width: 100%;
    max-width: 320px;
  }
  figure.shot img {
    display: block;
    width: 100%;
    height: auto;
    margin: 0 auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    background: white;
  }
  figure.shot figcaption {
    margin-top: 10px;
    font-size: 0.9rem;
    color: var(--text-muted);
  }
  footer {
    text-align: center;
    color: var(--text-muted);
    padding: 24px;
    font-size: 0.85rem;
  }
  footer code { background: var(--surface); padding: 2px 6px; border-radius: 4px; }
  @media (max-width: 800px) {
    section.section { grid-template-columns: 1fr; gap: 24px; padding: 24px; }
    .shots-1 { justify-self: center; }
  }
  @media (max-width: 640px) {
    nav.toc ul { columns: 1; }
    header { padding: 32px 16px; }
    main { padding: 16px; }
    section.section { padding: 16px; }
    .shots { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<header>
  <h1>Multiplix — Guide d'utilisation</h1>
  <p>Toutes les vues de l'application, capturées automatiquement.</p>
  <p><a href="../">← Retour à l'application</a></p>
</header>
<main>
  <nav class="toc">
    <strong>Sommaire</strong>
    <ul>${toc}</ul>
  </nav>
  ${sectionHtml}
</main>
<footer>
  Guide généré automatiquement le ${generatedAt} ·
  Régénérable en local avec <code>npm run user-guide</code>.
</footer>
</body>
</html>`;
}

// --- Main -------------------------------------------------------------------

async function main() {
  if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
    console.error('ERROR: dist/index.html not found. Run `npm run build` first.');
    process.exit(1);
  }

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(SHOTS_DIR, { recursive: true });

  const server = startPreviewServer();
  const cleanup = () => {
    if (!server.killed) server.kill('SIGTERM');
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(130); });

  try {
    await waitForUrl(BASE_URL);

    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE,
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
    });
    const page = await context.newPage();

    // Fail fast on unexpected page errors.
    page.on('pageerror', (err) => log('PAGE ERROR:', err.message));

    await captureWelcomeScreens(page);
    await captureHome(page);
    for (const spec of NAV_SCREENS) await captureNavScreen(page, spec);
    await captureParentDashboard(page);
    await captureSessionScreens(page);
    await captureRecap(page);

    await browser.close();

    const html = buildHtml({
      generatedAt: new Date().toISOString().slice(0, 10),
    });
    await writeFile(join(OUT_DIR, 'index.html'), html);
    log(`wrote ${join(OUT_DIR, 'index.html')}`);
  } finally {
    cleanup();
  }

  log('done ✔︎');
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
