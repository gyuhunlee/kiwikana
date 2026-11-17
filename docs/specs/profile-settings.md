# Profile and settings (PF)

**Scope:** Profile tab stats, settings, appearance. Source: handoff 4 (Profile), 5h, 5i (Settings).
**Code:** `src/profile/stats.logic.ts`, `ProfileScreen.tsx`, `SettingsScreen.tsx`, `settings.store.ts`.

Everything here is motivational. No due counts, no queues.

## Stats (`stats.logic.ts`, all derived from stored state, nothing cached)
- PF-1 `[logic]` Streak and best streak: DB-31, DB-32.
- PF-2 `[logic]` Week bars: ticks per day for the current week, Monday to Sunday (week start follows the device locale). A bar is dark when that day's round 1 was done (or the day was repaired). Tapping a bar shows that day's count.
- PF-3 `[logic]` Average line: mean ticks over this week's days so far, today included, future days excluded. Dashed line in `kiwiBrown` + text "x a day" (rounded to a whole number).
- PF-4 `[logic]` Words met = words with status not new. "+n today" = words whose `metAt` is today.
- PF-5 `[logic]` Words known = words with status known.
- PF-6 `[logic]` Milestone bar: progress from the previous multiple of 50 to the next, by words met. At 120 met: 20 / 50 toward 150.
- PF-7 `[logic]` Up next ring: current deck met / deck size, text "x words to finish this deck". Deck complete and no next deck → ring full, text "Deck finished".
- PF-8 `[logic]` Decks completed = count of decks with every word met.
- PF-9 `[logic]` Characters traced = lifetime count (Stroke + kana pages).
- PF-10 `[logic]` Quiz accuracy this week = correct / graded answers this week (word quizzes + kana questions), as a whole percent. No graded answers → "–".
- PF-11 `[logic]` Kana learned = kana at Good or Excellent, both scripts.

## Layout
- PF-20 `[ui]` Top to bottom: streak + best · week bars with average line · Words met (main number) with today's count, words known, milestone bar · Up next ring · 4 small stat cards · Settings entry.
- PF-21 `[ui]` The 4 stat cards each use their own color: decks completed (`kiwi`), characters traced (`statBlue`), quiz accuracy (`statLavender`), kana learned (`streak`). Color as a small accent, not a filled card.

## Settings
| ID | Setting | Values | Effect |
|---|---|---|---|
| PF-30 | New words per day | 2, 3 (default 3) | From the next pack built (WF-43) |
| PF-31 | Widget: new word every | WG-13 | Snapshot rebuilt, timelines reloaded, notifications rescheduled |
| PF-32 | Quiet hours | start, end | Same as PF-31 |
| PF-33 | Hourly notification | on / off | WG-30, WG-31 |
| PF-34 | Audio | "Follows silent switch" (info row, not a toggle) | WC-42 |
| PF-35 | Appearance | System / Light / Dark (default System, first launch renders light) | The app only. Widgets follow the phone |
| PF-36 | Picture style | Anime / Realistic | Every picture: cards, deck rows, word sheet, search, summary tiles, large widget. Widgets reload |
| PF-37 | Subscription | status, Manage, Restore purchases | M12 |
| PF-38 | About | KanjiVG attribution, privacy, terms, contact | |

- PF-39 `[logic]` Every setting is saved the moment it changes and survives restart (Hourly Kana 2★: "settings don't save").
- PF-40 `[logic]` Changing picture style downloads missing pictures for the current deck in the background; until then the other style shows.

PF-30 note: the handoff says "new words per day (3)" with buildPack never below 2 and max 3, so the only values are 2 and 3. Confirm, or make it a fixed 3 and drop the setting.

## Empty states
- Day 1 before any card: week bars empty, average line hidden, words met 0, accuracy "–".

## Manual check
- `day30`: every number matches the day inspector and a hand count in Decks.
- Tap a week bar → count shows.
- Switch Appearance: app changes at once; a home widget does not.
- Switch Picture style: Home card, deck rows and large widget all change.
