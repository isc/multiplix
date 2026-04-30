import type { UserProfile } from '../types';
import { daysBetween } from './utils';

// Renvoie la série affichable à `today`. La valeur stockée
// (`profile.currentStreak`) est figée à la dernière séance complétée et ne
// décroît pas toute seule — sans cette dérivation, un utilisateur qui rate
// plusieurs jours voit toujours sa vieille série affichée jusqu'à ce qu'une
// nouvelle séance se termine. La série n'est « active » que si la dernière
// séance complétée date d'aujourd'hui ou d'hier.
export function getActiveStreak(profile: UserProfile, today: string): number {
  if (!profile.lastSessionDate) return 0;
  return daysBetween(profile.lastSessionDate, today) <= 1
    ? profile.currentStreak
    : 0;
}
