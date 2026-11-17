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
  /** Word id, kana character, or traced character. */
  id: string;
  correct?: boolean;
  /** KN-66: kana that reached Good or Excellent on this answer. */
  levelUp?: string[];
}

export interface DayState {
  ticks: number;
  roundNo: number;
  roundStart: number;
  roundExtra: number;
  goalDone: boolean;
  repaired: boolean;
  repairDay: DayKey | null;
  /** Which round fills `repairDay` (DB-42). Not in the spec's field list; needed to tell the repair round apart. */
  repairRoundNo: number | null;
  log: LogEntry[];
}
