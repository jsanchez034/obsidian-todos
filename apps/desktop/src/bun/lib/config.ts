import { mkdir } from "fs/promises";

export const DEFAULT_CONFIG = { hotkey: "CommandOrControl+Shift+T" };

export async function loadConfig(configPath: string): Promise<typeof DEFAULT_CONFIG> {
  try {
    const text = await Bun.file(configPath).text();
    return { ...DEFAULT_CONFIG, ...JSON.parse(text) };
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
