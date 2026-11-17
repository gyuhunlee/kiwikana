# Kiwi Kana

Japanese vocab app for English speakers. iOS first. Expo (React Native) + TypeScript.

Start with `CLAUDE.md`, then `docs/plan.md`. Current milestone: **M0 Project setup**.

## First run

1. Install Node 20.19 or newer.
2. In this folder:
   ```
   npm install
   npx expo install --fix
   ```
   The second command sets every Expo and React Native package to the exact version Expo SDK 58 expects. Commit the `package-lock.json` it leaves behind.
3. Check the rig:
   ```
   npm test
   ```
4. Make a dev build (Expo Go will not work; SQLite and, later, widgets need native code):
   - On the Mac, phone plugged in: `npx expo run:ios --device`
   - Or a cloud build: `npx eas-cli build --profile development --platform ios` (needs `eas.json`; `npx eas-cli build:configure` writes it)
5. Day to day on Windows: `npm start`, then open the dev build on the phone and scan the QR code.

Before the first device build, set your own bundle ID in `app.json` → `expo.ios.bundleIdentifier` (it is a placeholder now).

## Commands

| Command | What it does |
|---|---|
| `npm start` | Metro for the dev build |
| `npm run test:changed` | Fast logic tests for changed files (the Stop hook runs this) |
| `npm run test:logic` | All fast logic tests |
| `npm run test:sim` | Multi-day simulations |
| `npm run check:content` | Content check (nothing to check until M2) |
| `npm run test:coverage-ids` | Spec rule IDs with no test, tests with unknown IDs |
| `npm test` | Typecheck + lint + logic + sim + content check |

## Dev menu

Dev builds only. Hold 3 fingers on Home. Time travel, load a scenario, wipe user state.

## Layout

```
app/          expo-router routes (thin)
src/home      Home and its modes
src/decks     Decks tab
src/profile   Profile tab
src/shared    theme, time, random, storage, testing, dev, ui
scripts/      Stop hook, spec ID coverage, content check
docs/         plan, architecture, specs, design
```
