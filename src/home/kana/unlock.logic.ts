import type { KanaGroup } from '../../shared/content/types';
import type { DayKey } from '../../shared/time/dayKey.logic';
import type { RowUnlockCard } from '../rewards/reward.types';
import { demand, kanaOf, type KanaStates } from './levels.logic';

export const UNLOCK_BELOW_DEMAND = 10;

/** One script's groups in unlock order (KN-10: order comes from content). */
export function unlockOrder(groups: readonly KanaGroup[], script: KanaGroup['script']): KanaGroup[] {
  return groups.filter((group) => group.script === script).sort((a, b) => a.order - b.order);
}

// KN-11: a new user starts with the first group (あ) unlocked.
export function initialUnlocked(groups: readonly KanaGroup[], script: KanaGroup['script']): string[] {
  const first = unlockOrder(groups, script)[0];
  return first ? [first.id] : [];
}

export function unlockedKana(groups: readonly KanaGroup[], unlockedGroupIds: readonly string[]): string[] {
  return groups.filter((group) => unlockedGroupIds.includes(group.id)).flatMap((group) => group.kana);
}

// KN-12: counts Gojūon kana only.
export function unlockedGojuonCount(groups: readonly KanaGroup[], unlockedGroupIds: readonly string[]): number {
  return groups
    .filter((group) => group.section === 'gojuon' && unlockedGroupIds.includes(group.id))
    .reduce((sum, group) => sum + group.kana.length, 0);
}

export function totalDemand(states: KanaStates, kana: readonly string[], today: DayKey): number {
  return kana.reduce((sum, char) => sum + demand(kanaOf(states, char), today), 0);
}

// DK-54
export function currentGroupId(unlockedGroupIds: readonly string[]): string | null {
  return unlockedGroupIds.at(-1) ?? null;
}

// KN-40, KN-42: run after every Continue and every I know it. At most one group per check.
export function unlockCheck(
  states: KanaStates,
  groups: readonly KanaGroup[],
  script: KanaGroup['script'],
  unlockedGroupIds: readonly string[],
  today: DayKey,
): { unlockedGroupIds: string[]; card: RowUnlockCard | null } {
  const order = unlockOrder(groups, script);
  const next = order.find((group) => !unlockedGroupIds.includes(group.id));
  const finished = order.find((group) => group.id === currentGroupId(unlockedGroupIds));
  const kana = unlockedKana(order, unlockedGroupIds);
  if (!next || !finished || totalDemand(states, kana, today) >= UNLOCK_BELOW_DEMAND) {
    return { unlockedGroupIds: [...unlockedGroupIds], card: null };
  }
  const unlocked = [...unlockedGroupIds, next.id];
  return {
    unlockedGroupIds: unlocked,
    // RW-20
    card: {
      type: 'rowUnlock',
      script,
      finishedGroupId: finished.id,
      newGroupId: next.id,
      kana: [...next.kana],
      unlockedCount: unlockedGojuonCount(order, unlocked),
    },
  };
}
