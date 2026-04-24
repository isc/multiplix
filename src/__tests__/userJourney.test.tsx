import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../App';
import { getCompletedTables } from '../lib/badges';
import { loadProfile } from '../lib/storage';
import { BADGE_IDS } from '../types';

// ---------------------------------------------------------------------------
// Test d'intégration « bout en bout » qui monte le vrai composant <App />
// dans jsdom et pilote l'app uniquement via des interactions DOM réelles
// (clics sur les boutons du NumPad, saisie du prénom, dismissal des overlays,
// etc.). Aucun helper ne duplique la logique d'App.tsx — tout passe par le
// wiring React de production.
// ---------------------------------------------------------------------------

const START_DATE = new Date('2026-01-05T08:00:00.000Z');
const QUESTION_RE = /(\d+)\D+(\d+)/;

function setDay(offset: number): void {
  const d = new Date(START_DATE);
  d.setUTCDate(d.getUTCDate() + offset);
  vi.setSystemTime(d);
}

function findButton(label: RegExp | string): HTMLButtonElement | null {
  const buttons = Array.from(document.querySelectorAll('button'));
  return (
    (buttons.find((b) => {
      const text = (b.textContent ?? '').trim();
      return typeof label === 'string' ? text === label : label.test(text);
    }) as HTMLButtonElement | null) ?? null
  );
}

function readCurrentQuestion(): [number, number] | null {
  const el = document.querySelector('.session-question-text');
  if (!el) return null;
  const text = el.textContent ?? '';
  const match = text.match(QUESTION_RE);
  if (!match) return null;
  return [parseInt(match[1], 10), parseInt(match[2], 10)];
}

/**
 * Joue une séance du début à la fin puis clique « À demain ! » pour
 * revenir à l'écran d'accueil. Pilote le vrai DOM : introductions,
 * saisie NumPad, dismissal du feedback, et recap.
 */
function playSessionAndDismissRecap(): void {
  const MAX_ITERS = 2000;

  for (let i = 0; i < MAX_ITERS; i++) {
    // Priorité aux états les plus fréquents pour limiter les scans DOM.

    const feedback = document.querySelector<HTMLElement>('.feedback-overlay');
    if (feedback) {
      fireEvent.click(feedback);
      continue;
    }

    const question = readCurrentQuestion();
    if (question) {
      const [a, b] = question;
      const digits = (a * b).toString();

      for (const d of digits) {
        const btn = document.querySelector<HTMLButtonElement>(
          `.numpad-btn[aria-label="${d}"]`,
        );
        if (!btn) throw new Error(`NumPad button ${d} introuvable`);
        fireEvent.click(btn);
      }

      // Produits à 1 chiffre (4, 6, 8, 9) : le NumPad n'auto-valide
      // qu'à partir de 2 chiffres.
      if (digits.length === 1) {
        const okBtn = findButton('OK');
        if (!okBtn) throw new Error('Bouton OK introuvable après saisie 1 chiffre');
        fireEvent.click(okBtn);
      }
      continue;
    }

    if (document.querySelector('.session-intro')) {
      const next = findButton(/^Suivant/) ?? findButton(/J'ai compris/);
      if (next) {
        fireEvent.click(next);
        continue;
      }
    }

    // Terminal : écran Recap visible → on le ferme pour revenir à Home.
    const recapBtn = findButton(/À demain/);
    if (recapBtn) {
      fireEvent.click(recapBtn);
      return;
    }

    throw new Error(
      'playSession: état DOM inattendu (ni feedback, ni question, ni intro, ni recap)',
    );
  }

  throw new Error('playSession: MAX_ITERS dépassé — boucle probable');
}

describe('Parcours utilisateur de bout en bout (DOM)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });
    setDay(0);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it(
    "mène Zoé de la première utilisation à la maîtrise des 36 faits",
    () => {
      render(<App />);

      // -- 1. WelcomeScreen affiché (pas de profil en storage) --
      expect(loadProfile()).toBeNull();
      expect(findButton(/^Suivant/)).not.toBeNull();

      // -- 2. Parcours de bienvenue --
      fireEvent.click(findButton(/^Suivant/)!);

      const nameInput = document.querySelector<HTMLInputElement>('input.welcome-input')!;
      fireEvent.change(nameInput, { target: { value: 'Zoe' } });
      fireEvent.click(findButton(/^C'est moi !/)!);

      fireEvent.click(findButton('Passer le test')!);

      // -- RulesIntroScreen (3 étapes : intro, règle ×1, règle ×10) --
      fireEvent.click(findButton(/C'est parti/)!);
      fireEvent.click(findButton(/Suivant/)!);
      fireEvent.click(findButton(/J'ai compris/)!);

      expect(findButton(/C'est parti/)).not.toBeNull();

      const initial = loadProfile()!;
      expect(initial.facts).toHaveLength(36);
      expect(initial.facts.every((f) => f.box === 1)).toBe(true);
      expect(initial.facts.every((f) => !f.introduced)).toBe(true);
      expect(initial.badges).toHaveLength(0);

      // -- 3. Boucle quotidienne jusqu'à maîtrise complète --
      const MAX_DAYS = 365;
      let sessionsPlayed = 0;
      let day = 0;

      while (day < MAX_DAYS) {
        const profile = loadProfile()!;
        if (profile.facts.every((f) => f.box === 5)) break;

        setDay(day);

        // Remonte l'app (= l'enfant rouvre l'app le lendemain).
        if (day > 0) {
          cleanup();
          render(<App />);
        }

        const startBtn = findButton(/C'est parti/);
        if (!startBtn) {
          day++;
          continue;
        }

        fireEvent.click(startBtn);

        // composeSession peut retourner 0 questions ; dans ce cas App
        // reste sur Home et il ne faut pas entrer dans playSession.
        const sessionStarted =
          document.querySelector('.session-intro') !== null ||
          document.querySelector('.session-question-text') !== null;

        if (!sessionStarted) {
          day++;
          continue;
        }

        playSessionAndDismissRecap();
        sessionsPlayed++;
        day++;
      }

      // -- 4. Assertions finales --
      expect(day).toBeLessThan(MAX_DAYS);
      expect(sessionsPlayed).toBeGreaterThan(0);

      const final = loadProfile()!;
      expect(final.facts.every((f) => f.box === 5)).toBe(true);
      expect(final.facts.every((f) => f.introduced)).toBe(true);
      expect(final.totalSessions).toBe(sessionsPlayed);

      const completedTables = getCompletedTables(final.facts);
      for (let t = 2; t <= 9; t++) {
        expect(completedTables.has(t)).toBe(true);
      }

      const badgeIds = new Set(final.badges.map((b) => b.id));
      expect(badgeIds.has(BADGE_IDS.PREMIER_PAS)).toBe(true);
      expect(badgeIds.has(BADGE_IDS.EXPLORATION)).toBe(true);
      expect(badgeIds.has(BADGE_IDS.GENIE_MATHS)).toBe(true);
      for (let t = 2; t <= 9; t++) {
        expect(badgeIds.has(`${BADGE_IDS.TABLE_PREFIX}${t}`)).toBe(true);
      }
    },
  );
});
