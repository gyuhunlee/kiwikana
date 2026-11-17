import { weekdayShort, type DayKey } from '../../shared/time/dayKey.logic';
import { enqueueRewards, headReward, summaryPending, withoutHead } from '../rewards/queue.logic';
import type { RewardCard, SummaryCard } from '../rewards/reward.types';
import type { DayState, LogEntry } from './day.types';
import { bestStreak, isRepairable } from './streak.logic';

export const ROUND_SIZE = 10;

/** The slice of state the bar owns. Words, Kana and Stroke all pass their bigger state through. */
export interface BarState {
  days: Readonly<Record<DayKey, DayState>>;
  rewardQueue: readonly RewardCard[];
  stats: { bestStreak: number; installDay: DayKey };
}

export type BarEffect = { type: 'queueReward'; card: RewardCard };

export function newDay(): DayState {
  return {
    ticks: 0,
    roundNo: 1,
    roundStart: 0,
    roundExtra: 0,
    goalDone: false,
    repaired: false,
    repairDay: null,
    repairRoundNo: null,
    log: [],
  };
}

// DB-18: a new day key starts fresh. Old days stay stored as they were.
export function ensureDay<S extends BarState>(state: S, today: DayKey): S {
  if (state.days[today]) return state;
  return { ...state, days: { ...state.days, [today]: newDay() } };
}

export function dayOf(state: BarState, today: DayKey): DayState {
  return state.days[today] ?? newDay();
}

export function roundProgress(day: DayState): { done: number; total: number } {
  return { done: day.ticks - day.roundStart, total: ROUND_SIZE + day.roundExtra };
}

export function isRepairRound(day: DayState): boolean {
  return day.repairDay !== null && day.repairRoundNo === day.roundNo;
}

// DB-12
export function barText(day: DayState): string {
  const { done, total } = roundProgress(day);
  const count = `${done} / ${total}`;
  if (isRepairRound(day) && day.repairDay) return `Repairing ${weekdayShort(day.repairDay)} · ${count}`;
  return day.roundNo > 1 ? `Round ${day.roundNo} · ${count}` : count;
}

// DB-10, DB-11
export function tick<S extends BarState>(state: S, today: DayKey, entry: LogEntry): { state: S; effects: BarEffect[] } {
  const withToday = ensureDay(state, today);
  // DB-17: the feed shows the summary, so nothing can be answered until it is dismissed.
  if (summaryPending(withToday.rewardQueue)) return { state: withToday, effects: [] };

  const day: DayState = { ...dayOf(withToday, today) };
  // DB-11, DB-13: a word Don't know grows the round first, then ticks. DB-14: kana never does.
  if (entry.kind === 'wordQuiz' && entry.correct === false) day.roundExtra += 1;
  day.ticks += 1;
  day.log = [...day.log, entry];

  const { done, total } = roundProgress(day);
  if (done < total) {
    return { state: { ...withToday, days: { ...withToday.days, [today]: day } }, effects: [] };
  }

  const days: Record<DayKey, DayState> = { ...withToday.days };
  const repair = isRepairRound(day);
  if (repair && day.repairDay) {
    // DB-43
    days[day.repairDay] = { ...(days[day.repairDay] ?? newDay()), repaired: true };
    day.repairDay = null;
    day.repairRoundNo = null;
  } else {
    // DB-16: counted when queued, so closing the app on the summary still counts the day.
    day.goalDone = true;
  }
  days[today] = day;

  const card: SummaryCard = { type: 'summary', dayKey: today, roundNo: day.roundNo, repair, log: [...day.log] };
  return {
    state: {
      ...withToday,
      days,
      rewardQueue: enqueueRewards(withToday.rewardQueue, [card]),
      stats: { ...withToday.stats, bestStreak: bestStreak(withToday.stats.bestStreak, days, today) }, // DB-32
    },
    effects: [{ type: 'queueReward', card }],
  };
}

// RW-3: the card's button removes it. DB-15: dismissing a summary starts the next round.
export function dismissReward<S extends BarState>(state: S, today: DayKey): S {
  const card = headReward(state.rewardQueue);
  if (!card) return state;
  const rewardQueue = withoutHead(state.rewardQueue);
  // RW-4: a summary carried over the rollover no longer changes the new day's round.
  if (card.type !== 'summary' || card.dayKey !== today) return { ...state, rewardQueue };

  const day = dayOf(state, today);
  const next: DayState = { ...day, roundNo: day.roundNo + 1, roundStart: day.ticks, roundExtra: 0, log: [] };
  return { ...state, rewardQueue, days: { ...state.days, [today]: next } };
}

// DB-41, DB-42, DB-44
export function selectRepairDay<S extends BarState>(state: S, today: DayKey, target: DayKey): S {
  const withToday = ensureDay(state, today);
  if (!isRepairable(withToday.days, today, withToday.stats.installDay, target)) return withToday;

  const day = dayOf(withToday, today);
  const untouchedRoundAfterGoal = day.goalDone && roundProgress(day).done === 0;
  // DB-44: mid repair round, a new pick only swaps the day.
  const repairRoundNo = isRepairRound(day) || untouchedRoundAfterGoal ? day.roundNo : day.roundNo + 1;
  return { ...withToday, days: { ...withToday.days, [today]: { ...day, repairDay: target, repairRoundNo } } };
}
