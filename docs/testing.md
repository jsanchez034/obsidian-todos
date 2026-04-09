# Testing

Vitest + React Testing Library. Run with `bun run test` at root (all workspaces via Turbo).

## Conventions

- Unit tests are **colocated** with their implementation file (e.g., `button.tsx` → `button.test.tsx`)
- Integration tests live in `src/__tests__/integration/`
- Setup files (`src/__tests__/setup.ts`) register jest-dom matchers and polyfills for jsdom

## Per-workspace

- `packages/ui/` — unit tests for each component and utility
- `apps/web/` — unit tests colocated with hooks/components; integration tests in `src/__tests__/integration/` (full `<App />` render with mocked RPC and MDXEditor)
- `apps/desktop/` — unit tests colocated in `src/bun/lib/` for extracted pure-logic modules (`config.ts`, `window-position.ts`)

## Mocking

- `@mdxeditor/editor` is mocked in web integration tests (requires a real browser layout engine)
- `electrobun/view` is never imported in tests — the hook detects the non-Electrobun environment and uses its built-in mock fallback
- `Bun` global and `fs/promises` are stubbed in desktop tests via `vi.stubGlobal` / `vi.mock`
