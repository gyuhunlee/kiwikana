import type { FeedContent } from '../../home/words/words.types';
import type { Deck } from '../content/types';

// Stand-in content for tests and the dev menu until real content lands (M2).
// N5: Core 1–3 then Food 1–2, 20 words each. Word ids read `core1-01` … `food2-20`.

const pad = (value: number): string => String(value).padStart(2, '0');

function deck(theme: string, slug: string, part: 1 | 2 | 3, order: number, size = 20): Deck {
  const id = `${slug}${part}`;
  return {
    id,
    level: 'N5',
    theme,
    part,
    name: `N5 ${theme} ${part}`,
    wordIds: Array.from({ length: size }, (_, index) => `${id}-${pad(index + 1)}`),
    order,
  };
}

export function fixtureDecks(): Deck[] {
  return [
    deck('Core', 'core', 1, 1),
    deck('Core', 'core', 2, 2),
    deck('Core', 'core', 3, 3),
    deck('Food', 'food', 1, 4),
    deck('Food', 'food', 2, 5),
  ];
}

export function fixtureContent(): FeedContent {
  const decks = fixtureDecks();
  return { decks, readyDeckIds: decks.map((d) => d.id) };
}
