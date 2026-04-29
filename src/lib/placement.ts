import type { MultiFact, BoxLevel } from '../types';
import { BOX_INTERVALS, RESPONSE_TIME } from '../types';
import { addDays } from './leitner';
import { getFactKey } from './facts';

export interface PlacementResult {
  factKey: string; // ex: "3x7" — produit par getFactKey, donc "min x max"
  correct: boolean;
  timeMs: number;
}

function boxFromResult(result: PlacementResult): BoxLevel {
  if (!result.correct) return 1;
  if (result.timeMs < RESPONSE_TIME.FAST) return 3;
  if (result.timeMs < RESPONSE_TIME.SLOW) return 2;
  return 1;
}

// Initialise les faits à partir des résultats du test de placement, en place.
//
// Pass 1 : les faits directement testés sont placés à la boîte qui correspond
// à la vitesse de réponse (cf. boxFromResult).
//
// Pass 2 : les faits non testés mais "dominés" par un test correct sont
// marqués introduits à la boîte 2. Domination : un test (aT,bT) domine un
// fait (a,b) si aT ≥ a ET bT ≥ b (avec aT ≤ bT et a ≤ b grâce à la
// normalisation min/max). Intuition : si l'enfant sait 6×9, on suppose
// qu'il sait aussi 2×3. Sans cette passe, 2×2 et 2×3 (jamais testés au
// placement) restent introduced=false, l'image mystère les cache, et
// shouldIntroduceNew se bloque dès qu'un fait du placement est en boîte 1.
export function seedFromPlacement(
  facts: MultiFact[],
  results: PlacementResult[],
  today: string,
): MultiFact[] {
  if (results.length === 0) return facts;

  for (const result of results) {
    const fact = facts.find((f) => getFactKey(f.a, f.b) === result.factKey);
    if (!fact) continue;
    const box = boxFromResult(result);
    fact.introduced = true;
    fact.box = box;
    fact.lastSeen = today;
    fact.nextDue = addDays(today, BOX_INTERVALS[box]);
    fact.history = [{
      date: today,
      correct: result.correct,
      responseTimeMs: result.timeMs,
      answeredWith: null,
    }];
  }

  for (const fact of facts) {
    if (fact.introduced) continue;
    const dominated = results.some((r) => {
      if (!r.correct) return false;
      const [aT, bT] = r.factKey.split('x').map(Number);
      return aT >= fact.a && bT >= fact.b;
    });
    if (dominated) {
      fact.introduced = true;
      fact.box = 2;
      fact.lastSeen = today;
      fact.nextDue = addDays(today, BOX_INTERVALS[2]);
    }
  }

  return facts;
}

// Migration : pour les profils créés avant l'ajout de la 2ᵉ passe de
// seedFromPlacement, infère les faits manquants à partir des faits déjà
// introduits qui ont au moins une bonne réponse dans leur historique.
// Idempotent : un profil sain (tous faits introduits) reste inchangé.
export function inferIntroductionsFromKnowns(
  facts: MultiFact[],
  today: string,
): MultiFact[] {
  const evidence = facts.filter(
    (f) => f.introduced && f.history.some((h) => h.correct),
  );
  if (evidence.length === 0) return facts;

  for (const fact of facts) {
    if (fact.introduced) continue;
    const dominated = evidence.some((e) => e.a >= fact.a && e.b >= fact.b);
    if (dominated) {
      fact.introduced = true;
      fact.box = 2;
      fact.lastSeen = today;
      fact.nextDue = addDays(today, BOX_INTERVALS[2]);
    }
  }

  return facts;
}
