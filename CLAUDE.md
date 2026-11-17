# Kiwi Kana

Japanese vocab app for English speakers. iOS first. The product is the **lock screen and home screen widgets**; the app feeds them. Exercises live on Home.

## Read first
- `docs/plan.md`: build order and what is in progress. Work on one milestone at a time.
- `docs/architecture.md`: stack, folders, data model.
- `docs/testing.md`: how tests are split and when each kind runs.
- `docs/theme.md`: colors, type, spacing. Never hardcode a color or font size.
- `docs/specs/<feature>.md`: the rules. Every rule has an ID (`WF-12`). Code and tests are built from these.
- `docs/open-questions.md`: undecided things and the defaults in use. Do not decide these yourself.
- `docs/not-included.md`: canvas notes that were left out or are in doubt. Do not build these until I answer.
- `docs/design/`: screenshots of the design canvas and its sticky notes typed out (`canvas-notes.md`). Look at the matching one before building any screen or widget.
- `docs/handoff.md`: background and design reasoning. Reference only. If it disagrees with a spec, stop and ask.

## How to talk to me
- Short answers, simple words, conclusions not thought process.
- When I ask for options: give your pick, then check whether it matters for v1.
- Push back if my request is redundant or conflicts with a spec.
- Do not change design or a spec rule on your own. Propose the change, wait for a yes, then edit the spec first and the code second.
- Do not re-propose anything in handoff section 8 (rejected).

## Code structure
- Organize by feature, not by type: `src/home`, `src/decks`, `src/profile`, `src/onboarding`, `src/shared`. No top-level `models/`, `components/`, `widgets/`, `utils/` folders.
- Inside a feature, split by sub-feature (`src/home/words`, `src/home/kana`, `src/home/stroke`, `src/home/bar`, `src/home/rewards`).
- A file moves to `src/shared` only when a second feature needs it.
- **Logic and UI are separate files.**
  - `*.logic.ts`: pure TypeScript. No React, no React Native, no Expo, no storage, no `Date.now()`, no `Math.random()`. Time comes from a `Clock`, randomness from an `Rng`, data from arguments.
  - `*.tsx`: screens and components. No rules in them. They call logic and render the result.
  - `*.store.ts`: glue. Loads state, calls logic, saves, notifies the UI.
- Every algorithm rule in a spec lives in a `*.logic.ts` file. If a rule is in a `.tsx` file, that is a bug.

## Coding standards
- TypeScript strict. No `any`.
- Meaningful names. Small functions. No abstraction until the second use.
- Comments only for why. Put the spec ID next to the code that implements a rule: `// WF-12`.
- No new dependency without asking.
- No breaking change to saved user data without a migration and my approval.
- Styling: theme tokens only. 2D, no shadows, no gradients, no elevation.

## Workflow
- Read the spec and the existing code before changing anything.
- For anything bigger than one file: tell me the plan first.
- Do not touch unrelated files.
- Check for existing functionality before adding new.
- If a spec is unclear or two rules conflict: ask. Do not guess.
- End with: files changed, spec IDs covered, anything not done.

## Testing
- New logic: write tests from `docs/specs/<feature>.md` first, then implement. Test names start with the spec ID: `it('WF-12 returning card is at least 2 after its new card')`.
- Tests are for `*.logic.ts` only. Do not write tests for screens or components unless I ask.
- Never edit or delete an existing test to make it pass. Fix the code or ask me.
- Do not run tests during a task. The Stop hook runs the fast tests for changed files.
- `npm run test:sim` (slow simulations) and `npm test` (everything): only when I ask or before a commit.
- UI work is checked by me on a device using the dev menu scenarios (`docs/testing.md`). When you finish UI work, list which scenarios I should open and what I should see.

## Commands
- `npm run test:changed`: fast logic tests related to changed files (what the Stop hook runs)
- `npm run test:logic`: all fast logic tests
- `npm run test:sim`: multi-day simulations
- `npm test`: typecheck + lint + logic + sim + content check
- `npm run check:content`: validates content data against `docs/specs/content.md`
