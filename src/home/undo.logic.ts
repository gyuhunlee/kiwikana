export const UNDO_MS = 4000;

/** DB-3: undo works by snapshot. `before` is the whole state as it was before the undoable action. */
export interface UndoSlot<S> {
  before: S;
  expiresAtMs: number;
}

export function openUndo<S>(before: S, now: Date): UndoSlot<S> {
  return { before, expiresAtMs: now.getTime() + UNDO_MS };
}

/** The state to restore, or null when the 4 s have passed. Any other action drops the slot (store). */
export function takeUndo<S>(slot: UndoSlot<S> | null, now: Date): S | null {
  if (!slot || now.getTime() > slot.expiresAtMs) return null;
  return slot.before;
}
