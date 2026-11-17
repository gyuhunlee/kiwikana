import type { Sentence, Token } from './types';

export interface Problem {
  rule: 'CT-20' | 'CT-21' | 'CT-23' | 'CT-24';
  sentenceId: string;
  message: string;
}

const KANJI = /[㐀-鿿豈-﫿々〆]/;

// CT-22
export function isTappable(token: Token): boolean {
  return token.wordId !== undefined && !token.isParticle;
}

function targetRuns(tokens: readonly Token[]): number {
  return tokens.filter((token, index) => token.isTarget && !tokens[index - 1]?.isTarget).length;
}

function furiganaProblem(token: Token): string | null {
  const covered = new Set<number>();
  for (const run of token.furigana ?? []) {
    if (run.start < 0 || run.end > token.surface.length || run.start >= run.end) return `bad range in "${token.surface}"`;
    for (let index = run.start; index < run.end; index += 1) covered.add(index);
  }
  for (let index = 0; index < token.surface.length; index += 1) {
    const isKanji = KANJI.test(token.surface[index] ?? '');
    if (isKanji && !covered.has(index)) return `kanji without furigana in "${token.surface}"`;
    if (!isKanji && covered.has(index)) return `furigana over a non-kanji character in "${token.surface}"`;
  }
  return null;
}

/** `text` is the sentence as stored on the server, when the export has it. */
export function validateSentence(sentence: Sentence, text?: string): Problem[] {
  const problems: Problem[] = [];
  const add = (rule: Problem['rule'], message: string) => problems.push({ rule, sentenceId: sentence.id, message });

  // CT-20
  const joined = sentence.tokens.map((token) => token.surface).join('');
  if (joined === '') add('CT-20', 'no tokens');
  if (text !== undefined && joined !== text) add('CT-20', `tokens join to "${joined}", sentence is "${text}"`);

  // CT-21
  if (targetRuns(sentence.tokens) !== 1) add('CT-21', `${targetRuns(sentence.tokens)} target runs, expected 1`);
  if (sentence.tokens.some((token) => token.isTarget && token.wordId !== sentence.wordId)) {
    add('CT-21', 'a target token does not point at the sentence word');
  }

  // CT-23
  for (const token of sentence.tokens) {
    const problem = furiganaProblem(token);
    if (problem) add('CT-23', problem);
  }

  // CT-24
  const [start, end] = sentence.targetSpan;
  if (!(start >= 0 && end <= sentence.translation.length && start < end)) add('CT-24', 'targetSpan is outside the translation or empty');

  return problems;
}
