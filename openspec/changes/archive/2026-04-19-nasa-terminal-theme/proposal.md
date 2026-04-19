## Why

The editor currently offers light and dark themes with a neutral aesthetic. Adding a retro NASA mission-control terminal theme gives the app a distinctive, immersive personality — phosphor green text on deep black, monospace typography, and CRT-inspired effects. This is a visual identity differentiator and makes editing markdown feel like operating a spacecraft console.

## What Changes

- Add a third theme option (`nasa`) alongside `light` and `dark`, activated via `ModeToggle` or `config.json`
- NASA theme applies: IBM Plex Mono font, green-on-black color palette, amber headings, cyan links, CRT scanlines (toggleable), green glow effects
- Hide the MDXEditor toolbar in NASA mode — editing is keyboard-shortcut-only for terminal authenticity
- Restyle the file toolbar as a mission-style status bar with NASA terminology (`NOMINAL`, `TRANSMITTING`, `FAULT`, `STANDBY`)
- Restyle the empty state with mission-control flavor text
- Extend `config.json` with `theme` and `scanlines` preferences, pushed to the webview via a new RPC message
- `config.json` sets the default theme on launch; `ModeToggle` overrides at runtime via localStorage

## Capabilities

### New Capabilities

- `nasa-theme`: CSS theme variables, typography, and visual effects for the NASA terminal aesthetic
- `theme-preferences`: Config-driven theme and scanline preferences with live reload via RPC

### Modified Capabilities

- None

## Impact

- **CSS**: `globals.css` gets a `.nasa` block (custom properties + `@custom-variant nasa`); `index.css` gets `nasa-editor` class with prose overrides, glow, and scanline styles
- **Components**: `theme-provider.tsx`, `mode-toggle.tsx`, `markdown-editor.tsx`, `file-toolbar.tsx`, `app.tsx` all gain NASA-mode branches
- **RPC**: New `configChanged` message (bun → webview) and `getConfig` request (webview → bun) in `rpc-schema.ts`
- **Config**: `config.ts` and `index.ts` in desktop app extended for `theme` and `scanlines` fields
- **Dependencies**: IBM Plex Mono font (Google Fonts or bundled)
- **Skills needed**: `frontend-ui-engineering` (theme system, accessibility of green-on-black contrast), `incremental-implementation` (build slice-by-slice: CSS vars → components → RPC), `test-driven-development` (config loading, theme provider, RPC)
