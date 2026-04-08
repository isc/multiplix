import type { UserProfile } from '../types';
import { createInitialFacts } from './facts';
import { todayISO } from './utils';

const STORAGE_KEY = 'multiplix-profile';

/**
 * Loads the user profile from localStorage.
 * Returns null if no profile exists or if parsing fails.
 */
export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidProfile(parsed)) return null;
    return migrateProfile(parsed as UserProfile);
  } catch {
    return null;
  }
}

/**
 * Saves the user profile to localStorage.
 */
export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/**
 * Exports a profile as a JSON string (for backup / transfer).
 */
export function exportProfile(profile: UserProfile): string {
  return JSON.stringify(profile, null, 2);
}

/**
 * Imports a profile from a JSON string.
 * Returns null if the JSON is invalid or doesn't match the expected shape.
 */
export function importProfile(json: string): UserProfile | null {
  try {
    const parsed = JSON.parse(json);
    if (!isValidProfile(parsed)) return null;
    return migrateProfile(parsed as UserProfile);
  } catch {
    return null;
  }
}

/**
 * Creates a fresh user profile with the given name.
 * All 36 facts start in box 1, not yet introduced.
 */
export function createNewProfile(name: string): UserProfile {
  const now = todayISO();
  return {
    name,
    startDate: now,
    facts: createInitialFacts(),
    totalSessions: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastSessionDate: null,
    badges: [],
    mascotLevel: 1,
    sessionHistory: [],
  };
}

/**
 * Migrates older profiles to the current shape.
 * Ensures backward compatibility when new fields are added.
 */
function migrateProfile(profile: UserProfile): UserProfile {
  if (!Array.isArray(profile.sessionHistory)) {
    profile.sessionHistory = [];
  }
  return profile;
}

/**
 * Basic structural validation of a profile object.
 */
function isValidProfile(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;

  const p = obj as Record<string, unknown>;

  if (typeof p.name !== 'string') return false;
  if (typeof p.startDate !== 'string') return false;
  if (!Array.isArray(p.facts)) return false;
  if (typeof p.totalSessions !== 'number') return false;
  if (typeof p.currentStreak !== 'number') return false;
  if (typeof p.longestStreak !== 'number') return false;
  if (!Array.isArray(p.badges)) return false;
  if (typeof p.mascotLevel !== 'number') return false;

  // Validate each fact has the expected shape
  for (const fact of p.facts) {
    if (typeof fact !== 'object' || fact === null) return false;
    const f = fact as Record<string, unknown>;
    if (typeof f.a !== 'number' || typeof f.b !== 'number') return false;
    if (typeof f.product !== 'number') return false;
    if (typeof f.box !== 'number' || f.box < 1 || f.box > 5) return false;
    if (typeof f.introduced !== 'boolean') return false;
    if (!Array.isArray(f.history)) return false;
  }

  return true;
}
