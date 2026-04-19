## 1. NASA Theme CSS Foundation

- [x] 1.1 Add `@custom-variant nasa (&:is(.nasa *))` and `.nasa` block with all shadcn CSS custom property overrides (background, foreground, primary, muted-foreground, destructive, border, accent, card, etc.) to `packages/ui/src/styles/globals.css`. Add IBM Plex Mono as `--font-mono` in the `.nasa` block and apply it to body. (incremental-implementation) Verify: `bun run check-types` passes, app builds with `bun run build`

- [x] 1.2 Add IBM Plex Mono font link (weights 400, 700) to `apps/web/index.html` (or the Electrobun HTML entry point). (incremental-implementation) Verify: font loads in browser at `bun run dev:web`

- [x] 1.3 Add `nasa-editor` class in `apps/web/src/index.css` with NASA prose typography overrides: amber headings, cyan links (underline on hover), bright green bold, dim green italic, green-bordered blockquotes, dashed green hr, terminal-style checkboxes. Add green glow box-shadow on editor container. Add scanline overlay as `::after` pseudo-element controlled by `data-scanlines` attribute. (incremental-implementation) Verify: `bun run build` passes

## 2. Config Extension (TDD)

- [x] 2.1 Write failing unit tests for `config.ts`: `loadConfig` returns `theme` and `scanlines` from config file, defaults `scanlines` to `true` when absent, returns `theme: undefined` for invalid values, ignores unknown theme strings. (test-driven-development RED) Verify: `bun run test` — new tests fail

- [x] 2.2 Extend `DEFAULT_CONFIG` in `apps/desktop/src/bun/lib/config.ts` to include `scanlines: true`. Update `loadConfig` to validate `theme` (only allow `"light"`, `"dark"`, `"nasa"` — set to `undefined` otherwise) and pass through `scanlines` boolean. (test-driven-development GREEN) Verify: `bun run test` — all tests pass

## 3. RPC Schema Extension

- [x] 3.1 Add `getConfig` to `bun.requests` in `apps/web/src/lib/rpc-schema.ts` with `params: void` and `response: { theme?: "light" | "dark" | "nasa", scanlines: boolean }`. Add `configChanged` to `webview.messages` with shape `{ theme?: "light" | "dark" | "nasa", scanlines: boolean }`. (incremental-implementation) Verify: `bun run check-types` passes

- [x] 3.2 Add `getConfig` request handler in `apps/desktop/src/bun/index.ts` that calls `loadConfig` and returns `{ theme, scanlines }`. Extend the existing `config.json` file watcher to send `configChanged` RPC message to the webview after reloading config. (incremental-implementation) Verify: `bun run check-types` passes

- [x] 3.3 Update `use-electrobun-rpc.ts` to expose `getConfig` request and `configChanged` subscription (following existing patterns for `readFile`/`fileOpened`). (incremental-implementation) Verify: `bun run check-types` passes

## 4. Theme Provider + Mode Toggle

- [x] 4.1 Update `ThemeProvider` in `apps/web/src/components/theme-provider.tsx` to pass `themes={["light", "dark", "nasa"]}` and `value={{ light: "", dark: "dark", nasa: "nasa" }}` to `NextThemesProvider`. (incremental-implementation) Verify: `bun run check-types` passes

- [x] 4.2 Update `ModeToggle` in `apps/web/src/components/mode-toggle.tsx` to cycle through three themes: light → dark → nasa → light. Update the icon to show a terminal/monitor icon for NASA mode. (incremental-implementation) Verify: `bun run dev:web` — clicking toggle cycles through all three themes, `nasa` class appears on root element

- [x] 4.3 Wire config preferences in `apps/web/src/app.tsx`: on mount, call `getConfig` and apply `theme` via `setTheme()` if present; set `data-scanlines` attribute on editor container. Subscribe to `configChanged` for live updates. (incremental-implementation) Verify: `bun run check-types` passes

## 5. NASA-Mode Component Updates

- [x] 5.1 Update `MarkdownEditor` in `apps/web/src/components/markdown-editor.tsx`: when theme is `nasa`, exclude `toolbarPlugin` from plugins array and use `nasa-editor` class instead of `dark-editor`. (incremental-implementation) Verify: `bun run dev:web` — NASA mode shows no toolbar, formatting keyboard shortcuts still work

- [x] 5.2 Update `FileToolbar` in `apps/web/src/components/file-toolbar.tsx`: when theme is `nasa`, render save status with NASA labels (`TRANSMITTING`, `NOMINAL`, `FAULT`) and corresponding colors/animations (amber pulse for saving, green for saved, red blink for error). Use monospace font. (incremental-implementation) Verify: `bun run dev:web` — NASA mode file toolbar shows correct status labels

- [x] 5.3 Update empty state in `apps/web/src/app.tsx`: when theme is `nasa` and no file is loaded, display `MISSION CONTROL — AWAITING INPUT` heading with `> Open a file from the tray menu` and `> to begin transmission` below. (incremental-implementation) Verify: `bun run dev:web` — NASA mode empty state shows mission control text

## 6. Final Verification

- [x] 6.1 Run full test suite and type checks. Verify all three themes work end-to-end in the browser: light → dark → nasa cycling, NASA typography, hidden toolbar, status labels, scanlines toggle, glow effect. Test config.json `theme` and `scanlines` fields apply correctly. (code-review-and-quality) Verify: `bun run test` passes, `bun run check-types` passes, `bun run check` passes
