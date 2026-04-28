## ADDED Requirements

### Requirement: Custom titlebar with close and zoom controls

The popup window SHALL render a custom HTML titlebar at the top of its webview, containing exactly two interactive controls: a red close button and a green zoom button. No yellow/minimize button SHALL be rendered. Both controls MUST be reachable via keyboard (Tab focus order) and labeled for assistive tech (`aria-label`).

#### Scenario: Titlebar renders with two controls

- **WHEN** the popup window is opened
- **THEN** the topmost region of the webview shows a titlebar with a red close button and a green zoom button
- **AND** no minimize button is rendered

#### Scenario: Controls are keyboard-accessible

- **WHEN** the user presses Tab from the editor
- **THEN** focus eventually reaches the close button and zoom button
- **AND** each button has a non-empty `aria-label` ("Close window", "Zoom window")

#### Scenario: Activating the close button destroys the window

- **WHEN** the user clicks the close button (or activates it via Enter/Space)
- **THEN** the bun process closes the BrowserWindow and clears its reference
- **AND** the file path of the open file is preserved for the lifetime of the tray app

### Requirement: Titlebar drag region for repositioning

The titlebar SHALL act as an OS drag region (`-webkit-app-region: drag`) so the user can reposition the window by dragging the bar. Interactive controls within the titlebar (close, zoom) MUST opt out (`-webkit-app-region: no-drag`) so clicks register as button activations rather than drags.

#### Scenario: Dragging the titlebar moves the window

- **WHEN** the user mouse-downs on an empty region of the titlebar and drags
- **THEN** the window follows the cursor

#### Scenario: Clicking a titlebar button does not start a drag

- **WHEN** the user mouse-downs on the close or zoom button
- **THEN** the window does not start dragging
- **AND** the button activates normally on mouse-up

### Requirement: Click-away does not close the popup

The popup window SHALL remain open when the user focuses another application. Loss of OS focus SHALL NOT trigger window destruction.

#### Scenario: Focusing another app keeps popup open

- **WHEN** the popup is open and the user clicks into another application (Finder, browser, etc.)
- **THEN** the popup window remains visible at its current position and size
- **AND** no `close` event is emitted

### Requirement: Edge-drag resize is disabled

The BrowserWindow SHALL be created with `Resizable: false` in its styleMask. The user SHALL NOT be able to resize the window by dragging its edges or corners. Window size changes happen only via programmatic actions (zoom popover, restore, full-screen).

#### Scenario: Edge drag does nothing

- **WHEN** the user attempts to drag any edge or corner of the popup window
- **THEN** the cursor does not change to a resize cursor
- **AND** the window dimensions do not change

### Requirement: Zoom popover with tiling presets

Activating the green zoom button SHALL open a popover (built with the shadcn `Popover` primitive from `packages/ui`) anchored to the button. The popover SHALL contain three sections: **Move & Resize** (left half, right half, top half, bottom half), **Fill & Arrange** (fill, vertical split, quadrants), and a **Full Screen** action. A **Restore** action SHALL also be present that returns the window to its anchor position and default 400×600 size.

#### Scenario: Zoom button opens the popover

- **WHEN** the user clicks the zoom button
- **THEN** a popover appears anchored to the button containing the Move & Resize, Fill & Arrange, and Full Screen sections plus a Restore action

#### Scenario: Selecting a half tile resizes and moves the window

- **WHEN** the user selects "Left half" from Move & Resize
- **THEN** the window frame is set to `{ x: workArea.x, y: workArea.y, width: workArea.width / 2, height: workArea.height }` of the primary display's work area
- **AND** the popover closes

#### Scenario: Selecting Fill makes the window cover the work area

- **WHEN** the user selects "Fill" from Fill & Arrange
- **THEN** the window frame is set to the full primary display work area

#### Scenario: Selecting Full Screen enters native full-screen

- **WHEN** the user selects "Full Screen"
- **THEN** the window enters macOS full-screen mode via frame-based pseudo-fullscreen (due to Electrobun's Resizable: false constraint)

#### Scenario: Selecting Restore returns to the anchor frame

- **WHEN** the user selects "Restore" while the window is in any non-default frame (including full-screen)
- **THEN** the window exits full-screen if applicable
- **AND** the window frame is set to 400×600 at the tray-anchored position computed by `calculatePopupPosition`

#### Scenario: Popover is keyboard-navigable

- **WHEN** the popover is open
- **THEN** Tab moves focus through the tile actions in document order
- **AND** Enter/Space activates the focused action
- **AND** Escape closes the popover without changing the window frame

### Requirement: Always-on-top coupled to zoom state

The window's `alwaysOnTop` flag SHALL be `true` when the window is at its default 400×600 anchor frame, and `false` whenever the window has been zoomed to any larger frame (any tile preset, fill, full-screen). Transitions MUST be sequenced to avoid a frame in which a maximized window is rendered above full-screen apps.

#### Scenario: Entering a zoomed state disables alwaysOnTop first

- **WHEN** the user selects any zoom popover action other than Restore
- **THEN** `setAlwaysOnTop(false)` is called BEFORE the frame change
- **AND** the frame change is applied after

#### Scenario: Restoring re-enables alwaysOnTop after the resize

- **WHEN** the user selects "Restore"
- **THEN** the frame is set back to the anchor 400×600 position FIRST
- **AND** `setAlwaysOnTop(true)` is called after

### Requirement: Hotkey toggle uses three-branch state machine

The global hotkey SHALL invoke a `togglePopup` function with three branches based on window state:

1. Window exists AND is focused → destroy (current hide-on-toggle semantics)
2. Window exists AND is not focused → focus the window
3. Window does not exist → show (or show tray context menu if no `currentFilePath`)

The bun process SHALL track per-window focus state by listening to the BrowserWindow's `focus` and `blur` events.

#### Scenario: Hotkey on focused popup destroys it

- **GIVEN** the popup window exists and is the OS-focused window
- **WHEN** the user presses the global hotkey
- **THEN** the window is destroyed and the popupWindow reference is nulled

#### Scenario: Hotkey on unfocused popup focuses it

- **GIVEN** the popup window exists but the user is focused on another application
- **WHEN** the user presses the global hotkey
- **THEN** the popup window receives focus and is brought to front
- **AND** the window is NOT destroyed

#### Scenario: Hotkey with no popup and a current file shows it

- **GIVEN** no popup window exists and `currentFilePath` is set
- **WHEN** the user presses the global hotkey
- **THEN** a new popup window is created at the tray-anchored position with the current file rehydrated

#### Scenario: Hotkey with no popup and no current file shows tray menu

- **GIVEN** no popup window exists and `currentFilePath` is null
- **WHEN** the user presses the global hotkey
- **THEN** the tray context menu appears (Open File, Recent, Preferences, Quit)

### Requirement: RPC contract for window operations

The webview SHALL communicate window operations to the bun process via the existing RPC channel. The schema SHALL expose the following requests:

- `closeWindow()` — close the popup
- `setWindowFrame({ x, y, width, height })` — set window frame
- `setWindowFullScreen({ value: boolean })` — toggle native full-screen
- `restoreWindow()` — return to anchor frame and re-enable alwaysOnTop
- `getDisplayWorkArea()` — return `{ x, y, width, height }` for the primary display work area

The bun-side handlers MUST validate that numeric arguments are finite and that frame dimensions are positive before applying them, rejecting malformed inputs without crashing.

#### Scenario: setWindowFrame with valid input applies the frame

- **WHEN** the webview calls `setWindowFrame({ x: 0, y: 0, width: 800, height: 600 })`
- **THEN** the bun process calls `popupWindow.setFrame(0, 0, 800, 600)`
- **AND** the response resolves successfully

#### Scenario: setWindowFrame with non-finite values is rejected

- **WHEN** the webview calls `setWindowFrame({ x: NaN, y: 0, width: 800, height: 600 })`
- **THEN** the handler returns an error without calling `popupWindow.setFrame`
- **AND** the window frame is unchanged

#### Scenario: getDisplayWorkArea returns the primary display work area

- **WHEN** the webview calls `getDisplayWorkArea()`
- **THEN** the response is the rect from `Screen.getPrimaryDisplay().workArea`

### Requirement: Tile math is a pure, testable module

Computing target window frames for tile presets SHALL live in a dedicated module `apps/desktop/src/bun/lib/window-tiling.ts` that exports pure functions taking a work-area rect and returning a frame rect. The module MUST NOT depend on Electrobun runtime APIs and MUST be unit-testable with Vitest.

#### Scenario: leftHalf returns the left half of the work area

- **WHEN** `tileFrame("left-half", { x: 0, y: 0, width: 1920, height: 1080 })` is called
- **THEN** the result is `{ x: 0, y: 0, width: 960, height: 1080 }`

#### Scenario: topRightQuadrant returns the top-right quadrant

- **WHEN** `tileFrame("top-right", { x: 0, y: 0, width: 1920, height: 1080 })` is called
- **THEN** the result is `{ x: 960, y: 0, width: 960, height: 540 }`

#### Scenario: fill returns the entire work area

- **WHEN** `tileFrame("fill", { x: 100, y: 50, width: 1820, height: 1030 })` is called
- **THEN** the result is `{ x: 100, y: 50, width: 1820, height: 1030 }`
