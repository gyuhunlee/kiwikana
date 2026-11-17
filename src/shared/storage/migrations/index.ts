import type { Migration } from '../migrate.logic';
import { initial } from './001_initial';

// Append only. Never edit a shipped migration (docs/architecture.md).
export const migrations: readonly Migration[] = [initial];
