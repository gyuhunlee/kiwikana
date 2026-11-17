# Testing

Goal: tests never slow down a normal change, and manual testing of multi-day behavior takes minutes, not days.

## 1. The idea
Three things make testing slow in an app like this. Each has one fix.

| Slow thing | Fix |
|---|---|
| Tests boot React Native and run on every change | Rules live in pure `*.logic.ts` files. Their tests run in plain Node in milliseconds. Only tests related to changed files run automatically |
| Algorithm behavior only shows up after days of use | Fake clock + seeded scenarios + simulations in tests. Dev menu time travel on the phone |
| Getting the app into a specific state by hand (bar at 9/10, row about to unlock) | Scenarios: one function builds each state. The same scenarios feed tests and the dev menu |

## 2. Test tiers
| Tier | Files | Speed | Runs when |
|---|---|---|---|
| Logic | `*.logic.test.ts` | under ~2 s for a related set | Stop hook, only for changed files |
| Simulation | `*.sim.test.ts` | seconds to a minute | `npm run test:sim`: when I ask, before commit, after changing a feed algorithm |
| Content | `scripts/check-content.ts` | seconds | `npm run check:content`: after content changes, before commit |
| Static | `tsc --noEmit`, eslint | seconds | inside `npm test`; editor shows these live |
| Manual | checklist in section 6 | minutes with the dev menu | end of each UI milestone, before release |

Not in v1: component tests, snapshot tests, end-to-end tests. Screens hold no rules, so they are checked by eye with scenarios. Revisit after launch if regressions show up.

## 3. Scripts (package.json)
```
"test:changed": "vitest run --changed --exclude '**/*.sim.test.ts'",
"test:logic":   "vitest run --exclude '**/*.sim.test.ts'",
"test:sim":     "vitest run .sim.test.ts",
"check:content":"tsx scripts/check-content.ts",
"test":         "tsc --noEmit && eslint . && npm run test:logic && npm run test:sim && npm run check:content"
```
- Vitest config: `environment: 'node'`, `include: ['src/**/*.test.ts']`. No React Native preset, no transforms beyond TypeScript.
- A lint rule blocks `*.logic.ts` from importing `react`, `react-native`, `expo-*`, or anything from a `.tsx` / `.store.ts` file. This is what keeps the fast tier fast.
- `--changed` runs tests related to uncommitted changes. Commit often so the set stays small.

## 4. Stop hook
Runs once when Claude finishes a turn, not on every edit.

`.claude/settings.json`:
```json
{
  "hooks": {
    "Stop": [
      { "hooks": [ { "type": "command", "command": "node scripts/test-changed.mjs" } ] }
    ]
  }
}
```
`scripts/test-changed.mjs` does this:
1. Read the hook input from stdin. If `stop_hook_active` is true, exit 0 (prevents a loop).
2. If no file under `src/` with a `.ts` extension changed (`git status --porcelain`), exit 0. Docs-only and Swift-only turns cost nothing.
3. Run `npm run -s test:changed`.
4. Pass: exit 0, print nothing. Fail: print the failing test names and messages to stderr and exit 2, which sends them back to Claude to fix.

Confirm the hook fields against the current Claude Code hooks docs when setting up (`/hooks` shows what is registered). Written as a Node script because development is on Windows.

## 5. How tests are written
- Spec first. Each rule in `docs/specs/*.md` has an ID. One or more tests per ID, named with it: `it('WF-12 ...')`.
- `npm run test:coverage-ids` (small script): lists spec IDs with no test and tests with unknown IDs. Run before commit. This is how I know the spec is fully covered without reading tests.
- Arrange with scenario builders, never by hand-writing rows:
  ```ts
  const s = scenario.day6()                 // user with first reviews landing
  const s = scenario.fresh().withBar(9)     // builders chain
  ```
- Fake clock: `clock.set('2026-11-16T09:00')`, `clock.advanceDays(1)`. Seeded rng: `rng(1)`.
- Assert on returned state and effects. Never on storage or UI.
- Table-driven tests for tables in the spec (what counts on the bar, side effects).
- Property checks for ordering rules: build 200 packs from random states with seeds, assert every ordering rule holds on each. Cheap and catches what examples miss.

### Simulations
`*.sim.test.ts` plays a fake user for N days through the real logic (no UI, no storage) and checks the "expected behavior" tables in the specs within a tolerance. Examples: 30 days at 10 cards a day gives roughly 90 learning and 5 Known; all Gojūon hiragana unlock in 280 to 370 cards depending on accuracy. If a tuning change moves these numbers, the sim fails and I decide whether the new number is fine.

`npm run sim:report` prints the tables (no assertions) so I can tune pack size, hard cards and retention without touching the phone.

## 6. Manual testing with the dev menu
Dev builds only. Open with a 3-finger long press on Home.

**Time**
- +1 hour, +1 day, jump to 3:59 AM, jump to 4:01 AM, reset to real time.
- Time travel only changes the app's `Clock`. Widgets use real time, so widget rotation is tested with "Widget interval: 1 minute (dev)" instead.

**Scenarios** (load = wipe user state and write this one)
| Name | State | Used to check |
|---|---|---|
| `fresh` | just finished onboarding at N5 | first pack: 5 new + 5 returning |
| `fresh-kana` | brand new, Kana mode | あ-row intros and first questions |
| `day6` | 5 days of use, first reviews due | mixed pack order |
| `day30` | 30 days of use, some Known, some weak | hard cards, nNew drop to 2 |
| `bar-9` | bar at 9 / 10 | summary card, "Daily goal done" |
| `bar-9-kana` | bar at 9 / 10 in Kana | summary waits for Continue |
| `two-dots-due` | a word with 2 dots due today | turning Known, widget drop |
| `deck-last-word` | 1 unseen word left in the deck | deck complete card, next deck |
| `kana-unlock-next` | total demand at 10, one correct answer from unlock | row unlock card, rebuild |
| `missed-yesterday` | streak 5, yesterday missed | repair flow |
| `decks-mixed` | a deck with new, learning and Known rows | swipes, pills, peek |
| `stroke-pool` | 6 met words, one traced yesterday | stroke order, auto-retire |
| `all-known` | every word in the level Known | empty states |

Scenario builders live in `src/shared/testing/scenarios.ts`. A scenario added for a test is automatically in the dev menu.

**Inspectors**
- Pack inspector: today's pack as a list. Each card shows type (new / returning / strong / weak), R, due date, dots, and the ordering rule that placed it. This answers "why did I get this card" in one look.
- Kana inspector: unlocked groups, each kana's score / level / demand, total demand, current batch.
- Day inspector: ticks, round, roundExtra, log, streak, repairDay.
- Widget inspector: the snapshot JSON last written and the next 12 timeline entries.

**Release checklist** (M14, on a real phone, real time)
1. Fresh install, airplane mode: first card shows and plays audio.
2. Kill the app mid-card five times: nothing lost beyond the card on screen.
3. Each widget added; word changes on the interval; quiet hours hold; Known word leaves.
4. Cross a real 4 AM once with the widget on the lock screen.
5. Light and dark on every screen. Smallest and largest iPhone.
6. Silent switch on: no auto-play; tapping a speaker still plays.
7. Every scenario in the table above, one pass.

## 7. What Claude does at the end of a task
- Logic task: nothing extra. The Stop hook reports.
- UI task: list the scenarios to load and what should be seen in each, in 3 to 6 lines.
- Algorithm change: say that `npm run test:sim` should be run, and do not run it unless asked.
