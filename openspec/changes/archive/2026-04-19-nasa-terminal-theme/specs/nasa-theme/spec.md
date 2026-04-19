## ADDED Requirements

### Requirement: NASA theme color palette

The system SHALL define a `.nasa` CSS class in `globals.css` that overrides all shadcn CSS custom properties with a retro terminal color palette (phosphor green foreground on deep dark green-black background, amber primary, cyan accent, red destructive).

#### Scenario: NASA theme colors applied

- **WHEN** the `nasa` class is applied to the root element
- **THEN** `--background` renders as deep dark green-black, `--foreground` renders as phosphor green, `--primary` renders as amber, `--accent` renders as cyan, `--destructive` renders as red

### Requirement: NASA Tailwind variant

The system SHALL define `@custom-variant nasa (&:is(.nasa *))` in `globals.css` so that Tailwind utilities can use the `nasa:` prefix for NASA-specific styling.

#### Scenario: nasa variant available in Tailwind

- **WHEN** a component uses a `nasa:` prefixed utility class (e.g. `nasa:hidden`)
- **THEN** the utility applies only when the root element has the `nasa` class

### Requirement: NASA monospace typography

The system SHALL use IBM Plex Mono as the font for all text in NASA mode, with a fallback to `monospace`.

#### Scenario: Font applied in NASA mode

- **WHEN** the NASA theme is active
- **THEN** all text in the editor renders in IBM Plex Mono (or system monospace fallback)

#### Scenario: Font not applied in other themes

- **WHEN** the light or dark theme is active
- **THEN** the default sans-serif font is used

### Requirement: NASA prose typography overrides

In NASA mode, the MDXEditor prose content SHALL use themed typography: amber headings, cyan links (underline on hover), bright green bold text, dim green italic text, green-bordered blockquotes, styled horizontal rules, and terminal-style checkboxes.

#### Scenario: Heading styled in NASA mode

- **WHEN** a markdown heading is rendered in NASA mode
- **THEN** the heading text appears in amber color with monospace font

#### Scenario: Link styled in NASA mode

- **WHEN** a markdown link is rendered in NASA mode
- **THEN** the link text appears in cyan, with underline appearing on hover

#### Scenario: Checkbox styled in NASA mode

- **WHEN** a markdown checkbox is rendered in NASA mode
- **THEN** checked items display a filled square indicator and unchecked items display an empty square indicator

### Requirement: Green glow effect

The editor container SHALL have a subtle green glow (box-shadow) in NASA mode.

#### Scenario: Glow visible in NASA mode

- **WHEN** the NASA theme is active
- **THEN** the editor container has a green-tinted box-shadow

### Requirement: CRT scanline overlay

The editor SHALL display a subtle CRT scanline overlay in NASA mode when scanlines are enabled.

#### Scenario: Scanlines visible when enabled

- **WHEN** the NASA theme is active and scanlines preference is `true`
- **THEN** a repeating horizontal line overlay is visible over the editor content
- **AND** the overlay does not intercept pointer events

#### Scenario: Scanlines hidden when disabled

- **WHEN** the NASA theme is active and scanlines preference is `false`
- **THEN** no scanline overlay is displayed

#### Scenario: Scanlines not shown in other themes

- **WHEN** the light or dark theme is active
- **THEN** no scanline overlay is displayed regardless of scanlines preference

### Requirement: NASA toolbar hidden

The MDXEditor toolbar SHALL NOT be rendered when the NASA theme is active. All formatting shortcuts (Cmd+B, Cmd+I, etc.) SHALL remain functional via keyboard.

#### Scenario: Toolbar hidden in NASA mode

- **WHEN** the NASA theme is active
- **THEN** the MDXEditor toolbar is not present in the DOM

#### Scenario: Keyboard shortcuts work without toolbar

- **WHEN** the NASA theme is active and the user presses Cmd+B
- **THEN** the selected text is toggled bold

#### Scenario: Toolbar visible in other themes

- **WHEN** the light or dark theme is active
- **THEN** the MDXEditor toolbar is rendered normally

### Requirement: NASA save status labels

The file toolbar SHALL display NASA-style status labels in NASA mode.

#### Scenario: Idle status in NASA mode

- **WHEN** save status is `idle` and NASA theme is active
- **THEN** no status indicator is displayed

#### Scenario: Saving status in NASA mode

- **WHEN** save status is `saving` and NASA theme is active
- **THEN** the label `TRANSMITTING` is displayed in amber with a pulsing animation

#### Scenario: Saved status in NASA mode

- **WHEN** save status is `saved` and NASA theme is active
- **THEN** the label `NOMINAL` is displayed in green

#### Scenario: Error status in NASA mode

- **WHEN** save status is `error` and NASA theme is active
- **THEN** the label `FAULT` is displayed in red with a blinking animation

### Requirement: NASA empty state

When no file is loaded and the NASA theme is active, the empty state SHALL display mission-control themed text.

#### Scenario: Empty state in NASA mode

- **WHEN** no file is loaded and the NASA theme is active
- **THEN** the text `MISSION CONTROL — AWAITING INPUT` is displayed as a heading
- **AND** the text `> Open a file from the tray menu` and `> to begin transmission` are displayed below

#### Scenario: Empty state in other themes

- **WHEN** no file is loaded and the light or dark theme is active
- **THEN** the standard empty state text is displayed

### Requirement: NASA theme is selectable

The ModeToggle component SHALL cycle through three themes: light → dark → nasa → light.

#### Scenario: Cycling to NASA theme

- **WHEN** the user is on dark theme and activates the ModeToggle
- **THEN** the theme changes to `nasa`

#### Scenario: Cycling from NASA theme

- **WHEN** the user is on NASA theme and activates the ModeToggle
- **THEN** the theme changes to `light`

**Accessibility:** The NASA theme MUST maintain WCAG AA contrast ratio (>4.5:1) for all primary text against the background. The green-on-black palette SHALL be validated for sufficient contrast.
