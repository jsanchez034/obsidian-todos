## ADDED Requirements

### Requirement: Config supports theme field

The `config.json` file SHALL support an optional `theme` field with values `"light"`, `"dark"`, or `"nasa"`. When absent, the system SHALL use the existing localStorage-based theme.

#### Scenario: Config with theme field

- **WHEN** `config.json` contains `{ "theme": "nasa" }`
- **THEN** `loadConfig` returns an object with `theme` set to `"nasa"`

#### Scenario: Config without theme field

- **WHEN** `config.json` does not contain a `theme` field
- **THEN** `loadConfig` returns an object with `theme` set to `undefined`

#### Scenario: Config with invalid theme value

- **WHEN** `config.json` contains `{ "theme": "invalid" }`
- **THEN** `loadConfig` returns an object with `theme` set to `undefined` (invalid values are ignored)

### Requirement: Config supports scanlines field

The `config.json` file SHALL support an optional `scanlines` boolean field. Default: `true`.

#### Scenario: Config with scanlines disabled

- **WHEN** `config.json` contains `{ "scanlines": false }`
- **THEN** `loadConfig` returns an object with `scanlines` set to `false`

#### Scenario: Config without scanlines field

- **WHEN** `config.json` does not contain a `scanlines` field
- **THEN** `loadConfig` returns an object with `scanlines` defaulting to `true`

### Requirement: Config changes push to webview

When `config.json` changes on disk, the bun process SHALL send a `configChanged` RPC message to the webview with the updated `theme` and `scanlines` values.

#### Scenario: Config file edited

- **WHEN** the user edits `config.json` to set `{ "theme": "nasa" }`
- **THEN** the bun process sends a `configChanged` message with `{ theme: "nasa", scanlines: true }` to the webview

### Requirement: Webview can request config

The webview SHALL be able to request the current config via a `getConfig` RPC request on mount.

#### Scenario: Webview requests config on mount

- **WHEN** the webview mounts and calls `getConfig`
- **THEN** the bun process returns the current `{ theme, scanlines }` from config

### Requirement: Config theme sets initial default

When the webview receives a `theme` value from config (via `getConfig` or `configChanged`), it SHALL call `setTheme()` to apply it. This updates localStorage, making it the active theme.

#### Scenario: Config theme applied on launch

- **WHEN** the app launches and config has `{ "theme": "nasa" }`
- **THEN** the NASA theme is applied

#### Scenario: ModeToggle overrides config at runtime

- **WHEN** config has `{ "theme": "nasa" }` but the user toggles to `dark` via ModeToggle
- **THEN** the dark theme is applied for the current session

#### Scenario: Config reasserts on restart

- **WHEN** config has `{ "theme": "nasa" }`, user toggled to `dark`, then restarts the app
- **THEN** the NASA theme is applied again (config is the default)

### Requirement: RPC schema extension

The `AppRPCSchema` SHALL include:

- `getConfig` in `bun.requests`: `{ params: void, response: { theme?: "light" | "dark" | "nasa", scanlines: boolean } }`
- `configChanged` in `webview.messages`: `{ theme?: "light" | "dark" | "nasa", scanlines: boolean }`

#### Scenario: Schema includes getConfig

- **WHEN** the webview calls `getConfig`
- **THEN** it receives a response matching `{ theme?: string, scanlines: boolean }`

#### Scenario: Schema includes configChanged

- **WHEN** the bun process sends `configChanged`
- **THEN** the webview receives a message matching `{ theme?: string, scanlines: boolean }`
