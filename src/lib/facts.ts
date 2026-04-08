import type { MultiFact } from '../types';

/**
 * Returns a normalized key for a multiplication fact.
 * Always uses the smaller operand first: "2x3" (never "3x2").
 */
export function getFactKey(a: number, b: number): string {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return `${lo}x${hi}`;
}

/**
 * Generates the 36 unique multiplication facts (a×b where 2 ≤ a ≤ b ≤ 9).
 * Each fact starts in box 1 with introduced=false.
 */
export function createInitialFacts(): MultiFact[] {
  const facts: MultiFact[] = [];

  for (let a = 2; a <= 9; a++) {
    for (let b = a; b <= 9; b++) {
      facts.push({
        a,
        b,
        product: a * b,
        box: 1,
        lastSeen: '',
        nextDue: '',
        history: [],
        introduced: false,
      });
    }
  }

  return facts;
}
