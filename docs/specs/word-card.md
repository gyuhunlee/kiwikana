# Word card and Home Words screen (WC)

**Scope:** what a word card looks like and how the Home screen behaves in Words mode: new card, quiz card, audio, tap-a-word popup, slide and look-back, mode dropdown. Rules about which card comes next are in `word-feed.md`. Source: handoff 4 (Words mode, Home top), 4b, 10, 11 (26s card).
**Code:** `src/home/HomeScreen.tsx`, `ModeSheet.tsx`, `src/home/words/WordCard.tsx`, `QuizCard.tsx`, `Sentence.tsx`, `WordPopup.tsx`, `sentence-layout.logic.ts`, `audio-queue.logic.ts`.

## Home frame
- WC-1 `[ui]` The app opens on Home in the last-used mode, on the saved card. A queued reward card shows before any exercise.
- WC-2 `[ui]` Dropdown (top left) is a pill showing mode and deck: `Words · N5 Core 1 ⌄`, `Kana · Hiragana ⌄`, `Stroke ⌄`. It opens a bottom sheet with three rows: Words, Kana, Stroke.
  - Words row: current deck name + "Change deck ›" (jumps to Decks).
  - Kana row: Hiragana / Katakana choice.
  - Stroke row: just "Stroke".
- WC-3 `[logic]` Switching mode keeps each mode's position (pack position, kana batch position, stroke position).
- WC-4 No gear, no mode on/off screen, no level tag on Home.

## Card layout (top to bottom, left-aligned)
- WC-10 `[ui]` One white card on the `bg` background holds everything. Inside it: large picture with rounded corners, full card width, in the user's picture style · word (`jpWord`) · `reading · romaji` (`caption`, e.g. `あめ · ame`) · meaning (`bodyBold`) · divider · sentence · English translation with the target word bold.
- WC-11 `[ui]` Two round speaker icon buttons (`raised` fill) on the right edge: one level with the word, one level with the sentence. Speaker icons, not waveforms. Each lights up while its audio plays.
- WC-12 No part-of-speech, no bookmark, no level tag, no "Review" tag.
- WC-13 `[ui]` New card: everything visible. Two equal-width buttons side by side at the bottom of the card: **I know it** on the left (white, outlined) and **Learn** on the right (black).
- WC-14 `[ui]` Quiz card front: word top-left with its speaker button top-right, then the picture as a tall rounded block, blurred strongly enough that the scene cannot be guessed (only soft color shows), with a round icon and "Tap to reveal" centered on it. No reading, no meaning, no sentence, no buttons.
- WC-15 `[ui]` Tap anywhere on the quiz card → blur clears and the card becomes the WC-10 layout (picture on top, word below it), with **Don't know** on the left (white, outlined) and **Know** on the right (black).
- WC-16 `[ui]` Buttons only. No swipe-to-answer.

## Sentence rendering
- WC-20 `[logic]` `layoutSentence(tokens)` returns render units: `{ surface, furigana?, isTarget, tappableWordId? }`. Furigana is attached per kanji run, not per token (食べる → 食 gets た, べる gets none).
- WC-21 `[ui]` Furigana at 12 px over every kanji. Target word bold. Tappable words have a dotted underline in `kiwiBrown`.
- WC-22 `[ui]` Sentences wrap between tokens, never inside one. Furigana never overlaps the line above.
- WC-23 `[logic]` The target token is not tappable (its info is already on the card).

## Tap-a-word popup
The hard part is data, not UI. The data rules are CT-20 to CT-24 in `content.md`.
- WC-30 `[logic]` (default NQ-11) A token is tappable when its `wordId` is set, it is not the target, and it is not a particle. No picture is needed for the popup.
- WC-31 `[ui]` Tap → small popup directly above the token with an arrow pointing at it: word (dictionary form), romaji, meaning, speaker icon. No Save. No picture.
- WC-32 `[ui]` The popup never covers the tapped token and stays inside the screen edges (shift sideways; the arrow still points at the token). If there is no room above, it shows below.
- WC-33 `[ui]` Tap anywhere else closes it. One popup at a time.
- WC-34 `[logic]` Opening a popup changes no state (the tapped word is not "met").
- WC-35 `[ui]` The popup speaker plays that word's audio and stops card audio.
- WC-36 `[ui]` On a quiz card the sentence is hidden before reveal, so popups exist only after reveal.

## Audio
- WC-40 `[logic]` `audioQueue` for a card: new card and revealed quiz card → word, then sentence. Quiz front → word only.
- WC-41 `[ui]` Auto-play starts the moment the card is on screen. The current card's and next card's audio are preloaded so there is no wait.
- WC-42 `[logic]` Auto-play follows the silent switch. Tapping a speaker always plays.
- WC-43 `[logic]` Any answer, slide, popup audio or mode switch stops what is playing. Two clips never overlap.
- WC-44 `[ui]` The lit speaker matches the clip playing, switching from word to sentence at the right moment.
- WC-45 `[ui]` Missing or failed audio: skip silently, speaker icon dimmed. Never block the card.

## Slide and look-back
- WC-50 `[ui]` An answered card slides right; the next card slides in.
- WC-51 `[ui]` Swipe left shows the previous answered card, read-only: full content, no buttons, a small "Back to current" control. Further swipes go further back within today's history.
- WC-52 `[logic]` Look-back cards do not auto-play audio and change no state.

## Undo
- WC-60 `[ui]` After I know it, a toast with Undo shows for 4 s above the tab bar. Undo brings the card back in place (WF-38).

## Empty states
- No pack (WF-17): centered message + button to Decks. Top bar and bar still visible.
- Picture missing: `raised` color block in the picture area. Card still works.

## Motion and sound (M11)
Slide right on answer, blur clear on reveal, soft sound on reveal and on Learn, right / wrong sounds on Know / Don't know. Sounds respect the silent switch.

## Manual check
- `fresh`: first card plays word then sentence, speakers light in turn. Silent switch on: nothing plays; tap speaker plays.
- Tap a dotted word at the far left, far right and on the first line: popup stays on screen, arrow on the word.
- Answer 3 cards, swipe left 3 times, swipe back: nothing changed in the bar.
- Kill the app on a revealed quiz card: reopening shows the same card unrevealed.
