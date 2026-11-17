# Motion, haptics, sound (MS)

**Scope:** every animation, haptic and sound in one place, so none is forgotten. Built in M11 after end states work (rewards get a rough version in M6). Source: handoff 4b, canvas animation note, hi-fi decisions.
**Code:** `src/shared/theme/motion.ts` (durations, springs), `src/shared/audio/sfx.ts`, `src/shared/ui/haptics.ts`. Feature components call these; they never define their own timings.

"Lots of motion; it's a big part of the fun." End states must be correct with motion off.

## Global rules
- MS-1 `[logic]` Every animation is skippable or non-blocking: a tap during an animation is never lost. Buttons act on the first tap.
- MS-2 `[logic]` iOS Reduce Motion on: slides, pops and confetti become simple fades. Haptics and sounds unchanged.
- MS-3 `[logic]` All UI sounds respect the silent switch. Sounds never interrupt or delay word audio; a sound and word audio may overlap, the sound is short and quiet.
- MS-4 `[logic]` `sfx.play(name)` and `haptic(name)` are fire-and-forget. A missing sound file never throws.
- MS-5 `[ui]` Timings come from the motion tokens in `theme.md` (`fast` 120, `base` 220, `slow` 400, `pop` spring, 60 ms stagger).

## Exercises
| ID | Where | Motion | Sound | Haptic |
|---|---|---|---|---|
| MS-10 | Word card answered | card slides right, next slides in | Know: right · Don't know: wrong · Learn: soft · I know it: soft | light |
| MS-11 | Quiz reveal | blur clears (`base`) | soft reveal | light |
| MS-12 | Bar | fill animates to the new value | — | — |
| MS-13 | Bar on Don't know | total number flips up (10 → 11) | — | — |
| MS-14 | Kana question enters | prompt pops (small overshoot); options rise in one after another, 60 ms apart. Replays for every question | — | — |
| MS-15 | Kana option selected | quick press-down bounce | tap | selection |
| MS-16 | Kana Check | right option pops green; wrong pick shakes red; meaning fades in under the prompt; button pops as it becomes Continue | right / wrong | success / error |
| MS-17 | New kana card | card rises in; big kana pops | kana audio | — |
| MS-18 | Stroke accepted / rejected | accepted settles solid; rejected shakes and fades | — | light / error |
| MS-19 | Character traced | success pop | right | success |
| MS-20 | Speaker icon | lights the instant audio starts, off when it ends | — | — |
| MS-21 | Tap-a-word popup | fades and scales in from the word (`fast`) | — | light |
| MS-22 | Undo toast | slides up, slides down after 4 s | — | — |
| MS-23 | Deck page first open | first not-Known row peeks left, then first Known row peeks right | — | — |
| MS-24 | Deck row swipe committed | row slides out, list closes the gap | soft | light |

## Rewards (one sequence shared by summary, row unlock, deck complete)
- MS-30 `[ui]` 1 card rises in → 2 hero pops and confetti bursts once, inside the top strip only, in `kiwi` + `kiwiBrown` → 3 tiles land big then settle, one by one → 4 dots fill one by one → 5 button pops last.
- MS-31 `[ui]` Light haptic on each tile landing.
- MS-32 `[ui]` Short fanfare when the card appears.
- MS-33 `[logic]` Tap anywhere skips to the end state. The button works the moment it is visible.
- MS-34 `[ui]` A reward card restored on app open (RW-4) shows its end state with no animation or fanfare.

## Onboarding and tutorial (M12)
- MS-40 `[ui]` Tap sound on every button.

## Sound set (bundled, CT-51)
`tap`, `right`, `wrong`, `soft` (reveal, Learn, I know it, row swipe), `fanfare`. Five files. Kana and word audio are content, not UI sounds.

## Tests
MS-1 to MS-4 and MS-33, MS-34 as logic tests on the stores (state is final before any animation ends). Everything else by eye.

## Manual check
- Play through 10 word cards and 10 kana cards with sound on, then with the silent switch on.
- Tap fast through three cards: no lost taps, no stuck animation.
- Reduce Motion on: everything still readable and in the right end state.
- Summary card: tap during the animation → end state at once.
