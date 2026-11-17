# Onboarding, tutorial, rating, paywall (OB)

**Status: draft. Not designed (OQ-4). Built at M12, after everything else works.**
Source: handoff 4 (Other v1 items), 4d (First open), 3a and 3b (review lessons), 12 (Monetization).

Before designing: record Hourly Kana, Daily Hangul and 26s from install to paywall, then fill the "Decide" list at the bottom.

## Flow (decided order)
1. Level: brand new / know kana / N5 / N4 / N3 / N2 / N1.
2. Goal.
3. Guided widget setup (critical step), with the notification opt-in.
4. Short tutorial.
5. Rating prompt after the first win.
6. Paywall.
7. Home with the first card on screen.

## Rules already decided
- OB-1 `[logic]` Level → start: brand new → Home in Kana mode, Hiragana. Know kana → Words, N5 core deck part 1. N5–N1 → Words, that level's core deck part 1.
- OB-2 `[logic]` The level answer is stored (`knowsKana` for ST-3). Level is not asked again; it changes only by studying a deck of another level.
- OB-3 `[logic]` `installDay` is set when onboarding finishes (DB-40).
- OB-4 `[logic]` Onboarding progress is saved per step. Killing the app resumes at the same step.
- OB-5 `[ui]` Widget setup shows how to add the lock screen widget and a home widget, step by step, with a check that detects when a widget has been added, and a "Later" exit.
- OB-6 `[logic]` Notification permission is requested only here, only after the user taps to turn hourly words on (WG-31).
- OB-7 `[ui]` Tutorial teaches exactly two things on real cards: the mode dropdown (easy to miss) and what "I know it" does.
- OB-8 `[ui]` Tap sounds on every button in onboarding and the tutorial.
- OB-9 `[logic]` Rating prompt: the system rating sheet, shown once, after the first summary card is dismissed and before the paywall. Never after a Don't know.
- OB-10 `[ui]` Paywall shows everything the app does (so v1 does not feel thin), honest trial terms (length, price after, renewal date), and an easy way to cancel described in plain words. Never the word "free" unless it is free.
- OB-11 `[logic]` The paywall never appears in the middle of the tutorial or in the middle of a round.
- OB-12 `[logic]` Subscription state comes from RevenueCat, cached locally so the app works offline. Restore purchases in Settings.
- OB-13 `[logic]` Products: weekly and yearly with a trial. A lifetime option is undecided.

## Decide before building (mine)
- Goal step: what are the choices and what do they change? (Round size is fixed at 10.)
- Free vs paid (NQ-14): what works without a subscription? Hard paywall after the first session, as the category does?
- Do widgets keep working when the trial ends or the subscription lapses? (They are the product and the ad hook.)
- Trial length and prices.
- Does the tutorial run on the user's real first cards (they count on the bar) or on samples?
- Feedback prompt: where does written feedback go?

## Tests
Logic tests for OB-1 to OB-4, OB-9, OB-11. Everything else by eye.
