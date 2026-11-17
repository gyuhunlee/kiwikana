// Read-only content shapes (docs/specs/content.md, Shapes). IDs are stable forever (CT-1).

export type Level = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type Script = 'hiragana' | 'katakana';

export interface Word {
  id: string;
  kanji: string;
  kana: string;
  romaji: string;
  meaning: string;
  level: Level;
  deckId: string;
  order: number;
  pictureAnime: string;
  pictureRealistic: string;
  audio: string;
  sentenceIds: [string, string];
}

export interface FuriganaRun {
  start: number;
  end: number;
  reading: string;
}

export interface Token {
  surface: string;
  furigana?: FuriganaRun[];
  dictionaryForm: string;
  romaji: string;
  meaning?: string;
  wordId?: string;
  isParticle: boolean;
  isTarget: boolean;
}

export interface Sentence {
  id: string;
  wordId: string;
  tokens: Token[];
  translation: string;
  targetSpan: [number, number];
  audio: string;
}

export interface Deck {
  id: string;
  level: Level;
  theme: string;
  part: 1 | 2 | 3;
  name: string;
  wordIds: string[];
  order: number;
}

export interface KanaGroup {
  script: Script;
  section: 'gojuon' | 'dakuon' | 'yoon' | 'sokuon';
  id: string;
  order: number;
  kana: string[];
}

export interface Kana {
  script: Script;
  char: string;
  romaji: string;
  audio: string;
  exampleWordIds: string[];
  strokeFile: string;
}

export interface KanaWord {
  id: string;
  script: Script;
  kana: string;
  parts: { kana: string; romaji: string }[];
  romaji: string;
  meaning: string;
  audio: string;
  groupId: string;
}

export interface StrokePath {
  points: [number, number][];
}

export interface Strokes {
  char: string;
  strokes: StrokePath[];
}
