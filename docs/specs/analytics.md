# Analytics (AN)

**Status: last step (M13). PostHog.**
Source: handoff 13 (validation plan), 4 (Notes).

## Rules
- AN-1 `[logic]` One function, `track(event, props)`, in `src/shared/analytics`. Features never import PostHog directly.
- AN-2 `[logic]` Events are emitted from stores as effects (`{ type: 'track', ... }`), next to the action that caused them. Logic files stay pure; tests can assert the effect.
- AN-3 `[logic]` Offline: events queue and send later. Analytics can never block or slow a tap.
- AN-4 `[logic]` No personal data. Anonymous ID only. No word-level content needed beyond IDs.
- AN-5 `[logic]` Disabled in dev builds and under test.

## What must be measurable (from the validation plan)
| Question | Events |
|---|---|
| Trial conversion | `paywall_shown`, `trial_started`, `subscribed` (RevenueCat is the source of truth; these are for funnels) |
| D1 / D7 retention | `app_opened` (once per day key) |
| Rounds finished per day | `round_done { roundNo, mode mix, cards, dontKnow }` |
| Don't know rate (> 30% = too hard) | `word_quiz { correct, cardType, dots }` |
| Is the widget used | `widget_setup_done { kinds }`, `opened_from_widget`, `widget_audio_played`, `notification_opened` |
| Onboarding drop-off | `onboarding_step { step }` |
| Which modes matter | `mode_switched { to }`, `kana_row_unlocked { group }`, `character_traced` (sampled), `deck_completed` |
| Is "I know it" overused | `word_knew_it`, `undo_used { action }` |
| Streak mechanics | `goal_done`, `streak_repaired` |
| Content problems | `audio_failed { id }`, `picture_missing { id }` |

- AN-10 Keep the list this small for v1. Add an event only when there is a decision it would change.
- AN-11 User properties: level, start mode, picture style, widget interval, days since install, subscription state.

## Not measured from widgets
Widget views cannot be counted (iOS does not report them). Widget use is inferred from setup, taps and audio plays.

## Tests
One test per event: the store action emits the `track` effect with the right props.
