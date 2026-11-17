import { describe, expect, it } from 'vitest';
import type { KanaGroup } from '../../shared/content/types';
import { applyCheck, demand, kanaLevel, markKanaKnown, newKana, progressLine, type KanaState } from './levels.logic';
import { initialUnlocked, totalDemand, unlockCheck, unlockedGojuonCount } from './unlock.logic';

const today = '2026-11-16';
const kana = (patch: Partial<KanaState>): KanaState => ({ ...newKana, ...patch });
const seen = (score: number, lastDrilled: string | null = today): KanaState => kana({ score, seen: true, lastDrilled });

const group = (id: string, order: number, chars: string, section: KanaGroup['section'] = 'gojuon'): KanaGroup => ({
  script: 'hiragana', section, id, order, kana: [...chars],
});
const groups = [group('a', 1, 'あいうえお'), group('ka', 2, 'かきくけこ'), group('sa', 3, 'さしすせそ'), group('ga', 11, 'がぎぐげご', 'dakuon')];
const states = (chars: string, state: KanaState) => Object.fromEntries([...chars].map((char) => [char, state]));

describe('kana levels', () => {
  it('KN-1 New: never in a checked question and not marked known', () => {
    expect(kanaLevel(newKana)).toBe('new');
  });

  it('KN-2 Weak 0–3 once checked (even wrong), Good 4–5, Excellent 6+', () => {
    expect([0, 3, 4, 5, 6, 9].map((score) => kanaLevel(seen(score)))).toEqual(['weak', 'weak', 'good', 'good', 'excellent', 'excellent']);
  });

  it('KN-2 I know it sets the score to at least 6', () => {
    expect(markKanaKnown(seen(2)).score).toBe(6);
    expect(markKanaKnown(seen(8)).score).toBe(8);
    expect(kanaLevel(markKanaKnown(newKana))).toBe('excellent');
    expect(markKanaKnown(newKana).knownByUser).toBe(true);
  });

  it('KN-3 demand: New or Weak 3, Good 2, Excellent 0, or 1 when not drilled for 3+ days or never', () => {
    expect(demand(newKana, today)).toBe(3);
    expect(demand(seen(1), today)).toBe(3);
    expect(demand(seen(4), today)).toBe(2);
    expect(demand(seen(6), today)).toBe(0);
    expect(demand(seen(6, '2026-11-14'), today)).toBe(0);
    expect(demand(seen(6, '2026-11-13'), today)).toBe(1);
    expect(demand(markKanaKnown(newKana), today)).toBe(1);
  });

  it('DK-61 progress line per level', () => {
    expect([newKana, seen(2), seen(5), seen(6)].map(progressLine)).toEqual([
      'New',
      'Weak · 2 / 4 correct to Good',
      'Good · 5 / 6 correct to Excellent',
      'Excellent',
    ]);
  });
});

describe('kana answers', () => {
  it('KN-63 correct: +1 for every distinct kana in the question, once each', () => {
    const { states: after } = applyCheck({}, { target: 'あ', kana: ['あ', 'い', 'あ'], correct: true }, today);
    expect([after['あ']?.score, after['い']?.score]).toEqual([1, 1]);
  });

  it('KN-64 right or wrong: every kana is seen and drilled today; the target records lastWrong', () => {
    const { states: after } = applyCheck({}, { target: 'あ', kana: ['あ', 'い'], correct: false }, today);
    expect(after['あ']).toEqual({ score: 0, seen: true, lastDrilled: today, lastWrong: true, knownByUser: false });
    expect(after['い']).toEqual({ score: 0, seen: true, lastDrilled: today, lastWrong: false, knownByUser: false });
    const right = applyCheck(after, { target: 'あ', kana: ['あ'], correct: true }, today);
    expect(right.states['あ']?.lastWrong).toBe(false);
  });

  it('KN-65 wrong: no score change', () => {
    const before = { あ: seen(3) };
    expect(applyCheck(before, { target: 'あ', kana: ['あ'], correct: false }, today).states['あ']?.score).toBe(3);
  });

  it('KN-4 KN-66 levels update on the Check; kana that reached Good or Excellent are reported', () => {
    const before = { あ: seen(3), い: seen(5), う: seen(1) };
    const { states: after, levelUps } = applyCheck(before, { target: 'あ', kana: ['あ', 'い', 'う'], correct: true }, today);
    expect(levelUps).toEqual(['あ', 'い']);
    expect([kanaLevel(after['あ'] ?? newKana), kanaLevel(after['い'] ?? newKana)]).toEqual(['good', 'excellent']);
  });
});

describe('unlock check', () => {
  const unlocked = initialUnlocked(groups, 'hiragana');

  it('KN-11 a new user starts with the あ group', () => {
    expect(unlocked).toEqual(['a']);
  });

  it('KN-12 the unlocked count covers Gojūon kana only', () => {
    expect(unlockedGojuonCount(groups, ['a', 'ka', 'ga'])).toBe(10);
  });

  it('KN-41 3 Excellent + 2 Good = demand 4 → unlock; 5 Good = 10 → no unlock', () => {
    const mixed = { ...states('あいう', seen(6)), ...states('えお', seen(4)) };
    expect(totalDemand(mixed, [...'あいうえお'], today)).toBe(4);
    expect(unlockCheck(mixed, groups, 'hiragana', unlocked, today).unlockedGroupIds).toEqual(['a', 'ka']);

    const allGood = states('あいうえお', seen(4));
    expect(totalDemand(allGood, [...'あいうえお'], today)).toBe(10);
    expect(unlockCheck(allGood, groups, 'hiragana', unlocked, today).card).toBeNull();
  });

  it('KN-40 RW-20 an unlock queues the row unlock card with the new row', () => {
    const { card } = unlockCheck(states('あいうえお', seen(6)), groups, 'hiragana', unlocked, today);
    expect(card).toEqual({
      type: 'rowUnlock', script: 'hiragana', finishedGroupId: 'a', newGroupId: 'ka', kana: [...'かきくけこ'], unlockedCount: 10,
    });
  });

  it('KN-42 one group per check: the new group’s demand makes the next check fail', () => {
    const all = states('あいうえお', seen(6));
    const first = unlockCheck(all, groups, 'hiragana', unlocked, today);
    const second = unlockCheck(all, groups, 'hiragana', first.unlockedGroupIds, today);
    expect(second.card).toBeNull();
    expect(second.unlockedGroupIds).toEqual(['a', 'ka']);
  });

  it('KN-40 no next group: nothing unlocks', () => {
    const everything = states('あいうえおかきくけこさしすせそがぎぐげご', seen(6));
    expect(unlockCheck(everything, groups, 'hiragana', ['a', 'ka', 'sa', 'ga'], today).card).toBeNull();
  });
});
