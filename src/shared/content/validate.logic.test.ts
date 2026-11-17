import { describe, expect, it } from 'vitest';
import type { Sentence, Token } from './types';
import { isTappable, validateSentence } from './validate.logic';

const token = (surface: string, patch: Partial<Token> = {}): Token => ({
  surface, dictionaryForm: surface, romaji: '', isParticle: false, isTarget: false, ...patch,
});
const good: Sentence = {
  id: 's1', wordId: 'ame', translation: "It's raining.", targetSpan: [5, 12], audio: 's1.m4a',
  tokens: [
    token('雨', { furigana: [{ start: 0, end: 1, reading: 'あめ' }], wordId: 'ame', isTarget: true }),
    token('が', { isParticle: true, wordId: 'ga' }),
    token('降って', { furigana: [{ start: 0, end: 1, reading: 'ふ' }], wordId: 'furu' }),
    token('います'),
    token('。'),
  ],
};
const rules = (sentence: Sentence, text?: string) => validateSentence(sentence, text).map((p) => p.rule);
const withTokens = (tokens: Token[]): Sentence => ({ ...good, tokens });

describe('sentence checks', () => {
  it('a correct sentence has no problems', () => {
    expect(validateSentence(good, '雨が降っています。')).toEqual([]);
  });

  it('CT-20 joining the token surfaces gives the sentence text exactly', () => {
    expect(rules(good, '雨が降っています')).toEqual(['CT-20']);
  });

  it('CT-21 exactly one run of target tokens, pointing at the sentence word', () => {
    const [ame, ga, futte, imasu, stop] = good.tokens as [Token, Token, Token, Token, Token];
    expect(rules(withTokens([{ ...ame, isTarget: false }, ga, futte, imasu, stop]))).toEqual(['CT-21']);
    expect(rules(withTokens([ame, ga, { ...futte, isTarget: true, wordId: 'ame' }, imasu, stop]))).toEqual(['CT-21']);
    expect(rules(withTokens([{ ...ame, wordId: 'other' }, ga, futte, imasu, stop]))).toEqual(['CT-21']);
    // Two tokens side by side are one run (a word split by the tokenizer).
    expect(rules(withTokens([ame, { ...ga, isTarget: true, wordId: 'ame' }, futte, imasu, stop]))).toEqual([]);
  });

  it('CT-22 tappable only with a word id and not a particle', () => {
    expect(good.tokens.map(isTappable)).toEqual([true, false, true, false, false]);
  });

  it('CT-23 furigana covers every kanji and nothing else', () => {
    const [ame, ga, futte, imasu, stop] = good.tokens as [Token, Token, Token, Token, Token];
    expect(rules(withTokens([ame, ga, { ...futte, furigana: [] }, imasu, stop]))).toEqual(['CT-23']);
    expect(rules(withTokens([ame, ga, { ...futte, furigana: [{ start: 0, end: 2, reading: 'ふっ' }] }, imasu, stop]))).toEqual(['CT-23']);
    expect(rules(withTokens([ame, ga, { ...futte, furigana: [{ start: 0, end: 9, reading: 'ふ' }] }, imasu, stop]))).toEqual(['CT-23']);
  });

  it('CT-24 targetSpan is inside the translation and not empty', () => {
    expect(rules({ ...good, targetSpan: [5, 5] })).toEqual(['CT-24']);
    expect(rules({ ...good, targetSpan: [5, 99] })).toEqual(['CT-24']);
  });
});
