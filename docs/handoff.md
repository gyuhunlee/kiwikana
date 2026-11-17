# Handoff: Kiwi Kana (Japanese learning app, side project #2)

Design canvas: https://claude.ai/artifact/1cpw8ffq4ryos9VeHZZBUK
- **Hi-fi page** (what to build): 4 Home screens, palette + type, **working prototype (press Play)**, home screen widgets, 6 lock screen options.
- **Lo-fi page** (full flows): clickable app (press Play) with every screen and flow, celebrations artboard, widget sizes.
- Both prototypes run simplified algorithms (no real FSRS, no real dates, only Gojūon built). **Section 5 is the source of truth** (feed algorithms in depth, side effects in 5i); user flows are in 4d; gaps I filled with defaults are in 9b. Where the hi-fi prototype is missing something (deck row swipe, kana page, tap-a-word popup, row unlock and deck complete cards, dark mode), the lo-fi has it.

## How I like to work
- Indie hacker. Mobile apps win on marketing and visuals, not features.
- Reply succinctly, simple words, conclusions not thought process.
- When asked for options: give your opinion, look for a better solution, then re-check whether the problem / better solution actually matters for v1 and this ICP.
- Push back if a suggestion of mine is redundant.
- Don't change the design until I say so. Discuss first.
- When I ask "any big issues?", remind me of the open issues in section 9.
- Don't re-propose anything in section 8 (rejected).

---

## 1. Market hypothesis (locked)
- **Product:** Kiwi Kana. Teaches Japanese to English speakers (US, Canada, UK, Australia). iOS first.
- **Target competitor:** Hourly Kana (~$50K/mo, ~20K downloads/mo, ~$2.50 per download, launched Jul 2026 by Radish Retail / Hourly Learning). Instagram ads straight to the App Store. Winning hooks: UGC "app is called hourly kana! check my profile for the setup" and "my screen time is embarrassing, might as well learn". Passive messaging beats feature lists. UGC beats polished brand ads ~2:1. They're scaling (44 new English ads Nov 2–4, ~200 localized ads for speakers of Spanish/Portuguese/Indonesian etc. since Oct 11).
- **Why Japanese:** only language proven with this format for English speakers. Same template: Hourly Kana ~$50K, Hourly Hangul ~$20K, Hourly Hanzi ~$0. Daily Hangul (indie, decks only, no lessons) ~$10K. Engine is language-agnostic; other languages later as content swaps (build once, keep testing languages).
- **Other reference apps:** Epop (~$500K/mo, Korean adults relearning English, 4-mode active drills, hard paywall after 20 exercises), 26s (~$50K/mo, exam picture flashcards, Taiwan/Korea, $68 lifetime), Maru (kana drills; model for our kana system), WRD (~$20K, immigrant vocab, testing passive audio mode as a hook), Eppika (~$100K/mo, graded readers + self-improvement hooks).
- **JLPT is NOT the hook in the US** (26s tested it, kept one quiet ad). Use N5–N1 only as levels inside the app.

## 2. ICP
- English-speaking hobby learners of Japanese (anime, travel, curiosity), roughly 18–35, phone-native, Gen Z TikTok passive learners.
- Lightweight: ~3 new words a day max. Usually a few cards (~5 on average), sometimes a full 10 (Duolingo feeling).
- **Enjoyability > learning** (enjoyment drives retention).
- The appeal: **the exercise is right there the moment you open the app** (exercises live on Home; that can't change).
- Want the app to decide what to study. Rarely browse saved/word lists. Rarely change level (set it themselves).
- Getting a just-seen word right makes them happy; fine with the bar's total growing on "Don't know"; won't keep missing the same word in one session.
- Most common interaction overall = glancing at the lock screen widget.
- Complete-zero beginners are better served by Maru; our Kana mode is the on-ramp.

## 3. Review research conclusions (how v1 features were decided)

### 3a. Hourly Kana reviews: 58 unique
- Mix: 26× 5★, 6× 4★, 6× 3★, 7× 2★, 13× 1★.
- **Suspected planted reviews (excluded):** Kamea Spriggseq, Lilah Gentricpyz, Charnice Benneywor…, Ahsen, Minor_Thornburgv, Inocencia Deedra, Beverlee, freddy squires (cluster Jul 28–30, odd names, ad-like titles). Discount the ~1K ratings / "50,000+ learners" claim a bit.

**Main stuff (mentioned most, real reviews only)**
1. **Lock screen widget / a word every hour — ~11 reviews** (Asa Watanabe 5★, Plasma 8 5★, jugglemyballls 5★, Eve.v.p 5★, Jarshyyy 5★, kamisoto0 5★, kelbeemoo 5★, LastSeong 5★, Shizzlechris 3★, ShakaidoX 2★, sproject_ 1★). Liked because it's "almost passive"; "with Anki I'd go weeks without opening it."
2. **Correct pronunciation / native audio — ~6, almost all 1–2★** (TLepianka, Kami Hakobu, Cassandra Crumb, コラ_コラ, Shizzlechris, pnin1). Bad AI audio was the early killer; they switched to human recordings.
3. **No bugs / progress that saves — ~8** (Andiromeda 1★ progress erased, Qqtttyy 1★ stuck in lessons, JustinAppReviews 2★ "tired of being the QA team", bug1453 2★, コラ_コラ 2★ settings don't save, threedollasplease 3★, Nickasrp 3★, pnin1 4★).
4. **Review / spaced repetition — ~3** (LastSeong 5★, pnin1 4★, Pomplamouse 3★).
5. **Vocab/kanji growth by JLPT level — ~3** (LjThomas60 4★, Wesont C Black 5★, kevo0382 5★).
6. **Kanji detail (radicals, roots, meanings) — 3** (pnin1, scherreraa, efwejnfke, all 4★).
7. **Stroke/writing practice — 3, all positive** (scherreraa, Shizzlechris, efwejnfke).
- Paywall/trial anger was the most common complaint (~12, mostly 1★). Business model ignored, but: be honest about the trial, easy cancel.

**Small stuff (one or two people each) → decision**
| Request | Who | Decision |
|---|---|---|
| Remove known cards forever | pnin1 4★ | **v1** (I know it / Known words never on Home) |
| Learn a day's worth in one go | Pomplamouse 3★ | **v1** (widget frequency setting + Home feed keeps going) |
| Beginner path: hiragana row by row | Nickasrp 3★ | **v1** (Kana mode) |
| Hide stroke order until you try | Shizzlechris 3★ | **v1** (Guided / Free-form) |
| Clean widget (hide the animal) | LastSeong 5★ | **v1** (clean widgets, no mascot, no app name) |
| Quiet hours (praised) | Nonya_Business 5★ | **v1** |
| Show all radicals in stroke practice | efwejnfke 4★ | later |
| Anki import (praised) | kamisoto0 5★, Plasma 8 5★ | extras |
| More grammar practice | Klightx15 5★ | later (lessons) |
| Speaking practice | scherreraa 4★, Lil Eezus 1★ | later (roleplay) |
| Settings for advanced learners | Art0091 4★ | later |

**Lessons check (decided no lessons in v1)**
- For lessons: Jumper to the mega 5★ ("in addition to the active learning modules"), Qqtttyy 1★ (bug blocked lessons → some people do them), BlueMochi32 5★ ("learning structure", unclear), plus ~3 asking for grammar/speaking (Klightx15, scherreraa, Lil Eezus).
- Against: ~11 real reviews praise passive vocab with no mention of lessons; jamxu88 5★ uses it as a supplement to a textbook; praise for lessons came mostly from planted reviews; my own use: walls of text + a 2–4 question quiz you can pass without reading.
- Daily Hangul makes money with decks only. **Verdict:** lessons sell the paywall more than they get used → extras list.

**v1 scope verdict:** good enough. For: covers what reviews praise, fixes top complaints (audio, bugs, unwanted cards, hourly distraction), Daily Hangul proves this scope earns. Against: thinner than Hourly Kana, minority wants more to do. Watch: make the paywall show everything so it doesn't feel thin.

### 3b. Epop reviews: ~174 unique (Korean, Taiwanese, Spanish versions)
- The active format is loved: "better than Duolingo", "learned more in 3 days than a 15-day Duolingo streak", "explains your errors", "makes you review what you missed".
- Best for people who already have basics ("excellent if you have a basic level") → Duolingo graduates.
- 3 English speakers use Epop backwards to learn Korean; one asked for an English option.
- Weak spots: difficulty ceiling for advanced users, paywall popping up mid-tutorial, unnatural sentences even with native review, onboarding with no explanation.
- Lots of short 5★ "free!" reviews → they ask for a rating after the first fun lesson, before the paywall. Copy that; never advertise "free" if it isn't.
- Hard paywall works at scale; paywall complaints are normal in this category.

## 4. App structure (v1)
**Tabs:** Home · Decks · Profile.

### Home top (always visible, in every mode)
One dropdown (left) + 🔥 streak (right), then one bar.
- **Dropdown** opens a bottom sheet: Words | Kana | Stroke. Words shows the current deck + "Change deck ›" (jumps to Decks). Kana shows Hiragana / Katakana. Stroke just says "Stroke" (no deck). No gear, no mode on/off screen.
- **One bar for all modes, in rounds of 10.** Every word card answered, every new kana card, every kana question checked and every traced character = +1.
  - Round 1 shows `X / 10` (that's the daily goal). After it fills: `Round 2 · X / 10`, `Round 3 · X / 10`… forever.
  - "Don't know" on a word adds 1 to the total (`6 / 10` → `6 / 11`, number flips up). Wrong kana answers don't.
  - ✕ (remove from writing practice) in Stroke does **not** count.
  - **Every full bar = a summary card** in the feed (see Rewards).
- **Streak:** a day counts when round 1 fills (any mix of modes). No freezes, no repair credits.
- 🔥 opens a week sheet. Missed days (last 7 days) are tappable to repair, with one line: "Do 10 extra cards after today's goal to fill Sunday." After today's goal, the bar shows `Repairing Sun · X / 10`.

### Words mode (most-used)
**Card (26s style):** large picture · word · `[reading] · romaji` · meaning · divider · sentence with furigana over every kanji (12px), target word bold, tappable words dotted-underlined · English translation with target word bold. **No level tag**, no part-of-speech, no bookmark. Speaker icons (not waveforms) for word and sentence; each lights up while playing.
- Audio auto-plays word, then sentence. Respects the silent switch.
- Tap a dotted word → small popup directly above it (arrow pointing at the word): word, romaji, meaning, speaker. No Save. Doesn't cover the screen. Only words in our database are tappable; particles aren't.
- **New card:** everything shown → **I know it / Learn**. I know it = Known (Undo toast).
- **Quiz card:** front = word + audio + the picture **blurred** (strong enough that it can't give the meaning away) + "Tap to reveal". Tap → blur clears and everything shows → **Don't know / Know**.
- Answered cards slide right. Swipe left shows the previous card (read-only; rating stands). Buttons only, no swipe-to-answer.

### Kana mode (a feed on Home, like words; modeled on Maru)
- **No Drill button, no 10-question count, no results page, no second progress bar.** Questions just keep coming, like word cards, and count on the shared bar.
- **New kana card** (before a kana's first question): big kana, its sound (audio), one example word split into parts (あい = a + i · love) → **I know it / Learn**. Both = +1 on the bar.
  - I know it = that kana goes to Excellent and its remaining questions drop out (Undo toast). Only on the new kana card, per kana (not per row).
  - The kana's first question comes 1–2 cards later.
- **Question flow:** select an answer → **Check Answer** (black; gray until something is selected) → right answer turns green, a wrong pick turns red, word questions show the meaning → button becomes **Continue**. No "Correct" text.
- **Row unlock** = a reward card in the feed (see Rewards).
- **6 question types (Maru):** (1) kana → pick romaji (2) audio → pick kana (3) kana → pick among 5 speaker buttons (tap to hear, then select) (4) romaji word → pick kana word (5) kana word → pick romaji (meaning shown after answering) (6) spell a word by tapping kana tiles.
- **Hiragana and Katakana:** both available anytime (katakana is never locked), each with its own progress. Switch in the dropdown.
- The kana chart lives in **Decks**, not Home (see Decks tab).

### Stroke mode
Layout copied from the reference stroke app (see section 11).
- **Top:** the word's characters as tappable tiles (current tile = pale kiwi tint + green ring) · meaning + reading · round **✕** = remove this word from writing practice (always visible, far away from Next).
- **Canvas:** full width, nothing inside but the grid. Guide strokes from KanjiVG (not the font). Line under it: "Write in stroke order."
- **Controls:** Guided / Free-form toggle · ▶ play stroke order · eraser = clear (no undo) · **Next character (→)** and **Next word (»)** with different icons.
- Each traced character = +1 on the bar. Stroke never blocks progress and **doesn't affect a word's 3 dots**.
- Words come from the words you've met in Words mode (no new words here). Feed rules in 5d.
- Stroke data: KanjiVG (check the CC BY-SA license). (Writing matters less than reading in the phone era; kept because it helps memory, reviewers like it, and it looks great in ads.)

### Decks tab
- **Search** at the top: matches word, kana, romaji or meaning → opens the word sheet.
- **Kana cards** first: Hiragana / Katakana → kana deck page: title + **?** (bottom sheet explaining the 4 levels and their conditions), Gojūon chart.
  - Chart: Maru's section labels (Gojūon, Dakuon, Yōon, Sokuon), gap + small gray label between sections, locked sections hidden. Romaji under every kana. Current row outlined automatically. Shades = New / Weak / Good / Excellent.
  - Tap an unlocked kana → **kana page:** big kana + sound, level + progress ("Weak · 2 / 4 correct to Good"), 2–3 example words split into parts with audio, small links "Practice writing" (kana tracing lives only here) and "I already know this" (sets Excellent).
- **Word decks:** level chips **N5–N1** (the only place level is set after onboarding), then themes. Each deck = **20 words max**; a theme has up to 3 decks (Food & drink 1 · 2 · 3). Theme cards show a small bar per part and a "Studying 1" / "Mastered" badge.
- **Deck page (same template for every deck):** name · **1 · 2 · 3** toggle (each shows `x / 20` or Mastered) · **Study this deck** · All / Learning / Known pills + filter icon (Sort: Recently added / A–Z, Show sentence toggle) · rows: picture, word, meaning, 3 progress dots. **No known count** on the deck page.
  - **Swipe a row left = Known. Swipe a Known row right = back to Learning.** The first time any deck opens, one row of each kind peeks once (left peek, then right peek) to teach the gesture.
- **Word sheet** (tap a row or a search result): the word card content + **Practice writing** (opens Stroke on that word) + I already know this / Mark as learning.

### Profile
No due counts or queues; everything motivational.
- Streak + best streak.
- This week's bars (dark = goal hit). Tap a bar to see its count. Dashed line = this week's average, written in text below.
- **Words met** (main number, grows from the first card) + today's count, words known, bar to the next milestone.
- **Up next:** ring for the current deck, "x words to finish this deck".
- 4 small stat cards: decks completed · characters traced · quiz accuracy this week · kana learned (kana at Good or better). Each card its own color (not all green).
- **Settings:** new words per day (3) · widget: new word every (1 hour) · quiet hours · audio (follows silent switch) · Appearance (System / Light / Dark) · Picture style (Anime / Realistic) · subscription.

### Rewards (mini goals, shown inline in the Home feed where the exercises are)
1. **Summary card, every full bar** (all modes). Title: "Daily goal done" for round 1 only; later rounds rotate "Nice work", "On a roll", "Keep it up", "Great round". "Here's what you did", then only what happened that round:
   - count tiles (words / kana / traced),
   - right-or-wrong dots for graded answers only (Know / Don't know, kana questions) + "x of y right",
   - new words learned (tiles),
   - "already knew" (I know it taps),
   - kana level-ups (to Good or Excellent),
   - missed items,
   - button.
   - **No streak mention.** If the bar fills on a kana Check, show the card after Continue (so they see the right answer first).
2. **Row unlock card** ("あ-row done, か-row unlocked", the new row's kana, "x of 46 hiragana unlocked").
3. **Deck complete card** when every word in a 20-word deck has been met; the next deck starts.
- All three share **one animation** (section 4b). Confetti stays inside the top strip of the card.

### Widgets (iOS)
Users add any mix. **No app name, no level tag, no streak** on any widget. Words rotate on the widget frequency setting, paused during quiet hours. Uses interactive widgets (iOS 17) for arrows, picture taps and play buttons.
- **Home screen** (follows the phone's light / dark setting):
  - Small square A: today's word with ‹ › arrows to step through today's words. No audio.
  - Small square B: current word + furigana + meaning. No audio.
  - Medium: current word card (word, reading, meaning) with one play button.
  - Large: row of today's word pictures (first selected by default, tap one to switch) + the selected word and sentence, with two play buttons (word, sentence).
- **Lock screen** (tinted one color by iOS; no play buttons on the lock screen):
  1. Circle: word + meaning.
  2. Rectangle: word card, left-aligned.
  3. Rectangle: word card, centered.
  4. Rectangle: sentence with romaji + translation.
  5. Inline line above the clock (iOS 16+).
  6. Hourly notification with the Kiwi Kana icon.

### Other v1 items (screens not drawn yet, see section 9)
- **Onboarding:** level (brand new / know kana / N5–N1) → sets starting mode and starting deck (that level's core deck) · goal · **guided widget setup** (critical) · short tutorial (dropdown is easy to miss; what "I know it" does; Duolingo-style tap sounds) · paywall (trial → weekly/yearly; show everything; honest trial terms, easy cancel).
- Rating + feedback prompt after a win, before the paywall.

### Notes I asked you to keep
- Every vocab card has a picture (AI-generated), in two styles: **anime** and **realistic**, vibrant either way (user picks in Settings).
- RevenueCat (paywall/subscriptions) + PostHog (analytics).
- 2 example sentences per word, alternating.
- Native-quality audio; a native speaker reviews all content.
- Flashcards slide right when answered so users learn they can swipe left to go back.
- Audio icons light up instantly while playing (word, then sentence).
- Widgets carry no app name (my call). Branding comes from the look; the notification shows the app icon.

## 4b. Animations, haptics, sounds
Lots of motion; it's a big part of the fun. The prototypes show end states, plus a rough reward animation (lo-fi) and the kana practice animations (hi-fi).

**Exercises**
- Word cards slide right on answer; next card slides in.
- Quiz card: blur clears on tap.
- Bar fills smoothly; total number flips up on "Don't know".
- Kana questions:
  - the prompt pops in (small overshoot),
  - the answers rise in one after another (~60ms apart),
  - the selected answer gets a quick press-down bounce,
  - on Check the right answer pops green and a wrong pick shakes red,
  - the meaning fades in under the prompt, and the button pops as it turns into Continue.
  - Every new question replays the entrance.
- New kana card rises in; the big kana pops.
- Deck rows: first-open peek (left, then right).

**Rewards (same on all 3 cards)**
- The card rises in.
- The hero pops and the confetti bursts once inside the top strip (kiwi green + kiwi brown).
- The tiles land big, then settle, one by one, with a light haptic on each.
- The dots fill one by one.
- The button pops last.
- Tap anywhere to skip to the end state.

**Sounds (Duolingo-style), needed everywhere**
- Tap sounds on every button in onboarding and the tutorial.
- On Home:
  - right and wrong answer sounds,
  - a soft sound on reveal and on Learn,
  - a short fanfare on each reward card.
- Respect the silent switch.

## 4c. Visual design (hi-fi)
- **Feel:** warm light, minimal, Headspace-calm. Light by default; Settings › Appearance: System / Light / Dark.
- **Main buttons are near-black**, not green (green buttons look like Duolingo).
- **One kiwi green** `#8FD14F` for small shapes only (progress bar, tab dot, logo, rewards) + its pale tint `#EAF5DA` behind text (e.g. the current stroke tile, with a green ring). Text never sits on solid green. No other greens except "correct".
- **Fonts:** Zen Maru Gothic (Japanese), DM Sans (UI). Furigana 12px.
- **Logo:** kiwi slice (brown ring, green flesh, cream center, black seeds). No mascot.

| Token | Hex |
|---|---|
| Background | `#FAF8F3` |
| Card | `#FFFFFF` |
| Soft gray (chips, icon buttons) | `#F1EEE7` |
| Text + main button | `#1C1B19` |
| Secondary text | `#6B675F` |
| Lines, tracks | `#ECE8DF` |
| Stroke guide | `#D3CDBF` |
| Kiwi green | `#8FD14F` |
| Kiwi tint (behind text) | `#EAF5DA` |
| Correct | `#2FB57A` |
| Wrong | `#E5484D` |
| Streak flame (never black) | `#F07C2E` |
| Stat blue | `#4C7EF3` |
| Stat lavender | `#9B7BEA` |
| Kiwi brown: logo ring, dotted word underline, average line, confetti | `#8B6B4A` |
| Dark mode: bg / card / raised / text | `#0F110F` / `#1A1D1A` / `#242824` / `#F2F3EF` |

Correct, wrong, streak, the stat colors and brown are "use sparingly" colors.

## 4d. User flows (step by step, with expected behavior)
Rules behind each step are in section 5; what each action changes elsewhere is in 5i.

**First open** (screens not designed yet, open issue 4)
1. Pick a level: brand new / know kana / N5–N1.
2. Brand new → Home starts in Kana (Hiragana). Know kana or a JLPT level → Home starts in Words with that level's core deck, part 1 (default mapping).
3. Goal → guided widget setup (critical; notification opt-in here) → short tutorial (dropdown, I know it) → paywall → Home with the first card on screen.

**Every open (the core loop)**
1. The app opens on Home, in the last-used mode, on the saved card. A queued reward card shows first.
2. A word card auto-plays its audio (word, then sentence) unless the phone is on silent.
3. The user does a few cards and leaves. Nothing is lost; the next open resumes on the same card.
4. Expected: the ICP does ~5 cards on most days, 10+ on some. Round 1 filling = "Daily goal done" + a streak day. Extra rounds are optional mini goals.

**Words**
1. New card: picture, word, sentence, all visible → **Learn** (or **I know it**).
2. The card slides right; the next card slides in. 1–2 cards later comes its quiz: word + audio + blurred picture → tap → reveal → **Know / Don't know**.
3. Don't know → the word comes back ~3 cards later with its other sentence, and the bar total grows by 1.
4. Tap a dotted word → popup above it; tap anywhere to close.
5. Swipe left → previous card (read-only).
6. Bar fills → summary card → Keep going → next card. When the pack ends, the next pack builds with no break.

**Kana**
1. Dropdown → Kana → Hiragana or Katakana.
2. New kana card (big kana, its sound plays, an example word) → **Learn / I know it**.
3. Questions: select → **Check Answer** → green / red → **Continue**. A kana's first question comes 1–2 cards after its new card.
4. When enough kana are strong, a row unlock card appears → Continue → new kana cards for the new row.
5. Levels, the chart and kana pages live in Decks › Hiragana / Katakana.

**Stroke**
1. Dropdown → Stroke. It opens on the most recently met word, first character.
2. Trace (Guided or Free-form) → success pop → **→** next character → **»** next word.
3. **✕** removes the word from writing practice (Undo toast). The pool loops when it ends.
4. No met words yet → empty state.

**Decks**
1. Decks tab → search a word, or open Hiragana / Katakana, or pick a level chip → theme → deck page (1 · 2 · 3).
2. First open of any deck: rows peek to teach swipe left (Known) and swipe right (Learning).
3. Tap a row → word sheet → I already know this / Mark as learning / Practice writing.
4. **Study this deck** → Home in Words with that deck.

**Streak repair**
1. Tap 🔥 → week sheet → tap the missed day → one line explains the rule.
2. Finish round 1 → the bar becomes "Repairing Sun · X / 10" → fill it → that day is filled and the streak is whole again.

**Widgets (the most common interaction)**
1. Glance at the lock screen: today's word changes every hour (paused in quiet hours).
2. Home screen: arrows / picture taps switch words; play buttons play audio in place.
3. Tapping the widget body: open issue 6.

---

## 5. Algorithms and rules (source of truth)
Anything marked **(default)** is a gap I filled in so you can build it; all of them are listed in 9b for me to confirm. Everything else was decided.

### 5.0 Shared basics
- **A "day"** = the user's local calendar day, rolling over at **4 AM** (default), so a 1 AM session still counts for the day before. Every "today", "different days", streak and pack rule uses this.
- **Save after every tap that changes state** (answer, I know it, swipe, trace, remove). Killing the app never loses more than the card on screen. Lost progress was a top 1★ complaint for Hourly Kana.
- Local-first: everything works offline once a deck's content and audio are on the phone (default).
- **Undo toast** (~4 s) after: I know it (word or kana), swipe to Known / Learning, I already know this, Mark as learning, ✕ in Stroke. Undo reverts **everything** that action changed: status, dots, bar count, the round's summary log, today's pack / kana batch, widgets.
- FSRS: use an open-source FSRS library with default weights, desired retention **0.85**, binary ratings only (Know = Good, Don't know = Again).

### 5a. Bar, rounds, streak, repair
**Data per day:** `ticks` (all +1s today), `roundNo`, `roundStart`, `roundExtra` (added by Don't know), `goalDone`, `repairDay`, `log` (this round's entries for the summary card).
```
tick(entry):                          # every +1 from any mode goes through here
  ticks += 1; log.append(entry)
  if ticks - roundStart >= 10 + roundExtra: queue summary card

Don't know on a word: roundExtra += 1 (bar 6/10 → 6/11), then tick() for the answered card
summary card dismissed: roundNo += 1; roundStart = ticks; roundExtra = 0; log = []
first summary of the day: goalDone = true → today counts for the streak
4 AM rollover: everything above resets; an unfinished round is dropped
               (its cards still count in that day's Profile week bar)
```

**What counts on the bar**
| Action | Bar | On the summary card as |
|---|---|---|
| Word new card: Learn | +1 | words count + "new words" tile |
| Word new card: I know it | +1 | "already knew" |
| Word quiz: Know / Don't know | +1 (Don't know also +1 to the total) | words count + green / red dot; Don't know also under "missed" |
| New kana card: Learn | +1 | kana count |
| New kana card: I know it | +1 | "already knew" |
| Kana question checked (right or wrong) | +1 | kana count + dot; wrong also under "missed"; level-ups listed |
| Stroke: one character traced | +1 | traced count |
| Kana tracing on a kana page | +1 (default) | traced count |
| Stroke ✕ remove | none | not shown |
| Anything done in Decks (swipes, word sheet buttons) | none | not shown |

**Streak**
- Streak = consecutive days with `goalDone` or repaired, counting back from today. Today only adds once round 1 is done; an unfinished today doesn't break the streak until the day ends.
- Best streak is stored and shown on Profile.

**Repair**
```
week sheet shows the last 7 days; a missed day (past, not done, not repaired, after install) is tappable
tap → repairDay = that day; line: "Do 10 extra cards after today's goal to fill Sunday."
once round 1 is done, the next round is the repair round: bar shows "Repairing Sun · X / 10"
repair round fills → that day = repaired; streak recomputed (the gap closes); summary card shows as usual
one day per extra round (default); to fix another day, pick it for the next round
repairDay is cleared at the 4 AM rollover
```

### 5b. Word feed (Home, Words mode)

**Data per word (per user):**
- `status`: new | learning | known
- `fsrs`: FSRS card (stability, difficulty, due, last review)
- `dots`: 0–3 = number of distinct days answered Know on an old-word quiz
- `lastDotDay`, `lastRatedDay`
- `metAt` (when it first left "new"), `strokeDays`, `strokeRemoved`

**Settings:** pack size **10**. New words per pack = 3, taken from Settings › New words per day (default 3; tying the setting to this number is my default). No review limit.

**Card types**
| Type | Meaning | Effort |
|---|---|---|
| New | first time seeing the word | easy |
| Returning | a word from this session coming back as a quiz (new word's re-quiz, or a "Don't know" loop) | easy |
| Old strong | learning word due today, FSRS retrievability (R) ≥ 0.70 | easy–medium |
| Old weak | learning word with R < 0.70 (due or not) | hard |

Known words are **never** in the pack (hard rule; some forgetting accepted).

**Where new words come from:** the current deck (theme + part), unseen words in deck order. When the deck has no unseen words left: deck complete card, the next deck becomes current (next part of the same theme, then the next theme at that level (default)), and the pack keeps filling from it.

**buildPack(today)** — runs once per day at the first app open or widget refresh after the rollover (default), then saved. Reopening shows the same pack and position.
```
if pack exists for today: return it

weak   = learning words with R < 0.70, lowest R first
strong = learning words due today with R >= 0.70, most overdue first

nNew = 3                                            # = the New words per day setting (default)
if len(weak) is large (e.g. > 6): nNew = 2          # never below 2, max 3 (except fill rule below)
newWords = next nNew unseen words from the current deck

hard      = weak[:2 or 3]                           # max 2–3 hard per pack
returning = one quiz card per new word              # counts inside the 10
easy      = strong, filling the remaining slots up to 10
if still < 10: add more weak (respecting max hard),
               then extra new words with their returning quizzes     # e.g. the first days, nothing to review

order(cards)
```

**order(cards)** rules, applied when the pack is built:
1. First card = easiest (old strong; if none, a new word).
2. At least 1 new word within the first 3 cards.
3. Each returning card ≥ 2 cards after its new card (if not possible, place it anyway; echo is fine).
4. Never 2 hard cards in a row.
5. Last card = a win (returning or easy card).
- Interleaved, not grouped by type. Example: old strong, New A, New B, old weak, Returning A, New C, Returning B, old weak, old strong, Returning C.
- First days (nothing old): new and returning only, e.g. A, B, C, returning A, D, returning B…

**Answer handling**
```
New card:
  Learn     → status = learning, metAt = now; keep its returning quiz in the pack
  I know it → status = known, dots = 3, metAt = now; remove its returning quiz; Undo toast

Quiz card (after Tap to reveal):
  FSRS: only the FIRST quiz answer of the day rates the word (lastRatedDay);
        later answers the same day (loops, returning cards) don't touch FSRS
        a new word's first returning quiz = its first FSRS rating (Learn alone rates nothing)
  Know:
    returning card (same session)  → no dot (short-term memory)
    old card (from an earlier day) → if lastDotDay != today: dots += 1, lastDotDay = today
    dots == 3 → status = known: leaves Home, widgets and FSRS forever
  Don't know:
    re-insert the same word ~3 cards later as a returning card, with its other sentence
       (fewer than 3 cards left → put it at the end)
    round total += 1 (bar 6/10 → 6/11, number flips up)
    loops until Know (no safeguard)
    dots never go down from Don't know (only Mark as learning resets them)

every answered card → tick()
pack runs out → buildPack runs again on fresh data (same rules) and the feed keeps going (default)
```
- Tomorrow's pack is rebuilt from scratch; unfinished cards come back naturally. No carry-over rule.
- Swiping left on Home shows the previous card, read-only; nothing changes.
- **Undo I know it:** status back to new, its returning quiz goes back where it was, bar −1, log entry removed (if that tap filled the bar, the summary card is cancelled too).

**Expected behavior** (rough simulation with FSRS-5 default weights, 85% Know on returning cards, 3 new words per pack):
| User | New words a day | After 30 days |
|---|---|---|
| 10 cards a day (one pack) | ~4–5 in days 1–5 (fill rule: nothing to review yet), then 3 | ~90 met words still learning, ~5 Known, ~18 due and waiting |
| 5 cards a day (half a pack) | ~3 in days 1–5, then ~2 | ~70 learning, ~3 Known |
- Day 1: no reviews exist, so the fill rule makes the pack 5 new + 5 returning. Finishing it fills round 1 → "Daily goal done", streak 1.
- Words rated Good on their first quiz aren't due again for ~5 days, so the first week is mostly new + returning cards; reviews start landing around day 5–6.
- **Known is slow on purpose:** a word needs Know on 3 different days *as an old card*, and FSRS spaces those days out (≈5 days, then ≈2 weeks). The first Known words show up around weeks 3–4. That's why "words met" is the main Profile number.
- Missed days: due words wait (most overdue first); words left too long turn weak (R < 0.70), get max 2–3 hard slots per pack, and push new words down to 2.
- "Don't know" rate above 30% = too hard (tune max hard cards and retention).

### 5c. Kana feed (Home, Kana mode)

**Data per kana (separate for hiragana and katakana):** `score` (correct answers, never decreases), `seen`, `lastDrilled`, `lastWrong`.

**Levels**
| Level | Condition |
|---|---|
| New | never in a checked question |
| Weak | in a checked question at least once (even if wrong), score 0–3 |
| Good | score 4–5 |
| Excellent | score ≥ 6, or I know it / I already know this |

**Demand** (questions a kana wants per batch; max 3 per kana per batch)
| Level | Demand |
|---|---|
| New / Weak | 3 |
| Good | 2 |
| Excellent | 0, or 1 if not seen in 3+ days |

**Groups (unlock order, per script)**
- Gojūon: あ か さ た な は ま や(やゆよ) ら わ(わをん)
- Dakuon: が ざ だ ば ぱ
- Yōon: groups of ~6 (きゃきゅきょしゃしゅしょ, ちゃ…にゃ…, ひゃ…みゃ…, りゃ + voiced combos)
- Sokuon (small っ): one group, tested only through words (きって, がっこう)
- Starts with the あ group unlocked. A section's label appears when its first group unlocks.
- Hiragana and katakana each follow this path independently; katakana is never locked.

**Batches.** The feed runs on hidden batches of 10 questions. The user never sees a batch, a count or a results page.
- One saved batch per script; switching Hiragana / Katakana or leaving the mode keeps each position.
- A batch survives app close and the 4 AM rollover (kana has no daily pack) (default).
- A new batch builds when the current one runs out, or right after a row unlock.
- Cards in a batch = 10 questions + one new kana card per New kana in it (max 3), so 10–13 cards. Every card is +1 on the bar.

**buildBatch()**
```
candidates = unlocked kana with demand > 0
sort: score asc → lastWrong first → lastDrilled oldest first
keep at most 3 New kana (same as 3 new words per pack); the rest of the row waits for a later batch

slots = []
repeat passes over candidates: give each kana 1 slot per pass
   until it reaches its demand (max 3) or slots == 10
if slots < 10 (everything strong):
   fill with unlocked, already-seen kana: lowest score, then longest since drilled

for each slot (target kana):
   alternate: single-kana question (types 1–3) / word question (types 4–6) when a word exists
   word = contains the target kana, made only of unlocked kana,
          weakest first (lowest sum of its kana's scores), rotate among the top 3 to avoid repeats
   vowel row has few words → mostly single questions; later rows ~half words
   word questions on the current row always contain at least one current-row kana
   rotate question types so it feels varied

new kana in the batch → a new kana card goes before its first question,
   and its first question lands 1–2 cards later:
   intro A, intro B, Q A, intro C, Q B, Q C, then the rest
```

**Options and question details**
- **4 options** in a 2×2 grid, as in the hi-fi (Maru uses 5; the lo-fi shows 5) (default).
- Kana distractors: same row first, then other unlocked kana. Word distractors: other words from the unlocked pool.
- Type 2 (audio → pick kana) auto-plays the sound, with a replay button. Type 3: speaker options play on tap; tap to hear, tap again to select. Silent switch rule in 9b.
- Type 6 (spell): tiles = the word's kana + current-row kana, up to 12, shuffled. Tapped tiles become chips above; tap a chip to remove it. Check turns on once 1+ tile is placed.

**Answer handling**
```
New kana card:
  Learn     → tick(); kana stays New until its first question is checked
  I know it → score = max(score, 6) → Excellent, seen = true
              its remaining questions leave the batch; tick(); Undo toast; unlock check now

Check Answer (options lock):
  correct → score += 1 for EVERY kana in the question (a word credits all its kana)
  all kana in the question → seen = true, lastDrilled = today
  target kana → lastWrong = !correct
  right answer turns green with extra info (kana under romaji, meaning under a word); a wrong pick turns red
  wrong → no extra question, no score change
  any kana that reaches Good / Excellent → listed on the next summary card
  tick()   # if this fills the bar, the summary card waits until Continue
Continue → unlock check → queued reward cards → next card
```

**Unlock check** (after every Continue and every I know it, not at the end of a drill)
```
totalDemand = sum(demand) over ALL unlocked kana
if totalDemand < 10 and a next group exists:
    unlock next group → row unlock card in the feed
    throw away the rest of the batch → buildBatch() (the new row's first 3 kana get new kana cards)
    (e.g. 3 Excellent + 2 Good = 4 → unlock; 5 Good = 10 → no unlock)
all groups unlocked → batches become review questions, weakest / longest-unseen first, mostly words
```
- During a batch, levels update live (chart shades, kana page, Profile), but the question list isn't re-planned, except for I know it (drops that kana's questions) and a row unlock (rebuild).

**Expected behavior** (simulated with this exact algorithm and the prototype's word list; cards include new kana cards):
| Accuracy | Cards until か unlocks | Cards per later row | All Gojūon hiragana unlocked |
|---|---|---|---|
| 100% | ~18 | ~31–39 | ~280 cards |
| 85% | ~21 | ~33–42 | ~315 cards |
| 70% | ~25 | ~40–50 | ~370 cards |
- At the ICP's ~5–10 kana cards a day, basic hiragana takes ~1–2 months.
- The first row unlocks **faster than my Maru pace** (I expected ~40 questions). Word questions credit every kana in the word, so え / お can still be Weak when か unlocks. They keep getting questions afterwards (Weak = demand 3), so nothing is skipped.
- Katakana runs separately at the same pace.
- Known kana keep appearing in reviews on purpose (kana are the foundation); known words never return on Home.
- Accepted as non-issues for v1: one hard kana blocking, returning after a break, word-credit inflation.

### 5d. Stroke feed (Home, Stroke mode)
```
pool  = words met in Words mode (Learn or I know it on Home), not removed, not retired
order = most recently met first
skip kana-only words for users who know kana
       ("know kana" or higher in onboarding, or all 46 hiragana at Good+) (default)
session: walk the pool in order; at the end, loop from the top (repeats are fine)
         the pool is re-read each time Stroke opens, so new words show up first
```
- **Tracing check** (default):
  - Each stroke is compared, in order, to the KanjiVG stroke (start point, direction, rough shape).
  - An accepted stroke turns solid. A rejected stroke shakes and fades; try again.
  - Guided shows the guide strokes (`#D3CDBF`). Free-form shows only the grid; after 2 misses on one stroke, that stroke's guide appears as a hint.
  - ▶ animates the stroke order. The eraser clears the character.
- A character is traced when all its strokes are accepted: success pop, tick(), and it stays on screen until → or » (default).
- A character gives +1 once per visit; re-tracing after clearing doesn't add more (default).
- Tapping a tile jumps to that character. » skips the rest of the word with no credit for untraced characters.
- **strokeDays** += 1 on a day when every character of the word was traced (default). At 2 → auto-retired: it quietly leaves the pool, stays in Words.
- **✕ remove** → strokeRemoved = true, next word loads, toast with Undo. No bar, not on the summary.
- **Practice writing** (word sheet) → jumps to Home in Stroke mode with that word first, then the normal pool continues.
  - If the word was removed or retired: it goes back in the pool and strokeDays resets to 0.
  - A word never met (found via search) gets a one-off visit and doesn't join the pool (default).
- Stroke never touches word dots, FSRS, deck progress or kana scores.
- Empty pool → empty state (open issue 3).

**Expected behavior:** a user who meets ~3 words a day has ~3 fresh words at the top of Stroke each day. A word traced on 2 days leaves on its own, so the pool stays around the last week's words. Users who never open Stroke don't build a backlog: there are no due counts.

### 5e. Rewards: when and where they show
- Reward cards show **in the Home feed in place of the next exercise**; the dropdown and bar stay on top. The card's button ("Keep going") continues the current mode.
- **Timing:**
  - word card → after it slides away;
  - kana question → after Continue;
  - new kana card / I know it → right after the tap;
  - stroke → after the character's success pop.
- **Several at once:** queue them as summary → row unlock → deck complete, one after another.
- A queued card that hasn't been seen (app closed) shows first on the next open (default).
- **Summary content** comes only from this round's log. Sections with nothing in them are hidden:
  - counts: words (excludes I know it), kana (new kana Learn + questions), traced,
  - dots for graded answers, in order, + "x of y right",
  - new words, up to 4,
  - already knew, up to 8,
  - kana level-ups,
  - missed items, unique, up to 8.
- **Row unlock card:** after the unlock check passes (Continue, or I know it on a new kana card).
- **Deck complete card:** when the last unseen word of the deck is met on Home. If it happens from Decks (marking the last unseen word Known), the card shows the next time Home is open (default).

### 5f. Decks
- Hard limit **20 words per deck**; up to **3 decks per theme** (Food & drink 1, 2, 3). The deck page's 1 · 2 · 3 toggle shows each part's `x / 20` Known or "Mastered".
- **Met** = status isn't new. **Complete** = all 20 met → deck complete card, next deck becomes current. **Mastered** = all 20 Known.
- Theme card: one small bar per part (Known / 20) + "Studying 2" on the current deck or "Mastered".
- **Search** covers all levels and matches word, kana, romaji or meaning. Results: word + meaning; tap → word sheet.
- **Swipe peek:** once per deck (stored per user). On first open, the first not-Known row peeks left, then the first Known row peeks right (only if such a row exists).
- **Word sheet buttons** depend on state: not Known → "I already know this"; Known → "Mark as learning". "Practice writing" is always there.
- **Study this deck** → that deck + part becomes current, Home switches to Words (today's pack: open issue 1).
- **Level chips** only filter the deck list; they don't change the current deck.
- Kana deck page has a Study button → Home in Kana mode with that script.

### 5g. Widgets: data and refresh
- **Today's words** (default) = today's pack words, new words first, then its learning words. Known words never show.
  - The pack is built at the rollover (widget refresh), so the morning widget already shows today's new words, before the user meets them on Home.
  - Seeing a word on a widget doesn't change any state.
- **Rotation:** the current word changes every Settings › Widget interval (default 1 hour), cycling through today's words. During quiet hours it doesn't change, and no notifications are sent.
- **Interactive widgets (iOS 17, App Intents):**
  - Home square A: ‹ › step through today's words.
  - Large: the picture row = today's words, tap one to switch.
  - Play buttons use an audio playback intent (word / sentence) without opening the app.
- **Notification** (lock option 6): one per interval outside quiet hours with the current word. Opt-in during widget setup in onboarding (default).
- **Reload widget timelines when:** the pack is rebuilt, any word turns Known (I know it, 3rd dot, Decks), the picture style changes, the widget interval or quiet hours change.
- Widgets follow the phone's light / dark mode, not the app's Appearance setting. Lock screen widgets are tinted one color by iOS, so design them for that.
- Share words, small pictures and audio with the widget extension through an App Group container.
- Tapping a widget: open issue 6.

### 5h. Profile numbers
| Stat | Definition |
|---|---|
| Streak / best | 5a |
| Week bars | ticks per day this week; dark when round 1 was done; tap a bar → that day's count |
| Average line | average ticks over this week's days so far (not future days), dashed line + "x a day" below |
| Words met (+today) | words whose status isn't new; +today = met today |
| Words known | status known |
| Milestone bar | progress to the next multiple of 50 met words (default) |
| Up next ring | current deck: met / 20, "x words to finish this deck" |
| Decks completed | count of complete decks |
| Characters traced | lifetime traced characters (Stroke + kana pages) |
| Quiz accuracy this week | right / graded answers this week (word quizzes + kana questions) |
| Kana learned | kana at Good or Excellent, both scripts |

### 5i. Side effects (what each action changes elsewhere)
Every action below is saved right away. Actions with an Undo toast revert all of their effects.

**Home · Words**
| Action | Changes | Doesn't change |
|---|---|---|
| Learn (new card) | status learning, metAt; bar +1; words met +1; deck "met" count, Up next ring, deck complete check; joins the Stroke pool at the top | dots, FSRS (rated on its quiz), widgets (already in today's words) |
| I know it (new card) | status known, dots 3; its returning quiz leaves the pack; bar +1; "already knew" on the summary; met +1 and known +1; deck complete + Mastered checks; joins the Stroke pool; leaves widgets | FSRS (never scheduled) |
| Know, returning card | bar +1; green dot; first FSRS rating if this is the word's first quiz today | dots |
| Know, old card | FSRS Good (first quiz today only); dots +1 (once a day); at 3 dots: known +1, leaves Home / FSRS / widgets, moves to the Known pill, Mastered check; bar +1 | Stroke pool |
| Don't know | FSRS Again (first quiz today only); word re-inserted ~3 cards later; round total +1; bar +1; red dot + "missed" | dots |
| Swipe left to look back | nothing | everything |

**Home · Kana**
| Action | Changes | Doesn't change |
|---|---|---|
| Learn (new kana card) | bar +1; kana count on the summary | level (stays New until its first checked question) |
| I know it (new kana card) | kana → Excellent; its remaining questions leave the batch; bar +1; "already knew"; chart shade; kana learned +1; unlock check (can unlock a row right away) | other kana |
| Check, right | score +1 for every kana in the question; seen, lastDrilled; lastWrong false (target); bar +1; level-ups on the summary; chart shades; kana learned at Good | the batch's question list |
| Check, wrong | seen, lastDrilled; lastWrong true (target, so it's picked earlier next batch); bar +1; red dot + "missed" | score, batch length |
| Continue | unlock check; queued reward cards show | — |
| Row unlock | next group appears in the chart; next section label if needed; rest of the batch discarded and rebuilt; "x of 46 unlocked" | scores |

**Home · Stroke**
| Action | Changes | Doesn't change |
|---|---|---|
| Character traced | bar +1; characters traced +1; traced count on the summary; strokeDays +1 once all the word's characters are traced today; at 2 days → auto-retired | word dots, FSRS, deck progress |
| ✕ remove | strokeRemoved; next word | bar, summary, Words, Decks, widgets |
| Eraser / ▶ / Guided toggle | the drawing only | counts |

**Decks**
| Action | Changes | Doesn't change |
|---|---|---|
| Swipe left / I already know this (word) | status known, dots 3; that word's remaining cards leave today's pack (no refill, the pack just ends sooner); out of FSRS; leaves widgets; known +1; Mastered check; if it was unseen: met +1 + deck complete check (card shows on next Home visit) | bar, summary, Stroke pool |
| Swipe right / Mark as learning | dots 0, status learning, fresh FSRS card due tomorrow; known −1; loses Mastered if it had it | today's pack (not added), bar, Stroke pool |
| Practice writing (word sheet) | Home → Stroke, that word first; a removed / retired word goes back in the pool with strokeDays 0 | word status, dots |
| Study this deck | current deck + part; Home → Words; "Studying" badge and Up next ring move; new words now come from this deck (today's pack: open issue 1) | dots, FSRS |
| Kana page: I already know this | kana → Excellent; its questions leave the current batch; unlock check when the kana feed resumes; kana learned +1 | bar |
| Kana page: Practice writing | bar +1 per kana traced (default); characters traced +1 | kana score |
| Level chip | the deck list shown | current deck |

**Settings**
| Change | Effect |
|---|---|
| New words per day | from the next pack (today's saved pack stays) (default) |
| Widget interval / quiet hours | widget timelines + notifications reschedule |
| Appearance | the app only; widgets follow the phone |
| Picture style | every picture (cards, deck rows, word sheet, search, summary tiles, large widget); widgets reload |
| Audio (follows silent switch) | auto-play only; see 9b |

**Time (4 AM rollover)**
- New word pack built; the unfinished pack is dropped (its words come back naturally).
- Bar back to round 1 `0 / 10`; repairDay cleared; yesterday's streak day is final.
- Kana batches and the Stroke position are kept.
- Excellent kana unseen for 3+ days get demand 1 again.
- Widgets switch to today's words.

### 5j. Content / data needed
- **Word entry:** kanji form, kana, romaji, meaning, level, deck + part, **two AI-generated pictures (anime + realistic)**, word audio, 2 sentences. Each sentence: tokens (surface, furigana, dictionary form, romaji, meaning, tappable flag, target flag), English translation with target span, sentence audio.
- Generate sentences using only same-level (+ a few lower-level) words. Automated check flags any tappable word missing from the database.
- **Kana word lists, one per script:** per group, words using only that group's kana + earlier kana, with meaning + audio (あい love, あお blue, いえ house…). Katakana needs real katakana words (loanwords like カメラ, テレビ), not converted hiragana words.
- Kana example words for kana pages and new kana cards (2–3 per kana), audio per kana.
- KanjiVG stroke data for every character in the word list.
- UI sound set: taps, right, wrong, reveal, Learn, reward fanfare.

---

## 6. Extras (later, in priority order)
1. Audio mode (hands-free word → pause → meaning; WRD is testing it as an ad hook)
2. User-picked GIF replacing a card's picture (more memorable)
3. Anki import
4. Customizable mascot on the widget
5. Lessons (grammar)
6. User-made decks
7. Roleplay (my preferred add-on)
8. Stories & sentences (from Daily Hangul; maybe, not for sure)
- Also later: Stroke swipe back to the previous word; Stroke character parts breakdown (components/radicals, like the reference app's parts sheet); settings for advanced learners.
- Only if users ask: "New words per day: Few / Normal / Many" setting; "review only / new only" choice.

## 7. Questions for the Japanese native speaker
- Do beginners finish hiragana fully before katakana, or mix them?
- Should letters (kana) and words be separate modes?
- Do learners still learn to write kana by hand, and does it help?
- Review sentence naturalness and audio.

## 8. Rejected (don't re-propose)
- Fake door / Meta Instant Forms for picking the language (no retention data); build MVP and test with the real app.
- Lessons in v1; Library tab; Saved deck; My words deck; Save button on sentence words; bookmark on the main word.
- Gear / mode on-off screen; rhythm or "new vs review" choice in the dropdown; level-up prompt.
- Review cap; safeguard for a word missed repeatedly; fixed 3-new + 3-old pack; pack carry-over rule.
- "Review" tag on cards; separate Review button on Home; reviews-first ordering.
- Red mistakes bar in drills; "Basic / Voiced / Combos" labels; waveform audio icons; part-of-speech tags.
- Kana drills as a separate thing: Drill button, 10-question drill count, drill results page, second progress bar, kana chart on Home.
- "Not quite" button on the new kana card; "I know it" per kana row; "I know it" icons on quiz cards (only on new cards).
- ⋯ menus for card actions (icons do the action directly); mark-known edit mode in deck lists or the kana chart; "?" next to the kana deck cards (it lives inside the deck page).
- Known counts on deck pages ("12 / 120 known"); "0 / 46 learned" on kana deck pages.
- Stroke: undo (eraser = clear), anything inside the canvas but the grid, card/pill around the tiles, my alternative stroke redesign, new stroke exercise types, a stroke progress display.
- Rewards: "Daily goal done" on every bar (round 1 only); streak on reward cards; "水 is now Known" toast; Hiragana complete reward.
- Streak freezes / repair credits; separate make-up session screen for streak repair; "today pill" week row; streak shown as a tiny ring only.
- Widgets: app name, level tag, streak, play buttons on the lock screen.
- Visual: dark by default; green main buttons (Duolingo look); extra green shades; N5 tag on Home cards; mascot (v1).

## 9. Open issues (bring up when I ask about big issues)
1. **Switching decks mid-day:** proposed: replace the unfinished new words in today's pack with the new deck's words; keep reviews/returning; bar count unchanged. Not confirmed.
2. **Which themes per level** (content planning). Deck size and parts are settled (5f).
3. **Empty states** (don't forget): deck done, nothing due, no words for Stroke yet, everything Known, all kana groups Excellent.
4. **Onboarding + paywall + tutorial** (explaining "I know it" and the dropdown, with tap sounds): not designed.
5. **Stroke auto-retire (2 days traced):** agreed for now; check it against real usage.
6. **Tapping a widget:** opens the app on that word? Not decided.
7. **Point 8 from my kana feedback** was cut off: "while doing the quiz for the kana, there needs to be a…" (may no longer matter after the feed redesign).

## 9b. Gaps I filled with defaults (confirm or change)
The coder can build with these; tell me any you want different.
1. **Day rollover at 4 AM** local time, not midnight.
2. **Extra packs the same day** follow the same rules, so they can bring more new words.
3. **Silent switch:** auto-play follows it, but tapping a speaker always plays. Otherwise audio kana questions (types 2–3) can't be answered on silent.
4. **4 answer options** per kana question (hi-fi 2×2 grid), not Maru's 5.
5. **Stroke checking:** each stroke is checked against KanjiVG in order; a wrong stroke shakes and fades; Free-form shows a hint after 2 misses; a finished character waits for → / ».
6. **A stroke day** = every character of the word traced that day (2 days → retired).
7. **Stroke pool** = words met on Home (Learn or I know it). Words only marked in Decks don't join; a never-met word opened via search is a one-off.
8. **"Knows kana"** (for skipping kana-only words in Stroke) = onboarding "know kana" or higher, or all 46 hiragana at Good+.
9. **Kana tracing** on a kana page counts +1 on the bar.
10. **Kana batches** survive the day rollover.
11. **After a deck completes:** the next part of the same theme, then the next theme at that level.
12. **Deck complete from Decks** (marking the last unseen word Known): the reward shows on the next Home visit.
13. **Widgets show today's pack words**, new words first, from the morning on (before the user meets them on Home). Known words never show.
14. **Notification** is opt-in during widget setup.
15. **Repair:** one missed day per extra round.
16. **Reward queue order:** summary → row unlock → deck complete; each shows after the card's own animation finishes.
17. **New words per day** setting = the 3 in buildPack; changing it applies from the next pack.
18. **Onboarding start:** brand new → Kana; know kana or N5–N1 → Words with that level's core deck.
19. **Undo window** ~4 seconds.

**Watch items the simulations turned up (no change made):**
- **First days bring ~4–5 new words a day** for a 10-card user (the fill rule tops up with new words while nothing is due), above the ~3 the ICP wants. Option if it matters: fill with extra returning quizzes instead of extra new words.
- **The first kana row unlocks after ~18–25 cards**, faster than my Maru pace (~40), because word questions credit every kana in them. Later rows take ~30–50 cards.
- **Known words take 3–4 weeks to appear** (3 different days, spaced by FSRS). Fine since "words met" is the main number, but the deck's Known dots will look slow early on.

## 10. Design principles (from my feedback)
- Simple, calm style like 26s / Epop / Headspace. Not Hourly Kana's busy dark toolbox.
- Less text on Home and on cards; the user focuses only on answering. Icons over labels (audio = speaker icon).
- One obvious action per screen. Choices live behind one tap (dropdown, sheets).
- Flashcard content left-aligned, audio icon on the right.
- Progress must be visible from the first second, but without clutter.
- Rare actions get tucked away (Mark as learning, kana tracing, I already know this on kana).
- Lots of small rewards and motion; never pile up text to celebrate.

## 11. Reference screens (described, so screenshots aren't needed)
- **26s flashcard (our Words card model):** top bar (back, 🗑 skipped count, ✓ 7/13 progress, undo, ⋯) · large photo with bookmark bottom-right · word 許可 big · [きょか] small gray · "n" tag + meaning · divider · sentence with furigana over every kanji, dotted underlines on tappable words, target bold · gray audio icon right · English with target bold · "N3" level tag · Skip / Learn buttons (white / black). We copy this minus bookmark, POS tag, level tag and waveform icons.
- **26s other screens:** Home = weekly calendar strip (today ringed) → "Day 1" → Flashcard card (photo strip, "6 words · ~1 min", Start) → "Set your goal". Collections = N5 / N4 / N3 cards with word counts, progress %, higher levels locked. Library = History, Bookmarked, Archived, Leech Words, Difficult. History list = picture, word, meaning, sentence + translation per row, Listening Review / Flashcard Review buttons.
- **Maru drill (our Kana question model):** white screen, big black prompt, 2-column grid of 5 bordered option cards, "Check Answer" (gray until selected, yellow when selected; ours is black), after checking the correct card turns green with extra info (kana under romaji / meaning under word), button becomes green "Continue" (red if wrong). Spell type: tapped tiles appear as small chips above the tile grid; wrong chip turns red and the correct word shows on the right with ✅. Speaker-option type: 5 speaker cards, tap to hear. Top: ✕ + progress bar (we drop it; our shared bar stays on top).
- **Stroke reference app (our Stroke model):** character tiles at the top with meaning + reading, a round button on the right of that row, big full-width grid canvas, short instruction under it, a row of round controls under that. We copy the layout: our round button is ✕ (remove), the eraser clears, and Next character / Next word get different icons.
- **Hourly Kana:** Today = one big word card (JLPT N5 · KANA tag, くもり huge, 曇り · kumori, ON/KUN table, meaning), "Got it", skip, +, edit buttons, "Today's words 3 of 4", "Next word 8:00 PM". Practice tab = Everyday roleplay lessons (tap-to-answer only), Grammar & kana lessons (text wall + 2–4 MC quiz), Kana Drill (levels by row, Flashcards / Reading drill / Build words), Stroke practice (word tiles 始める, trace box, Guided / Free-form, play/undo/erase/hide/repeat, "Built from 女 Woman + 台 Pedestal"). Dark theme. Its stroke button only uses words you've saved (ours uses words you've met).
- **Daily Hangul:** card = big word, "Tap for romanization", example sentence + audio, bookmark; buttons Still Learning / Almost Got It / Learned; daily goal "10 / 8" bar; 🔥 streak; deck sheet: For You, Review, Everyday Conversation, Fundamentals, Food / Drink / Menu, Navigation / Transportation, App Navigation, Travel…
- **Parrot Spanish library:** big "112 total words" header, "Review 20 cards" button, All / Learning / Known pills + filter icon, rows with speaker icon, word, meaning, status dot.
- **Epop (Chinese version):** home with 4 big mode cards: type the green word in a sentence · roleplay (reply by typing or voice) · tap words into correct order · listen and repeat.
- **Clozemaster:** fill the missing word in real sentences, "for when you've outgrown the basics". **WRD:** word packs by level/exam/topic, "listen before sleep and on the go" audio mode.

## 12. Other context
- **Data files (re-upload only if needed):** `hourly_learning_ads.csv` (505 ads), `daily_hangul_ads.csv` (69 ads), `wrd_learn_words_ads.csv` (177 active ads), Eppika ad CSV (old "Eppika" chat), 26s ad CSVs (old "26seconds" chat). Revenue numbers come from AppMagic.
- **WRD ad findings:** formula = specific painful situation → "not your fault" → adaptive algorithm → "only 2.5 min a day" → identity close. Winners target immigrants (Russian→Polish residency, Turkish→English "studied for years but freeze"). Only 5/177 ads pitch audio mode; the one with history ran 51 days ("too tired to study? learn in the background").
- **Eppika ad findings:** English→French ads 40% lasted 14+ days vs 16% for English→Spanish (less crowded languages are easier). Ads naming famous self-improvement books lived longest.
- **My earlier fake-door test** (English learning, Spanish speakers, IG Stories): 3.62% CTR, 8.6% landing signup, ~$9.30 per lead. Ad worked, page/audience expensive. Teaching English to US Spanish speakers is dropped.
- **Language expansion order idea (after Japanese works):** French (big US market, cheaper ads), Korean (Hourly Hangul / Daily Hangul prove it; 3 English speakers reverse-use Epop for Korean). Spanish = most crowded.
- **Monetization:** copy the category (free first session → 7-day trial → yearly/weekly, hard paywall). 26s's $68 lifetime is an interesting alternative (Hourly Kana reviewers asked for lifetime). Business model otherwise ignored.
- This handoff replaces my earlier "Lock-screen flashcard app (side project #2)" handoff and the first "Japanese learning app" handoff.

## 13. Validation plan
Build the MVP (~2 weeks; Japanese first, other languages later as deck swaps), ship, run Meta ads (UGC-style, adapt Hourly Kana's proven hooks), straight to the App Store. Break-even ≈ $2 cost per install. Start at $20–30/day. Measure: cost per install, trial conversion, D1/D7 retention, rounds finished per day, "Don't know" rate (>30% = too hard). Tune: hard cards per pack, FSRS desired retention.
