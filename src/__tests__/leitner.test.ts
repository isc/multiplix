// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { shouldIntroduceNew } from '../lib/leitner';
import { createInitialFacts } from '../lib/facts';
import type { MultiFact } from '../types';

function intro(fact: MultiFact, box: 1 | 2 | 3 | 4 | 5): MultiFact {
  return { ...fact, introduced: true, box };
}

describe('shouldIntroduceNew', () => {
  it('renvoie true si aucun fait n\'est introduit', () => {
    expect(shouldIntroduceNew(createInitialFacts())).toBe(true);
  });

  it('renvoie true si tous les introduits sont en boîte ≥ 2', () => {
    const facts = createInitialFacts().map((f) => intro(f, 2));
    expect(shouldIntroduceNew(facts)).toBe(true);
  });

  it('renvoie false si un fait introduit est en boîte 1 (cas général)', () => {
    const facts = createInitialFacts();
    facts[0] = intro(facts[0], 1);
    for (let i = 1; i < 10; i++) facts[i] = intro(facts[i], 2);
    // 10 introduits dont 1 en boîte 1, 26 non introduits → cas général
    expect(shouldIntroduceNew(facts)).toBe(false);
  });

  it('relâche la règle quand il ne reste que ≤ 2 faits à introduire', () => {
    // 34 introduits dont 1 en boîte 1, 2 non introduits (typique post-placement)
    const facts = createInitialFacts();
    for (let i = 0; i < 34; i++) {
      facts[i] = intro(facts[i], i === 0 ? 1 : 2);
    }
    // facts[34] et facts[35] restent introduced=false
    expect(shouldIntroduceNew(facts)).toBe(true);
  });

  it('relâche la règle aussi avec 1 seul fait restant', () => {
    const facts = createInitialFacts();
    for (let i = 0; i < 35; i++) {
      facts[i] = intro(facts[i], i === 0 ? 1 : 3);
    }
    expect(shouldIntroduceNew(facts)).toBe(true);
  });

  it('ne relâche PAS si 3 faits restent à introduire (encore en phase d\'apprentissage)', () => {
    const facts = createInitialFacts();
    for (let i = 0; i < 33; i++) {
      facts[i] = intro(facts[i], i === 0 ? 1 : 2);
    }
    // 33 introduits dont 1 en boîte 1, 3 non introduits
    expect(shouldIntroduceNew(facts)).toBe(false);
  });
});
