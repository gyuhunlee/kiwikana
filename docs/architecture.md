# Architecture

## Stack
| Need | Choice | Note |
|---|---|---|
| App | Expo (React Native) + TypeScript strict, expo-router | Dev build, not Expo Go (widgets and native modules need it) |
| Widgets | Swift + WidgetKit + App Intents in `targets/widget`, generated with `@bacons/apple-targets` | The only non-TypeScript code. Needs the Mac to build |
| Local data | SQLite (`expo-sqlite`), one database file | User state and content index. Local-first, works offline |
| UI state | Zustand, one small store per feature | Stores are glue only |
| Spaced repetition | `ts-fsrs` (open-source FSRS), default weights, retention 0.85 | Wrapped in `src/home/words/fsrs.logic.ts` so the rest of the app never imports it |
| Drawing | `@shopify/react-native-skia` | Stroke canvas, confetti |
| Motion | `react-native-reanimated` + gesture handler | |
| Audio | `expo-audio` | Preload the current and next card |
| Content backend | Supabase (database + storage), read-only from the app | No user accounts in v1 |
| Subscriptions | RevenueCat (M12) | |
| Analytics | PostHog (M13) | |
| Tests | Vitest (logic only, Node, no React Native) | See `testing.md` |

Check current versions and setup steps in each library's docs at M0. Do not add libraries outside this table without asking.

Working across two machines: TypeScript work happens on Windows against a dev build installed on the phone. Anything in `targets/widget` and every native build happens on the Mac (or a cloud build). Plan widget sessions for when the Mac is at hand.

## Folders
```
app/                      expo-router routes only (thin files that render a screen from src/)
src/
  home/
    bar/                  day, ticks, rounds, streak, repair
    words/                pack building, answers, card UI, tap-a-word popup
    kana/                 batches, questions, kana card UI
    stroke/               pool, stroke matching, canvas
    rewards/              summary, row unlock, deck complete cards, reward queue
    HomeScreen.tsx        top bar, dropdown, mounts the active mode
  decks/                  search, deck list, deck page, word sheet, kana chart, kana page
  profile/                stats, settings
  onboarding/             level, goal, widget setup, tutorial, paywall (M12)
  shared/
    theme/                tokens, text styles, ThemeProvider
    ui/                   Button, Sheet, Toast, Pill, Icon (only things used by 2+ features)
    content/              content types, repository, sync
    storage/              sqlite, migrations, user state repository
    time/                 Clock, day key, rollover
    audio/                player, silent switch
    widget-bridge/        snapshot builder + App Group writer
    testing/              scenario builders (used by tests AND the dev menu)
    dev/                  dev menu (not in release builds)
targets/widget/           Swift: widgets, timeline, intents
scripts/                  content check, test-changed
docs/
```

File naming inside a feature:
- `thing.logic.ts` pure rules, `thing.logic.test.ts` its tests, `thing.sim.test.ts` slow simulations
- `thing.store.ts` glue, `Thing.tsx` UI, `thing.types.ts` types shared inside the feature

## The three layers
```
UI (.tsx)  →  store (.store.ts)  →  logic (.logic.ts)
                    ↓
              storage / audio / widget-bridge
```
- Logic takes state in and returns new state plus a list of effects. It never reads the clock, the database or the network itself.
- Store pattern for every user action:
  1. read current state
  2. `const { state, effects } = logicFn(state, action, clock, rng)`
  3. save state in one SQLite transaction (rule DB-2: save after every tap)
  4. run effects (reload widgets, queue reward card, play sound)
- Effects are plain data: `{ type: 'reloadWidgets' }`, `{ type: 'queueReward', card }`, `{ type: 'showUndo', token }`. Tests assert on them.

## Time
- `Clock` interface: `now(): Date` and `timeZone(): string`. Real clock in the app, fake clock in tests, dev-menu clock in dev builds (offset stored in dev settings).
- `dayKey(clock)`: local date string `YYYY-MM-DD` after subtracting 4 hours (rule DB-1). Every "today" in the app goes through this one function.
- Nothing else in the codebase may call `new Date()` or `Date.now()`. A lint rule enforces it outside `src/shared/time`.

## Randomness
- `Rng` interface: `next(): number`. Seeded in tests.
- Specs remove randomness wherever the design allows it (fixed offsets, rotation by counter). Use `Rng` only where a spec says "shuffle".

## Data model (user state, SQLite)
All tables are per device. No sync in v1.

| Table | Key | Fields |
|---|---|---|
| `word_state` | wordId | status (new/learning/known), fsrs (JSON), dots, lastDotDay, lastRatedDay, metAt, metOnHome, sentenceIndex, strokeDays, lastStrokeDay, strokeRemoved, strokeRetired |
| `day_state` | dayKey | ticks, roundNo, roundStart, roundExtra, goalDone, repaired, repairDay, log (JSON) |
| `pack` | dayKey + seq | cards (JSON, ordered), position, history (answered cards for look-back) |
| `kana_state` | script + kana | score, seen, lastDrilled, lastWrong, knownByUser |
| `kana_progress` | script | unlockedGroups, batch (JSON), batchPosition, rotation counters |
| `stroke_state` | single row | position, tracedToday (JSON: wordId → traced character indexes) |
| `reward_queue` | id | type, payload (JSON), createdAt |
| `deck_state` | single row | currentDeckId, level, completedDeckIds, peekedDeckIds |
| `settings` | key | newWordsPerDay, widgetIntervalMin, quietStart, quietEnd, appearance, pictureStyle, onboarding answers |
| `stats` | single row | bestStreak, charactersTraced, installDay |
| `graded_log` | id | dayKey, correct (for weekly accuracy) |
| `undo` | single row | the last undoable action's full before-state, expiry time |

Undo (rule DB-3) works by snapshot: before an undoable action, the store saves the affected rows; Undo restores them and re-runs effects. No per-action reverse code.

Schema changes go through numbered migrations in `src/shared/storage/migrations`. Never edit a shipped migration.

## Content (read-only)
- Types and tables in `specs/content.md`.
- Content index (words, sentences, tokens, decks, kana words) lives in SQLite; pictures, audio and stroke data are files on disk.
- The app ships with the first N5 deck bundled so the first card shows with no network.

## Widgets
- The widget extension cannot run TypeScript. The app writes a **snapshot** (JSON + small pictures + audio) into the App Group folder; Swift only reads it and builds a timeline. All rules about which word shows when are in `widget-bridge/snapshot.logic.ts` (tested), so Swift stays dumb. Details in `specs/widgets.md`.

## Navigation
- Tabs: Home, Decks, Profile.
- Sheets (bottom): mode dropdown, week/streak, word sheet, kana levels help.
- Cross-tab jumps are store actions, not navigation params: `studyDeck(deckId)`, `practiceWriting(wordId)`, `studyKana(script)`. Each sets Home's mode then switches tab.
