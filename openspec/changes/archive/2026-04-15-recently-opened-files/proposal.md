## Why

Users must go through the native file dialog every time they want to open a file. Power users who work with the same few markdown files repeatedly need quicker access. A "Recently Opened Files" feature in the tray menu eliminates friction for the most common workflow — reopening a file you've already worked on.

## What Changes

- Add a "Recent" submenu to the tray context menu showing the last 3 most recently opened files
- Clicking a recent file opens it directly (bypassing the file dialog)
- Persist recent file paths in a new `state.json` file, separate from user preferences in `config.json`
- If a recent file no longer exists on disk, show a native macOS notification and remove it from the list

## Capabilities

### New Capabilities

- `recent-files`: Track, persist, and display recently opened files in the tray context menu with error handling for missing files

### Modified Capabilities

<!-- No existing specs to modify -->

## Impact

- **New file**: `apps/desktop/src/bun/lib/state.ts` — state persistence and recent file tracking
- **Modified**: `apps/desktop/src/bun/index.ts` — tray menu construction, new `openFileByPath()` function, context menu handler for recent file clicks
- **New persistent file**: `state.json` in the user data directory alongside `config.json`
- **No changes** to: RPC schema, webview/React code, config.json format, or dependencies

## Skills needed

- `/build` (incremental-implementation) — state module first, then menu integration, then error handling
- `/test` (test-driven-development) — unit tests for state.ts functions (trackRecentFile, removeRecentFile, dedup/trim logic)
- `/review` (code-review-and-quality) — before merge

## Security & performance notes

- File paths stored in state.json are absolute paths on the local filesystem — no sanitization needed beyond what the OS provides
- State file reads/writes are infrequent (only on file open) — no performance concern
