# Architecture

Turborepo monorepo for a macOS menu bar markdown editor (Electrobun + React 19).

## Apps

- **`apps/desktop/`** — Electrobun Bun process. Manages tray icon, popup window lifecycle (show/hide/minimize), native file dialogs, file watching, and RPC communication with the webview. Entry: `src/bun/index.ts`.
- **`apps/web/`** — Vite + React 19 frontend loaded inside the Electrobun popup. Uses MDXEditor for rich-text/source markdown editing, auto-saves with 1.5s debounce. Entry: `src/main.tsx`, main component: `src/app.tsx`.

## Packages

- **`packages/ui/`** — Shared shadcn/ui components (base-lyra style). Import as `@obsidian-todos/ui/components/<name>`.
- **`packages/config/`** — Shared `tsconfig.base.json`.
- **`packages/env/`** — Environment variable validation (t3-oss/env-core + zod).

## Desktop ↔ Web Communication

RPC schema defined in `apps/web/src/lib/rpc-schema.ts` (imported by both sides):

- **Bun requests** (webview calls bun): `openFile`, `readFile`, `saveFile`
- **Bun messages** (webview sends to bun): `webviewReady`
- **Webview messages** (bun sends to webview): `fileOpened`, `fileChanged`, `windowShown`

The webview hook `use-electrobun-rpc.ts` wraps RPC with a subscription system for incoming messages and provides a mock fallback for browser-only dev.

## State Management

`use-file-state.ts` manages file path, content, dirty flag, and save status. State persists to localStorage so the popup retains context across hide/show cycles. On mount (and on `windowShown`), the file is re-read from disk to pick up external changes.

## Desktop behavior

No dock icon — tray-only app. The popup uses `setAlwaysOnTop` and `minimize()` for visibility toggling.
