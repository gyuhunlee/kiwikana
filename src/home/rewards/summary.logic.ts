import type { LogEntry } from '../bar/day.types';

const LATER_TITLES = ['Nice work', 'On a roll', 'Keep it up', 'Great round'] as const;

// RW-11
export function summaryTitle(roundNo: number): string {
  if (roundNo <= 1) return 'Daily goal done';
  return LATER_TITLES[(roundNo - 2) % LATER_TITLES.length] ?? LATER_TITLES[0];
}

export const SUMMARY_SUBTITLE = "Here's what you did";

export type SummarySection = 'counts' | 'dots' | 'newWords' | 'alreadyKnew' | 'levelUps' | 'practiceAgain';

export interface Summary {
  counts: { words: number; kana: number; traced: number };
  /** One per graded answer, in order. true = right. */
  dots: boolean[];
  rightText: string;
  newWords: string[];
  alreadyKnew: string[];
  levelUps: string[];
  practiceAgain: string[];
  /** Sections that have content, in display order. Empty ones are left out. */
  sections: SummarySection[];
}

const NEW_WORDS_LIMIT = 4;
const ALREADY_KNEW_LIMIT = 8;
const PRACTICE_AGAIN_LIMIT = 8;

const unique = (ids: string[]): string[] => [...new Set(ids)];
const idsOf = (log: readonly LogEntry[], ...kinds: LogEntry['kind'][]): string[] =>
  log.filter((entry) => kinds.includes(entry.kind)).map((entry) => entry.id);

// RW-12, RW-13
export function buildSummary(log: readonly LogEntry[]): Summary {
  const graded = log.filter((entry) => entry.kind === 'wordQuiz' || entry.kind === 'kanaQuestion');
  const dots = graded.map((entry) => entry.correct === true);
  const counts = {
    words: idsOf(log, 'wordLearn', 'wordQuiz').length,
    kana: idsOf(log, 'kanaLearn', 'kanaQuestion').length,
    traced: idsOf(log, 'traced').length,
  };
  const summary = {
    counts,
    dots,
    rightText: `${dots.filter(Boolean).length} of ${dots.length} right`,
    newWords: unique(idsOf(log, 'wordLearn')).slice(0, NEW_WORDS_LIMIT),
    alreadyKnew: unique(idsOf(log, 'wordKnewIt', 'kanaKnewIt')).slice(0, ALREADY_KNEW_LIMIT),
    levelUps: unique(log.flatMap((entry) => entry.levelUp ?? [])),
    practiceAgain: unique(graded.filter((entry) => entry.correct === false).map((entry) => entry.id)).slice(
      0,
      PRACTICE_AGAIN_LIMIT,
    ),
  };
  const hasContent: Record<SummarySection, boolean> = {
    counts: counts.words + counts.kana + counts.traced > 0,
    dots: dots.length > 0,
    newWords: summary.newWords.length > 0,
    alreadyKnew: summary.alreadyKnew.length > 0,
    levelUps: summary.levelUps.length > 0,
    practiceAgain: summary.practiceAgain.length > 0,
  };
  const order: SummarySection[] = ['counts', 'dots', 'newWords', 'alreadyKnew', 'levelUps', 'practiceAgain'];
  return { ...summary, sections: order.filter((section) => hasContent[section]) };
}
