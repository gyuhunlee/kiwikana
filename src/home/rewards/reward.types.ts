import type { DayKey } from '../../shared/time/dayKey.logic';
import type { LogEntry } from '../bar/day.types';

export interface SummaryCard {
  type: 'summary';
  dayKey: DayKey;
  roundNo: number;
  repair: boolean;
  log: LogEntry[];
}

// RW-20
export interface RowUnlockCard {
  type: 'rowUnlock';
  script: 'hiragana' | 'katakana';
  finishedGroupId: string;
  newGroupId: string;
  kana: string[];
  unlockedCount: number;
}

// RW-30
export interface DeckCompleteCard {
  type: 'deckComplete';
  deckId: string;
  deckName: string;
  wordCount: number;
  nextDeckId: string | null;
  nextDeckName: string | null;
}

export type RewardCard = SummaryCard | RowUnlockCard | DeckCompleteCard;
