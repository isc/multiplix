// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { getStrategy } from '../lib/strategies';

describe('getStrategy', () => {
  it('returns null for the ×2 table (taught via repeated addition)', () => {
    for (let b = 2; b <= 9; b++) {
      expect(getStrategy(2, b), `2×${b}`).toBeNull();
      expect(getStrategy(b, 2), `${b}×2`).toBeNull();
    }
  });

  it('returns null for 3×3 (small square, grid is enough)', () => {
    expect(getStrategy(3, 3)).toBeNull();
  });

  it('returns a strategy for every other fact (3..9, skipping ×2 and 3×3)', () => {
    for (let a = 3; a <= 9; a++) {
      for (let b = a; b <= 9; b++) {
        if (a === 3 && b === 3) continue;
        const s = getStrategy(a, b);
        expect(s, `${a}×${b}`).not.toBeNull();
      }
    }
  });

  it('is commutative — same strategy whichever order is passed', () => {
    for (let a = 2; a <= 9; a++) {
      for (let b = 2; b <= 9; b++) {
        expect(getStrategy(a, b)).toEqual(getStrategy(b, a));
      }
    }
  });

  it('final line of each strategy resolves to the correct product', () => {
    for (let a = 3; a <= 9; a++) {
      for (let b = a; b <= 9; b++) {
        const s = getStrategy(a, b);
        if (!s) continue;
        const last = s.lines[s.lines.length - 1];
        expect(last, `${a}×${b}`).toBe(`= ${a * b}`);
      }
    }
  });

  // Priority order: 9 > 5 > 3 > 4 > 6 > 7 > 8
  it('prioritises near-ten when one operand is 9', () => {
    expect(getStrategy(3, 9)?.kind).toBe('near-ten');
    expect(getStrategy(7, 9)?.kind).toBe('near-ten');
    expect(getStrategy(9, 9)?.kind).toBe('near-ten');
  });

  it('prioritises skip-count when one operand is 5 (and none is 9)', () => {
    expect(getStrategy(3, 5)?.kind).toBe('skip-count');
    expect(getStrategy(5, 8)?.kind).toBe('skip-count');
    expect(getStrategy(5, 5)?.kind).toBe('skip-count');
  });

  it('prioritises double-add (×3) over ×4/6/7/8', () => {
    expect(getStrategy(3, 4)?.kind).toBe('double-add');
    expect(getStrategy(3, 7)?.kind).toBe('double-add');
    expect(getStrategy(3, 8)?.kind).toBe('double-add');
  });

  it('uses double-double (×4) when no 9/5/3 is present', () => {
    expect(getStrategy(4, 4)?.kind).toBe('double-double');
    expect(getStrategy(4, 7)?.kind).toBe('double-double');
    expect(getStrategy(4, 8)?.kind).toBe('double-double');
  });

  it('uses five-plus-one (×6) when pivot is 6', () => {
    expect(getStrategy(6, 6)?.kind).toBe('five-plus-one');
    expect(getStrategy(6, 7)?.kind).toBe('five-plus-one');
    expect(getStrategy(6, 8)?.kind).toBe('five-plus-one');
  });

  it('uses five-plus-two (×7) when pivot is 7', () => {
    expect(getStrategy(7, 7)?.kind).toBe('five-plus-two');
    expect(getStrategy(7, 8)?.kind).toBe('five-plus-two');
  });

  it('uses double-double-double (×8) for 8×8', () => {
    expect(getStrategy(8, 8)?.kind).toBe('double-double-double');
  });

  it('renders the strategy with the “other” operand on the left', () => {
    // 3 × 9 should show "3 × 9 = 3 × 10 − 3 = 30 − 3 = 27"
    const s = getStrategy(3, 9);
    expect(s?.lines[0]).toBe('3 × 9 = 3 × 10 − 3');
    expect(s?.lines[2]).toBe('= 27');
  });
});
