import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_CONFIG, ensureConfig, loadConfig } from "./config";

// Mock Bun globals and fs/promises
const mockFileText = vi.fn();
const mockWrite = vi.fn();
const mockMkdir = vi.fn();

vi.stubGlobal("Bun", {
  file: () => ({ text: mockFileText }),
  write: mockWrite,
});

vi.mock("fs/promises", () => ({
  mkdir: (...args: any[]) => mockMkdir(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadConfig", () => {
  it("returns default config when file does not exist", async () => {
    mockFileText.mockRejectedValue(new Error("ENOENT"));
    const config = await loadConfig("/path/to/config.json");
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("merges file config with defaults", async () => {
    mockFileText.mockResolvedValue(JSON.stringify({ hotkey: "Alt+T" }));
    const config = await loadConfig("/path/to/config.json");
    expect(config).toEqual({ hotkey: "Alt+T", scanlines: true });
  });

  it("preserves defaults for missing keys in file", async () => {
    mockFileText.mockResolvedValue(JSON.stringify({}));
    const config = await loadConfig("/path/to/config.json");
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("handles malformed JSON gracefully", async () => {
    mockFileText.mockResolvedValue("not json{{{");
    const config = await loadConfig("/path/to/config.json");
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("returns theme from config when valid", async () => {
    mockFileText.mockResolvedValue(JSON.stringify({ theme: "nasa" }));
    const config = await loadConfig("/path/to/config.json");
    expect(config.theme).toBe("nasa");
  });

  it("returns undefined theme for invalid value", async () => {
    mockFileText.mockResolvedValue(JSON.stringify({ theme: "invalid" }));
    const config = await loadConfig("/path/to/config.json");
    expect(config.theme).toBeUndefined();
  });

  it("accepts all valid theme values", async () => {
    for (const theme of ["light", "dark", "nasa"]) {
      mockFileText.mockResolvedValue(JSON.stringify({ theme }));
      const config = await loadConfig("/path/to/config.json");
      expect(config.theme).toBe(theme);
    }
  });

  it("defaults scanlines to true when absent", async () => {
    mockFileText.mockResolvedValue(JSON.stringify({ hotkey: "Alt+T" }));
    const config = await loadConfig("/path/to/config.json");
    expect(config.scanlines).toBe(true);
  });

  it("passes scanlines false from config", async () => {
    mockFileText.mockResolvedValue(JSON.stringify({ scanlines: false }));
    const config = await loadConfig("/path/to/config.json");
    expect(config.scanlines).toBe(false);
  });
});

describe("ensureConfig", () => {
  it("does nothing when config file already exists", async () => {
    mockFileText.mockResolvedValue("{}");
    await ensureConfig("/config-dir", "/config-dir/config.json");
    expect(mockMkdir).not.toHaveBeenCalled();
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it("creates directory and writes default config when file missing", async () => {
    mockFileText.mockRejectedValue(new Error("ENOENT"));
    mockMkdir.mockResolvedValue(undefined);
    mockWrite.mockResolvedValue(undefined);

    await ensureConfig("/config-dir", "/config-dir/config.json");

    expect(mockMkdir).toHaveBeenCalledWith("/config-dir", { recursive: true });
    expect(mockWrite).toHaveBeenCalledWith(
      "/config-dir/config.json",
      JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n",
    );
  });
});
