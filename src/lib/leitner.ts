import type { MultiFact, BoxLevel } from '../types';
import { BOX_INTERVALS, RESPONSE_TIME } from '../types';

/**
 * Adds `days` calendar days to an ISO date string and returns the new ISO date string.
 */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Computes the next due date for a fact based on its box level.
 */
export function computeNextDue(box: BoxLevel, lastSeen: string): string {
  const interval = BOX_INTERVALS[box];
  return addDays(lastSeen, interval);
}

/**
 * Returns true if a fact is due for review (nextDue <= now).
 * A fact with no nextDue (empty string) is always due.
 */
export function isDue(fact: MultiFact, now: string): boolean {
  if (!fact.nextDue) return true;
  return fact.nextDue <= now;
}

/**
 * Processes an answer and returns the updated MultiFact.
 *
 * Rules from the spec:
 * - Correct + fast (< 5 000 ms): promote box (max 5), update nextDue
 * - Correct + slow (>= 5 000 ms): no box change, still record the attempt
 * - Incorrect: box drops to 1, update nextDue
 *
 * Note: The UI feedback thresholds (< 3s fast, 3-5s slow, > 5s very slow) are
 * for display purposes. For box promotion, the threshold is 5 000 ms per spec §1.1.
 */
export function processAnswer(
  fact: MultiFact,
  correct: boolean,
  responseTimeMs: number,
  now: string,
): MultiFact {
  const attempt = {
    date: now,
    correct,
    responseTimeMs,
    answeredWith: null, // the caller can fill this in before calling
  };

  const updatedHistory = [...fact.history, attempt].slice(-30);

  if (!correct) {
    const newBox: BoxLevel = 1;
    return {
      ...fact,
      box: newBox,
      lastSeen: now,
      nextDue: computeNextDue(newBox, now),
      history: updatedHistory,
    };
  }

  // Correct answer
  const isFastEnough = responseTimeMs < RESPONSE_TIME.SLOW; // < 5000 ms

  if (isFastEnough) {
    const newBox = Math.min(fact.box + 1, 5) as BoxLevel;
    return {
      ...fact,
      box: newBox,
      lastSeen: now,
      nextDue: computeNextDue(newBox, now),
      history: updatedHistory,
    };
  }

  // Correct but slow: no box change
  return {
    ...fact,
    lastSeen: now,
    nextDue: computeNextDue(fact.box, now),
    history: updatedHistory,
  };
}

/**
 * Resets a fact to box 1 with cleared history.
 */
export function resetFact(fact: MultiFact, today: string): MultiFact {
  return { ...fact, box: 1 as BoxLevel, history: [], nextDue: today, lastSeen: today };
}

// Phase finale : seuil sous lequel on introduit les derniers faits restants
// même si certains faits sont en boîte 1. Sans ça, un seul fait raté en
// boîte 1 bloque indéfiniment l'intro des derniers faits (typiquement 8×9
// et 9×9 après le seeding par dominance du test de placement, qui ne peuvent
// être inférés par aucun fait du set placement). À ce stade, l'enfant
// maîtrise déjà la quasi-totalité ; la règle protectrice du début n'a plus
// d'utilité.
const TAIL_INTRO_THRESHOLD = 2;

/**
 * Returns true if a new fact should be introduced.
 * Condition: all previously introduced facts are at box 2 or above.
 */
export function shouldIntroduceNew(facts: MultiFact[]): boolean {
  const introduced = facts.filter((f) => f.introduced);
  if (introduced.length === 0) return true;
  if (facts.length - introduced.length <= TAIL_INTRO_THRESHOLD) return true;
  return introduced.every((f) => f.box >= 2);
}
