import { useMemo } from 'react';

function toDateOnly(isoDate: string): Date {
  // Parse as local date (YYYY-MM-DD), ignoring time component
  const [year, month, day] = isoDate.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

function todayDateOnly(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs(b.getTime() - a.getTime()) / msPerDay);
}

interface UseStreakInput {
  lastSessionDate: string | null;
  currentStreak: number;
}

interface UseStreakResult {
  currentStreak: number;
  isNewDay: boolean;
  daysMissed: number;
}

export function useStreak({ lastSessionDate, currentStreak }: UseStreakInput): UseStreakResult {
  return useMemo(() => {
    const today = todayDateOnly();

    // First session ever
    if (lastSessionDate === null) {
      return { currentStreak: 0, isNewDay: true, daysMissed: 0 };
    }

    const lastDate = toDateOnly(lastSessionDate);
    const diff = daysBetween(lastDate, today);

    if (diff === 0) {
      // Same day: streak unchanged, not a new day
      return { currentStreak, isNewDay: false, daysMissed: 0 };
    }

    if (diff === 1) {
      // Yesterday: streak continues, new day
      return { currentStreak: currentStreak + 1, isNewDay: true, daysMissed: 0 };
    }

    // 2+ days ago: streak resets
    return { currentStreak: 0, isNewDay: true, daysMissed: diff };
  }, [lastSessionDate, currentStreak]);
}
