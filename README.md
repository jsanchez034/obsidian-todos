# obsidian-todos

A macOS menu bar markdown editor built with [Electrobun](https://electrobun.dev/) and [Vite](https://vite.dev/) + React 19. Scaffolded with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack).

## Features

- **Vite + React 19** - Fast dev server and HMR via Vite 7
- **MDXEditor** - Rich-text and source markdown editing
- **TailwindCSS v4** - Utility-first CSS with CSS variables
- **Shared UI package** - shadcn/ui primitives in `packages/ui`
- **Electrobun** - Lightweight native desktop shell (tray-only, no dock icon)
- **Oxlint + Oxfmt** - Fast linting and formatting
- **Turborepo** - Optimized monorepo build system

## Getting Started

```bash
bun install        # Install dependencies
bun run dev        # Start all apps (web + desktop)
```

Open [http://localhost:5173](http://localhost:5173) in your browser, or use the desktop tray app.

## Project Structure

```
obsidian-todos/
├── apps/
│   ├── desktop/     # Electrobun Bun process (tray icon, file I/O, RPC)
│   └── web/         # Vite + React 19 frontend (MDXEditor, auto-save)
├── packages/
│   ├── ui/          # Shared shadcn/ui components (base-lyra style)
│   ├── config/      # Shared tsconfig
│   └── env/         # Environment variable validation (t3-oss/env-core + zod)
```

## UI Customization

Shared shadcn/ui primitives live in `packages/ui`:

- Design tokens and global styles: `packages/ui/src/styles/globals.css`
- Shared primitives: `packages/ui/src/components/*`
- shadcn config: `packages/ui/components.json` and `apps/web/components.json`

Add shared components from the project root:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import them as:

```tsx
import { Button } from "@obsidian-todos/ui/components/button";
```

For app-specific blocks, run the shadcn CLI from `apps/web`.

## Available Scripts

- `bun run dev` — Start all apps in development mode
- `bun run build` — Build all apps
- `bun run dev:web` — Web app only (Vite on :5173)
- `bun run dev:desktop` — Desktop app with HMR
- `bun run build:desktop` — Build stable Electrobun desktop app
- `bun run build:desktop:canary` — Build canary Electrobun desktop app
- `bun run check-types` — TypeScript checks across monorepo
- `bun run check` — Oxlint + Oxfmt (lint & format)
