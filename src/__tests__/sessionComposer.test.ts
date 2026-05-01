// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { composeSession } from '../lib/sessionComposer';
import { createInitialFacts, getFactKey } from '../lib/facts';
import { computeNextDue, addDays } from '../lib/leitner';
import { createNewProfile } from '../lib/storage';
import type { MultiFact, UserProfile, BoxLevel } from '../types';

const TODAY = '2026-05-01';

function profileWith(facts: MultiFact[]): UserProfile {
  return { ...createNewProfile('Zoé'), facts };
}

function introduce(
  facts: MultiFact[],
  a: number,
  b: number,
  box: BoxLevel,
  introDate: string,
  lastSeen: string,
): void {
  const fact = facts.find((f) => getFactKey(f.a, f.b) === getFactKey(a, b))!;
  fact.introduced = true;
  fact.box = box;
  fact.lastSeen = lastSeen;
  fact.nextDue = computeNextDue(box, lastSeen);
  fact.history = [
    { date: introDate, correct: true, responseTimeMs: 2000, answeredWith: null },
  ];
}

describe('composeSession — introduction des derniers faits', () => {
  it('introduit 8×9 ou 9×9 même si la table de 9 est en révision active hier', () => {
    // Setup : 34 faits introduits il y a longtemps, en boîte 5 (peu dus pour
    // laisser de la place à une intro), dont les faits avec un 9 ont été
    // revus hier (lastSeen = hier). Avant le fix, la similarité forte avec
    // un fait vu < 48h bloquait l'intro de 8×9 et 9×9 indéfiniment.
    const facts = createInitialFacts();
    const yesterday = addDays(TODAY, -1);
    const longAgo = addDays(TODAY, -30);

    for (const f of facts) {
      if (
        getFactKey(f.a, f.b) === getFactKey(8, 9) ||
        getFactKey(f.a, f.b) === getFactKey(9, 9)
      ) {
        continue;
      }
      // Tous en boîte 5 et vus hier → pas dus aujourd'hui (place pour intro).
      // Introduits il y a 30 jours, donc hors de la fenêtre « 48h depuis intro ».
      introduce(facts, f.a, f.b, 5, longAgo, yesterday);
    }

    const session = composeSession(profileWith(facts), TODAY);
    const introduced = session.filter((q) => q.isIntroduction).map((q) =>
      getFactKey(q.fact.a, q.fact.b),
    );
    const candidates = [getFactKey(8, 9), getFactKey(9, 9)];
    expect(introduced.some((k) => candidates.includes(k))).toBe(true);
  });

  it("n'introduit pas un fait similaire à un fait introduit dans les 48h", () => {
    // Garde-fou pour la spec : 8×9 introduit hier → 9×9 ne doit pas être
    // introduit aujourd'hui (similarité forte, opérande 9 partagé).
    const facts = createInitialFacts();
    const yesterday = addDays(TODAY, -1);
    const longAgo = addDays(TODAY, -30);

    for (const f of facts) {
      if (getFactKey(f.a, f.b) === getFactKey(9, 9)) continue;
      const isRecentIntro = getFactKey(f.a, f.b) === getFactKey(8, 9);
      introduce(
        facts,
        f.a,
        f.b,
        2,
        isRecentIntro ? yesterday : longAgo,
        isRecentIntro ? yesterday : longAgo,
      );
    }

    const session = composeSession(profileWith(facts), TODAY);
    const introducedKeys = session
      .filter((q) => q.isIntroduction)
      .map((q) => getFactKey(q.fact.a, q.fact.b));
    expect(introducedKeys).not.toContain(getFactKey(9, 9));
  });
});
