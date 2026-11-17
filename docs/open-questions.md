# Open questions and defaults

Claude: build with the default shown. Never settle one of these yourself. When work touches one, remind me.

## A. Open issues from the handoff (section 9)
| ID | Question | Default used until I decide |
|---|---|---|
| OQ-1 | Switching decks mid-day | Replace unanswered new words (and their returning quizzes) in today's pack with the new deck's next unseen words. Keep reviews and returning cards. Bar unchanged. (WF-40) |
| OQ-2 | Which themes per level | Content planning. Blocks M2 beyond the first deck |
| OQ-3 | Empty states | Listed per spec under "Empty states". Copy is placeholder |
| OQ-4 | Onboarding, tutorial, paywall design | Not designed. Blocks M12 |
| OQ-5 | Stroke auto-retire after 2 days | Keep. Check with real use |
| OQ-6 | Tapping a widget | Opens the app on Home, last mode. No jump to the word |
| OQ-7 | Cut-off kana feedback point 8 | Ignored |

## B. Handoff defaults (section 9b) — all in use
4 AM rollover · extra packs follow the same rules · tapping a speaker always plays, auto-play follows the silent switch · 4 kana options · stroke check against KanjiVG in order, hint after 2 misses · stroke day = whole word traced · stroke pool = words met on Home · "knows kana" definition · kana tracing counts on the bar · kana batches survive rollover · next deck = next part, then next theme · deck complete from Decks shows on next Home visit · widgets show today's pack words, new first · notification opt-in at widget setup · one repair day per extra round · reward order summary → row unlock → deck complete · new words per day = buildPack's 3 · onboarding start mapping · undo 4 s.

## C. New: places where the handoff was vague and I had to pick an exact rule
These were chosen so the logic is testable. Confirm or change.

| ID | Gap | Exact rule chosen | Spec |
|---|---|---|---|
| NQ-1 | "hard = weak[:2 or 3]" | 2 hard cards per pack; 3 when more than 6 words are weak | WF-12 |
| NQ-2 | Returning quiz "1–2 cards later" vs "≥ 2 cards after" | Returning card index ≥ new card index + 2 (one other card between). Same for kana intro → first question | WF-22, KN-33 |
| NQ-3 | "re-insert ~3 cards later" | Exactly 3 cards later (index + 3); at the end if fewer remain | WF-34 |
| NQ-4 | Don't know loop next to a hard card | The re-inserted card is exempt from "never 2 hard in a row" | WF-34 |
| NQ-5 | Widgets need today's pack at 4 AM but the app may not run | App pre-builds a preview of the next 7 days' words on every background; widget uses it. When the app opens on that day it builds the real pack (same function, so same result if nothing changed) | WG-4 |
| NQ-6 | Hourly notification | Local notifications, scheduled ahead for the next 48 slots on every app background (iOS caps pending notifications at 64). If the app is not opened for 2+ days they stop until next open | WG-30 |
| NQ-7 | "Mark as learning: fresh FSRS card due tomorrow" | Treated as an old strong card when due (no retrievability yet) | WF-13 |
| NQ-8 | Kana "rotate question types", "rotate among the top 3 words" | Round-robin by saved counters, no randomness | KN-28 |
| NQ-9 | Stroke "start point, direction, rough shape" | Numeric thresholds in ST-20. Starting values, to tune on a phone | ST-20 |
| NQ-10 | Round in progress when the app is killed with a reward queued | Reward queue is saved; shows first on next open, even after rollover | RW-4 |
| NQ-11 | Tap-a-word popup and pictures | Popup has no picture (handoff: word, romaji, meaning, speaker). Tappable = token links to a word in the database, picture or not. So missing pictures do not block tappable words; only the word's own card needs one | WC-30 |
| NQ-12 | Level chip in Decks "is the only place level is set" but "chips only filter" | Chips filter the list. The level only changes when I start a deck of another level with Study this deck | DK-3 |
| NQ-13 | Watch item: first days give 4–5 new words a day | Kept as designed (fill with new words). Sim prints the number so it can be judged | WF-15 |
| NQ-14 | Free vs paid boundary | Not defined. Blocks M12 | onboarding-paywall |
| NQ-15 | Medium widget: handoff says word, reading, meaning + play; the canvas also shows a sentence line | Follow the hi-fi board: one truncated line, sentence · translation. The lo-fi note says "medium = current word", so this may be wrong | WG-23 |
| NQ-16 | Stroke: where is Next word (»)? The hi-fi shows a full-width "→ Next character" button; I could not find » in the screenshot | Round » icon at the end of the controls row; the black button becomes "» Next word" on the last character | ST-52 |
| NQ-17 | Reward buttons: handoff says "Keep going"; the canvas shows "Start the か-row" and "Start N5 Core 2" on the unlock and deck cards | Follow the canvas | RW-21, RW-31 |
| NQ-18 | Notification text | Title `reading · word · romaji`, body meaning. Read from a small screenshot; confirm the order | WG-30 |
| NQ-19 | Large widget with more than 4 words today | Row shows 4 thumbnails around the current word | WG-24 |

## D. Things I should do outside the code
- Record a full walk-through of Hourly Kana, Daily Hangul and 26s during a free trial (onboarding, widget setup, paywall). Cancel the trial right after. Needed for OQ-4.
- Native speaker review of sentences and audio (handoff section 7).
- KanjiVG is CC BY-SA: add attribution in Settings and check the share-alike terms for the stroke data files before release.
- Apple developer account, App Group ID and bundle ID before M1.
