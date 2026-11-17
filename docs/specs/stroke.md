# Stroke mode (ST)

**Scope:** writing practice on Home: which words show, tracing check, counting, removing and retiring words. Kana tracing from a kana page reuses the canvas. Source: handoff 4 (Stroke mode), 5d, 5i (Stroke), 11 (stroke reference app).
**Code:** `src/home/stroke/pool.logic.ts`, `match.logic.ts`, `session.logic.ts`, `stroke.store.ts`, `StrokeScreen.tsx`, `StrokeCanvas.tsx`.

## Data
Per word: `strokeDays`, `lastStrokeDay`, `strokeRemoved`, `strokeRetired`, `metOnHome` (true after Learn or I know it on Home).
Session: `position` (word index, character index), `tracedToday` (word → set of character indexes), `oneOffWordId`.
Stroke data: KanjiVG paths per character, normalized to a 0–1 square (`content.md` CT-40).

## Pool
- ST-1 `[logic]` Pool = words with `metOnHome`, not `strokeRemoved`, not `strokeRetired`. Words only marked in Decks are not in it.
- ST-2 `[logic]` Order: most recently met first (`metAt` descending).
- ST-3 `[logic]` Kana-only words are skipped when the user "knows kana": onboarding answer was "know kana" or a JLPT level, or all 46 Gojūon hiragana are Good or better.
- ST-4 `[logic]` The pool is re-read each time Stroke opens, starting at the first word, first character. At the end it loops to the top.
- ST-5 `[logic]` Empty pool → empty state.

## Tracing
- ST-10 `[ui]` Guided: guide strokes visible (`strokeGuide` color, from KanjiVG, not the font). Free-form: grid only.
- ST-11 `[logic]` Strokes are checked in order against the expected stroke. Accepted → turns solid, snapped to the reference path. Rejected → shakes and fades; same stroke again.
- ST-12 `[logic]` Free-form: after 2 rejected attempts on one stroke, that stroke's guide appears until it is accepted.
- ST-13 `[logic]` A character is traced when all its strokes are accepted: success pop, tick (`traced`), `charactersTraced += 1`. It stays on screen until → or ».
- ST-14 `[logic]` One tick per character per visit. Clearing and re-tracing gives nothing more. Leaving the character and coming back the same day gives nothing more (`tracedToday`).
- ST-15 `[logic]` Eraser clears the current character's drawing. No undo of single strokes. ▶ plays the stroke order animation and changes no state. Guided / Free-form toggle changes the drawing only and is remembered.

### Stroke matching (`match.logic.ts`)
- ST-20 `[logic]` (default NQ-9) Input: user points and reference points, both in the 0–1 square. Resample both to 24 points. Accept when all hold:
  - start point within 0.20 of the reference start
  - end point within 0.25 of the reference end
  - overall direction (start → end vector) within 60° of the reference; skipped when the reference start and end are closer than 0.10 (loops like the end of あ)
  - mean distance between matching resampled points ≤ 0.18
  - user path length between 0.5× and 2.0× the reference length
- ST-21 `[logic]` A stroke drawn in reverse is rejected.
- ST-22 `[logic]` A tap or a path shorter than 0.03 is ignored (not counted as a miss).
- ST-23 `[logic]` Tests use recorded fixtures: for 一, 十, 水, あ, っ — the reference itself, a jittered copy (accept), a reversed copy (reject), a wrong stroke of the same character (reject).
- ST-24 Thresholds are starting values. Tune on a phone with my finger, then lock them in the spec.

## Session
- ST-30 `[logic]` Practice writing from a word sheet: Home switches to Stroke with that word first; then the normal pool continues. A removed or retired word goes back in the pool with `strokeDays` 0. A word never met on Home gets a one-off visit and does not join the pool.
- ST-31 `[logic]` Tapping a tile jumps to that character. → goes to the next character (at the last one, to the next word). » goes to the next word; untraced characters get no credit.
- ST-32 `[logic]` When every character of a word has been traced today and `lastStrokeDay` ≠ today: `strokeDays += 1`, `lastStrokeDay` = today.
- ST-33 `[logic]` `strokeDays` reaches 2 → `strokeRetired`. It leaves the pool at the next pool read (not mid-word). It stays in Words.
- ST-34 `[logic]` ✕: `strokeRemoved` = true, next word loads, Undo toast. No tick, not on the summary.
- ST-35 `[logic]` Stroke never changes word status, dots, FSRS, deck progress or kana scores. Table test against the side-effects list.
- ST-36 `[logic]` Kana characters inside a word (okurigana, kana-only words) are traced like any other character.

## UI (layout copied from the stroke reference app)
- ST-50 `[ui]` Top: the word's characters as small square tappable tiles in a row (current = `kiwiTint` fill + green ring). Under them, left: meaning in bold ("to eat") and `reading · romaji` below it. Right, level with the meaning: round ✕, always visible, far from Next.
- ST-51 `[ui]` Canvas: full width, square, nothing inside but the grid (and guide strokes in Guided). Line under it: "Write in stroke order."
- ST-52 `[ui]` Controls row under the canvas: Guided / Free-form segmented toggle on the left · round ▶ and eraser icon buttons on the right. Under that, a full-width black button **→ Next character**. (default NQ-16) **» Next word**: a round icon button at the right end of the controls row; on the word's last character the black button itself reads **» Next word**.
- ST-53 No undo button, no card or pill around the tiles, no progress display, nothing else in the canvas.

## Empty states
- Empty pool: "Learn a word first and it will show up here to write." + button that switches to Words.

## Motion and sound (M11)
Accepted stroke settles into place; rejected stroke shakes and fades; success pop on a finished character with a light haptic.

## Manual check
- `stroke-pool`: opens on the most recently met word.
- Trace 水 in Guided, then Free-form. Draw a stroke backwards: rejected. Miss twice in Free-form: hint shows.
- Trace a full word → bar +1 per character. Clear and re-trace: bar unchanged.
- ✕ → next word, Undo brings it back, bar unchanged.
- Trace a word fully on two days (dev menu +1 day) → gone from the pool on the next open.
