import { mkdir } from "fs/promises";

const VALID_THEMES = ["light", "dark", "nasa"] as const;
type Theme = (typeof VALID_THEMES)[number];

export interface AppConfig {
  hotkey: string;
  scanlines: boolean;
  theme?: Theme;
}

export const DEFAULT_CONFIG: AppConfig = {
  hotkey: "CommandOrControl+Shift+T",
  scanlines: false,
};

export async function loadConfig(configPath: string): Promise<AppConfig> {
  try {
    const text = await Bun.file(configPath).text();
    const parsed = JSON.parse(text);
    const theme = VALID_THEMES.includes(parsed.theme) ? (parsed.theme as Theme) : undefined;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      theme,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function ensureConfig(configDir: string, configPath: string) {
  try {
    await Bun.file(configPath).text();
  } catch {
    await mkdir(configDir, { recursive: true });
    await Bun.write(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n");
  }
}
