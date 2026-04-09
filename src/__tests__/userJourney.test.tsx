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
//
// Objectif : simuler le parcours complet d'un nouvel utilisateur, séance
// après séance, jusqu'à la maîtrise des 36 faits (tous en boîte 5), en
// avançant le temps simulé d'un jour à chaque itération de la boucle.
// ---------------------------------------------------------------------------

const START_DATE = new Date('2026-01-05T08:00:00.000Z');

function setDay(offset: number): void {
  const d = new Date(START_DATE);
  d.setUTCDate(d.getUTCDate() + offset);
  vi.setSystemTime(d);
}

/** Trouve le premier <button> dont le texte correspond au label. */
function findButton(label: RegExp | string): HTMLButtonElement | null {
  const buttons = Array.from(document.querySelectorAll('button'));
  return (
    (buttons.find((b) => {
      const text = (b.textContent ?? '').trim();
      return typeof label === 'string' ? text === label : label.test(text);
    }) as HTMLButtonElement | null) ?? null
  );
}

/**
 * Lit l'énoncé de la question courante dans le DOM, tel qu'il est affiché
 * à l'écran (ex : "7×8="). Retourne les deux opérandes, ou null si l'écran
 * de question n'est pas actuellement visible.
 */
function readCurrentQuestion(): [number, number] | null {
  const el = document.querySelector('.session-question-text');
  if (!el) return null;
  const text = el.textContent ?? '';
  const match = text.match(/(\d+)\D+(\d+)/);
  if (!match) return null;
  return [parseInt(match[1], 10), parseInt(match[2], 10)];
}

/**
 * Joue une séance du début à la fin en cliquant sur les vrais boutons :
 * - passe les écrans d'introduction (Nouveau !) d'un fait neuf
 * - lit la question affichée, calcule le produit, tape la réponse sur le
 *   NumPad (le NumPad auto-valide à 2 chiffres, sinon on clique « OK »)
 * - ferme l'overlay de feedback en cliquant dessus (onClick=onDismiss)
 * - s'arrête quand l'écran Recap apparaît (bouton « À demain ! »).
 */
function playSession(): number {
  const MAX_ITERS = 2000;
  let questionsAnswered = 0;

  for (let i = 0; i < MAX_ITERS; i++) {
    // Fin de séance : l'écran Recap est visible.
    if (findButton(/À demain/)) return questionsAnswered;

    // Écran d'introduction d'un nouveau fait ("Nouveau !" + DotGrid).
    if (document.querySelector('.session-intro')) {
      const next = findButton(/^Suivant$/) ?? findButton(/J'ai compris/);
      if (next) {
        fireEvent.click(next);
        continue;
      }
    }

    // Overlay de feedback visible : on le ferme d'un clic (comme l'enfant
    // qui tape pour passer au fait suivant).
    const feedback = document.querySelector<HTMLElement>('.feedback-overlay');
    if (feedback) {
      fireEvent.click(feedback);
      continue;
    }

    // Écran de question : on lit l'énoncé et on tape la bonne réponse.
    const question = readCurrentQuestion();
    if (question) {
      const [a, b] = question;
      const product = a * b;
      const digits = product.toString();

      for (const d of digits) {
        const btn = document.querySelector<HTMLButtonElement>(
          `.numpad-btn[aria-label="${d}"]`,
        );
        if (!btn) throw new Error(`NumPad button ${d} introuvable`);
        fireEvent.click(btn);
      }

      // Produits à 1 chiffre (4, 6, 8, 9) : le NumPad n'auto-valide pas,
      // il faut cliquer explicitement sur OK.
      if (digits.length === 1) {
        const okBtn = findButton('OK');
        if (!okBtn) throw new Error('Bouton OK introuvable après saisie 1 chiffre');
        fireEvent.click(okBtn);
      }

      questionsAnswered++;
      continue;
    }

    throw new Error(
      'playSession: état DOM inattendu (ni intro, ni feedback, ni question, ni recap)',
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
    localStorage.clear();
  });

  it(
    "mène Zoé de la première utilisation à la maîtrise des 36 faits",
    () => {
      render(<App />);

      // ---------------------------------------------------------------
      // 1. Aucun profil en storage → WelcomeScreen doit être affiché
      // ---------------------------------------------------------------
      expect(loadProfile()).toBeNull();
      expect(findButton('Suivant')).not.toBeNull();

      // ---------------------------------------------------------------
      // 2. Parcours de bienvenue : 3 étapes + skip du test de placement
      // ---------------------------------------------------------------
      // Étape 0 : écran d'accueil → « Suivant »
      fireEvent.click(findButton('Suivant')!);

      // Étape 1 : saisie du prénom → « C'est moi ! »
      const nameInput = document.querySelector<HTMLInputElement>('input.welcome-input');
      expect(nameInput).not.toBeNull();
      fireEvent.change(nameInput!, { target: { value: 'Zoe' } });
      fireEvent.click(findButton("C'est moi !")!);

      // Étape 2 : présentation du test de placement → on le passe
      fireEvent.click(findButton('Passer le test')!);

      // On est maintenant sur l'écran d'accueil
      expect(findButton(/C'est parti/)).not.toBeNull();

      // Le profil a été créé et persisté
      const initial = loadProfile();
      expect(initial).not.toBeNull();
      expect(initial!.name).toBe('Zoe');
      expect(initial!.facts).toHaveLength(36);
      expect(initial!.facts.every((f) => f.box === 1)).toBe(true);
      expect(initial!.facts.every((f) => !f.introduced)).toBe(true);
      expect(initial!.mascotLevel).toBe(1);
      expect(initial!.badges).toHaveLength(0);

      // ---------------------------------------------------------------
      // 3. Boucle quotidienne : on joue une séance par jour jusqu'à ce
      //    que tous les faits soient en boîte 5.
      // ---------------------------------------------------------------
      const MAX_DAYS = 365;
      let sessionsPlayed = 0;
      let day = 0;

      while (day < MAX_DAYS) {
        const profile = loadProfile();
        if (profile && profile.facts.every((f) => f.box === 5)) break;

        setDay(day);

        // Force le re-rendu de HomeScreen pour qu'il relise todayISO()
        // et recalcule sessionDoneToday. On démonte et on remonte l'app
        // (ce qui correspond à "l'enfant rouvre l'app le lendemain").
        if (day > 0) {
          cleanup();
          render(<App />);
        }

        const startBtn = findButton(/C'est parti/);
        if (!startBtn) {
          // Séance déjà faite aujourd'hui ou aucune séance disponible :
          // on passe au jour suivant.
          day++;
          continue;
        }

        fireEvent.click(startBtn);

        // La séance a-t-elle vraiment démarré ? (composeSession peut
        // retourner 0 questions, auquel cas App reste sur l'écran Home.)
        const sessionStarted =
          document.querySelector('.session-intro') !== null ||
          document.querySelector('.session-question-text') !== null;

        if (!sessionStarted) {
          day++;
          continue;
        }

        playSession();
        sessionsPlayed++;

        // Écran Recap : on clique « À demain ! »
        const recapBtn = findButton(/À demain/);
        expect(recapBtn).not.toBeNull();
        fireEvent.click(recapBtn!);

        day++;
      }

      // ---------------------------------------------------------------
      // 4. Assertions finales : maîtrise atteinte
      // ---------------------------------------------------------------
      expect(day).toBeLessThan(MAX_DAYS);
      expect(sessionsPlayed).toBeGreaterThan(0);

      const final = loadProfile();
      expect(final).not.toBeNull();
      expect(final!.facts.every((f) => f.box === 5)).toBe(true);
      expect(final!.facts.every((f) => f.introduced)).toBe(true);
      expect(final!.mascotLevel).toBe(5);
      expect(final!.totalSessions).toBe(sessionsPlayed);

      // Toutes les tables 2..9 sont complétées
      const completedTables = getCompletedTables(final!.facts);
      for (let t = 2; t <= 9; t++) {
        expect(completedTables.has(t)).toBe(true);
      }

      // Les badges-clés du parcours sont débloqués
      const badgeIds = new Set(final!.badges.map((b) => b.id));
      expect(badgeIds.has(BADGE_IDS.PREMIER_PAS)).toBe(true);
      expect(badgeIds.has(BADGE_IDS.EXPLORATION)).toBe(true);
      expect(badgeIds.has(BADGE_IDS.GENIE_MATHS)).toBe(true);
      for (let t = 2; t <= 9; t++) {
        expect(badgeIds.has(`${BADGE_IDS.TABLE_PREFIX}${t}`)).toBe(true);
      }
    },
  );
});
