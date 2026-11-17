# Kana feed (KN)

**Scope:** Kana mode on Home: levels, demand, unlock groups, hidden batches of 10, the 6 question types, answer handling, unlock check. Chart and kana page are in `decks.md`. Source: handoff 4 (Kana mode), 5c, 5i (Kana), 11 (Maru).
**Code:** `src/home/kana/levels.logic.ts`, `batch.logic.ts`, `question.logic.ts`, `answer.logic.ts`, `unlock.logic.ts`, `kana.store.ts`, `NewKanaCard.tsx`, `KanaQuestion.tsx`.

## Data
Per kana, per script: `score` (never decreases), `seen`, `lastDrilled` (day key), `lastWrong`, `knownByUser`.
Per script: `unlockedGroups`, `batch` (cards), `batchPosition`, `typeCounter`, `wordCounters`.
Hiragana and katakana are fully separate. Katakana is never locked.

## Levels and demand
- KN-1 `[logic]` New: never in a checked question and not `knownByUser`.
- KN-2 `[logic]` Weak: in a checked question at least once (even wrong), score 0–3. Good: score 4–5. Excellent: score ≥ 6 (I know it / I already know this set score to max(score, 6)).
- KN-3 `[logic]` Demand per batch: New or Weak 3 · Good 2 · Excellent 0, or 1 when `lastDrilled` is 3+ days ago (or never).
- KN-4 `[logic]` Levels update live after every Check.

## Groups
- KN-10 `[logic]` Unlock order per script:
  - Gojūon: あ, か, さ, た, な, は, ま, や (やゆよ), ら, わ (わをん)
  - Dakuon: が, ざ, だ, ば, ぱ
  - Yōon: groups of about 6 as defined in content (`kana_groups`)
  - Sokuon: one group (small っ), tested only through words
- KN-11 `[logic]` A new user starts with the あ group unlocked. A section label appears when its first group unlocks.
- KN-12 `[logic]` "x of 46 unlocked" counts Gojūon kana only.

## Batches
The user never sees a batch, a count or a results page.
- KN-20 `[logic]` One saved batch per script. Switching script, leaving the mode, closing the app and the 4 AM rollover all keep it and its position.
- KN-21 `[logic]` A new batch is built when the current one runs out, or right after a row unlock (the rest of the old batch is thrown away).
- KN-22 `[logic]` A batch = 10 questions + one new kana card per New kana in it (max 3) → 10 to 13 cards.

### buildBatch
- KN-23 `[logic]` Candidates = unlocked kana with demand > 0, sorted by score ascending, then `lastWrong` true first, then `lastDrilled` oldest first, then chart order.
- KN-24 `[logic]` At most 3 New kana per batch; other New kana wait.
- KN-25 `[logic]` Slots: repeated passes over the candidates, one slot per kana per pass, until each reaches its demand or 10 slots are filled.
- KN-26 `[logic]` Under 10 slots: fill with unlocked, seen kana by lowest score, then longest since drilled, cycling until 10.
- KN-27 `[logic]` Each slot has a target kana and becomes a single-kana question (types 1–3) or a word question (types 4–6). Alternate single / word per target when an eligible word exists; otherwise single.
- KN-28 `[logic]` (default NQ-8) Type choice rotates by `typeCounter` within its family (1→2→3, 4→5→6). Word choice: eligible words sorted by lowest sum of their kana's scores; pick among the top 3 in rotation by a per-kana counter. No randomness.
- KN-29 `[logic]` Eligible word for a target: contains the target kana and uses only unlocked kana. A word question for a current-group target therefore always contains a current-group kana.
- KN-30 `[logic]` Sokuon targets always use word questions.
- KN-31 `[logic]` The same question (same type + same prompt) never appears twice in a row.
- KN-32 `[logic]` No two consecutive slots have the same target when another order exists.
- KN-33 `[logic]` (default NQ-2) New kana cards: each goes before its kana's first question, and that question is at index ≥ intro index + 2. Reference start for new A, B, C: `intro A, intro B, Q A, intro C, Q B, Q C, …`.
- KN-34 `[logic]` All groups unlocked and everything strong: batches are review questions, weakest and longest-unseen first, word questions preferred.

## Question types
- KN-50 `[logic]` 1: kana → pick romaji. 2: audio → pick kana (auto-plays, replay button). 3: kana → pick among speaker options (tap to hear, tap again to select). 4: romaji word → pick kana word. 5: kana word → pick romaji (meaning shown after answering). 6: spell the word by tapping kana tiles.
- KN-51 `[logic]` 4 options in a 2×2 grid (default). Exactly one is correct. No duplicate options. Position of the correct option is shuffled with `Rng`.
- KN-52 `[logic]` Kana distractors: same group first, then other unlocked kana. With fewer than 3 available (first batch has only 5 kana, which is enough), take from the next locked group.
- KN-53 `[logic]` Word distractors: other words from the unlocked pool with the same kana count when possible.
- KN-54 `[logic]` Type 6 tiles: the word's kana + current-group kana, up to 12, shuffled with `Rng`. A kana that appears twice in the word has two tiles. Tapped tiles become chips above in order; tapping a chip removes it. Correct = chips equal the word exactly.
- KN-55 `[logic]` Audio: type 2 auto-play follows the silent switch; tapping replay or a speaker option always plays.

## Answer handling
- KN-60 `[logic]` New kana card, Learn: tick (`kanaLearn`). The kana stays New until its first question is checked.
- KN-61 `[logic]` New kana card, I know it: score = max(score, 6), `seen`, `knownByUser`. Its remaining questions leave the batch (batch gets shorter, no refill). tick (`kanaKnewIt`). Undo toast. Unlock check runs now.
- KN-62 `[logic]` Check Answer is disabled until something is selected (type 6: one or more tiles placed). On Check, options lock.
- KN-63 `[logic]` Correct: score += 1 for every distinct kana in the question (a word credits all its kana once each).
- KN-64 `[logic]` Right or wrong: every kana in the question gets `seen` and `lastDrilled` = today. Target kana gets `lastWrong` = not correct.
- KN-65 `[logic]` Wrong: no score change, no extra question, no change to `roundExtra`.
- KN-66 `[logic]` tick (`kanaQuestion`, `correct`, and any kana that reached Good or Excellent on this answer as `levelUp`).
- KN-67 `[logic]` If the tick fills the bar, the summary waits until Continue (RW-5).
- KN-68 `[logic]` Continue → unlock check → queued reward cards → next card.
- KN-69 `[logic]` During a batch the question list is not re-planned, except by KN-61, DK-62 and a row unlock.
- KN-70 `[logic]` Undo I know it: score, flags, batch questions, tick, log and any row unlock it caused (group re-locked, old batch restored) all revert.

## Unlock check
- KN-40 `[logic]` After every Continue and every I know it: `totalDemand` = sum of demand over all unlocked kana. If `totalDemand < 10` and a next group exists: unlock it, queue the row unlock card, discard the rest of the batch, build a new one.
- KN-41 `[logic]` Examples: 3 Excellent + 2 Good → 4 → unlock. 5 Good → 10 → no unlock.
- KN-42 `[logic]` Only one group unlocks per check. The new group's demand makes the next check fail.

## UI
- KN-80 `[ui]` New kana card: big kana, its sound plays, one example word split into parts (あい = a + i · love). Buttons: I know it / Learn.
- KN-81 `[ui]` Question: big prompt, 2×2 options, **Check Answer** (black; gray until selectable). After Check: right answer green with extra info (kana under romaji, meaning under a word), wrong pick red, button becomes **Continue**. No "Correct" text.
- KN-82 No Drill button, no question count, no results page, no second bar, no chart on Home, no "Not quite" button.

## Simulations (`batch.sim.test.ts`)
Fake user answers with a fixed accuracy, never taps I know it, hiragana from zero. Cards include new kana cards. Tolerance ±20%.

| ID | Accuracy | Cards until か unlocks | Cards per later row | All Gojūon unlocked |
|---|---|---|---|---|
| KN-90 | 100% | ~18 | ~31–39 | ~280 |
| KN-91 | 85% | ~21 | ~33–42 | ~315 |
| KN-92 | 70% | ~25 | ~40–50 | ~370 |

- KN-93 Every unlocked kana that is still Weak keeps receiving questions after later rows unlock.
- KN-94 Property: over 500 simulated batches, every batch has 10 questions, at most 3 intros, and satisfies KN-31 to KN-33.

These numbers came from the prototype's word list. With the real kana word list they may shift; if so, show me the new table before changing anything.

## Empty states
- All groups Excellent: review batches continue (KN-34). No "done" screen.

## Motion and sound (M11)
Prompt pops in; answers rise in 60 ms apart; selected answer press-bounce; on Check right pops green, wrong shakes red; meaning fades in; button pops into Continue. New kana card rises in, big kana pops.

## Manual check
- `fresh-kana`: `intro あ, intro い, Q あ, intro う, Q い, Q う, …`.
- `kana-unlock-next`: one right answer → Continue → row unlock card → new row's intros.
- Tap I know it on a new kana → its questions are gone (kana inspector), Undo brings them back.
- Type 2 with silent switch on: no auto-play, replay button plays.
- Switch Hiragana → Katakana → back: same card as before.
