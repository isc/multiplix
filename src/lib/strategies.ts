// Stratégies de dérivation par fait — voir specs §3.4bis et audit §4.

export type StrategyKind =
  | 'near-ten'           // ×9 : n×10 − n
  | 'skip-count'         // ×5 : compter par 5
  | 'double-add'         // ×3 : n×2 + n
  | 'double-double'      // ×4 : (n×2) × 2
  | 'five-plus-one'      // ×6 : n×5 + n
  | 'five-plus-two'      // ×7 : n×5 + n×2
  | 'double-double-double'; // ×8 : ((n×2)×2)×2

export interface Strategy {
  kind: StrategyKind;
  /** Phrase courte expliquant l'astuce (ex : « × 9, c'est × 10 moins une fois »). */
  title: string;
  /** Étapes de calcul, une par ligne, à afficher en colonne. */
  lines: string[];
}

interface StrategyTemplate {
  kind: StrategyKind;
  title: string;
  lines: (other: number, product: number) => string[];
}

// Ordre = priorité pédagogique quand plusieurs pivots s'appliquent.
const STRATEGIES: ReadonlyArray<readonly [pivot: number, StrategyTemplate]> = [
  [9, {
    kind: 'near-ten',
    title: '× 9, c’est comme × 10 mais on enlève une fois.',
    lines: (n, p) => [`${n} × 9 = ${n} × 10 − ${n}`, `= ${n * 10} − ${n}`, `= ${p}`],
  }],
  [5, {
    kind: 'skip-count',
    title: '× 5, c’est compter par 5.',
    lines: (n, p) => {
      const sequence = Array.from({ length: n }, (_, i) => (i + 1) * 5).join(' → ');
      const sum = Array.from({ length: n }, () => '5').join(' + ');
      return [`${n} × 5 = ${sum}`, `On compte : ${sequence}`, `= ${p}`];
    },
  }],
  [3, {
    kind: 'double-add',
    title: '× 3, c’est × 2 plus une fois.',
    lines: (n, p) => [`${n} × 3 = ${n} × 2 + ${n}`, `= ${n * 2} + ${n}`, `= ${p}`],
  }],
  [4, {
    kind: 'double-double',
    title: '× 4, c’est le double de × 2.',
    lines: (n, p) => [`${n} × 4 = (${n} × 2) × 2`, `= ${n * 2} × 2`, `= ${p}`],
  }],
  [6, {
    kind: 'five-plus-one',
    title: '× 6, c’est × 5 plus une fois.',
    lines: (n, p) => [`${n} × 6 = ${n} × 5 + ${n}`, `= ${n * 5} + ${n}`, `= ${p}`],
  }],
  [7, {
    kind: 'five-plus-two',
    title: '× 7, c’est × 5 plus × 2.',
    lines: (n, p) => [`${n} × 7 = ${n} × 5 + ${n} × 2`, `= ${n * 5} + ${n * 2}`, `= ${p}`],
  }],
  [8, {
    kind: 'double-double-double',
    title: '× 8, c’est doubler trois fois.',
    lines: (n, p) => [
      `${n} × 8 = ${n} × 2 × 2 × 2`,
      `= ${n * 2} × 2 × 2`,
      `= ${n * 4} × 2`,
      `= ${p}`,
    ],
  }],
];

/**
 * Retourne une stratégie de dérivation adaptée au fait (a, b), ou null
 * si aucune stratégie n'est plus parlante que la grille / l'addition répétée.
 *
 * Faits de base exclus (table de 2, 3 × 3) : la grille animée et
 * l'addition répétée sont déjà la meilleure introduction.
 */
export function getStrategy(a: number, b: number): Strategy | null {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);

  if (lo === 2) return null;
  if (lo === hi && lo === 3) return null;

  for (const [pivot, template] of STRATEGIES) {
    if (lo === pivot || hi === pivot) {
      const other = pivot === lo ? hi : lo;
      return {
        kind: template.kind,
        title: template.title,
        lines: template.lines(other, pivot * other),
      };
    }
  }
  return null;
}

export function hasStrategy(a: number, b: number): boolean {
  return getStrategy(a, b) !== null;
}
