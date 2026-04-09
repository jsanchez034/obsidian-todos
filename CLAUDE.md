# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

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

To type-check just the web app: `cd apps/web && npx tsc --noEmit`

To add shared shadcn/ui components: `npx shadcn@latest add <component> -c packages/ui`

## Architecture

This is a **Turborepo monorepo** for a macOS menu bar markdown editor built with Electrobun.

### Apps

- **`apps/desktop/`** — Electrobun Bun process. Manages tray icon, popup window lifecycle (show/hide/minimize), native file dialogs, file watching, and RPC communication with the webview. Entry: `src/bun/index.ts`.
- **`apps/web/`** — Vite + React 19 frontend loaded inside the Electrobun popup. Uses MDXEditor for rich-text/source markdown editing, auto-saves with 1.5s debounce. Entry: `src/main.tsx`, main component: `src/app.tsx`.

### Packages

- **`packages/ui/`** — Shared shadcn/ui components (base-lyra style). Import as `@obsidian-todos/ui/components/<name>`.
- **`packages/config/`** — Shared `tsconfig.base.json`.
- **`packages/env/`** — Environment variable validation (t3-oss/env-core + zod).

### Desktop ↔ Web Communication

RPC schema defined in `apps/web/src/lib/rpc-schema.ts` (imported by both sides):

- **Bun requests** (webview calls bun): `openFile`, `readFile`, `saveFile`
- **Bun messages** (webview sends to bun): `webviewReady`
- **Webview messages** (bun sends to webview): `fileOpened`, `fileChanged`, `windowShown`

The webview hook `use-electrobun-rpc.ts` wraps RPC with a subscription system for incoming messages and provides a mock fallback for browser-only dev.

### State Management

`use-file-state.ts` manages file path, content, dirty flag, and save status. State persists to localStorage so the popup retains context across hide/show cycles. On mount (and on `windowShown`), the file is re-read from disk to pick up external changes.

## Testing

Tests use **Vitest** + **React Testing Library**. Run with `bun run test` at the root (runs all workspaces via Turbo).

**Conventions:**
- Unit tests are **colocated** with their implementation file (e.g., `button.tsx` → `button.test.tsx`)
- Integration tests live in `src/__tests__/integration/`
- Setup files (`src/__tests__/setup.ts`) register jest-dom matchers and polyfills for jsdom

**Per-workspace approach:**
- `packages/ui/` — unit tests for each component and utility
- `apps/web/` — unit tests colocated with hooks/components; integration tests in `src/__tests__/integration/` (full `<App />` render with mocked RPC and MDXEditor)
- `apps/desktop/` — unit tests colocated in `src/bun/lib/` for extracted pure-logic modules (`config.ts`, `window-position.ts`)

**Mocking notes:**
- `@mdxeditor/editor` is mocked in web integration tests (requires a real browser layout engine)
- `electrobun/view` is never imported in tests — the hook detects the non-Electrobun environment and uses its built-in mock fallback
- `Bun` global and `fs/promises` are stubbed in desktop tests via `vi.stubGlobal` / `vi.mock`

## Key Conventions

- **Package manager**: Bun (not npm/yarn/pnpm)
- **Linting/formatting**: Oxlint + Oxfmt (not ESLint/Prettier)
- **Styling**: Tailwind CSS v4 with CSS variables
- **Path aliases**: `@/*` maps to `src/` in the web app
- **Desktop has no dock icon** — it's a tray-only app; the popup uses `setAlwaysOnTop` and `minimize()` for visibility toggling
