import type { RewardCard } from './reward.types';

// RW-2
const ORDER: Record<RewardCard['type'], number> = { summary: 0, rowUnlock: 1, deckComplete: 2 };

/** Adds the cards one action produced, behind anything already waiting. */
export function enqueueRewards(queue: readonly RewardCard[], fromOneAction: readonly RewardCard[]): RewardCard[] {
  const sorted = [...fromOneAction].sort((a, b) => ORDER[a.type] - ORDER[b.type]);
  return [...queue, ...sorted];
}

// RW-1: the feed shows this in place of the next exercise.
export function headReward(queue: readonly RewardCard[]): RewardCard | null {
  return queue[0] ?? null;
}

// RW-3
export function withoutHead(queue: readonly RewardCard[]): RewardCard[] {
  return queue.slice(1);
}

export function summaryPending(queue: readonly RewardCard[]): boolean {
  return queue.some((card) => card.type === 'summary');
}

export type RewardSource = 'wordCard' | 'kanaQuestion' | 'newKanaCard' | 'stroke';
export type RewardMoment = 'afterSlide' | 'afterContinue' | 'afterTap' | 'afterSuccessPop';

// RW-5
export function rewardMoment(source: RewardSource): RewardMoment {
  switch (source) {
    case 'wordCard':
      return 'afterSlide';
    case 'kanaQuestion':
      return 'afterContinue';
    case 'newKanaCard':
      return 'afterTap';
    case 'stroke':
      return 'afterSuccessPop';
  }
}
