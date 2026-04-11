import type { MultiFact, UserProfile, SessionQuestion } from '../types';
import { isDue, shouldIntroduceNew } from './leitner';
import { computeSimilarity } from './similarity';
import { daysBetween, shuffle } from './utils';

// Target range: 12-15 questions (~5 min at ~20-30s per question with feedback).
// MIN_QUESTIONS is a soft target, not an absolute floor: if fewer distinct facts
// are available, the session is shorter rather than repeating facts (massed
// practice is counterproductive — Cepeda et al. 2008). See specs §6.2.
const MIN_QUESTIONS = 12;
const MAX_QUESTIONS = 15;
const MAX_NEW_FACTS = 2;

/**
 * Returns a random display order for a fact (a*b or b*a).
 * For squares (a === b), returns the original order.
 */
function randomDisplayOrder(fact: MultiFact): { displayA: number; displayB: number } {
  if (fact.a === fact.b) {
    return { displayA: fact.a, displayB: fact.b };
  }
  return Math.random() < 0.5
    ? { displayA: fact.a, displayB: fact.b }
    : { displayA: fact.b, displayB: fact.a };
}

/**
 * Returns which "table" a question belongs to (the smaller operand displayed).
 * Used for interleaving: we never want two consecutive questions from the same table.
 */
function questionTable(q: SessionQuestion): number {
  return Math.min(q.displayA, q.displayB);
}

/**
 * Checks if placing `candidate` right after `prev` would violate
 * the interleaving rule (same table) or the anti-interference rule (strong similarity).
 */
function isAdjacentConflict(prev: SessionQuestion, candidate: SessionQuestion): boolean {
  // Same table check
  if (questionTable(prev) === questionTable(candidate)) {
    return true;
  }
  // Strong similarity check
  if (computeSimilarity(prev.fact, candidate.fact) === 'strong') {
    return true;
  }
  return false;
}

/**
 * Attempts to reorder questions so that no two consecutive questions share a table
 * or have strong similarity. Uses a greedy approach.
 */
function interleave(questions: SessionQuestion[]): SessionQuestion[] {
  if (questions.length <= 1) return questions;

  const remaining = [...questions];
  const result: SessionQuestion[] = [];

  // Pick the first question randomly
  const firstIdx = Math.floor(Math.random() * remaining.length);
  result.push(remaining.splice(firstIdx, 1)[0]);

  while (remaining.length > 0) {
    const prev = result[result.length - 1];
    // Find the first candidate that doesn't conflict
    let placed = false;
    for (let i = 0; i < remaining.length; i++) {
      if (!isAdjacentConflict(prev, remaining[i])) {
        result.push(remaining.splice(i, 1)[0]);
        placed = true;
        break;
      }
    }
    if (!placed) {
      // No conflict-free candidate: just take the first one (best effort)
      result.push(remaining.shift()!);
    }
  }

  return result;
}

/**
 * Composes a session of 12-15 questions following the spec:
 *
 * Priority order (§6.1):
 *   1. Box 1 facts that are due (highest priority)
 *   2. Box 2-3 facts that are due
 *   3. Box 4-5 facts that are due
 *   4. New facts to introduce (max 2)
 *
 * Constraints (§6.2):
 *   - Anti-interference: no two facts with strong similarity adjacent
 *   - Interleaving: never two consecutive questions from the same table
 *   - Max 2 new facts introduced per session
 *   - Vary display order (a*b vs b*a)
 */
export function composeSession(profile: UserProfile, now: string): SessionQuestion[] {
  const { facts } = profile;
  const today = now.slice(0, 10);

  // Partition due facts by priority
  const dueFacts = facts.filter((f) => f.introduced && isDue(f, today));
  const box1 = shuffle(dueFacts.filter((f) => f.box === 1));
  const box23 = shuffle(dueFacts.filter((f) => f.box === 2 || f.box === 3));
  const box45 = shuffle(dueFacts.filter((f) => f.box === 4 || f.box === 5));

  // Gather candidates in priority order
  const prioritized: MultiFact[] = [...box1, ...box23, ...box45];

  // Select facts for the session, respecting the strong-similarity constraint.
  // We use a greedy approach: add facts one by one, skipping any that have
  // strong similarity with an already-selected fact.
  const selected: MultiFact[] = [];

  for (const fact of prioritized) {
    if (selected.length >= MAX_QUESTIONS) break;
    const hasStrongConflict = selected.some(
      (s) => computeSimilarity(s, fact) === 'strong',
    );
    if (!hasStrongConflict) {
      selected.push(fact);
    }
  }

  // If we still have room and can't fill with conflict-free facts, relax the constraint
  if (selected.length < MIN_QUESTIONS) {
    for (const fact of prioritized) {
      if (selected.length >= MAX_QUESTIONS) break;
      if (!selected.includes(fact)) {
        selected.push(fact);
      }
    }
  }

  // New facts to introduce (max 2)
  // 48h inter-session similarity constraint: facts introduced in the last 48h
  // block similar candidates (strong or medium similarity) from being introduced
  // to prevent interference during the consolidation phase.
  const recentlyIntroduced = facts.filter(
    (f) => f.introduced && f.lastSeen && daysBetween(f.lastSeen, today) < 2,
  );

  const newFacts: MultiFact[] = [];
  if (shouldIntroduceNew(facts) && selected.length < MAX_QUESTIONS) {
    const notIntroduced = facts.filter((f) => !f.introduced);
    // Sort by "simplicity": smallest product first (e.g., 2x2=4 before 9x9=81)
    const sorted = [...notIntroduced].sort((a, b) => a.product - b.product);

    for (const fact of sorted) {
      if (newFacts.length >= MAX_NEW_FACTS) break;
      if (selected.length + newFacts.length >= MAX_QUESTIONS) break;

      // Skip candidates similar to facts introduced within the last 48h
      const hasSimilarRecent = recentlyIntroduced.some(
        (recent) => computeSimilarity(recent, fact) !== 'none',
      );
      if (hasSimilarRecent) continue;

      newFacts.push(fact);
    }
  }

  // Build SessionQuestion objects
  const reviewQuestions: SessionQuestion[] = selected.map((fact) => ({
    fact,
    ...randomDisplayOrder(fact),
    isIntroduction: false,
    isRetry: false,
    isBonusReview: false,
  }));

  const introQuestions: SessionQuestion[] = newFacts.map((fact) => ({
    fact,
    ...randomDisplayOrder(fact),
    isIntroduction: true,
    isRetry: false,
    isBonusReview: false,
  }));

  // Combine: intro questions are placed at the front, then interleave the rest.
  // The spec says intro happens before practice, so intro questions come first.
  const allReview = interleave(reviewQuestions);
  const result = [...introQuestions, ...allReview];

  // If the session is still too short, pad with bonus review of other introduced
  // facts (not already in the session). Bonus reviews give feedback but don't
  // change the Leitner box — the spaced repetition schedule is preserved.
  // Prioritize weakest facts (lowest box, then closest nextDue).
  if (result.length < MIN_QUESTIONS) {
    const sessionFactKeys = new Set(
      result.map((q) => `${q.fact.a}x${q.fact.b}`),
    );
    const extraFacts = facts
      .filter((f) => f.introduced && !sessionFactKeys.has(`${f.a}x${f.b}`))
      .sort((a, b) => a.box - b.box || a.nextDue.localeCompare(b.nextDue));
    for (const fact of extraFacts) {
      if (result.length >= MIN_QUESTIONS) break;
      result.push({
        fact,
        ...randomDisplayOrder(fact),
        isIntroduction: false,
        isRetry: false,
        isBonusReview: true,
      });
    }
  }

  return result;
}

/**
 * Inserts a retry question for a failed fact 2-3 positions after currentIndex.
 * Returns the updated questions array.
 */
export function insertRetry(
  questions: SessionQuestion[],
  failedFact: MultiFact,
  currentIndex: number,
): SessionQuestion[] {
  const retryOffset = 2 + Math.floor(Math.random() * 2); // 2 or 3
  const insertAt = Math.min(currentIndex + retryOffset, questions.length);

  const retryQuestion: SessionQuestion = {
    fact: failedFact,
    ...randomDisplayOrder(failedFact),
    isIntroduction: false,
    isRetry: true,
    isBonusReview: false,
  };

  const updated = [...questions];
  updated.splice(insertAt, 0, retryQuestion);
  return updated;
}
