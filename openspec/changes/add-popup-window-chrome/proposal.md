## Why

Today the popup window is a borderless menu-bar popover that destroys itself on `blur`, has no visible window controls, and offers no way to reposition or resize. Users can't focus another app without losing their editor state, can't manually close the window short of pressing the global hotkey, and can't grow the editor for longer writing sessions. Adding custom chrome (close button + zoom popover) decouples the popup from blur-close behavior and unlocks a "tool window" experience without enabling AppKit edge-drag — which `NSWindowStyleMaskResizable` would also enable, and which we explicitly want to avoid.

## What Changes

- **BREAKING**: Remove the `blur → hidePopup` handler. Click-away no longer destroys the popup window.
- Add a custom HTML titlebar component to `apps/web` containing a red close button and a green zoom button. No yellow/minimize button. The titlebar acts as a `-webkit-app-region: drag` handle so the window can be repositioned by dragging the bar; the buttons opt out via `no-drag`.
- Add a zoom popover (shadcn `Popover`) opened by the green button, exposing tiling presets — Move & Resize (left/right/top/bottom halves), Fill & Arrange (fill, vertical split, quadrants), Full Screen, and Restore (return to original 400×600 popup position).
- Add RPC requests from webview → bun for window operations: `setWindowFrame(x, y, w, h)`, `setWindowFullScreen(v)`, `closeWindow()`, `restoreWindow()` (returns to anchor position), `getDisplayWorkArea()`.
- Couple `alwaysOnTop` with zoom state — disable when entering any non-default frame, restore when returning to the anchor frame. Order matters to prevent a one-frame flash above full-screen apps.
- Revise `togglePopup` to a three-branch state machine: focused → destroy; unfocused but exists → focus; doesn't exist → show. Track focus via Electrobun's `focus`/`blur` events.
- Keep `Borderless: true`, `Resizable: false`, `Closable: false` on the BrowserWindow — chrome stays custom, edge-drag stays disabled.
- Install shadcn `Popover` (and `Button` if missing) into `packages/ui` per CLAUDE.md.

## Capabilities

### New Capabilities

- `popup-window-chrome`: Custom titlebar with close + zoom controls, drag region, click-away persistence, zoom popover with tiling presets, always-on-top coupling to zoom state, and the revised toggle state machine.

### Modified Capabilities

- None. (No existing spec covers popup window lifecycle today.)

## Impact

- **Desktop bun process** (`apps/desktop/src/bun/index.ts`): remove `blur` handler, revise `togglePopup`, add focus tracking, add new RPC handlers (`setWindowFrame`, `setWindowFullScreen`, `closeWindow`, `restoreWindow`, `getDisplayWorkArea`), sequence `setAlwaysOnTop` around zoom transitions.
- **RPC schema** (`apps/web/src/lib/rpc-schema.ts`): add the new requests above.
- **Web UI** (`apps/web/src/components/`): new `TitleBar` component with close + zoom buttons + drag region; new `ZoomPopover` component with tiling presets; mount titlebar above editor in `App.tsx`.
- **Tile math** (`apps/desktop/src/bun/lib/window-tiling.ts`): new module computing target frames (halves, quadrants, fill) from a `workArea` rect. Kept separate from `window-position.ts`, which handles tray-anchored popup placement only.
- **Shared UI** (`packages/ui`): install shadcn `Popover` and any missing primitives via `npx shadcn@latest add <component> -c packages/ui`.
- **Tests**: unit tests for `window-tiling.ts` (frame math), `togglePopup` state machine logic (extracted to a pure function for testability), and `TitleBar` interaction (close click, zoom popover open/close, drag-region wiring).
- **CSS**: titlebar height (~28px) reduces editor viewport height — verify scroll/layout in `markdown-editor.tsx` still feels right.
- **Skills needed**: `frontend-ui-engineering` (titlebar component, accessibility of custom close/zoom controls, focus order, keyboard support), `api-and-interface-design` (RPC contract for window ops), `test-driven-development` (tile math, state machine), `incremental-implementation` (build slice-by-slice: drop blur handler → titlebar shell → close button → zoom popover → tile actions → alwaysOnTop coupling → togglePopup revision), `code-review-and-quality` (review before merge).
