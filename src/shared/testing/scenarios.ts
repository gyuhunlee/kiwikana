import { newDay } from '../../home/bar/day.logic';
import type { DayState, LogEntry } from '../../home/bar/day.types';
import type { HomeState } from '../../home/home.types';
import { newWordState, type FeedContent, type WordState } from '../../home/words/words.types';
import type { Clock } from '../time/clock';
import { MS_PER_DAY, addDays, dayKey, type DayKey } from '../time/dayKey.logic';
import { shiftInstant } from '../time/zone.logic';
import { fakeClock } from './fakeClock';
import { fakeCard } from './fakeScheduler';
import { fixtureContent } from './fixtures';

// One function builds each state. Tests and the dev menu use the same ones (docs/testing.md section 6).
// Kana and Stroke scenarios are added with their milestones.

export interface ScenarioState extends HomeState {
  today: DayKey;
  appearance: 'system' | 'light' | 'dark';
  pictureStyle: 'anime' | 'realistic';
}

interface LearningOptions {
  /** Days until due. 0 or less = due. */
  dueInDays?: number;
  /** Pins retrievability. Under 0.70 is weak. */
  r?: number;
  dots?: number;
  metDaysAgo?: number;
}

export class ScenarioBuilder {
  constructor(
    private readonly state: ScenarioState,
    private readonly clock: Clock,
  ) {}

  private with(patch: Partial<ScenarioState>): ScenarioBuilder {
    return new ScenarioBuilder({ ...this.state, ...patch }, this.clock);
  }

  private withWords(words: WordState[]): ScenarioBuilder {
    const next = { ...this.state.words };
    words.forEach((word) => {
      next[word.wordId] = word;
    });
    return this.with({ words: next });
  }

  private withDay(key: DayKey, patch: Partial<DayState>): ScenarioBuilder {
    return this.with({ days: { ...this.state.days, [key]: { ...(this.state.days[key] ?? newDay()), ...patch } } });
  }

  /** Round 1 with `ticks` cards answered: `scenario.fresh().withBar(9)`. */
  withBar(ticks: number): ScenarioBuilder {
    const log: LogEntry[] = Array.from({ length: ticks }, (_, index) => ({
      kind: 'wordQuiz',
      id: `scenario-word-${index + 1}`,
      correct: true,
    }));
    return this.withDay(this.state.today, { ticks, log });
  }

  withLearning(wordIds: readonly string[], options: LearningOptions = {}): ScenarioBuilder {
    const now = this.clock.now();
    const metAt = shiftInstant(now, -(options.metDaysAgo ?? 5) * MS_PER_DAY).toISOString();
    return this.withWords(
      wordIds.map((wordId) => ({
        ...newWordState(wordId),
        status: 'learning',
        metAt,
        metOnHome: true,
        dots: options.dots ?? 0,
        fsrs: fakeCard(now, { dueInDays: options.dueInDays ?? 0, r: options.r ?? 0.85 }),
      })),
    );
  }

  withKnown(wordIds: readonly string[]): ScenarioBuilder {
    const metAt = shiftInstant(this.clock.now(), -10 * MS_PER_DAY).toISOString();
    return this.withWords(
      wordIds.map((wordId) => ({ ...newWordState(wordId), status: 'known', dots: 3, metAt, metOnHome: true })),
    );
  }

  /** The goal was met on each of the `count` days before `endingDaysAgo` (1 = up to yesterday). */
  withStreak(count: number, endingDaysAgo = 1): ScenarioBuilder {
    let next: ScenarioBuilder = this.with({
      stats: { ...this.state.stats, bestStreak: Math.max(this.state.stats.bestStreak, count) },
    });
    for (let index = 0; index < count; index += 1) {
      next = next.withDay(addDays(this.state.today, -(endingDaysAgo + index)), { ticks: 10, goalDone: true });
    }
    return next;
  }

  installedDaysAgo(days: number): ScenarioBuilder {
    return this.with({ stats: { ...this.state.stats, installDay: addDays(this.state.today, -days) } });
  }

  withCurrentDeck(deckId: string): ScenarioBuilder {
    return this.with({ deck: { ...this.state.deck, currentDeckId: deckId } });
  }

  withNewWordsPerDay(count: 2 | 3): ScenarioBuilder {
    return this.with({ newWordsPerDay: count });
  }

  build(): ScenarioState {
    return this.state;
  }
}

const idsOf = (content: FeedContent, deckIndex: number, from: number, to: number): string[] =>
  (content.decks[deckIndex]?.wordIds ?? []).slice(from, to);

export const scenario = {
  /** Just finished onboarding at N5. */
  fresh(clock: Clock = fakeClock(), content: FeedContent = fixtureContent()): ScenarioBuilder {
    const today = dayKey(clock);
    return new ScenarioBuilder(
      {
        today,
        days: {},
        words: {},
        pack: null,
        rewardQueue: [],
        deck: { level: 'N5', currentDeckId: content.decks[0]?.id ?? null, completedDeckIds: [] },
        stats: { bestStreak: 0, charactersTraced: 0, installDay: today },
        newWordsPerDay: 3,
        appearance: 'system',
        pictureStyle: 'anime',
      },
      clock,
    );
  },

  /** 5 days of use, first reviews due. */
  day6(clock: Clock = fakeClock(), content: FeedContent = fixtureContent()): ScenarioBuilder {
    return scenario
      .fresh(clock, content)
      .installedDaysAgo(5)
      .withStreak(5)
      .withLearning(idsOf(content, 0, 0, 2), { dueInDays: 0, r: 0.85 })
      .withLearning(idsOf(content, 0, 2, 4), { dueInDays: -1, r: 0.6 })
      .withLearning(idsOf(content, 0, 4, 18), { dueInDays: 3, r: 0.95 });
  },

  /** A word with 2 dots due today. */
  twoDotsDue(clock: Clock = fakeClock(), content: FeedContent = fixtureContent()): ScenarioBuilder {
    return scenario
      .fresh(clock, content)
      .installedDaysAgo(20)
      .withLearning(idsOf(content, 0, 0, 1), { dueInDays: 0, r: 0.85, dots: 2, metDaysAgo: 20 });
  },

  /** 1 unseen word left in the current deck. */
  deckLastWord(clock: Clock = fakeClock(), content: FeedContent = fixtureContent()): ScenarioBuilder {
    return scenario.fresh(clock, content).installedDaysAgo(6).withLearning(idsOf(content, 0, 0, 19), { dueInDays: 4, r: 0.95 });
  },

  /** Streak 5, yesterday missed. */
  missedYesterday(clock: Clock = fakeClock(), content: FeedContent = fixtureContent()): ScenarioBuilder {
    return scenario.fresh(clock, content).installedDaysAgo(6).withStreak(5, 2);
  },

  /** A deck with new, learning and Known rows. */
  decksMixed(clock: Clock = fakeClock(), content: FeedContent = fixtureContent()): ScenarioBuilder {
    return scenario
      .fresh(clock, content)
      .installedDaysAgo(8)
      .withLearning(idsOf(content, 0, 0, 6), { dueInDays: 2, r: 0.9, dots: 1 })
      .withKnown(idsOf(content, 0, 6, 10));
  },

  /** Every word in the level Known. */
  allKnown(clock: Clock = fakeClock(), content: FeedContent = fixtureContent()): ScenarioBuilder {
    return scenario
      .fresh(clock, content)
      .installedDaysAgo(60)
      .withKnown(content.decks.flatMap((deck) => deck.wordIds));
  },
};

/** Named scenarios from docs/testing.md. Everything listed here shows up in the dev menu. */
export const scenarios: Record<string, (clock: Clock, content: FeedContent) => ScenarioState> = {
  fresh: (clock, content) => scenario.fresh(clock, content).build(),
  day6: (clock, content) => scenario.day6(clock, content).build(),
  'bar-9': (clock, content) => scenario.fresh(clock, content).withBar(9).build(),
  'two-dots-due': (clock, content) => scenario.twoDotsDue(clock, content).build(),
  'deck-last-word': (clock, content) => scenario.deckLastWord(clock, content).build(),
  'missed-yesterday': (clock, content) => scenario.missedYesterday(clock, content).build(),
  'decks-mixed': (clock, content) => scenario.decksMixed(clock, content).build(),
  'all-known': (clock, content) => scenario.allKnown(clock, content).build(),
};
