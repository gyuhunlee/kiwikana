# Build plan

One milestone at a time. A milestone is done when its "Done when" line is true. Logic milestones finish with green tests; UI milestones finish with me checking the listed dev menu scenarios on a phone.

Status key: `[ ]` not started, `[~]` in progress, `[x]` done.

## Before starting
- Answer `not-included.md` and section C of `open-questions.md`. Each answer is a one-line spec edit now and a rewrite later.
- Add full-size board exports to `docs/design/` (list in its README).

## Order and why
1. The riskiest part (widgets, needs a Mac and Swift) gets a throwaway spike first.
2. All rules are built and tested as pure logic before any screen exists. This is where testing time is saved.
3. Screens are thin and come after the logic they show.
4. Onboarding, tutorial, rating and paywall come at the end. Analytics is the last step.

## Milestones

### M0 Project setup `[~]`
- Expo + TypeScript strict, tabs (Home, Decks, Profile), feature folders.
- `src/shared/theme` from `docs/theme.md`. Fonts loaded.
- Test rig from `docs/testing.md`: Vitest for `*.logic.ts`, scripts, Stop hook.
- `Clock`, `Rng`, storage layer, migrations (`docs/architecture.md`).
- Dev menu shell: time travel, load scenario, reset.
- Done when: empty app runs on a phone, `npm test` passes, the Stop hook runs after a change, the dev menu can move the clock.

### M1 Widget spike `[ ]` (throwaway code, 1 day max)
- One hardcoded lock screen rectangle widget and one small home widget, built with a real device build.
- App writes one JSON file to the App Group; widget reads it.
- One interactive button (iOS 17 App Intent) that changes the word.
- Done when: the widget shows on my lock screen and changes when the app writes new data. Write what was learned at the bottom of `docs/specs/widgets.md`.

### M2 Content `[ ]` — `specs/content.md`
- Local content schema, sync from Supabase, media download, content check script.
- Done when: one N5 deck (20 words, pictures, audio, sentences) is on the phone offline and `npm run check:content` passes.

### M3 Day, bar, streak logic `[x]` — `specs/day-bar-streak.md`
- Done when: all DB rules pass.
- Status: every `[logic]` DB rule has a passing test. Store (`bar.store.ts`) and UI (`Bar.tsx`, `WeekSheet.tsx`) come with M5/M6.
- Added `DayState.repairRoundNo` (migration 2) to tell the repair round apart. Needs your yes.

### M4 Word feed logic `[ ]` — `specs/word-feed.md`
- buildPack, order, answers, undo, deck advance. Simulations.
- Done when: all WF rules pass and `test:sim` matches the expected tables.

### M5 Home Words screen `[ ]` — `specs/word-card.md`
- Top bar, dropdown sheet, bar, new card, quiz card, audio, tap-a-word popup, slide, look back, undo toast.
- Done when: scenarios `fresh`, `day6`, `bar-9` behave as the spec says on a phone.

### M6 Rewards and streak sheet `[ ]` — `specs/rewards.md`, `specs/day-bar-streak.md`
- Summary card, deck complete card, week sheet, repair. End states first, animation in M11.
- Done when: scenarios `bar-9`, `deck-last-word`, `missed-yesterday` behave as the spec says.

### M7 Widgets `[ ]` — `specs/widgets.md`
- Snapshot writer (logic + tests), 4 home widgets, 5 lock widgets, notification, reload triggers.
- Done when: every widget shows today's words, rotates on the interval, stops in quiet hours, and drops a word within one reload after it turns Known.

### M8 Decks `[ ]` — `specs/decks.md`
- Search, level chips, themes, deck page, swipes, word sheet, Study this deck.
- Done when: all DK rules pass and scenario `decks-mixed` behaves as the spec says.

### M9 Kana `[ ]` — `specs/kana-feed.md`
- Batch logic + simulations, then new kana card, 6 question types, row unlock card, chart, kana page.
- Done when: all KN rules pass, `test:sim` matches the expected table, scenario `kana-unlock-next` behaves as the spec says.

### M10 Stroke `[ ]` — `specs/stroke.md`
- Pool logic, stroke matching logic, canvas, controls.
- Done when: all ST rules pass and I can trace 水 and きって on a phone in both modes.

### M11 Profile, settings, dark mode, polish `[ ]` — `specs/profile-settings.md`
- Profile stats, settings, appearance (`specs/profile-settings.md`).
- Animations, haptics, sounds: every row of `specs/motion-sound.md`.
- Empty states: every row of `specs/empty-states.md`.
- Done when: all PF and MS logic rules pass, every MS and ES row is ticked off on a phone, and every screen is checked in light and dark.

### M12 Onboarding, tutorial, rating, paywall `[ ]` — `specs/onboarding-paywall.md`
- Needs design first (open question OQ-4).

### M13 Analytics `[ ]` — `specs/analytics.md`

### M14 Release check `[ ]`
- Full manual pass of `docs/testing.md` section 6 on a real phone. App Store assets. KanjiVG attribution.

## If time runs short (cut line)
Ship order of value: Words + widgets + rewards + decks, then Kana, then Stroke. Kana and Stroke are independent of the rest by design (they only call `tick()`), so either can ship in a later update without reworking anything. My call to make, not Claude's.
