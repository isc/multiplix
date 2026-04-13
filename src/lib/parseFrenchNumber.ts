// Parse a French-language spoken number (0-100) into an integer.
// Accepts:
//  - pure digit strings: "24", "7"
//  - canonical French: "vingt-quatre", "soixante et onze", "quatre-vingts"
//  - digit sequences: "deux quatre" (read as "24")
// Returns null if the input cannot be interpreted as a number in range.

const UNITS: Record<string, number> = {
  zero: 0,
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
};

const TEENS: Record<string, number> = {
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  'dix sept': 17,
  'dix huit': 18,
  'dix neuf': 19,
};

const TENS: Record<string, number> = {
  vingt: 20,
  trente: 30,
  quarante: 40,
  cinquante: 50,
  soixante: 60,
};

function unitWord(n: number): string {
  for (const [w, v] of Object.entries(UNITS)) {
    if (v === n && w !== 'une') return w;
  }
  return '';
}

function teenWord(n: number): string {
  for (const [w, v] of Object.entries(TEENS)) {
    if (v === n) return w;
  }
  return '';
}

function buildPhraseMap(): Map<string, number> {
  const m = new Map<string, number>();

  for (const [w, n] of Object.entries(UNITS)) m.set(w, n);
  for (const [w, n] of Object.entries(TEENS)) m.set(w, n);

  // 20..69 (regular tens)
  for (const [tw, tn] of Object.entries(TENS)) {
    m.set(tw, tn);
    m.set(`${tw}s`, tn);
    m.set(`${tw} et un`, tn + 1);
    m.set(`${tw} et une`, tn + 1);
    for (let u = 2; u <= 9; u++) {
      m.set(`${tw} ${unitWord(u)}`, tn + u);
    }
  }

  // 70..79 : "soixante-<teen>"
  for (let x = 10; x <= 19; x++) {
    const xw = teenWord(x);
    if (!xw) continue;
    m.set(`soixante ${xw}`, 60 + x);
    if (x === 11) m.set(`soixante et ${xw}`, 60 + x);
  }

  // 80..89 : "quatre-vingt[-u]"
  m.set('quatre vingt', 80);
  m.set('quatre vingts', 80);
  for (let u = 1; u <= 9; u++) {
    m.set(`quatre vingt ${unitWord(u)}`, 80 + u);
  }
  // "quatre-vingt-et-un" is archaic but sometimes pronounced
  m.set('quatre vingt et un', 81);

  // 90..99 : "quatre-vingt-<teen>"
  for (let x = 10; x <= 19; x++) {
    const xw = teenWord(x);
    if (!xw) continue;
    m.set(`quatre vingt ${xw}`, 80 + x);
  }

  m.set('cent', 100);

  return m;
}

const PHRASE_MAP = buildPhraseMap();

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-\u2010-\u2015]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseFrenchNumber(input: string): number | null {
  const s = normalize(input);
  if (!s) return null;

  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }

  if (PHRASE_MAP.has(s)) return PHRASE_MAP.get(s)!;

  // Digit-by-digit fallback: "deux quatre" -> 24, "2 4" -> 24
  const tokens = s.split(' ');
  if (tokens.length === 2) {
    const [aTok, bTok] = tokens;
    const a = /^\d$/.test(aTok) ? parseInt(aTok, 10) : UNITS[aTok];
    const b = /^\d$/.test(bTok) ? parseInt(bTok, 10) : UNITS[bTok];
    if (a !== undefined && b !== undefined && a >= 0 && a < 10 && b >= 0 && b < 10) {
      return a * 10 + b;
    }
  }

  // Last resort: strip all non-digit chars and see if a number appears
  const digitsOnly = s.replace(/\D/g, '');
  if (digitsOnly && digitsOnly.length <= 3) {
    return parseInt(digitsOnly, 10);
  }

  return null;
}
