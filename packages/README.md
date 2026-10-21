# Shared packages

Shared code consumed by the apps lives here as npm workspaces (`packages/<name>`), for example:

- `packages/design-tokens` (TASK-DTD-S0-002): tokens generated from `docs/designsystem` for React Native and CSS.
- `packages/onboarding` (TASK-DTD-S0-007): the shared mobile walkthrough.

Each package needs its own `package.json` with `lint`, `typecheck` and `test` scripts so the root scripts pick it up.
