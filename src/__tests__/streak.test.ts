// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { getActiveStreak } from '../lib/streak';
import { createNewProfile } from '../lib/storage';
import type { UserProfile } from '../types';

function makeProfile(overrides: Partial<UserProfile>): UserProfile {
  return { ...createNewProfile('Test'), ...overrides };
}

describe('getActiveStreak', () => {
  it('renvoie 0 quand aucune séance n\'a jamais été complétée', () => {
    const profile = makeProfile({ lastSessionDate: null, currentStreak: 0 });
    expect(getActiveStreak(profile, '2026-04-30')).toBe(0);
  });

  it('renvoie la valeur stockée si la dernière séance est aujourd\'hui', () => {
    const profile = makeProfile({ lastSessionDate: '2026-04-30', currentStreak: 5 });
    expect(getActiveStreak(profile, '2026-04-30')).toBe(5);
  });

  it('renvoie la valeur stockée si la dernière séance est hier (la série peut encore être prolongée)', () => {
    const profile = makeProfile({ lastSessionDate: '2026-04-29', currentStreak: 3 });
    expect(getActiveStreak(profile, '2026-04-30')).toBe(3);
  });

  it('renvoie 0 si la dernière séance date d\'avant-hier (série rompue)', () => {
    const profile = makeProfile({ lastSessionDate: '2026-04-28', currentStreak: 7 });
    expect(getActiveStreak(profile, '2026-04-30')).toBe(0);
  });

  it('renvoie 0 si la dernière séance date d\'il y a une semaine', () => {
    const profile = makeProfile({ lastSessionDate: '2026-04-23', currentStreak: 12 });
    expect(getActiveStreak(profile, '2026-04-30')).toBe(0);
  });
});
