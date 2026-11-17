# Empty states (ES)

**Scope:** one checklist of every "nothing to show" case. Each is owned by a feature spec; this file exists so none is forgotten (canvas note: "DON'T FORGET: empty states"). None are designed yet (OQ-3). Copy below is placeholder.

Shared look: centered in the card area, one short line, at most one button. No illustration, no mascot. Home's dropdown and bar stay visible.

| ID | Where | When | Text (placeholder) | Button | Owner |
|---|---|---|---|---|---|
| ES-1 | Home · Words | no unseen words in the level, nothing due or weak | "You've finished every word at this level." | Browse decks | WF-17 |
| ES-2 | Home · Words | reviews exist but none due, no unseen words | never shown: packs fill with weak / longest-unseen learning words first; ES-1 only when there are none | — | WF-17 |
| ES-3 | Home · Words | next deck's media not downloaded, offline | "Connect to the internet to get more words." (reviews continue first) | — | CT-13 |
| ES-4 | Home · Words | deck done, no next deck at this level | deck complete card, then reviews only; then ES-1 | — | WF-51 |
| ES-5 | Home · Kana | all groups Excellent | none: review batches continue | — | KN-34 |
| ES-6 | Home · Stroke | no met words | "Learn a word first and it will show up here to write." | Go to Words | ST-5 |
| ES-7 | Decks · search | no match | "No words found" | — | DK-13 |
| ES-8 | Decks · level | no decks yet | "More decks coming soon" | — | decks |
| ES-9 | Deck page · Known pill | none known | "Words you know will show here" | — | decks |
| ES-10 | Deck page · Learning pill | all known | "Nothing left to learn here" | — | decks |
| ES-11 | Profile | day 1, no cards yet | bars empty, average hidden, accuracy "–" | — | PF |
| ES-12 | Widget | added before first open | "Open Kiwi Kana to start" | — | WG |
| ES-13 | Widget | day with no words | "All caught up" | — | WG-6 |
| ES-14 | Any picture | file missing | `raised` color block | — | WC |
| ES-15 | Any audio | file missing | speaker dimmed, card still works | — | WC-45 |

ES-2 needs a rule decision: see `../not-included.md` item 7.

## Manual check
Scenario `all-known` for ES-1, ES-9, ES-10, ES-13. Fresh install for ES-6, ES-11, ES-12. Airplane mode after the first deck for ES-3.
