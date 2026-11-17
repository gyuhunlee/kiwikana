# Decks tab (DK)

**Scope:** search, kana deck cards, level chips, themes, deck page, row swipes, word sheet, Study this deck, kana chart and kana page. Source: handoff 4 (Decks tab), 5f, 5i (Decks).
**Code:** `src/decks/search.logic.ts`, `deck-progress.logic.ts`, `word-actions.logic.ts`, `DecksScreen.tsx`, `DeckPage.tsx`, `WordSheet.tsx`, `KanaChart.tsx`, `KanaPage.tsx`.

## Terms
- DK-1 `[logic]` Met = status is not new. Deck complete = all its words met. Mastered = all its words Known.
- DK-2 `[logic]` A deck has at most 20 words. A theme has up to 3 decks (parts 1, 2, 3).
- DK-2b `[logic]` Deck display name = level + theme + part: "N5 Core 1", "N5 Food & drink 2". Used in the Home dropdown, the deck complete card and Profile.

## Decks screen (top to bottom)
- DK-3 `[logic]` (default NQ-12) Level chips N5–N1 filter the deck list only. They do not change the current deck.
- DK-4 `[ui]` Search field → Hiragana and Katakana cards → level chips → theme cards.
- DK-5 `[logic]` Theme card data: one small bar per part (Known / 20) and a badge: "Studying n" when part n is the current deck, "Mastered" when every part is mastered, otherwise none.
- DK-6 No "?" next to the kana cards. No known counts on deck pages.

## Search
- DK-10 `[logic]` Matches across all levels on: word (kanji form), kana, romaji, meaning. Case-insensitive. Romaji matches with or without spaces and long-vowel marks (`toukyou`, `tokyo`, `tōkyō` all find 東京).
- DK-11 `[logic]` Ranking: exact match, then prefix, then contains; ties by level N5 first.
- DK-12 `[ui]` Result row: word + meaning. Tap → word sheet.
- DK-13 `[ui]` No results: "No words found".

## Deck page (same template for every deck)
- DK-20 `[ui]` Name · **1 · 2 · 3** toggle · **Study this deck** · All / Learning / Known pills + filter icon · rows.
- DK-21 `[logic]` Toggle label per part: `x / 20` (x = Known) or "Mastered".
- DK-22 `[logic]` Pills: All = every word. Learning = status new or learning. Known = status known.
- DK-23 `[logic]` Filter sheet: Sort (Recently added / A–Z by romaji), Show sentence toggle. Saved per user, applies to all decks.
- DK-24 `[ui]` Row: picture, word, meaning, 3 progress dots (`dots`). With Show sentence on, the first sentence shows under the meaning.
- DK-25 `[logic]` Swipe a not-Known row left → Known (DK-40). Swipe a Known row right → Learning (DK-41). Other directions do nothing.
- DK-26 `[logic]` Peek: the first time a deck page opens (stored per deck), the first not-Known row peeks left, then the first Known row peeks right if one exists. Never again for that deck.
- DK-27 `[logic]` **Study this deck**: this deck becomes current, Home switches to Words mode and the tab changes to Home. Today's pack follows WF-40.

## Word sheet
- DK-30 `[ui]` Opens from a row or a search result. Shows the word card content (WC-10, WC-11, with tappable sentence words) with audio on tap only, no auto-play.
- DK-31 `[logic]` Buttons by state: not Known → "I already know this"; Known → "Mark as learning". "Practice writing" always.
- DK-32 `[logic]` Practice writing → ST-30.

## Word actions from Decks
None of these tick the bar or appear on a summary (DB-11).
- DK-40 `[logic]` To Known (swipe left or "I already know this"): status known, dots 3, FSRS removed. Its unanswered cards leave today's pack (WF-41). If it was new: `metAt` = now, deck complete check (reward shows on next Home visit, RW-6). Mastered check. Reload widgets. Undo toast. Does not join the Stroke pool.
- DK-41 `[logic]` To Learning (swipe right or "Mark as learning"): dots 0, status learning, fresh FSRS card due tomorrow (WF-42). Deck loses Mastered. Not added to today's pack. Undo toast.
- DK-42 `[logic]` Undo restores everything DK-40 or DK-41 changed, including a queued deck complete card and the pack.

## Kana deck page
- DK-50 `[ui]` Title + **?** (bottom sheet explaining the 4 levels and their conditions, KN-2) + Study button + chart.
- DK-51 `[logic]` Study → Home in Kana mode with that script.
- DK-52 `[ui]` Chart: sections Gojūon, Dakuon, Yōon, Sokuon with a gap and a small gray label between sections. Locked sections are hidden. Locked groups inside a visible section are hidden. Romaji under every kana. The current group is outlined.
- DK-53 `[logic]` Cell shade from level: New / Weak / Good / Excellent (KN-2).
- DK-54 `[logic]` Current group = the most recently unlocked group.
- DK-55 No "0 / 46 learned" count. No edit mode.

## Kana page (tap an unlocked kana)
- DK-60 `[ui]` Big kana + sound · level + progress line · 2–3 example words split into parts with audio · small links "Practice writing" and "I already know this".
- DK-61 `[logic]` Progress line: New → "New"; Weak → "Weak · s / 4 correct to Good"; Good → "Good · s / 6 correct to Excellent"; Excellent → "Excellent".
- DK-62 `[logic]` "I already know this": score = max(score, 6), `knownByUser`. Its questions leave the current batch. Unlock check runs when the kana feed is next shown. No tick. Undo toast.
- DK-63 `[logic]` "Practice writing": opens tracing for that kana (same canvas as Stroke). Each kana traced = +1 on the bar and +1 characters traced. Kana score unchanged. Once per visit.

## Empty states
- Level with no decks yet: "More decks coming soon".
- Known pill empty: "Words you know will show here". Learning pill empty: "Nothing left to learn here".

## Motion (M11)
Row peek on first open (left, then right).

## Manual check
- `decks-mixed`: first open peeks once; reopen does not.
- Swipe a learning row left → moves to Known, 3 dots, Undo works. Check it left today's pack (pack inspector) and the widget.
- Swipe it back right → 0 dots, in Learning.
- Search `neko`, `ねこ`, `猫`, `cat` → same word.
- Mark the last unseen word of a deck Known in Decks → go Home → deck complete card.
