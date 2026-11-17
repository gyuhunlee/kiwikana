# Specs

One file per feature. Each rule has an ID. Tests are named with the ID. Code that implements a rule carries the ID in a comment.

| Spec | Prefix | Milestone | Logic files |
|---|---|---|---|
| `content.md` | CT | M2 | `src/shared/content` |
| `day-bar-streak.md` | DB | M3, M6 | `src/home/bar` |
| `word-feed.md` | WF | M4 | `src/home/words` |
| `word-card.md` | WC | M5 | `src/home/words` (UI) |
| `rewards.md` | RW | M6 | `src/home/rewards` |
| `widgets.md` | WG | M1, M7 | `src/shared/widget-bridge`, `targets/widget` |
| `decks.md` | DK | M8 | `src/decks` |
| `kana-feed.md` | KN | M9 | `src/home/kana` |
| `stroke.md` | ST | M10 | `src/home/stroke` |
| `profile-settings.md` | PF | M11 | `src/profile` |
| `motion-sound.md` | MS | M11 (rewards rough in M6) | `src/shared/theme/motion.ts`, `src/shared/audio/sfx.ts` |
| `empty-states.md` | ES | with each feature, checked in M11 | owned by each feature |
| `onboarding-paywall.md` | OB | M12 | `src/onboarding` |
| `analytics.md` | AN | M13 | `src/shared/analytics` |

## Format of a spec
1. **Scope**: what it covers, where it lives, handoff sections it comes from.
2. **Data**: the state it owns.
3. **Rules**: numbered, each one checkable by a test. Marked `[logic]` (must have a test) or `[ui]` (checked by eye with a scenario).
4. **Empty states**.
5. **Motion and sound** (built in M11).
6. **Manual check**: scenarios to load and what to see.

## Rules for editing specs
- IDs are never reused or renumbered. A removed rule keeps its ID with "removed".
- A rule changes only after I say yes. Spec first, then tests, then code.
- `(default)` marks a rule that is my open question. See `../open-questions.md`.
