# Widgets (WG)

**Scope:** the main point of the app. 4 home screen widgets, 5 lock screen widgets, the hourly notification, the data they show and when they refresh. Source: handoff 4 (Widgets), 5g.
**Code:** `src/shared/widget-bridge/snapshot.logic.ts` (all rules, tested), `writer.ts` (App Group files), `targets/widget/*.swift` (reads the snapshot, draws, no rules).

## Principle
The widget extension cannot run the app's TypeScript and iOS decides when it wakes up. So the app prepares everything in advance and the widget only reads.
- WG-1 The app writes a **snapshot** to the App Group folder: `snapshot.json` + one small picture per word per style + word and sentence audio files.
- WG-2 Swift never decides which words exist. It only picks the entry for the current time from the snapshot.
- WG-3 Seeing a word on a widget changes no state.

## Snapshot
```
{
  version, writtenAt, intervalMin, quietStart, quietEnd, pictureStyle,
  days: [ { dayKey, words: [ { id, word, reading, romaji, meaning,
            sentence: { text, furigana runs, romaji, translation }, picture, wordAudio, sentenceAudio } ] } ]
}
```
- WG-4 `[logic]` (default NQ-5) `days` holds today plus the next 7 days. Today uses today's saved pack. Each later day is a preview: `buildPack` run for that day key on current state, assuming no reviews in between.
- WG-5 `[logic]` Today's words = the pack's words, new words first (deck order), then its learning words in pack order. No duplicates. Known words never appear.
- WG-6 `[logic]` If a day has no words (everything Known, no content): `words` is empty and the widget shows the empty state.
- WG-7 `[logic]` The snapshot is rebuilt and widget timelines are reloaded when:
  - a pack is built or rebuilt
  - any word turns Known (I know it, third dot, Decks) or goes back to learning
  - undo of any of those
  - picture style changes
  - widget interval or quiet hours change
  - the app goes to the background (refreshes the 7-day preview)
- WG-8 `[logic]` Pictures are resized for widgets (small file) and only the current picture style is written.
- WG-9 `[logic]` When the app opens on a new day, it builds the real pack. If state did not change since the preview, the words are identical to what the widget already shows.

## Rotation (Swift timeline, rules mirrored and tested in `snapshot.logic.ts` as `entriesFor(snapshot, from, to)`)
- WG-10 `[logic]` The current word index for a time T on day D = number of whole intervals since D's 4 AM start, counting only intervals outside quiet hours, modulo the day's word count.
- WG-11 `[logic]` During quiet hours the word does not change: the entry before quiet hours stays.
- WG-12 `[logic]` At 4 AM the widget switches to the next day's words.
- WG-13 `[logic]` Interval default 1 hour. Quiet hours may cross midnight. (My placeholder values, not in the handoff, confirm: interval choices 15 min, 30 min, 1 hour, 2 hours, 4 hours; quiet hours default 22:00–07:00.)
- WG-14 `[logic]` Swift builds timeline entries for the next 24 hours and asks for a reload at the end. If the snapshot has no entry for now (app unopened for 8+ days), it keeps cycling the last day in the snapshot.
- WG-15 `[logic]` All widget kinds on one phone show the same current word at the same time, unless the user stepped manually (WG-21).

## Home screen widgets (follow the phone's light / dark, not the app setting)
- WG-20 `[ui]` Small A: word large and centered, `reading · romaji` and meaning under it, round ‹ › buttons in the bottom corners. No audio.
- WG-21 `[logic]` ‹ › step through today's words, wrapping. The manual position is stored in the App Group and resets at the next rotation tick.
- WG-22 `[ui]` Small B: word large with furigana above it, meaning below. No audio, no controls.
- WG-23 `[ui]` Medium: word on the left, `reading · romaji` and meaning beside it, one round play button on the right (word audio). (default NQ-15) The canvas also shows one line under it: sentence · translation, truncated to one line.
- WG-24 `[ui]` Large: a row of 4 picture thumbnails on top (today's words; first selected by default; tap one to select; the selected one is outlined). Below: selected word, `reading · romaji`, meaning, play button on the right; divider; its sentence with furigana and a second play button; translation. With more than 4 words today, the row shows the 4 around the rotation's current word.
- WG-25 `[ui]` Play buttons play audio without opening the app (audio playback intent). Arrows and picture taps do not open the app.
- WG-26 `[ui]` (default OQ-6) Tapping a widget body opens the app on Home.

## Lock screen widgets (tinted one color by iOS; no play buttons)
- WG-27 `[ui]` Lock widgets:
  1. Circle (under the clock, left slot): word, small meaning under it.
  2. Rectangle, left-aligned, 3 lines: word · `reading · romaji` · meaning.
  3. Rectangle, centered: same 3 lines.
  4. Rectangle, sentence: Japanese sentence (up to 2 lines) · romaji · translation, smaller text, truncating with …
  5. Inline, in the date line above the clock: `Fri 13  雨 あめ · rain` (iOS puts the date first; we supply word, reading, meaning).
- WG-28 `[ui]` Designed with weight and opacity only. Long words shrink to fit, then truncate; a circle widget that cannot fit a word shows its kana reading instead.

## All widgets
- WG-29 No app name, no level tag, no streak, no mascot.
- WG-29b `[ui]` Home widgets: `card` background, `text` for the word, `textSecondary` for reading, `raised` round buttons. Dark versions use the dark tokens. No kiwi green needed.

## Notification (lock screen option 6)
- WG-30 `[logic]` (default NQ-6) Local notifications, one per interval outside quiet hours, each showing that slot's word (same as WG-10): title `reading · word · romaji`, body = meaning, Kiwi Kana icon. On every app background, cancel all pending and schedule the next 48 slots.
- WG-31 `[logic]` Opt-in is asked during widget setup in onboarding. Off by default. A toggle lives in Settings.
- WG-32 `[logic]` No notifications in quiet hours. None if the day has no words.

## Empty states
- No snapshot yet (widget added before first open): "Open Kiwi Kana to start".
- Day with no words: "All caught up".

## Tests
- Snapshot content: WG-4 to WG-9 with scenarios `fresh`, `day30`, `two-dots-due`, `all-known`.
- Rotation: table tests for WG-10 to WG-13. Cases: plain day, quiet hours crossing midnight, quiet hours covering the 4 AM start, 1 word, 0 words, interval longer than the awake window.
- Swift has no unit tests in v1. It is checked with the widget inspector (dev menu) against real widgets.

## Manual check
- Add all 9 widgets. Dev interval 1 minute: all change together each minute.
- Set quiet hours to include now: nothing changes; no notification.
- `two-dots-due`: answer Know in the app → within one reload the word is gone from every widget.
- Change picture style: large widget pictures change.
- Lock the phone on a real night and check at 4 AM+ that words changed without opening the app.

## Spike notes (fill in after M1)
- Device build steps that worked:
- App Group ID:
- How fast a reload shows after the app writes:
- Limits found (timeline refresh budget, picture size, audio from a widget):
