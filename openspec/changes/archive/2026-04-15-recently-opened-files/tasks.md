## 1. State persistence module

- [x] 1.1 Create `apps/desktop/src/bun/lib/state.ts` with `loadState(statePath)` and `saveState(statePath, state)` functions. State shape: `{ recentFiles: string[] }`. Default to `{ recentFiles: [] }` on missing/corrupt file. Verify: type-check passes. `/build`
- [x] 1.2 Add `trackRecentFile(statePath, filePath)` — loads state, prepends path (deduplicating), trims to 3, saves. Add `removeRecentFile(statePath, filePath)` — loads state, filters out path, saves. Verify: type-check passes. `/build`
- [x] 1.3 Write unit tests for state.ts: track first file, track duplicate (moves to top), trim to 3, remove file, load from corrupt file, load from missing file. Verify: `bun run test` passes. `/test`

## 2. Extract openFileByPath

- [x] 2.1 Extract `openFileByPath(filePath)` in `index.ts` from the existing `openFileFromTray` logic (read content, set hasFileLoaded, startWatching, show popup or store pending file, send fileOpened). Refactor `openFileFromTray` to call `openFileByPath` after the dialog. Verify: existing "Open File..." flow still works, type-check passes. `/build`

## 3. Wire up recent file tracking

- [x] 3.1 Initialize `STATE_PATH` (alongside `CONFIG_PATH`) in `index.ts`. Call `trackRecentFile(STATE_PATH, filePath)` inside `openFileFromTray` after the dialog returns a path. Verify: opening a file via tray creates/updates `state.json` in the user data directory. `/build`

## 4. Recent submenu in tray menu

- [x] 4.1 Update `showTrayContextMenu()` to read state via `loadState(STATE_PATH)` and build a "Recent" submenu with `label: basename(path)`, `action: "open-recent"`, `data: { path }` for each recent file. Only include the submenu + separator when recent files exist. Verify: tray menu shows Recent submenu after opening a file. `/build`
- [x] 4.2 Handle `"open-recent"` action in the `context-menu-clicked` and `tray-clicked` handlers. Extract the path from `event.data.data.path`, call `openFileByPath`. Verify: clicking a recent file opens it in the editor. `/build`

## 5. Missing file handling

- [x] 5.1 In the `"open-recent"` handler, check if the file exists before opening. If missing, call `removeRecentFile(STATE_PATH, path)` and `Utils.showNotification({ title: "File not found", body: "<basename> has been removed from recent files.", silent: true })`. Verify: clicking a deleted recent file shows notification and removes the entry. `/build`

## 6. Review

- [x] 6.1 Code review of all changes. `/review`
