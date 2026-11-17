# Day, bar, rounds, streak, repair (DB)

**Scope:** the shared progress bar on Home, rounds of 10, the streak, streak repair, the day rollover, save and undo basics. Source: handoff 4 (Home top), 5.0, 5a.
**Code:** `src/home/bar/day.logic.ts`, `streak.logic.ts`, `bar.store.ts`, `Bar.tsx`, `WeekSheet.tsx`.

## Data
`DayState` (one per day key): `ticks`, `roundNo` (starts 1), `roundStart` (ticks at round start), `roundExtra`, `goalDone`, `repaired`, `repairDay` (day key or null), `log` (entries of this round).
`LogEntry`: `{ kind, id, correct?, levelUp? }` where kind is one of `wordLearn`, `wordKnewIt`, `wordQuiz`, `kanaLearn`, `kanaKnewIt`, `kanaQuestion`, `traced`.
`stats.bestStreak`, `stats.installDay`.

## Shared basics
- DB-1 `[logic]` Day key = local calendar date of (now − 4 hours). 03:59 on the 17th belongs to the 16th; 04:00 belongs to the 17th. Uses the device time zone at the moment of the call.
- DB-2 `[logic]` Every state-changing action returns the full new state and the store saves it before the UI moves on. Killing the app loses at most the card on screen.
- DB-3 `[logic]` Undoable actions (list in DB-4) snapshot every row they will touch. Undo within 4 s restores the snapshot exactly: status, dots, bar count, round log, pack or batch, queued reward caused by that action, and triggers a widget reload. After 4 s or after any other state-changing action, the snapshot is dropped.
- DB-4 Undoable: I know it (word), I know it (kana), swipe to Known, swipe to Learning, I already know this (word or kana), Mark as learning, ✕ in Stroke.

## Bar and rounds
- DB-10 `[logic]` `tick(entry)`: `ticks += 1`, append entry to `log`. If `ticks − roundStart >= 10 + roundExtra`, emit effect `queueReward(summary)` with a copy of the log.
- DB-11 `[logic]` What ticks (table-driven test):

| Action | tick | roundExtra |
|---|---|---|
| Word new card: Learn | +1 | |
| Word new card: I know it | +1 | |
| Word quiz: Know | +1 | |
| Word quiz: Don't know | +1 | +1, applied before the tick |
| New kana card: Learn | +1 | |
| New kana card: I know it | +1 | |
| Kana question checked, right or wrong | +1 | |
| Stroke: character traced | +1 | |
| Kana page: kana traced | +1 | |
| Stroke ✕ remove | 0 | |
| Any action in Decks (swipes, word sheet, kana page "I already know this") | 0 | |

- DB-12 `[logic]` Bar text. Round 1: `X / T`. Round n > 1: `Round n · X / T`. Repair round: `Repairing <Weekday short> · X / T`. X = `ticks − roundStart`, T = `10 + roundExtra`.
- DB-13 `[logic]` Don't know at `6 / 10` gives `7 / 11` after the answer (extra first, then tick). A Don't know on the 10th card (`9 / 10`) gives `10 / 11`: no summary yet.
- DB-14 `[logic]` Wrong kana answers never change `roundExtra`.
- DB-15 `[logic]` When the summary card is dismissed: `roundNo += 1`, `roundStart = ticks`, `roundExtra = 0`, `log = []`.
- DB-16 `[logic]` The first summary queued in a day sets `goalDone = true` at queue time (not at dismiss time), so closing the app on the summary still counts the day.
- DB-17 `[logic]` While a summary is queued and not dismissed, no new tick can happen (the feed shows the reward card instead of an exercise).
- DB-18 `[logic]` Rollover: a new day key means a fresh `DayState` (`roundNo 1`, all zero, `repairDay null`). The old day's `ticks`, `goalDone` and `repaired` stay stored. An unfinished round is dropped; its ticks still count in that day's total.
- DB-19 `[logic]` Rollover is detected on app open, on return to foreground, and before any action is applied. If the day changed while the app was open, the action applies to the new day.

## Streak
- DB-30 `[logic]` A day counts if `goalDone` or `repaired`.
- DB-31 `[logic]` Streak = number of consecutive counting days ending today if today counts, otherwise ending yesterday. An unfinished today does not break the streak.
- DB-32 `[logic]` `bestStreak = max(bestStreak, streak)` whenever streak is recomputed.
- DB-33 `[logic]` Any mix of modes fills round 1.
- DB-34 No freezes, no repair credits.

## Repair
- DB-40 `[logic]` The week sheet lists the last 7 days ending today. A day is repairable if it is before today, on or after `installDay`, and neither `goalDone` nor `repaired`.
- DB-41 `[logic]` Tapping a repairable day sets today's `repairDay`. The sheet shows: "Do 10 extra cards after today's goal to fill <Weekday>."
- DB-42 `[logic]` If `repairDay` is set when a summary is dismissed and `goalDone` is true, the next round is the repair round. If it is set mid-round after the goal is done, the round after the current one is the repair round.
- DB-43 `[logic]` When the repair round fills: that day gets `repaired = true`, `repairDay = null`, streak is recomputed, and the normal summary card is queued.
- DB-44 `[logic]` One day per repair round. Picking another day while one is set replaces it.
- DB-45 `[logic]` `repairDay` does not survive the rollover.
- DB-46 `[logic]` Example: streak 5, miss Sunday, open Monday → streak shows 0 until repaired; finish round 1 Monday → streak 1; fill the repair round for Sunday → streak 7.

## UI
- DB-60 `[ui]` Home top, always visible in every mode: mode dropdown pill (left), 🔥 + streak number (right), one thin bar below spanning the width with a `kiwi` fill, and the bar text (`3 / 10`) right-aligned beside it in `caption`.
- DB-63 `[ui]` Tab bar: Home, Decks, Profile, each an outline icon with a label; the active tab has a small `kiwi` dot.
- DB-61 `[ui]` 🔥 opens the week sheet: 7 day cells, done days filled, today outlined, repairable days tappable.
- DB-62 `[ui]` The flame uses the `streak` color, never black.

## Motion and sound (M11)
Bar fill animates smoothly. On Don't know the total number flips up.

## Manual check
- `bar-9`: answer one card → summary card "Daily goal done"; streak +1; dismiss → `Round 2 · 0 / 10`.
- `bar-9` then Don't know → bar `10 / 11`, no summary; next answer → summary.
- `missed-yesterday`: open week sheet, tap yesterday, finish round 1, bar reads `Repairing …`, fill it, streak is whole.
- Dev menu jump to 03:59 then 04:01: bar resets, streak unchanged if yesterday was done.
