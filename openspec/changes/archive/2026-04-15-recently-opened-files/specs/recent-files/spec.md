## ADDED Requirements

### Requirement: Recent files are tracked on file open from tray

The system SHALL record a file's absolute path in the recent files list when a file is opened via the tray menu "Open File..." dialog. The list SHALL store at most 3 entries, ordered most-recent-first.

#### Scenario: First file opened

- **WHEN** user opens a file via "Open File..." from the tray menu
- **THEN** the file's absolute path is stored as the only entry in the recent files list

#### Scenario: Subsequent file opened

- **WHEN** user opens a new file via "Open File..." and the recent files list already contains entries
- **THEN** the new file's path is prepended to the list

#### Scenario: Duplicate file opened

- **WHEN** user opens a file that is already in the recent files list
- **THEN** the existing entry is moved to the top of the list (no duplicates)

#### Scenario: List exceeds maximum size

- **WHEN** user opens a file and the recent files list already contains 3 entries
- **THEN** the oldest entry is removed and the new file is prepended (list remains at 3)

### Requirement: Recent files persist across app restarts

The system SHALL persist the recent files list to a `state.json` file in the app's user data directory. The state file SHALL be separate from `config.json`.

#### Scenario: App restarts with existing state

- **WHEN** the app starts and `state.json` contains a valid recent files list
- **THEN** the recent files list is loaded from `state.json`

#### Scenario: App starts with missing state file

- **WHEN** the app starts and `state.json` does not exist
- **THEN** the recent files list is empty

#### Scenario: App starts with corrupt state file

- **WHEN** the app starts and `state.json` contains invalid JSON
- **THEN** the recent files list defaults to empty (no crash)

### Requirement: Tray menu shows Recent submenu

The system SHALL display a "Recent" submenu in the tray context menu between "Open File..." and "Preferences..." when there are recent files. Each submenu item SHALL display the file's basename as its label.

#### Scenario: Recent files exist

- **WHEN** the tray context menu is shown and there are recent files
- **THEN** a "Recent" submenu appears with one item per recent file, showing basenames

#### Scenario: No recent files

- **WHEN** the tray context menu is shown and there are no recent files
- **THEN** the "Recent" submenu does not appear

### Requirement: Clicking a recent file opens it

The system SHALL open the file directly when a user clicks a recent file in the submenu, bypassing the file dialog. This SHALL use the same file-opening flow as "Open File..." (read content, start watching, show popup, send fileOpened to webview).

#### Scenario: Recent file clicked and exists on disk

- **WHEN** user clicks a recent file entry in the submenu and the file exists
- **THEN** the file is opened in the editor, the file watcher is started, and the file is moved to the top of the recent files list

#### Scenario: Recent file clicked and popup window already exists

- **WHEN** user clicks a recent file and the popup window is already created
- **THEN** the popup is shown and `fileOpened` is sent to the existing webview

#### Scenario: Recent file clicked and no popup window exists

- **WHEN** user clicks a recent file and no popup window has been created yet
- **THEN** the file is stored as pending, a new popup window is created, and the file is sent via `fileOpened` once the webview signals ready

### Requirement: Missing recent file shows notification and is removed

The system SHALL show a native macOS notification and remove the file from the recent files list when a user clicks a recent file that no longer exists on disk.

#### Scenario: Recent file no longer exists

- **WHEN** user clicks a recent file entry and the file does not exist on disk
- **THEN** a silent native notification is shown with title "File not found" and body "<filename> has been removed from recent files.", and the file is removed from the recent files list
