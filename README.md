# DairyToDoor

Single-supplier doorstep milk subscription platform (local MVP, synthetic data only).

- **APP-001** DairyToDoor Customer: Android (Expo / React Native)
- **APP-002** DairyToDoor Delivery: Android (Expo / React Native)
- **APP-003** DairyToDoor Admin: web (React / Vite)
- **COMP-001** Shared API and database: Express, Prisma, PostgreSQL

## Workspace layout

npm workspaces: `apps/customer` and `apps/delivery` (Expo SDK 57), `apps/admin` (React + Vite), and shared code under `packages/`.

## Local setup

Prerequisites (verified on the dev host): Node.js 24.21 / npm 12.1, Git, JDK 17 and the Android SDK (for later native builds). Phones run the apps in Expo Go 57 (SDK 57 only).

```sh
npm ci              # install from package-lock.json
npm run lint        # ESLint in every workspace
npm run typecheck   # tsc --noEmit in every workspace
npm test            # jest-expo (mobile) and Vitest (admin)
npm run build       # Vite build + expo export --platform android for both apps
```

Run one app: `npm start -w @dtd/customer` (or `@dtd/delivery`), or `npm run dev -w @dtd/admin` (serves on 127.0.0.1 only).

Copy `.env.example` to `.env` for local configuration; `.env` is never committed.

CI (`.github/workflows/ci.yml`, check name `verify`) runs the same commands on the local self-hosted runner for every pull request.

Changes reach `main` only through pull requests.
