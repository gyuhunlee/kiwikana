import type { Level } from '../shared/content/types';
import type { Clock } from '../shared/time/clock';
import type { DayKey } from '../shared/time/dayKey.logic';
import type { DayState } from './bar/day.types';
import type { RewardCard } from './rewards/reward.types';
import type { FeedContent, Pack, Scheduler, Words } from './words/words.types';

export interface HomeState {
  days: Readonly<Record<DayKey, DayState>>;
  words: Words;
  /** The current pack. Dropped and rebuilt at the rollover (WF-44). */
  pack: Pack | null;
  rewardQueue: readonly RewardCard[];
  deck: { level: Level; currentDeckId: string | null; completedDeckIds: readonly string[] };
  stats: { bestStreak: number; charactersTraced: number; installDay: DayKey };
  newWordsPerDay: 2 | 3;
}

// Plain data the store runs after saving (docs/architecture.md). State is the truth; these only notify.
export type Effect =
  | { type: 'queueReward'; card: RewardCard }
  | { type: 'reloadWidgets' }
  | { type: 'showUndo' }
  | { type: 'refreshStrokePool' };

export interface Result {
  state: HomeState;
  effects: Effect[];
}

export interface Ctx {
  clock: Clock;
  scheduler: Scheduler;
  content: FeedContent;
}
