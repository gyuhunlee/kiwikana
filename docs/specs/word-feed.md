# Word feed (WF)

**Scope:** which word cards show on Home in Words mode, in what order, and what each answer changes. No UI here (see `word-card.md`). Source: handoff 5b, 5i.
**Code:** `src/home/words/pack.logic.ts` (build + order), `answer.logic.ts`, `fsrs.logic.ts` (the only file that imports `ts-fsrs`), `deck-advance.logic.ts`, `words.store.ts`.

## Data
`WordState`: `status` new | learning | known · `fsrs` · `dots` 0–3 · `lastDotDay` · `lastRatedDay` · `metAt` · stroke fields (owned by `stroke.md`).
`Pack`: `dayKey`, `seq` (1 for the first pack of the day), `cards[]`, `position`, `history[]`.
`Card`: `{ wordId, type: 'new' | 'returning' | 'strong' | 'weak', sentenceIndex: 0 | 1, loop?: true }`.
Constants: `PACK_SIZE 10`, `WEAK_R 0.70`, `RETENTION 0.85`, `REINSERT_OFFSET 3`, `RETURN_GAP 2`.

## FSRS wrapper
- WF-1 `[logic]` Default weights, desired retention 0.85. Ratings used: Good (Know) and Again (Don't know) only.
- WF-2 `[logic]` `retrievability(word, now)` and `isDue(word, dayKey)` come from the wrapper. A word with no FSRS review yet has no retrievability.
- WF-3 `[logic]` Due today = FSRS due date's day key ≤ today.

## Card types
- WF-5 `[logic]` New: status new. Returning: a quiz for a word already shown in this pack. Strong: learning, due today, R ≥ 0.70. Weak: learning, R < 0.70, due or not.
- WF-6 `[logic]` Known words are never in a pack. Checked by a property test over random states.

## buildPack(state, dayKey, seq)
- WF-10 `[logic]` If a pack with this dayKey and seq is saved, return it unchanged, including position.
- WF-11 `[logic]` `weak` = learning words with R < 0.70, lowest R first. `strong` = learning words due today with R ≥ 0.70, most overdue first.
- WF-12 `[logic]` (default NQ-1) `maxHard` = 2; 3 when `weak.length > 6`. `nNew` = Settings › New words per day (default 3, max 3); 2 when `weak.length > 6`. Never below 2 unless the level has fewer unseen words.
- WF-13 `[logic]` (default NQ-7) A learning word with a fresh FSRS card (from Mark as learning) counts as strong once its due day arrives.
- WF-14 `[logic]` Fill order: `nNew` new words → one returning card for each → `maxHard` weak cards → strong cards until 10.
- WF-15 `[logic]` If still under 10: add more new words, each with its returning card, while a pair still fits within 10 and unseen words remain. A single leftover slot stays empty, so a pack can be 9 cards. (Day 1 with nothing to review: 5 new + 5 returning.)
- WF-16 `[logic]` New words are the next unseen words of the current deck in deck order. When the deck runs out mid-fill, continue from the next deck (WF-50) in the same pack.
- WF-17 `[logic]` No unseen words anywhere in the level and nothing due or weak → empty pack → empty state (below).
- WF-18 `[logic]` Each word has 2 sentences. `sentenceIndex` alternates on every appearance of the word (new card, returning quiz, later days, Don't know loops), stored per word.

## order(cards)
Applied once when the pack is built. Deterministic for the same input.
- WF-20 `[logic]` First card is a strong card if any exists, else a new card.
- WF-21 `[logic]` At least one new card within the first 3 positions (when the pack has any).
- WF-22 `[logic]` (default NQ-2) Each returning card sits at index ≥ its new card's index + 2. If impossible, place it directly after.
- WF-23 `[logic]` Never two weak cards next to each other.
- WF-24 `[logic]` Last card is returning or strong when one exists.
- WF-25 `[logic]` Types are interleaved, not grouped. Reference output for 3 new (A, B, C), 2 weak, 2 strong: `strong, A, B, weak, retA, C, retB, weak, strong, retC`.
- WF-26 `[logic]` First-days output for 5 new, nothing else: `A, B, C, retA, D, retB, E, retC, retD, retE`.
- WF-27 `[logic]` Property test: 200 seeded random states; every pack satisfies WF-6, WF-20 to WF-24.

## Answers
All answers end with `tick()` (DB-10) and save (DB-2).
- WF-30 `[logic]` New card, Learn: status learning, `metAt` = now. Returning card stays. No FSRS rating, no dot. Effects: stroke pool refresh, deck complete check (WF-50).
- WF-31 `[logic]` New card, I know it: status known, dots 3, `metAt` = now. Its returning card is removed from the pack. Never scheduled in FSRS. Effects: undo toast, reload widgets, deck complete check, mastered check.
- WF-32 `[logic]` Quiz, FSRS: only the first quiz answer for a word in a day rates it (`lastRatedDay`). A new word's first returning quiz is its first rating. Later answers that day do not touch FSRS.
- WF-33 `[logic]` Quiz, Know:
  - returning or loop card: no dot.
  - strong or weak card (word met on an earlier day): if `lastDotDay` ≠ today, `dots += 1`, `lastDotDay` = today.
  - dots reaches 3: status known. The word leaves future packs, FSRS and widgets. Effects: reload widgets, mastered check.
- WF-34 `[logic]` (defaults NQ-3, NQ-4) Quiz, Don't know: `roundExtra += 1` (DB-11). Insert a card for the same word at current index + 3 (at the end if fewer than 3 remain) with `type: 'returning'`, `loop: true`, and the other sentence. Exempt from WF-23. Repeats until Know. Dots never go down.
- WF-35 `[logic]` Log entries: Learn → `wordLearn`; I know it → `wordKnewIt`; quiz → `wordQuiz` with `correct`.
- WF-36 `[logic]` When the last card of a pack is answered, build pack `seq + 1` for the same day from fresh state with the same rules, and continue with no break. Extra packs can bring new words.
- WF-37 `[logic]` Look-back: `history` holds answered cards in order. Viewing them changes nothing.
- WF-38 `[logic]` Undo I know it: status new, dots 0, `metAt` cleared, returning card back at its old index, tick and log entry removed, a summary queued by that tick is cancelled, widgets reloaded.

## Changes from outside Home
- WF-40 `[logic]` (default OQ-1) Study this deck mid-day: unanswered new cards and their returning cards are replaced by the new deck's next unseen words in the same positions. Everything else stays. Bar unchanged.
- WF-41 `[logic]` A word turned Known in Decks: all its unanswered cards leave today's pack. No refill.
- WF-42 `[logic]` A word marked as learning in Decks: dots 0, status learning, fresh FSRS card due tomorrow. Not added to today's pack.
- WF-43 `[logic]` Changing New words per day applies from the next pack built. The saved pack is untouched.
- WF-44 `[logic]` Rollover: yesterday's unfinished pack is dropped. Today's pack is built from scratch at the first open. No carry-over.

## Deck advance
- WF-50 `[logic]` A deck is complete when none of its words has status new. On completion from Home: queue the deck complete reward, set the current deck to the next part of the same theme, else the first part of the next theme at the same level.
- WF-51 `[logic]` No next deck at this level: current deck stays, no new words are added; packs hold reviews only.

## Simulations (`pack.sim.test.ts`)
Fake user: Know rate 85% on every quiz, answers N cards a day, 30 days, 3 new per pack.
- WF-60 10 cards a day: new words per day 4–5 on days 1–5, then about 3. After 30 days about 90 learning (±15), about 5 Known (±5), about 18 due and waiting (±10).
- WF-61 5 cards a day: about 3 new a day on days 1–5, then about 2. After 30 days about 70 learning (±15), about 3 Known (±3).
- WF-62 First FSRS reviews land on days 5–6.
- WF-63 First Known word appears between day 15 and day 30.
- WF-64 A user who skips 10 days: next pack has at most `maxHard` weak cards and `nNew` = 2.
- WF-65 Report (not asserted): Don't know rate per day. Above 30% means too hard.

## Empty states
- Nothing to show (WF-17): "You've finished every word at this level." + button to Decks.

## Manual check
- `fresh`: pack inspector shows `A, B, C, retA, D, retB, E, retC, retD, retE`.
- `day6`: first card is strong; a new word within the first 3; no two weak in a row.
- `two-dots-due`: Know → word gone from Home, widget and the Learning pill.
- Don't know twice on one word: it returns 3 cards later each time with the other sentence; bar total grows by 1 each time.
