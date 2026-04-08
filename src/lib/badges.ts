import type { UserProfile, Badge, MultiFact } from '../types';
import { BADGE_IDS } from '../types';

/**
 * Returns true if the profile already has a badge with the given id.
 */
function hasBadge(profile: UserProfile, id: string): boolean {
  return profile.badges.some((b) => b.id === id);
}

/**
 * Helper to create a Badge object.
 */
function makeBadge(id: string, name: string, description: string, icon: string, now: string): Badge {
  return { id, name, description, earnedDate: now, icon };
}

/**
 * Returns all facts that belong to a given table number.
 * A fact belongs to table N if N is one of its operands (a or b).
 */
function factsForTable(facts: MultiFact[], table: number): MultiFact[] {
  return facts.filter((f) => f.a === table || f.b === table);
}

/**
 * Computes the number of days between two ISO date strings.
 * Returns a positive number if dateB is after dateA.
 */
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Checks all badge conditions and returns the list of *newly earned* badges.
 *
 * @param profile - The current user profile (after session update).
 * @param sessionStats - Optional stats from the current session (consecutive correct, fast answers).
 */
export function checkBadges(
  profile: UserProfile,
  sessionStats?: { consecutiveCorrect: number; fastAnswers: number[] },
): Badge[] {
  const now = new Date().toISOString().slice(0, 10);
  const newBadges: Badge[] = [];

  // Premier pas: 1st session completed
  if (!hasBadge(profile, BADGE_IDS.PREMIER_PAS) && profile.totalSessions >= 1) {
    newBadges.push(
      makeBadge(BADGE_IDS.PREMIER_PAS, 'Premier pas', 'Terminer la 1re séance', '🌱', now),
    );
  }

  // Régulier·e: 7 consecutive days
  if (!hasBadge(profile, BADGE_IDS.REGULIER) && profile.currentStreak >= 7) {
    newBadges.push(
      makeBadge(BADGE_IDS.REGULIER, 'Régulier·e', '7 jours consécutifs', '🔥', now),
    );
  }

  // Machine: 10 correct in a row in a session
  if (
    !hasBadge(profile, BADGE_IDS.MACHINE) &&
    sessionStats &&
    sessionStats.consecutiveCorrect >= 10
  ) {
    newBadges.push(
      makeBadge(BADGE_IDS.MACHINE, 'Machine', '10 réponses correctes d\'affilée', '⚡', now),
    );
  }

  // Exploratrice: all facts have been introduced
  if (!hasBadge(profile, BADGE_IDS.EXPLORATRICE) && profile.facts.every((f) => f.introduced)) {
    newBadges.push(
      makeBadge(BADGE_IDS.EXPLORATRICE, 'Exploratrice', 'Avoir vu tous les faits au moins une fois', '🗺️', now),
    );
  }

  // Table de N: all facts of table N in box 4+
  for (let n = 2; n <= 9; n++) {
    const badgeId = `${BADGE_IDS.TABLE_PREFIX}${n}`;
    if (!hasBadge(profile, badgeId)) {
      const tableFacts = factsForTable(profile.facts, n);
      if (tableFacts.length > 0 && tableFacts.every((f) => f.box >= 4)) {
        newBadges.push(
          makeBadge(badgeId, `Table de ${n}`, `Tous les faits de la table de ${n} en boîte 4+`, '⭐', now),
        );
      }
    }
  }

  // Mathématicienne: all 36 facts in box 5
  if (!hasBadge(profile, BADGE_IDS.MATHEMATICIENNE) && profile.facts.every((f) => f.box === 5)) {
    newBadges.push(
      makeBadge(BADGE_IDS.MATHEMATICIENNE, 'Mathématicienne', 'Tous les faits en boîte 5', '🏆', now),
    );
  }

  // Véloce: 5 answers < 2s in a row
  if (
    !hasBadge(profile, BADGE_IDS.VELOCE) &&
    sessionStats &&
    hasConsecutiveFastAnswers(sessionStats.fastAnswers, 5, 2000)
  ) {
    newBadges.push(
      makeBadge(BADGE_IDS.VELOCE, 'Véloce', '5 réponses < 2s d\'affilée', '🚀', now),
    );
  }

  // Persévérante: comeback after 3+ days absence
  if (
    !hasBadge(profile, BADGE_IDS.PERSEVERANTE) &&
    profile.lastSessionDate &&
    daysBetween(profile.lastSessionDate, now) >= 3
  ) {
    newBadges.push(
      makeBadge(BADGE_IDS.PERSEVERANTE, 'Persévérante', 'Revenir après 3+ jours d\'absence', '💪', now),
    );
  }

  // Flamme éternelle: 30 consecutive days
  if (!hasBadge(profile, BADGE_IDS.FLAMME_ETERNELLE) && profile.currentStreak >= 30) {
    newBadges.push(
      makeBadge(BADGE_IDS.FLAMME_ETERNELLE, 'Flamme éternelle', '30 jours consécutifs', '🌟', now),
    );
  }

  return newBadges;
}

/**
 * Checks if the array of response times contains `count` consecutive entries below `thresholdMs`.
 */
function hasConsecutiveFastAnswers(
  fastAnswers: number[],
  count: number,
  thresholdMs: number,
): boolean {
  let consecutive = 0;
  for (const time of fastAnswers) {
    if (time < thresholdMs) {
      consecutive++;
      if (consecutive >= count) return true;
    } else {
      consecutive = 0;
    }
  }
  return false;
}

/**
 * Computes the mascot evolution level (1-5) based on fact mastery.
 *
 * | Level | Condition                    |
 * |-------|------------------------------|
 * | 1     | Default (egg)                |
 * | 2     | 5 facts in box 2+            |
 * | 3     | 15 facts in box 3+           |
 * | 4     | 25 facts in box 4+           |
 * | 5     | 36 facts in box 5            |
 */
export function computeMascotLevel(profile: UserProfile): number {
  const { facts } = profile;

  const inBox5 = facts.filter((f) => f.box >= 5).length;
  if (inBox5 >= 36) return 5;

  const inBox4Plus = facts.filter((f) => f.box >= 4).length;
  if (inBox4Plus >= 25) return 4;

  const inBox3Plus = facts.filter((f) => f.box >= 3).length;
  if (inBox3Plus >= 15) return 3;

  const inBox2Plus = facts.filter((f) => f.box >= 2).length;
  if (inBox2Plus >= 5) return 2;

  return 1;
}
