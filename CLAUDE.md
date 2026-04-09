# CLAUDE.md

macOS menu bar markdown editor — Turborepo monorepo (Electrobun + React 19).

**Package manager: Bun** (not npm/yarn/pnpm). **Linter/formatter: Oxlint + Oxfmt** (not ESLint/Prettier).

## Commands

```bash
bun install                    # Install dependencies
bun run dev                    # Start all apps (Turborepo)
bun run dev:web                # Web app only (Vite on :5173)
bun run dev:desktop            # Desktop app with HMR
bun run build                  # Build all apps
bun run build:desktop          # Build stable desktop app
bun run test                   # Run all tests (Vitest, all workspaces)
bun run check-types            # TypeScript checks across monorepo
bun run check                  # Oxlint + Oxfmt (lint & format)
```

Type-check web app only: `cd apps/web && npx tsc --noEmit`

Add shared shadcn/ui component: `npx shadcn@latest add <component> -c packages/ui`

## Docs

- [Architecture](docs/architecture.md) — apps, packages, RPC, state management
- [Testing](docs/testing.md) — conventions, mocking, per-workspace approach
