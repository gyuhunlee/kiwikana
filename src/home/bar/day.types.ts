import type { DayKey } from '../../shared/time/dayKey.logic';

// docs/specs/day-bar-streak.md, Data.
export type LogKind =
  | 'wordLearn'
  | 'wordKnewIt'
  | 'wordQuiz'
  | 'kanaLearn'
  | 'kanaKnewIt'
  | 'kanaQuestion'
  | 'traced';

export interface LogEntry {
  kind: LogKind;
  id: string;
  correct?: boolean;
  levelUp?: boolean;
}

export interface DayState {
  ticks: number;
  roundNo: number;
  roundStart: number;
  roundExtra: number;
  goalDone: boolean;
  repaired: boolean;
  repairDay: DayKey | null;
  log: LogEntry[];
}
