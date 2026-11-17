# Theme

One source: `src/shared/theme/tokens.ts`. Components read tokens through `useTheme()`. No hex values, font names or raw numbers for spacing anywhere else (lint rule).

## Feel
Warm light, calm, flat. Mostly off-white, gray and near-black. Kiwi green appears in small shapes only. 26s / Headspace, not Duolingo, not Hourly Kana.

## Hard rules
- TH-1 2D only: no shadows, no elevation, no gradients, no blur except the quiz picture blur.
- TH-2 Separation comes from the background/card contrast and 1 px lines, never from shadow.
- TH-3 Main buttons are near-black (`text`) with white label. Never green.
- TH-4 Kiwi green is for small shapes: progress bar fill, tab dot, logo, reward accents. Text never sits on solid green. Behind text use `kiwiTint`.
- TH-5 `correct`, `wrong`, `streak`, `statBlue`, `statLavender`, `kiwiBrown` are sparing colors, each with one job (below).
- TH-6 Less text. Icons over labels where the meaning is obvious (speaker, eraser, play).
- TH-7 Flashcard content is left-aligned; audio icon on the right.

## Colors
| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#FAF8F3` | `#0F110F` | screen background |
| `card` | `#FFFFFF` | `#1A1D1A` | cards, sheets |
| `raised` | `#F1EEE7` | `#242824` | chips, icon buttons, option cards |
| `text` | `#1C1B19` | `#F2F3EF` | text, main button fill |
| `textSecondary` | `#6B675F` | to pick at M11 | reading, romaji, captions |
| `line` | `#ECE8DF` | to pick at M11 | dividers, bar track, borders |
| `strokeGuide` | `#D3CDBF` | to pick at M11 | stroke guide paths, grid |
| `kiwi` | `#8FD14F` | same | small shapes only |
| `kiwiTint` | `#EAF5DA` | to pick at M11 | behind text (current stroke tile) |
| `correct` | `#2FB57A` | same | right answer |
| `wrong` | `#E5484D` | same | wrong answer |
| `streak` | `#F07C2E` | same | flame, never black |
| `statBlue` | `#4C7EF3` | same | one Profile stat card |
| `statLavender` | `#9B7BEA` | same | one Profile stat card |
| `kiwiBrown` | `#8B6B4A` | same | logo ring, dotted word underline, average line, confetti |
| `onText` | `#FFFFFF` | `#0F110F` | label on a main button |

Dark values marked "to pick" are not in the handoff text, but the canvas note says the dark tokens are on the palette card. Copy them from there (see `docs/design/README.md`); do not invent them.

## Type
Fonts: **Zen Maru Gothic** for Japanese, **DM Sans** for everything else.

| Style | Font | Size / line | Weight | Use |
|---|---|---|---|---|
| `jpHero` | Zen Maru Gothic | 96 / 104 | 500 | big kana, stroke character |
| `jpWord` | Zen Maru Gothic | 40 / 48 | 700 | word on a card |
| `jpSentence` | Zen Maru Gothic | 20 / 34 | 400 (target 700) | sentence; line height leaves room for furigana |
| `furigana` | Zen Maru Gothic | 12 / 14 | 400 | over every kanji |
| `title` | DM Sans | 22 / 28 | 700 | sheet and reward titles |
| `body` | DM Sans | 16 / 22 | 400 | meaning, translation |
| `bodyBold` | DM Sans | 16 / 22 | 700 | target word in translation, button label |
| `caption` | DM Sans | 13 / 18 | 500 | reading, romaji, bar text, labels |
| `stat` | DM Sans | 32 / 36 | 700 | Profile numbers |

Sizes other than furigana 12 are starting values. The canvas screenshots in `docs/design/` are zoomed-out overviews, good for layout and proportion but too small to measure type. Export each hi-fi board at full size into `docs/design/` before M5 and update this table from them.

## Seen on the hi-fi canvas (layout facts)
- Screen = `bg`; content sits in one large white `card` with `lg` radius and no border or shadow.
- Pictures have rounded corners (`md`) and fill the card width.
- Mode dropdown is a small pill; the streak sits top right as flame + number.
- Paired answer buttons: equal width, left one white with a 1 px `line` border, right one black.
- Round icon buttons (speaker, ▶, eraser, ✕, widget arrows) are `raised` circles with a dark icon.
- Small all-caps gray labels (`caption`, letter-spaced) head sections on reward cards and palette groups.
- Tab bar: outline icons with labels, small `kiwi` dot on the active tab.

## Spacing, radius, sizes
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48. Screen side padding 20.
- Radius: `sm` 8 (chips, tiles), `md` 14 (option cards, buttons), `lg` 22 (cards, sheets), `full` (round icon buttons, pills).
- Line width 1. Selected option border 2.
- Main button height 56. Icon button 44. Minimum tap target 44.
- Progress bar height 8, fully rounded.

## Motion tokens
- `fast` 120 ms, `base` 220 ms, `slow` 400 ms. Spring `pop` (small overshoot) for prompts, heroes and buttons.
- Stagger 60 ms between kana answer options.
- The full list is `specs/motion-sound.md`. Build end states first; motion is added in M11.

## Components that exist once (in `src/shared/ui`)
`Button` (primary black / secondary raised), `IconButton`, `Pill`, `Sheet`, `Toast` (with Undo), `ProgressBar`, `SpeakerIcon` (lights up while playing), `Dots` (3 progress dots), `WordPicture` (reads picture style from settings).

## Widgets
Swift cannot read the TypeScript tokens. `targets/widget/Theme.swift` repeats the colors by hand; keep the two in step. Home widgets follow the phone's light/dark setting. Lock widgets are tinted by iOS, so they use only opacity and weight, no color.
