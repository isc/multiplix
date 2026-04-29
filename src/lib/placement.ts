import type { MultiFact, BoxLevel } from '../types';
import { RESPONSE_TIME } from '../types';
import { computeNextDue } from './leitner';

// `a` et `b` sont normalisés (a ≤ b) — même invariant que `MultiFact`,
// nécessaire pour la comparaison de dominance ci-dessous.
export interface PlacementResult {
  a: number;
  b: number;
  correct: boolean;
  timeMs: number;
}

function boxFromResult(result: PlacementResult): BoxLevel {
  if (!result.correct) return 1;
  if (result.timeMs < RESPONSE_TIME.FAST) return 3;
  if (result.timeMs < RESPONSE_TIME.SLOW) return 2;
  return 1;
}

// Marque comme introduit (boîte 2) tout fait non encore introduit qui est
// "dominé" par au moins un élément de `evidence` : un (eA, eB) domine un
// fait (a, b) si eA ≥ a ET eB ≥ b. Repose sur l'invariant a ≤ b côté facts
// et evidence.
function markDominated(
  facts: MultiFact[],
  evidence: Array<{ a: number; b: number }>,
  today: string,
): void {
  for (const fact of facts) {
    if (fact.introduced) continue;
    if (evidence.some((e) => e.a >= fact.a && e.b >= fact.b)) {
      fact.introduced = true;
      fact.box = 2;
      fact.lastSeen = today;
      fact.nextDue = computeNextDue(2, today);
    }
  }
}

// Pass 1 : place chaque fait directement testé à la boîte qui correspond
// à la vitesse de réponse.
//
// Pass 2 : marque comme introduits (boîte 2) les faits non testés mais
// dominés par un test correct. Sans cette passe, 2×2 et 2×3 (jamais
// testés) restent introduced=false, l'image mystère les cache, et
// shouldIntroduceNew se bloque dès qu'un fait du placement est en boîte 1.
export function seedFromPlacement(
  facts: MultiFact[],
  results: PlacementResult[],
  today: string,
): void {
  if (results.length === 0) return;

  for (const result of results) {
    const fact = facts.find((f) => f.a === result.a && f.b === result.b);
    if (!fact) continue;
    const box = boxFromResult(result);
    fact.introduced = true;
    fact.box = box;
    fact.lastSeen = today;
    fact.nextDue = computeNextDue(box, today);
    fact.history = [{
      date: today,
      correct: result.correct,
      responseTimeMs: result.timeMs,
      answeredWith: null,
    }];
  }

  markDominated(facts, results.filter((r) => r.correct), today);
}

// Migration : pour les profils créés avant l'ajout de la 2ᵉ passe de
// seedFromPlacement, infère les faits manquants à partir des faits déjà
// introduits qui ont au moins une bonne réponse en historique.
// Idempotent : un profil sain reste inchangé (pas de candidat à inférer).
export function inferIntroductionsFromKnowns(
  facts: MultiFact[],
  today: string,
): void {
  const evidence = facts.filter(
    (f) => f.introduced && f.history.some((h) => h.correct),
  );
  if (evidence.length === 0) return;
  markDominated(facts, evidence, today);
}
