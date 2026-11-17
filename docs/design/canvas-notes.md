# Canvas sticky notes (typed out)

The yellow notes on the design canvas, typed from screenshots so Claude Code can read them. Images are next to this file. Where a note and a spec differ, the spec is what gets built; differences are listed in `../not-included.md`.

## Hi-fi: decisions (`note-hifi-decisions.png`)
- Light by default; Settings › Appearance: System / Light / Dark (dark tokens on the palette card).
- Main buttons near-black. One kiwi green #8FD14F for small shapes + pale tint #EAF5DA behind text.
- No level tag (N5) on Home cards.
- Furigana 12px.
- Quiz front: picture blurred enough that it can't give away the meaning; tap reveals.
- Word pictures: anime or realistic (2 styles), vibrant either way.
- Stroke guide comes from KanjiVG strokes, not the font.
- No mascot.
- Kiwi brown is a "use sparingly" color: logo ring, dotted word underline, average line, confetti.
- Lock screen widgets are tinted by iOS; home widgets follow the phone's light / dark setting (light shown).

## Hi-fi: working prototype (`note-hifi-prototype.png`)
Works: Words (new card, blurred quiz front, reveal, Know / Don't know) · Kana (new kana card, questions with green / red answers) · Stroke (tiles, trace, clear, ✕ remove, next) · bar + summary card every 10 · dropdown, streak sheet · Decks (search, kana chart, themes, 1·2·3, word sheet, Practice writing, mark known / learning) · Profile (tap a bar for its count).

Not built there (see lo-fi): swipe on deck rows, kana detail page, tap-a-word popup, row unlock and deck complete cards, dark mode, animations and sounds.

## Lo-fi v5: main note (`note-lofi-1.png`, `note-lofi-2.png`, `note-lofi-3.png`)
**Home:** one dropdown (mode + deck) · flame opens the week (tap Sun to repair) · one bar for all modes, repeats every 10 (Round 2, Round 3…) · every full bar = summary card in the feed (only what you did that round).

**Words:** 26s-style card, no level tag · new card = I know it / Learn · quiz card = tap to flip, Don't know / Know.

**Kana:** a feed on Home, like words (no Drill button, no 10-count, no results page) · 6 Maru-style types, Check Answer then Continue · new kana card first (big kana, sound, example word · I know it / Learn, +1 on the bar), its first question 1–2 cards later · max 3 new kana per batch · I know it = Excellent, its questions drop · row unlock = a card in the feed.

**Kana chart lives in Decks:** Hiragana / Katakana cards → deck page (title + ? for levels, Gojūon chart) → kana page (examples, Practice writing, I already know this).

**"I know it"** for words and kana = on the new card only.

**Stroke** (layout copied from the reference app): tappable character tiles · meaning + reading, round ✕ = remove from writing practice (always there, far from Next) · full-width canvas, nothing inside but the grid · "Write in stroke order." · Guided / Free-form, ▶ stroke order, eraser = clear (no undo) · Next character (→) / Next word (»). Leaves writing practice via I know it (stays in words; real app also auto-retires after 2 days traced). Feed algorithm: agreed, tabled (recent words first, 2-day retire, repeats allowed in a session and loops when there are few words, skip kana-only words for kana-knowers). Dropdown just says "Stroke" (no deck).

**Decks:** search words at the top (word, kana, romaji or meaning → word sheet) · word sheet has "Practice writing" (opens Stroke on that word and quietly puts it back if it was removed) · Kana cards, then N5–N1 word themes · decks are 20 words, up to 3 per theme (Food & drink 1 · 2 · 3), toggle 1 · 2 · 3 on the deck page · complete = all words met (reward, next deck starts), Mastered = all Known · Mark as learning resets to 0 dots · swipe a row left = Known, swipe a Known row right = Learning (first open of each deck: one row of each kind peeks once) · word sheet: I already know this / Mark as learning · no known count on the deck page.

**Profile (no due counts):** streak + best, this week's bars (dark = goal hit, tap a bar for its count, dashed line = this week's average, written below) · words met (+today, known, bar to next milestone) · Up next: current deck ring "x words to finish" · small cards: decks completed, characters traced, quiz accuracy this week, kana learned · settings (incl. Appearance: System / Light / Dark; widgets follow the phone's setting). Kana progress removed.

**Celebrations artboard:** summary card, row unlock, deck complete, one shared animation.

**Widgets:** lock screen options row at the bottom of the canvas, one screen each, no app name, real sizes (1 meaning circle, 2 word card left, 3 word card centered, 4 sentence rectangle with romaji + translation, 5 inline (iOS 16+), 6 hourly notification; no play button on the lock screen) · home screen artboard, no app name (2 squares, no audio: one with ‹ › through today's words, one with the current word + furigana + meaning; medium = current word; large = row of today's word pictures, first selected by default, tap one to switch).

**Build notes (side effects):** Practice writing on a removed word also resets its stroke days to 0 · swiping one word to Known in Decks removes only that word's remaining cards from today's pack · ✕ in stroke doesn't count on the bar or the summary · Mark as learning puts the word back into reviews, due tomorrow (Known words themselves are never reviewed) · Excellent … [cut off in the screenshot] … (unchanged).

**DON'T FORGET:** empty states (deck done, nothing due) · sounds in onboarding, tutorial and every answer on Home (see orange sticky). Tabled: onboarding + paywall (+ tutorial explaining I know it).

**Simplified in the mockup:** no real FSRS or dates; only Gojūon is built; exercise animations not built (reward animation is, roughly). Not shown: onboarding, paywall, empty states.

## Lo-fi: animation and sound note (`note-lofi-3.png`)
Lots of animation (full spec in the later handoff). The wireframe shows end states only.

**Exercises:** card slides right on answer · flip on tap · bar fills · total flips up on Don't know · right answer pops, wrong one shakes · next question slides in.

**Rewards** (same on all 3 cards; rough version runs in the app artboard): card rises in · hero pops, confetti bursts once inside the top strip · tiles land big then settle, one by one, light haptic each · dots fill one by one · button pops last · tap to skip to the end.

**Sounds** (Duolingo-style), needed everywhere: tap sounds on every button in onboarding and the tutorial · on Home: right / wrong answer sounds, a soft sound on flip and Learn, a short fanfare on each reward card (summary, row unlock, deck complete). Respect the silent switch.
