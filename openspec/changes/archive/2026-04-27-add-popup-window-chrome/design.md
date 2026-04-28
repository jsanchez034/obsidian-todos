## Context

The popup window today is configured as a borderless, always-on-top, non-resizable, non-closable HUD-style popover (`apps/desktop/src/bun/index.ts:162-183`). It auto-destroys on `blur` so the global hotkey can re-fire cleanly (see the comment block at `index.ts:143-146` documenting a prior race condition with `Cmd+Shift+G` being swallowed as "Find Previous"). The window position is computed once at creation time, anchored relative to the tray icon's bounds via `calculatePopupPosition` in `lib/window-position.ts`.

Stakeholders / constraints worth preserving:

- The destroy-on-hide-via-hotkey behavior must remain intact — it's load-bearing for hotkey reliability.
- `currentFilePath` lives at module scope and persists across window lifecycles; this is intentional rehydration behavior the user has confirmed should not change.
- The app is `exitOnLastWindowClosed: false`, so closing the window does not quit the app.
- Electrobun 1.16.0 exposes `setFrame`, `setFullScreen`, `setAlwaysOnTop`, `focus`, and `close` on `BrowserWindow`, plus `focus`/`blur`/`resize` events. It does NOT expose `setMinSize`/`setMaxSize` or per-traffic-light visibility, which is why we cannot use the native zoom button without enabling edge-drag.

## Goals / Non-Goals

**Goals:**

- Click-away (focus loss) no longer destroys the popup window.
- A red close button and a green zoom button are visible and functional.
- The zoom button opens a popover with tiling presets that resize/move the window programmatically.
- The window remains non-edge-draggable.
- `alwaysOnTop` is true at the default popup size and false when zoomed.
- The global hotkey gains a "focus if unfocused" branch so it stops being destructive when the user just wants to bring the popup forward.
- Tile-frame math is a pure, fully unit-testable module separate from window placement.

**Non-Goals:**

- Replicating macOS Sequoia's native window-tiling popover pixel-for-pixel. The popover uses shadcn primitives and is allowed to look like the rest of the app.
- Adding native macOS traffic-light buttons. This was explicitly rejected during exploration (Path A/D) due to the AppKit `Resizable ↔ edge-drag ↔ zoom-button` coupling.
- Multi-display support beyond the primary display. The current popup positioning code already only uses the primary display; we follow that precedent. Multi-display tiling can be a follow-up.
- Persisting the zoomed frame across hotkey hide/show cycles. After a hotkey-destroy, re-show recreates the window at the anchor frame. This matches today's behavior; persisting last-frame would be a separate feature.
- Animating zoom transitions. Native AppKit zoom animates; programmatic `setFrame` does not. We accept the snap.
- Yellow/minimize button. Explicitly out of scope.

## Decisions

### Decision 1: Custom HTML chrome over native traffic lights

**Choice**: Keep `Borderless: true`, `Resizable: false`, `Closable: false`, render our own titlebar in HTML.

**Why**: AppKit's `NSWindowStyleMaskResizable` controls both the green zoom button AND mouse edge-drag — they cannot be decoupled without overriding `windowWillResize:` natively. Electrobun does not bridge that hook, nor does it expose `setMinSize`/`setMaxSize` (which would unlock a "lock to default size except during programmatic zoom" trick). Custom chrome sidesteps the entire AppKit coupling and gives us pixel-level control over which buttons appear.

**Alternatives considered**:

- _Path A — `Titled: true` + `Resizable: true` and accept edge-drag_: rejected; user explicitly does not want edge-drag.
- _Path A + snap-back resize handler_: rejected; the `resize` event fires continuously during drag, producing a visibly fighting window.
- _Path D — fork/PR Electrobun to expose `setMinSize`/`setMaxSize` or `windowWillResize:` hook_: noted as the proper long-term fix but out of scope for this change. Worth raising as an upstream issue.

### Decision 2: One capability, one spec file

**Choice**: All five sub-features live under a single `popup-window-chrome` capability.

**Why**: They are tightly coupled — removing blur-close requires the togglePopup state-machine update (otherwise the hotkey becomes wrong), and the zoom popover only makes sense if the window persists past blur. Splitting into separate capabilities would create artificial boundaries that don't match how the code naturally factors.

**Alternatives considered**: Separate capabilities for `popup-titlebar`, `popup-tiling`, and `popup-toggle-state-machine`. Rejected as over-decomposed for the scope.

### Decision 3: Tile math in its own module

**Choice**: New file `apps/desktop/src/bun/lib/window-tiling.ts`. Do not extend `window-position.ts`.

**Why**: `window-position.ts` answers "where should the popup appear relative to the tray icon at default size?" Tiling answers "given a work area, where should each preset put the window?" Different inputs (tray bounds vs. work area), different outputs, different test data. Keeping them separate keeps each module's purpose obvious and its tests focused.

### Decision 4: RPC-driven window operations, not direct webview-side ffi

**Choice**: Webview button clicks send RPC requests to the bun process, which calls the Electrobun window methods. Webview never touches `popupWindow` directly (it can't — it lives in the bun process).

**Why**: This matches the existing RPC pattern (`openFile`, `saveFile`, `getConfig`). Adds: `closeWindow`, `setWindowFrame`, `setWindowFullScreen`, `restoreWindow`, `getDisplayWorkArea`. The bun handlers validate input (finite numbers, positive dimensions) before invoking Electrobun — security and crash-resistance at the trust boundary.

**Alternatives considered**: Bun-side preload that exposes window controls directly to the webview JS context. Rejected; inconsistent with the project's existing RPC-first architecture and would split window-control logic across two surfaces.

### Decision 5: Track focus state in bun, not webview

**Choice**: Bun process listens to the BrowserWindow's `focus`/`blur` events and maintains an `isPopupFocused: boolean`. The togglePopup branch decision is made entirely in bun.

**Why**: Focus is an OS-level property that the bun process already has authoritative access to via Electrobun events. The webview learns of focus changes after a round-trip; making bun the source of truth avoids stale state. The hotkey is also handled in bun (`GlobalShortcut.register`) — keeping the toggle logic colocated.

### Decision 6: alwaysOnTop sequencing

**Choice**:

```
zoomOut (→ default):    setFrame(anchor) → setAlwaysOnTop(true)
zoomIn  (→ any other):  setAlwaysOnTop(false) → setFrame(target)
```

**Why**: At the moment of an alwaysOnTop=true large-frame state, AppKit can paint the window above an active full-screen app on another space. By disabling alwaysOnTop first when growing, and re-enabling it last when shrinking, we ensure that no intermediate frame ever has both "always-on-top=true" AND "frame larger than anchor."

### Decision 7: Custom popover, not native menu

**Choice**: Use shadcn `Popover` from `packages/ui`. Layout closely mirrors the macOS Sequoia tiling menu (sections + grid of icon buttons) but is rendered by us.

**Why**: The native macOS tiling popover is system UI gated behind a real `NSWindowZoomButton`; we don't have one. shadcn's `Popover` (Radix-based) gives us accessible focus management, Escape to close, and auto-positioning out of the box. Other shadcn primitives (`Button`, possibly `Separator`) compose into the layout. Install via `npx shadcn@latest add popover button -c packages/ui`.

## Implementation approach

Phases follow `incremental-implementation` (vertical slices, test-and-commit per slice) with `test-driven-development` (RED → GREEN → REFACTOR) gating every logic change.

1. **`test-driven-development` RED + `incremental-implementation`** — Add unit tests for `window-tiling.ts` covering all preset frames against a known work area. Tests fail (module doesn't exist).
2. **`test-driven-development` GREEN** — Implement `window-tiling.ts` with pure functions. Tests pass.
3. **`test-driven-development` RED** — Add a unit test for the togglePopup state machine extracted as a pure function (`decideToggleAction({ exists, focused, hasCurrentFile })` returning `"hide" | "focus" | "show" | "show-tray-menu"`). Test fails.
4. **`test-driven-development` GREEN** — Implement the pure decision function and wire it into `togglePopup`. Test passes.
5. **`api-and-interface-design` + `incremental-implementation`** — Extend `apps/web/src/lib/rpc-schema.ts` with the new requests. Add bun handlers in `apps/desktop/src/bun/index.ts` with input validation. Smoke-test via `bun run check-types`.
6. **`incremental-implementation`** — Remove the `blur → hidePopup` handler. Add `focus`/`blur` event listeners that maintain `isPopupFocused`. Verify by manually focusing/blurring (window should now persist).
7. **`frontend-ui-engineering` + `incremental-implementation`** — Install shadcn `Popover`/`Button` in `packages/ui`. Build `TitleBar` component with two buttons + drag region. Add `aria-label`s, ensure Tab order. Mount in `apps/web/src/App.tsx` above the editor. Verify in dev (`bun run dev:desktop`) — buttons render, drag works, close destroys window.
8. **`frontend-ui-engineering` + `incremental-implementation`** — Build `ZoomPopover` component. Wire each tile action to call `getDisplayWorkArea` → compute frame via `tileFrame` (imported via duplicate or shared util) → call `setWindowFrame`. Wire Restore → `restoreWindow`, Full Screen → `setWindowFullScreen({ value: true })`. Verify each preset visually.
9. **`incremental-implementation`** — Add the alwaysOnTop sequencing inside the bun-side handlers (not webview). Verify by zooming over a full-screen app: the popup should fall behind on zoom-in and return to top on Restore.
10. **`code-review-and-quality`** — Five-axis review (correctness, readability, architecture, security, performance) before merge. Specific things to verify: input validation in RPC handlers (security), no listener leaks across hotkey hide/show cycles (correctness), titlebar height doesn't break editor scroll (architecture/UX).

## Risks / Trade-offs

- **Risk**: Custom chrome doesn't pixel-match macOS, looks "off" to users expecting native traffic lights → **Mitigation**: User has accepted this; no native macOS app guarantees its chrome matches the system either (Linear, Raycast, Arc all use custom). Keep button colors and sizing close enough to read as window controls.
- **Risk**: Drag region (`-webkit-app-region: drag`) interactions with React event handling — clicks on `no-drag` children sometimes get eaten on certain WebKit versions → **Mitigation**: Test in dev. If problems appear, fall back to `pointer-events: auto` on buttons inside an explicit `pointer-events: none` drag layer, or use Electrobun's draggable-region API (preload exposes it per `dist/api/bun/preload/index.ts:4`).
- **Risk**: alwaysOnTop sequencing race — if the user clicks two zoom presets in rapid succession, ordering could interleave → **Mitigation**: Bun handlers run serially over the RPC channel; each handler completes before the next is dequeued. As long as `setAlwaysOnTop` and `setFrame` are awaited (or both synchronous ffi), no interleaving.
- **Risk**: Focus tracking lag — if `focus`/`blur` events arrive after the global hotkey fires, the toggle decides on stale state → **Mitigation**: Read focus synchronously at the top of `togglePopup` if Electrobun exposes a query API; otherwise fall back to the cached `isPopupFocused`. Worst case, a single hotkey press destroys instead of focuses, which is recoverable with a second press. Document this as a known minor edge case.
- **Risk**: Restore doesn't account for tray-icon position changing (e.g., user rearranges menu bar items) → **Mitigation**: Recompute `calculatePopupPosition` at Restore time using the current `tray.getBounds()`, not a cached value. This already works correctly for first-show.
- **Trade-off**: Custom chrome adds ~28px of permanent vertical space → editor viewport is shorter. Acceptable; the 600px default already accommodates this with margin to spare.
- **Trade-off**: We don't get the macOS Sequoia native tiling popover. We get a popover that's ours and behaves consistently with the rest of the shadcn UI. User explicitly approved.

**Skill review flags:**

- `security-and-hardening` — RPC handlers accept window-frame coordinates from the webview. Validate finite numbers and positive dimensions; reject silently bad input. Webview content is local-only (`views://popup/index.html`), so threat surface is low, but defense-in-depth still warrants validation.
- `frontend-ui-engineering` — Custom titlebar buttons must be keyboard-accessible (Tab order), labeled (`aria-label`), and have visible focus rings consistent with the rest of the app. Drag region must not capture button events.
- `performance-optimization` — Not performance-sensitive; programmatic `setFrame` is one-shot per user action.

## Migration Plan

This is an additive change with one removal (the `blur → hidePopup` handler). No data migration. No persisted state changes. To roll back: revert the commit set; the window returns to the previous popover behavior. No external systems touched.
