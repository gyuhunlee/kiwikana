# Content (CT)

**Scope:** the read-only learning content: its shape, how it gets onto the phone, and the automated check that guards it. Source: handoff 5j, 4 (Notes). Content lives in Supabase (database + storage).
**Code:** `src/shared/content/types.ts`, `repository.ts`, `sync.ts`, `validate.logic.ts`, `scripts/check-content.ts`.

Most "bugs" in a flashcard app are content bugs (a missing audio file, a tappable word with no entry). The content check finds them before a phone does.

## Shapes
```
Word       { id, kanji, kana, romaji, meaning, level, deckId, order,
             pictureAnime, pictureRealistic, audio, sentenceIds[2] }
Sentence   { id, wordId, tokens[], translation, targetSpan[start,end], audio }
Token      { surface, furigana?[{ start, end, reading }], dictionaryForm, romaji, meaning?,
             wordId?, isParticle, isTarget }
Deck       { id, level, theme, part (1–3), name, wordIds[] (≤ 20), order }
KanaGroup  { script, section, id, order, kana[] }
Kana       { script, char, romaji, audio, exampleWordIds[2–3], strokeFile }
KanaWord   { id, script, kana, parts[{ kana, romaji }], romaji, meaning, audio, groupId }
Strokes    { char, strokes[{ points[[x, y]] }] }     // 0–1 square, from KanjiVG
```
- CT-1 `[logic]` IDs are stable forever. User state points at them.
- CT-2 `[logic]` Content has a `version`. The app stores the version it has per deck.

## Delivery
- CT-10 `[logic]` The first deck of N5 (words, sentences, both picture styles, audio, strokes) and all kana content are bundled in the app. First launch needs no network.
- CT-11 `[logic]` The content index for all levels (words, sentences, tokens, decks; text only) syncs on first launch with network and then when the server version changes. Search (DK-10) works across all levels once it has synced.
- CT-12 `[logic]` Media (pictures, audio, strokes) downloads per deck: the current deck, and the next deck as soon as the current one is half met. Only the selected picture style.
- CT-13 `[logic]` A deck is "ready" when every file for it is on disk. buildPack takes new words only from ready decks. If the next deck is not ready and there is no network, new words pause; reviews continue.
- CT-14 `[logic]` A content update never removes a word a user has state for. Removed words are flagged `retired` on the server and hidden from new packs only.
- CT-15 `[logic]` Downloads resume after interruption and verify file size. A failed file is retried on the next app open.
- CT-16 `[ui]` Opening a deck page for a deck that is not ready shows rows with text at once and pictures as they arrive.

## Sentence tokens and tappable words
- CT-20 `[logic]` Joining all token `surface` values gives the sentence text exactly.
- CT-21 `[logic]` Exactly one run of tokens has `isTarget`, and its `wordId` is the sentence's word.
- CT-22 `[logic]` A token is tappable only when `wordId` is set and `isParticle` is false (WC-30). Tokens without a database word are plain text.
- CT-23 `[logic]` Furigana ranges cover every kanji character in the surface and nothing else.
- CT-24 `[logic]` `targetSpan` in the translation is inside the string and non-empty.

## Content check (`npm run check:content`)
Runs against a local export of the content. Fails with a list of every problem, grouped by rule.
- CT-30 Every word: has kana, romaji, meaning, level, a deck, both pictures, audio, exactly 2 sentences.
- CT-31 Every sentence: CT-20 to CT-24 hold; has audio; has a translation.
- CT-32 Every deck: 1–20 words, unique order values, part 1–3, parts of a theme are contiguous.
- CT-33 Every `wordId` on a token exists. Report (not fail) the share of content words per level that are not tappable, and list sentences that use words above their level.
- CT-34 Every character of every word (kanji and kana) has stroke data.
- CT-35 Every kana in every group has audio, 2–3 example words and stroke data.
- CT-36 Kana words: `parts` join to `kana`; every kana in the word belongs to the word's group or an earlier group; katakana words are real katakana words.
- CT-37 Each kana group has at least 3 kana words containing each of its kana, except the あ group (few words exist).
- CT-38 Every file path referenced exists in storage and is non-empty.
- CT-39 No duplicate word (same kanji + kana) inside a level.

## Stroke data
- CT-40 `[logic]` KanjiVG paths are converted at build time to point lists in a 0–1 square, in stroke order. The app never parses SVG.
- CT-41 KanjiVG is CC BY-SA. Attribution shows in Settings › About. Check the share-alike terms before release.

## Audio
- CT-50 One file per word, per sentence, per kana, per kana word. Format and loudness are the same across all files.
- CT-51 UI sounds (taps, right, wrong, reveal, Learn, fanfare) are bundled.

## Empty states
- First launch, no network, bundled deck finished: "Connect to the internet to get more words". Reviews still work.

## Manual check
- Fresh install in airplane mode: 20 words of the first deck work fully.
- Turn network on: next deck's media arrives before the first deck ends.
- Kill the app mid-download: next open finishes it.
