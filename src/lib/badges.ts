import type { UserProfile, Badge, MultiFact } from '../types';
import { BADGE_IDS } from '../types';
import { todayISO, daysBetween } from './utils';

function hasBadge(profile: UserProfile, id: string): boolean {
  return profile.badges.some((b) => b.id === id);
}

function makeBadge(def: BadgeDefinition, now: string): Badge {
  return { id: def.id, name: def.name, description: def.description, earnedDate: now, icon: def.icon };
}

export function factsForTable(facts: MultiFact[], table: number): MultiFact[] {
  return facts.filter((f) => f.a === table || f.b === table);
}

export function getCompletedTables(facts: MultiFact[]): Set<number> {
  const completed = new Set<number>();
  for (let t = 2; t <= 9; t++) {
    const tf = factsForTable(facts, t);
    if (tf.length > 0 && tf.every((f) => f.box >= 5)) {
      completed.add(t);
    }
  }
  return completed;
}

// Single source of truth for all badge metadata
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ALL_BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: BADGE_IDS.PREMIER_PAS, name: 'Premier pas', description: 'Terminer la première séance', icon: '🌱' },
  { id: BADGE_IDS.REGULIER, name: 'Régularité', description: '7 jours consécutifs', icon: '🔥' },
  { id: BADGE_IDS.MACHINE, name: 'Machine', description: '10 bonnes réponses de suite', icon: '⚡' },
  { id: BADGE_IDS.EXPLORATION, name: 'Exploration', description: 'Avoir vu tous les faits', icon: '🗺️' },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `${BADGE_IDS.TABLE_PREFIX}${i + 2}`,
    name: `Table de ${i + 2}`,
    description: `Maîtriser la table de ${i + 2}`,
    icon: '⭐',
  })),
  { id: BADGE_IDS.GENIE_MATHS, name: 'Génie des maths', description: 'Tous les faits en boîte 5', icon: '🏆' },
  { id: BADGE_IDS.VELOCE, name: 'Véloce', description: '5 réponses < 2s de suite', icon: '🚀' },
  { id: BADGE_IDS.PERSEVERANCE, name: 'Persévérance', description: 'Revenir après 3+ jours', icon: '💪' },
  { id: BADGE_IDS.FLAMME_ETERNELLE, name: 'Flamme éternelle', description: '30 jours consécutifs', icon: '🌟' },
];

const BADGE_MAP = new Map(ALL_BADGE_DEFINITIONS.map((d) => [d.id, d]));

/**
 * Checks all badge conditions and returns the list of *newly earned* badges.
 *
 * @param previousLastSessionDate - The lastSessionDate BEFORE this session's update,
 *   needed to check the PERSEVERANTE badge (comeback after 3+ days).
 */
export function checkBadges(
  profile: UserProfile,
  sessionStats?: { consecutiveCorrect: number; fastAnswers: number[] },
  previousLastSessionDate?: string | null,
): Badge[] {
  const now = todayISO();
  const newBadges: Badge[] = [];

  function earn(id: string) {
    const def = BADGE_MAP.get(id);
    if (def && !hasBadge(profile, id)) {
      newBadges.push(makeBadge(def, now));
    }
  }

  if (profile.totalSessions >= 1) earn(BADGE_IDS.PREMIER_PAS);
  if (profile.currentStreak >= 7) earn(BADGE_IDS.REGULIER);
  if (profile.currentStreak >= 30) earn(BADGE_IDS.FLAMME_ETERNELLE);
  if (profile.facts.every((f) => f.introduced)) earn(BADGE_IDS.EXPLORATION);
  if (profile.facts.every((f) => f.box === 5)) earn(BADGE_IDS.GENIE_MATHS);

  if (sessionStats?.consecutiveCorrect && sessionStats.consecutiveCorrect >= 10) {
    earn(BADGE_IDS.MACHINE);
  }

  if (sessionStats && hasConsecutiveFastAnswers(sessionStats.fastAnswers, 5, 2000)) {
    earn(BADGE_IDS.VELOCE);
  }

  // Persévérance: check against the PREVIOUS lastSessionDate (before this session updated it)
  if (previousLastSessionDate && daysBetween(previousLastSessionDate, now) >= 3) {
    earn(BADGE_IDS.PERSEVERANCE);
  }

  for (let n = 2; n <= 9; n++) {
    const tableFacts = factsForTable(profile.facts, n);
    if (tableFacts.length > 0 && tableFacts.every((f) => f.box >= 4)) {
      earn(`${BADGE_IDS.TABLE_PREFIX}${n}`);
    }
  }

  return newBadges;
}

function hasConsecutiveFastAnswers(times: number[], count: number, thresholdMs: number): boolean {
  let consecutive = 0;
  for (const time of times) {
    if (time < thresholdMs) {
      consecutive++;
      if (consecutive >= count) return true;
    } else {
      consecutive = 0;
    }
  }
  return false;
}

export function computeMascotLevel(profile: UserProfile): number {
  const { facts } = profile;
  // Single pass to count per-box thresholds
  let box2Plus = 0, box3Plus = 0, box4Plus = 0, box5 = 0;
  for (const f of facts) {
    if (f.box >= 2) box2Plus++;
    if (f.box >= 3) box3Plus++;
    if (f.box >= 4) box4Plus++;
    if (f.box >= 5) box5++;
  }
  if (box5 >= 36) return 5;
  if (box4Plus >= 25) return 4;
  if (box3Plus >= 15) return 3;
  if (box2Plus >= 5) return 2;
  return 1;
}
