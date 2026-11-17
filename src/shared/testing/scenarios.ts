import type { DayState, LogEntry } from '../../home/bar/day.types';
import type { Clock } from '../time/clock';
import { dayKey, type DayKey } from '../time/dayKey.logic';
import { fakeClock } from './fakeClock';

// One function builds each state. Tests and the dev menu use the same ones (docs/testing.md section 6).
// M0 holds the shell and the two scenarios that need no word or kana state.
// Each later milestone adds its own scenarios and its own slice of ScenarioState.

export interface ScenarioSettings {
  newWordsPerDay: 2 | 3;
  appearance: 'system' | 'light' | 'dark';
  pictureStyle: 'anime' | 'realistic';
}

export interface ScenarioStats {
  bestStreak: number;
  charactersTraced: number;
  installDay: DayKey;
}

export interface ScenarioState {
  today: DayKey;
  days: Record<DayKey, DayState>;
  settings: ScenarioSettings;
  stats: ScenarioStats;
}

const emptyDay = (): DayState => ({
  ticks: 0,
  roundNo: 1,
  roundStart: 0,
  roundExtra: 0,
  goalDone: false,
  repaired: false,
  repairDay: null,
  log: [],
});

export class ScenarioBuilder {
  constructor(private readonly state: ScenarioState) {}

  /** Round 1 with `ticks` cards answered: `scenario.fresh().withBar(9)`. */
  withBar(ticks: number): ScenarioBuilder {
    const log: LogEntry[] = Array.from({ length: ticks }, (_, index) => ({
      kind: 'wordQuiz',
      id: `scenario-word-${index + 1}`,
      correct: true,
    }));
    const today: DayState = { ...emptyDay(), ticks, log };
    return new ScenarioBuilder({ ...this.state, days: { ...this.state.days, [this.state.today]: today } });
  }

  build(): ScenarioState {
    return this.state;
  }
}

export const scenario = {
  /** Just finished onboarding at N5. */
  fresh(clock: Clock = fakeClock()): ScenarioBuilder {
    const today = dayKey(clock);
    return new ScenarioBuilder({
      today,
      days: {},
      settings: { newWordsPerDay: 3, appearance: 'system', pictureStyle: 'anime' },
      stats: { bestStreak: 0, charactersTraced: 0, installDay: today },
    });
  },
};

/** Named scenarios from docs/testing.md. Everything listed here shows up in the dev menu. */
export const scenarios: Record<string, (clock: Clock) => ScenarioState> = {
  fresh: (clock) => scenario.fresh(clock).build(),
  'bar-9': (clock) => scenario.fresh(clock).withBar(9).build(),
};
