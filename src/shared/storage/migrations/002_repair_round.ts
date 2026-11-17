import type { Migration } from '../migrate.logic';

// DB-42: which round fills the repair day. See DayState.repairRoundNo.
export const repairRound: Migration = {
  version: 2,
  name: 'repair_round',
  sql: 'ALTER TABLE day_state ADD COLUMN repairRoundNo INTEGER;',
};
