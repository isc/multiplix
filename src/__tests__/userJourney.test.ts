import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MultiFact, SessionResult, UserProfile } from '../types';
import { BADGE_IDS, RESPONSE_TIME } from '../types';
import { checkBadges, computeMascotLevel, getCompletedTables } from '../lib/badges';
import { getFactKey } from '../lib/facts';
import { processAnswer } from '../lib/leitner';
import { composeSession } from '../lib/sessionComposer';
import { createNewProfile, loadProfile, saveProfile } from '../lib/storage';
import { daysBetween, todayISO } from '../lib/utils';

// ---------------------------------------------------------------------------
// Minimal in-memory localStorage shim — vitest defaults to a node environment,
// where `localStorage` is not defined. We stub it so the real `storage.ts`
// helpers (loadProfile / saveProfile) can be exercised end-to-end.
// ---------------------------------------------------------------------------
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

// ---------------------------------------------------------------------------
// The two helpers below mirror the orchestration code in `App.tsx`. They are
// re-implemented here (rather than imported) because App.tsx wires its
// reducers into React state — these versions reproduce the exact same
// transitions on a plain UserProfile so the test can drive them headlessly.
// ---------------------------------------------------------------------------

/**
 * Mirrors `App.handleAnswer` + the inline `processAnswer` call from
 * `SessionScreen.handleAnswer`. Always reads the *current* fact from profile
 * state (not the stale snapshot embedded in the SessionQuestion) so that
 * back-to-back occurrences of the same fact in a single session keep
 * promoting from the up-to-date box.
 */
function applyAnswer(
  profile: UserProfile,
  fact: MultiFact,
  correct: boolean,
  timeMs: number,
): UserProfile {
  const today = todayISO();
  const updatedFacts = profile.facts.map((f) => {
    if (f.a !== fact.a || f.b !== fact.b) return f;
    const updated = processAnswer(f, correct, timeMs, today);
    if (updated.history.length > 0) {
      updated.history[updated.history.length - 1].answeredWith = correct
        ? f.product
        : 0;
    }
    if (!updated.introduced) updated.introduced = true;
    return updated;
  });
  return { ...profile, facts: updatedFacts };
}

/**
 * Mirrors `App.handleSessionComplete`: streak update, mascot level
 * recompute, badge check, history append.
 */
function finalizeSession(
  profile: UserProfile,
  result: SessionResult,
  previousLastSessionDate: string | null,
  sessionStats: { consecutiveCorrect: number; fastAnswers: number[] },
): UserProfile {
  const today = todayISO();

  let currentStreak = profile.currentStreak;
  if (previousLastSessionDate) {
    const diff = daysBetween(previousLastSessionDate, today);
    if (diff === 1) currentStreak += 1;
    else if (diff !== 0) currentStreak = 1;
  } else {
    currentStreak = 1;
  }
  const longestStreak = Math.max(profile.longestStreak, currentStreak);

  const sessionHistory = [...profile.sessionHistory, result].slice(-50);

  const next: UserProfile = {
    ...profile,
    totalSessions: profile.totalSessions + 1,
    currentStreak,
    longestStreak,
    lastSessionDate: today,
    sessionHistory,
  };
  next.mascotLevel = computeMascotLevel(next);

  const earned = checkBadges(next, sessionStats, previousLastSessionDate);
  const knownIds = new Set(profile.badges.map((b) => b.id));
  const fresh = earned.filter((b) => !knownIds.has(b.id));
  next.badges = [...profile.badges, ...fresh];

  return next;
}

/**
 * Plays a single session start-to-finish, answering every question
 * correctly and quickly enough to count as a promotion (well under
 * RESPONSE_TIME.SLOW). Returns the new profile after recap.
 */
function playPerfectSession(profile: UserProfile): UserProfile {
  const today = todayISO();
  const questions = composeSession(profile, today);
  expect(questions.length).toBeGreaterThan(0);

  const previousLastSessionDate = profile.lastSessionDate;
  const responseTimes: number[] = [];
  const introduced = new Set<string>();
  const promoted = new Set<string>();

  let consecutive = 0;
  let maxConsecutive = 0;
  let totalTime = 0;
  let working = profile;

  for (const q of questions) {
    // 1500 ms is fast enough to be < RESPONSE_TIME.FAST (3000) and well
    // under RESPONSE_TIME.SLOW (5000), guaranteeing a promotion *and*
    // contributing to the VELOCE badge condition (5 in a row < 2000 ms).
    const timeMs = 1500;
    expect(timeMs).toBeLessThan(RESPONSE_TIME.SLOW);

    responseTimes.push(timeMs);
    totalTime += timeMs;
    consecutive++;
    if (consecutive > maxConsecutive) maxConsecutive = consecutive;

    const key = getFactKey(q.fact.a, q.fact.b);
    promoted.add(key);
    if (q.isIntroduction) introduced.add(key);

    working = applyAnswer(working, q.fact, true, timeMs);
  }

  const result: SessionResult = {
    date: today,
    questionsCount: questions.length,
    correctCount: questions.length,
    averageTimeMs: Math.round(totalTime / questions.length),
    newFactsIntroduced: introduced.size,
    factsPromoted: promoted.size,
    factsDemoted: 0,
  };

  return finalizeSession(working, result, previousLastSessionDate, {
    consecutiveCorrect: maxConsecutive,
    fastAnswers: responseTimes,
  });
}

// ---------------------------------------------------------------------------
// The test
// ---------------------------------------------------------------------------

const START_DATE = new Date('2026-01-05T08:00:00.000Z');

function setDay(dayOffset: number): void {
  const d = new Date(START_DATE);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  vi.setSystemTime(d);
}

describe('Parcours utilisateur de bout en bout', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage());
    vi.useFakeTimers({ toFake: ['Date'] });
    setDay(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("mène l'apprenant de la première séance jusqu'à la maîtrise des 36 faits", () => {
    // ---- 1. Première utilisation : aucun profil en localStorage ----
    expect(loadProfile()).toBeNull();

    // ---- 2. WelcomeScreen → handleWelcomeComplete (sans test de placement) ----
    const initial = createNewProfile('Zoé');
    saveProfile(initial);

    expect(initial.facts).toHaveLength(36);
    expect(initial.facts.every((f) => f.box === 1)).toBe(true);
    expect(initial.facts.every((f) => !f.introduced)).toBe(true);
    expect(initial.mascotLevel).toBe(1);
    expect(initial.badges).toHaveLength(0);
    expect(initial.totalSessions).toBe(0);
    expect(initial.currentStreak).toBe(0);

    // Le profil persiste bien dans le storage et peut être rechargé.
    const reloaded = loadProfile();
    expect(reloaded).not.toBeNull();
    expect(reloaded!.name).toBe('Zoé');

    // ---- 3. Boucle quotidienne de séances jusqu'à la maîtrise complète ----
    let profile: UserProfile = reloaded!;
    let day = 0;
    let playedSessions = 0;
    const MAX_DAYS = 365; // garde-fou : 1 an max simulé

    while (day < MAX_DAYS) {
      // Condition d'arrêt : tous les faits en boîte 5
      if (profile.facts.every((f) => f.box === 5)) break;

      const questions = composeSession(profile, todayISO());

      if (questions.length > 0) {
        profile = playPerfectSession(profile);
        playedSessions++;

        // Round-trip via le storage : on vérifie que la persistance
        // tient la route entre chaque séance.
        saveProfile(profile);
        const fresh = loadProfile();
        expect(fresh).not.toBeNull();
        profile = fresh!;
      }

      day++;
      setDay(day);
    }

    // ---- 4. La maîtrise est bien atteinte ----
    expect(day).toBeLessThan(MAX_DAYS);
    expect(profile.facts.every((f) => f.box === 5)).toBe(true);
    expect(profile.facts.every((f) => f.introduced)).toBe(true);
    expect(profile.mascotLevel).toBe(5);
    expect(profile.totalSessions).toBe(playedSessions);
    expect(playedSessions).toBeGreaterThan(0);

    // Toutes les tables (2 → 9) sont marquées comme complétées.
    const completedTables = getCompletedTables(profile.facts);
    for (let t = 2; t <= 9; t++) {
      expect(completedTables.has(t)).toBe(true);
    }

    // ---- 5. Les badges-clés du parcours sont débloqués ----
    const badgeIds = new Set(profile.badges.map((b) => b.id));
    expect(badgeIds.has(BADGE_IDS.PREMIER_PAS)).toBe(true);
    expect(badgeIds.has(BADGE_IDS.EXPLORATION)).toBe(true);
    expect(badgeIds.has(BADGE_IDS.GENIE_MATHS)).toBe(true);
    expect(badgeIds.has(BADGE_IDS.MACHINE)).toBe(true);
    expect(badgeIds.has(BADGE_IDS.VELOCE)).toBe(true);
    for (let t = 2; t <= 9; t++) {
      expect(badgeIds.has(`${BADGE_IDS.TABLE_PREFIX}${t}`)).toBe(true);
    }

    // ---- 6. Le profil final est bien resérialisable ----
    const finalReload = loadProfile();
    expect(finalReload).not.toBeNull();
    expect(finalReload!.facts.every((f) => f.box === 5)).toBe(true);
    expect(finalReload!.badges.length).toBe(profile.badges.length);
  });
});
