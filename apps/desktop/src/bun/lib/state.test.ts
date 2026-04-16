import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadState, removeRecentFile, saveState, trackRecentFile } from "./state";

const mockFileText = vi.fn();
const mockWrite = vi.fn();

vi.stubGlobal("Bun", {
  file: () => ({ text: mockFileText }),
  write: mockWrite,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockWrite.mockResolvedValue(undefined);
});

describe("loadState", () => {
  it("returns default state when file does not exist", async () => {
    mockFileText.mockRejectedValue(new Error("ENOENT"));
    const state = await loadState("/path/to/state.json");
    expect(state).toEqual({ recentFiles: [] });
  });

  it("returns default state when file contains invalid JSON", async () => {
    mockFileText.mockResolvedValue("not json{{{");
    const state = await loadState("/path/to/state.json");
    expect(state).toEqual({ recentFiles: [] });
  });

  it("loads state from valid file", async () => {
    const saved = { recentFiles: ["/a.md", "/b.md"] };
    mockFileText.mockResolvedValue(JSON.stringify(saved));
    const state = await loadState("/path/to/state.json");
    expect(state).toEqual(saved);
  });
});

describe("saveState", () => {
  it("writes state as formatted JSON", async () => {
    await saveState("/path/to/state.json", { recentFiles: ["/a.md"] });
    expect(mockWrite).toHaveBeenCalledWith(
      "/path/to/state.json",
      JSON.stringify({ recentFiles: ["/a.md"] }, null, 2) + "\n",
    );
  });
});

describe("trackRecentFile", () => {
  it("tracks the first file", async () => {
    mockFileText.mockRejectedValue(new Error("ENOENT"));
    await trackRecentFile("/state.json", "/notes.md");
    expect(mockWrite).toHaveBeenCalledWith("/state.json", expect.stringContaining("/notes.md"));
    const written = JSON.parse(mockWrite.mock.calls[0]![1] as string);
    expect(written.recentFiles).toEqual(["/notes.md"]);
  });

  it("prepends new file to existing list", async () => {
    mockFileText.mockResolvedValue(JSON.stringify({ recentFiles: ["/a.md", "/b.md"] }));
    await trackRecentFile("/state.json", "/c.md");
    const written = JSON.parse(mockWrite.mock.calls[0]![1] as string);
    expect(written.recentFiles).toEqual(["/c.md", "/a.md", "/b.md"]);
  });

  it("moves duplicate to top", async () => {
    mockFileText.mockResolvedValue(JSON.stringify({ recentFiles: ["/a.md", "/b.md", "/c.md"] }));
    await trackRecentFile("/state.json", "/b.md");
    const written = JSON.parse(mockWrite.mock.calls[0]![1] as string);
    expect(written.recentFiles).toEqual(["/b.md", "/a.md", "/c.md"]);
  });

  it("trims list to 3 entries", async () => {
    mockFileText.mockResolvedValue(JSON.stringify({ recentFiles: ["/a.md", "/b.md", "/c.md"] }));
    await trackRecentFile("/state.json", "/d.md");
    const written = JSON.parse(mockWrite.mock.calls[0]![1] as string);
    expect(written.recentFiles).toEqual(["/d.md", "/a.md", "/b.md"]);
  });
});

describe("removeRecentFile", () => {
  it("removes file from list", async () => {
    mockFileText.mockResolvedValue(JSON.stringify({ recentFiles: ["/a.md", "/b.md", "/c.md"] }));
    await removeRecentFile("/state.json", "/b.md");
    const written = JSON.parse(mockWrite.mock.calls[0]![1] as string);
    expect(written.recentFiles).toEqual(["/a.md", "/c.md"]);
  });

  it("does nothing if file not in list", async () => {
    mockFileText.mockResolvedValue(JSON.stringify({ recentFiles: ["/a.md"] }));
    await removeRecentFile("/state.json", "/z.md");
    const written = JSON.parse(mockWrite.mock.calls[0]![1] as string);
    expect(written.recentFiles).toEqual(["/a.md"]);
  });
});
