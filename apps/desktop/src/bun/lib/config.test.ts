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
    expect(config).toEqual({ hotkey: "Alt+T" });
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
