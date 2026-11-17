# Rewards (RW)

**Scope:** the three reward cards shown inline in the Home feed (summary, row unlock, deck complete), their queue and timing. Source: handoff 4 (Rewards), 4b, 5e.
**Code:** `src/home/rewards/queue.logic.ts`, `summary.logic.ts`, `RewardCard.tsx`.

## Queue
- RW-1 `[logic]` Reward cards are saved in `reward_queue`. The feed shows the head of the queue in place of the next exercise. The dropdown and bar stay on top.
- RW-2 `[logic]` Order when several are queued from one action: summary → row unlock → deck complete.
- RW-3 `[logic]` The card's button (labels in RW-15, RW-21, RW-31) removes it from the queue and continues the current mode. Dismissing a summary applies DB-15.
- RW-4 `[logic]` (default NQ-10) An unseen queued card shows first on the next open, in whichever mode is active, even after the rollover. A summary carried over a rollover no longer changes the new day's round on dismiss.
- RW-5 `[logic]` Timing of when a queued card becomes visible:
  - word card → after it slides away
  - kana question → after Continue
  - new kana card or I know it → right after the tap
  - stroke → after the character's success pop
- RW-6 `[logic]` A deck completed from Decks queues its card; it shows the next time Home is open.
- RW-7 `[logic]` Undo of the action that queued a card removes that card (DB-3).

## Summary card
- RW-10 `[logic]` Queued by DB-10 with a copy of the round's log.
- RW-11 `[logic]` Title: "Daily goal done" for round 1 only. Later rounds rotate in order by `roundNo`: "Nice work", "On a roll", "Keep it up", "Great round". Repair rounds use the rotation too.
- RW-12 `[logic]` Subtitle "Here's what you did". `buildSummary(log)` returns sections; empty sections are omitted:

| Section | Content | Limit |
|---|---|---|
| Count tiles | words (`wordLearn` + `wordQuiz`, not `wordKnewIt`) · kana (`kanaLearn` + `kanaQuestion`) · traced | — |
| Dots | one dot per graded answer (`wordQuiz`, `kanaQuestion`) in order, green or red, + "x of y right" | — |
| New words | words with `wordLearn` | 4 |
| Already knew | `wordKnewIt` + `kanaKnewIt` | 8 |
| Kana level-ups | kana that reached Good or Excellent this round | — |
| Practice again (the missed items) | wrong `wordQuiz` and `kanaQuestion` items, unique | 8 |

- RW-13 `[logic]` A word missed twice in a round appears once under Missed and as two red dots.
- RW-14 No streak mention on any reward card.
- RW-15 `[ui]` Layout, top to bottom: hero (check mark in a black circle) inside the confetti strip · title · "Here's what you did" · up to 3 count tiles in a row (big number, small label: words, kana, traced) · dots row + "5 of 6 right" · sections, each with a small all-caps gray label (NEW WORDS, ALREADY KNEW, KANA LEVELED UP, PRACTICE AGAIN). New words are tiles (word + meaning); the other sections are chips. Full-width black button "Keep going".

## Row unlock card
- RW-20 `[logic]` Queued when the unlock check passes (KN-40). Payload: finished group, new group, the new group's kana, unlocked count.
- RW-21 `[ui]` Small all-caps label "NEW ROW UNLOCKED" · hero = the new row's first kana, large · "あ-row done. Meet the か-row" · one tile per kana of the new row with romaji under it · "10 of 46 hiragana unlocked" (or katakana) · black button "Start the か-row".

## Deck complete card
- RW-30 `[logic]` Queued by WF-50. Payload: deck name and part, next deck name.
- RW-31 `[ui]` Small all-caps label "DECK COMPLETE" · hero icon · deck name ("N5 Core 1") · "All 20 words met" · a row of word tiles from the deck with a "+n" tile for the rest · black button "Start N5 Core 2" (the next deck's name). With no next deck (WF-51) the button reads "Keep going".
- RW-32 No "Hiragana complete" reward. No "X is now Known" toast.

## Empty states
None.

## Motion and sound (M11) — one animation shared by all three
1. Card rises in.
2. Hero pops; confetti bursts once, inside the top strip of the card only (kiwi green + kiwi brown).
3. Tiles land big then settle, one by one, light haptic on each.
4. Dots fill one by one.
5. Button pops last.
6. Tap anywhere skips to the end state.
Short fanfare on appear. Respects the silent switch.

## Manual check
- `bar-9`: one answer → "Daily goal done" with only the sections that have content.
- `bar-9-kana`: Check on the 10th → right answer shown first; summary only after Continue.
- `deck-last-word`: Learn → deck complete card → next card comes from the next deck.
- `kana-unlock-next` with bar at 9: one right answer → summary, then row unlock, in that order.
- Kill the app while a reward card shows: it shows again on open.
