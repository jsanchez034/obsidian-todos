## Context

The app currently supports `light` and `dark` themes via `next-themes` (`ThemeProvider` wrapping the app, `ModeToggle` for switching). Theme is stored in localStorage under `obsidian-todos-theme`. The dark theme uses warm neutral colors with an orange-ish primary (hue 42.9). MDXEditor applies a `dark-theme dark-editor` class and has a visible toolbar with B/I/U, lists, and diff-source toggles.

The desktop app has a `config.json` (at `~/Library/Application Support/obsidian-todos/config.json`) with a `hotkey` field, watched for live changes via `fs.watch`. Preferences menu opens this file in the default editor.

## Goals / Non-Goals

**Goals:**

- Add a `nasa` theme that transforms the editor into a retro mission-control terminal
- Theme uses IBM Plex Mono, phosphor green on deep black, amber headings, cyan links, CRT scanlines
- Hide MDXEditor toolbar in NASA mode for terminal authenticity
- Restyle file toolbar with NASA terminology for save status
- NASA-flavored empty state when no file is loaded
- Allow setting theme and scanlines preference in `config.json` with live reload
- Add `@custom-variant nasa` in `globals.css` like the existing `dark` variant

**Non-Goals:**

- Custom theme editor / arbitrary color configuration
- Animated boot sequence or sound effects
- Modifying the light or dark themes
- Changing the tray icon or desktop window chrome

## Decisions

### 1. Theme system: CSS custom properties + `@custom-variant nasa`

Use the same pattern as the existing `dark` theme. Add a `.nasa` block in `globals.css` that overrides all shadcn CSS custom properties. Add `@custom-variant nasa (&:is(.nasa *))` so Tailwind utilities can use `nasa:` prefix where needed.

**Why over a separate CSS file:** Keeps all theme definitions co-located. The existing pattern works well and `next-themes` already handles the class toggling.

**Why over Tailwind `nasa:` utilities for everything:** Most styling flows through CSS custom properties automatically (any component using `bg-background`, `text-foreground`, etc. gets NASA colors for free). The `nasa:` variant is only needed for NASA-specific structural changes (like hiding elements).

### 2. Font loading: Google Fonts CDN link in `index.html`

Add `<link>` for IBM Plex Mono in the HTML entry point. Only load weights 400 and 700.

**Why over bundling:** Simpler, no build config changes. The app is already an Electrobun webview that loads from `views://` — the font loads once and is cached.

**Alternative considered — system monospace fallback:** Less distinctive. IBM Plex Mono is specifically chosen for its NASA-adjacent feel.

### 3. Toolbar: conditionally exclude toolbar plugin

In `markdown-editor.tsx`, when theme is `nasa`, omit `toolbarPlugin()` from the MDXEditor plugins array entirely. MDXEditor keyboard shortcuts (Cmd+B, Cmd+I, etc.) remain functional without the toolbar.

**Why over CSS `display: none`:** Cleaner — no hidden DOM, no accessibility concerns with invisible interactive elements. MDXEditor supports dynamic plugin lists.

### 4. Config → webview: new RPC message + request

Extend `AppRPCSchema`:

- `getConfig` request (webview → bun): returns `{ theme?: "light" | "dark" | "nasa", scanlines?: boolean }`
- `configChanged` message (bun → webview): same shape, pushed on `fs.watch` changes

On webview mount, call `getConfig` to get initial preferences. Subscribe to `configChanged` for live updates. When received, update localStorage and call `setTheme()`.

**Priority:** Config sets the default on launch. ModeToggle overrides at runtime. On next app restart, config value applies again.

### 5. Scanlines: CSS `::after` pseudo-element, toggleable

Apply scanlines as a `::after` overlay on the editor container in `.nasa` mode. Controlled by a `data-scanlines` attribute on the root, driven by the `scanlines` config value. Default: `true`.

```css
.nasa [data-scanlines="true"]::after {
  content: "";
  pointer-events: none;
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.12) 0px,
    rgba(0, 0, 0, 0.12) 1px,
    transparent 1px,
    transparent 3px
  );
}
```

### 6. NASA color palette (CSS custom properties)

| Token                  | Value                  | Use                          |
| ---------------------- | ---------------------- | ---------------------------- |
| `--background`         | `oklch(0.08 0.02 140)` | Deep dark green-black        |
| `--foreground`         | `oklch(0.85 0.25 142)` | Phosphor green               |
| `--primary`            | `oklch(0.78 0.18 85)`  | Amber (headings, highlights) |
| `--primary-foreground` | `oklch(0.15 0 0)`      | Dark text on amber           |
| `--muted-foreground`   | `oklch(0.45 0.12 142)` | Dim green                    |
| `--destructive`        | `oklch(0.65 0.25 25)`  | Red alert                    |
| `--border`             | `oklch(0.2 0.05 142)`  | Dark green border            |
| `--accent`             | `oklch(0.7 0.15 195)`  | Cyan (links)                 |
| `--card`               | `oklch(0.1 0.02 140)`  | Slightly lifted surface      |

### 7. Save status NASA labels

| Status   | Label          | Style                  |
| -------- | -------------- | ---------------------- |
| `idle`   | _(hidden)_     | —                      |
| `saving` | `TRANSMITTING` | Amber, pulse animation |
| `saved`  | `NOMINAL`      | Green                  |
| `error`  | `FAULT`        | Red, blink animation   |

## Implementation Approach

1. **CSS theme variables** — `incremental-implementation`: Add `.nasa` block in `globals.css` with all custom properties, add `@custom-variant nasa`, add `nasa-editor` class in `index.css` with prose overrides, glow, and scanline styles
2. **Config extension** — `test-driven-development RED` → `GREEN`: Extend `config.ts` to support `theme` and `scanlines` fields, test loading/defaults
3. **RPC extension** — `incremental-implementation`: Add `getConfig` and `configChanged` to schema and handlers
4. **ThemeProvider + ModeToggle** — `incremental-implementation`: Add `nasa` to theme list, update cycling logic, wire config preferences
5. **File toolbar NASA mode** — `test-driven-development RED` → `GREEN`: NASA status labels, monospace styling
6. **Markdown editor NASA mode** — `incremental-implementation`: Conditional toolbar exclusion, `nasa-editor` class
7. **Empty state NASA mode** — `incremental-implementation`: Mission control flavor text
8. **Font loading** — `incremental-implementation`: Add IBM Plex Mono link to HTML entry

## Risks / Trade-offs

- **[Contrast / readability]** Green-on-black with scanlines may strain eyes in long sessions → Scanlines are toggleable; chose oklch values targeting WCAG AA contrast ratio (>4.5:1) for primary text
- **[Font loading]** IBM Plex Mono from CDN adds a network dependency → Fallback to `monospace` in font stack; font loads fast and is cached
- **[MDXEditor toolbar removal]** Users in NASA mode lose toolbar discoverability → Keyboard shortcuts still work; users choosing NASA mode are opting into the aesthetic
- **[Config file editing]** Users must manually edit JSON for preferences → Matches existing pattern for hotkey config; JSON is simple and the file opens in their editor via Preferences menu
