# Not included, or included with doubt

Things from the canvas notes and screenshots that I did not turn into spec rules, or where I picked one of two readings. Nothing here is built until you answer. Answers go into the spec, then the line is deleted from this file.

## A. Notes I could not place
| # | Note text | Why it is not in a spec | What the spec does now |
|---|---|---|---|
| 1 | Stroke: "Leaves writing practice via I know it (stays in words; real app also auto-retires after 2 days traced)" | Reads like an older lo-fi behavior where a button called "I know it" removed a word from writing practice. The handoff replaced that with ✕, and says a word marked I know it on Home **joins** the Stroke pool (5d, 5i) | ✕ removes; 2 traced days retires; I know it on Home adds the word to the pool (ST-1) |
| 2 | Profile: "Kana progress removed" | The handoff still lists a "kana learned" stat card (4, 5h). I read the note as "the separate kana progress section was removed", not the small card | "Kana learned" small card kept (PF-11) |
| 3 | Build notes: "Excellent … (unchanged)" | Cut off in the screenshot | Assumed it is "Excellent kana unseen for 3+ days get demand 1 again" (KN-3) |
| 4 | "see orange sticky" | I have not seen an orange note. Assumed it is the animation and sound note | `specs/motion-sound.md` built from that note + handoff 4b |
| 5 | Empty states "(deck done, nothing due)" | Named but not designed | Placeholder text in `specs/empty-states.md` |

## B. Lo-fi and hi-fi (or handoff) disagree: I followed hi-fi / handoff
| # | Lo-fi says | Hi-fi / handoff says | Built as |
|---|---|---|---|
| 6 | Quiz card "tap to flip", "flip on tap", "soft sound on flip" | Blurred picture, tap clears the blur ("Tap to reveal") | Blur reveal, no flip (WC-14, MS-11) |
| 7 | "nothing due" is an empty state | Handoff has no rule for "learning words exist, none due, no new words left" | Open. Options: show ES-1 until something is due, or fill packs with the weakest not-due words. I lean to the second (the app always has something), but it changes FSRS timing slightly. WF-17 currently shows the empty state |
| 8 | Kana: "next question slides in" | Handoff 4b: prompt pops, options rise in, replayed each question | Handoff version (MS-14) |
| 9 | Kana options: lo-fi shows 5 | Hi-fi shows a 2×2 grid of 4 | 4 (KN-51, handoff default) |
| 10 | Medium widget: "medium = current word" | The hi-fi widget board seems to show a sentence line under the word | Sentence line included (WG-23, NQ-15). If the note is right, delete that line |

## C. Could not read from the screenshots
| # | What | Placeholder in spec |
|---|---|---|
| 11 | Where "Next word (»)" sits on the hi-fi Stroke screen | Round » icon at the end of the controls row; black button turns into "» Next word" on the last character (ST-52, NQ-16) |
| 12 | Exact text and order of the notification | `reading · word · romaji`, body = meaning (WG-30, NQ-18) |
| 13 | Font sizes, spacing, radii, dark-mode token values (they are on the palette card) | Placeholders in `theme.md` |
| 14 | Lo-fi screens never seen: dropdown sheet, week sheet, kana new card and the 6 question types, Decks tab, deck page, word sheet, kana chart, kana page, Profile, Settings, tap-a-word popup | Specs built from handoff text only |
| 15 | Reward card small text (section labels, tile contents) | Read as NEW WORDS, ALREADY KNEW, KANA LEVELED UP, PRACTICE AGAIN (RW-15) |

## D. Deliberately left out of v1 specs
- Everything in handoff section 6 (extras) and section 8 (rejected).
- Component tests and end-to-end tests (`testing.md` section 2).
- User accounts and cloud sync of progress. Progress is on the device only. Reinstalling or changing phones loses it. Hourly Kana's top 1★ complaint was lost progress, so decide before launch whether iCloud backup of the database is enough.
- Android.
