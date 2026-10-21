# Shared packages

Shared code consumed by the apps lives here as npm workspaces (`packages/<name>`), for example:

- `packages/tokens` (`@dtd/tokens`, TASK-DTD-S0-002): design tokens for React Native (TS) and the admin web (CSS custom properties).
  `packages/tokens/tokens.json` is a copy of `docs/designsystem/developer/tokens.json` and the single source; after changing it run
  `npm run generate -w @dtd/tokens` and commit `generated/`. `npm test` fails if the generated files drift from `tokens.json`.
- `packages/onboarding` (TASK-DTD-S0-007): the shared mobile walkthrough.

Each package needs its own `package.json` with `lint`, `typecheck` and `test` scripts so the root scripts pick it up.
