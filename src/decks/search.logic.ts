import type { Level, Word } from '../shared/content/types';

const LEVEL_ORDER: Record<Level, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };
const MACRONS: Record<string, string> = { ā: 'a', ī: 'i', ū: 'u', ē: 'e', ō: 'o' };

// DK-10: `toukyou`, `tokyo` and `tōkyō` all become `tokyo`.
export function normalizeRomaji(text: string): string {
  return text
    .toLowerCase()
    .replace(/[āīūēō]/g, (letter) => MACRONS[letter] ?? letter)
    .replace(/[\s\-']/g, '')
    .replace(/ou|oo/g, 'o')
    .replace(/uu/g, 'u')
    .replace(/aa/g, 'a')
    .replace(/ii/g, 'i')
    .replace(/ee/g, 'e');
}

const EXACT = 0;
const PREFIX = 1;
const CONTAINS = 2;
const NO_MATCH = 3;

function rank(field: string, query: string): number {
  if (field === query) return EXACT;
  if (field.startsWith(query)) return PREFIX;
  return field.includes(query) ? CONTAINS : NO_MATCH;
}

// DK-10, DK-11
export function searchWords(words: readonly Word[], rawQuery: string): Word[] {
  const query = rawQuery.trim().toLowerCase();
  if (query === '') return [];
  const romajiQuery = normalizeRomaji(query);

  return words
    .map((word) => ({
      word,
      rank: Math.min(
        rank(word.kanji, query),
        rank(word.kana, query),
        rank(word.meaning.toLowerCase(), query),
        romajiQuery === '' ? NO_MATCH : rank(normalizeRomaji(word.romaji), romajiQuery),
      ),
    }))
    .filter((hit) => hit.rank < NO_MATCH)
    .sort((a, b) => a.rank - b.rank || LEVEL_ORDER[a.word.level] - LEVEL_ORDER[b.word.level] || a.word.order - b.word.order)
    .map((hit) => hit.word);
}
