## Context

The app is a macOS menu bar markdown editor built with Electrobun + React 19. The tray icon shows a context menu with "Open File...", "Preferences...", and "Quit". Files are opened via a native file dialog (`Utils.openFileDialog`). The bun process (`apps/desktop/src/bun/index.ts`) manages all tray/menu/file logic. User config lives in `~/Library/Application Support/obsidian-todos/config.json`.

Existing patterns to reuse:

- `apps/desktop/src/bun/lib/config.ts` — `loadConfig`/`ensureConfig` pattern for JSON file persistence
- `ContextMenu.showContextMenu()` — already used for the tray menu, supports `submenu` property
- `Utils.showNotification()` — native macOS notifications

## Goals / Non-Goals

**Goals:**

- Show last 3 recently opened files in the tray context menu as a "Recent" submenu
- Persist recent files across app restarts in a separate state file
- Handle missing files gracefully with native notification + auto-cleanup
- Extract `openFileByPath(path)` to share logic between file dialog and recent file opens

**Non-Goals:**

- Configurable number of recent files (hardcode to 3)
- Recent files in the webview UI (tray menu only)
- Tracking files opened via the webview RPC `openFile` handler
- File thumbnails or previews in the menu
- "Clear recent files" menu action

## Decisions

### 1. Separate state.json for persistence

**Decision**: Store recent files in `state.json` alongside `config.json`, not inside `config.json`.

**Rationale**: `config.json` is user-editable preferences (currently just `hotkey`). Recent files are app-managed state that changes frequently. Mixing them would clutter the user's config file and risk data loss if a user edits config and accidentally removes the recent files array.

**Alternative considered**: Using `config.json` with a `recentFiles` key — simpler (one file), but violates separation of concerns.

### 2. state.ts module mirrors config.ts pattern

**Decision**: Create `apps/desktop/src/bun/lib/state.ts` with `loadState()`, `saveState()`, `trackRecentFile(statePath, filePath)`, and `removeRecentFile(statePath, filePath)`.

**Rationale**: Follows the existing `config.ts` pattern (`loadConfig`/`ensureConfig`). Functions accept the state file path as a parameter for testability (same pattern as `loadConfig(configPath)`).

### 3. Extract openFileByPath from openFileFromTray

**Decision**: Create `openFileByPath(filePath)` in `index.ts` that handles: read content → trackRecentFile → startWatching → show popup → send fileOpened. Then `openFileFromTray` becomes: dialog → openFileByPath. The "open-recent" handler also calls `openFileByPath`.

**Rationale**: Eliminates duplication between the two open-file paths. Single place to maintain the file-opening sequence.

### 4. Submenu with basename labels and data property for full path

**Decision**: Each recent file menu item uses `label: basename(path)`, `action: "open-recent"`, `data: { path: fullPath }`.

**Rationale**: Full paths are too long for menu labels. The `data` property on Electrobun's ContextMenu items passes the full path to the click handler.

### 5. Native notification for missing files

**Decision**: Use `Utils.showNotification({ title: "File not found", body: "<filename> has been removed from recent files.", silent: true })`.

**Rationale**: The app may not have a visible window when a recent file is clicked (menu bar app). Native notifications are the established way to communicate from a tray-only app. Silent to avoid being intrusive — the user just clicked the menu so they're already looking at the screen.

## Risks / Trade-offs

- **Race condition on state.json** — Multiple rapid file opens could cause concurrent read/write. → Mitigation: File opens are user-initiated and sequential in practice. No locking needed.
- **Basename collisions** — Two files with the same name in different directories would look identical in the menu. → Acceptable for 3 items; user can distinguish by opening. Not worth adding directory hints for v1.
- **state.json corruption** — If the file becomes invalid JSON, `loadState` falls back to empty defaults (same pattern as `loadConfig`). No data loss risk — worst case is recent files list resets.

## Implementation approach

| Phase | Skill     | Work                                                                           |
| ----- | --------- | ------------------------------------------------------------------------------ |
| 1     | `/build`  | Create `state.ts` with loadState, saveState, trackRecentFile, removeRecentFile |
| 2     | `/test`   | Unit tests for state.ts (track, dedup, trim, remove, corrupt file handling)    |
| 3     | `/build`  | Extract `openFileByPath()`, wire up `trackRecentFile` in `openFileFromTray`    |
| 4     | `/build`  | Build Recent submenu in `showTrayContextMenu`, handle "open-recent" action     |
| 5     | `/build`  | Add missing-file notification + removeRecentFile on error                      |
| 6     | `/review` | Code review before merge                                                       |
