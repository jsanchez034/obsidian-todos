import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RpcClient } from "./use-electrobun-rpc";
import { useFileState } from "./use-file-state";

function createMockRpc(overrides: Partial<RpcClient> = {}): RpcClient {
  return {
    openFile: vi.fn(async () => null),
    readFile: vi.fn(async () => ""),
    saveFile: vi.fn(async () => true),
    getConfig: vi.fn(async () => ({ scanlines: true as const })),
    closeWindow: vi.fn(async () => true),
    setWindowFrame: vi.fn(async () => true),
    setWindowFullScreen: vi.fn(async () => true),
    restoreWindow: vi.fn(async () => true),
    getDisplayWorkArea: vi.fn(async () => ({ x: 0, y: 0, width: 1920, height: 1080 })),
    subscribe: vi.fn(() => () => {}),
    isElectrobun: false,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("useFileState", () => {
  it("initializes with default state", () => {
    const { result } = renderHook(() => useFileState(createMockRpc()));

    expect(result.current.state).toEqual({
      filePath: null,
      content: "",
      isDirty: false,
      saveStatus: "idle",
    });
  });

  it("setFile updates path, content and resets dirty/status", () => {
    const { result } = renderHook(() => useFileState(createMockRpc()));

    act(() => result.current.setContent("unsaved"));
    expect(result.current.state.isDirty).toBe(true);

    act(() => result.current.setFile("/path/to/file.md", "# Hello"));
    expect(result.current.state).toEqual({
      filePath: "/path/to/file.md",
      content: "# Hello",
      isDirty: false,
      saveStatus: "idle",
    });
  });

  it("setContent marks dirty and resets save status", () => {
    const { result } = renderHook(() => useFileState(createMockRpc()));

    act(() => result.current.setContent("new content"));
    expect(result.current.state.content).toBe("new content");
    expect(result.current.state.isDirty).toBe(true);
    expect(result.current.state.saveStatus).toBe("idle");
  });

  it("setSaveStatus('saving') does not clear dirty", () => {
    const { result } = renderHook(() => useFileState(createMockRpc()));

    act(() => result.current.setContent("changed"));
    act(() => result.current.setSaveStatus("saving"));
    expect(result.current.state.saveStatus).toBe("saving");
    expect(result.current.state.isDirty).toBe(true);
  });

  it("setSaveStatus('saved') clears dirty", () => {
    const { result } = renderHook(() => useFileState(createMockRpc()));

    act(() => result.current.setContent("changed"));
    expect(result.current.state.isDirty).toBe(true);

    act(() => result.current.setSaveStatus("saved"));
    expect(result.current.state.saveStatus).toBe("saved");
    expect(result.current.state.isDirty).toBe(false);
  });

  it("setSaveStatus('error') keeps dirty", () => {
    const { result } = renderHook(() => useFileState(createMockRpc()));

    act(() => result.current.setContent("changed"));
    act(() => result.current.setSaveStatus("error"));
    expect(result.current.state.saveStatus).toBe("error");
    expect(result.current.state.isDirty).toBe(true);
  });

  it("persists filePath and content to localStorage", () => {
    const { result } = renderHook(() => useFileState(createMockRpc()));

    act(() => result.current.setFile("/test.md", "content"));

    const stored = JSON.parse(localStorage.getItem("obsidian-todos-file-state")!);
    expect(stored).toEqual({ filePath: "/test.md", content: "content" });
  });

  it("restores state from localStorage on re-mount", () => {
    localStorage.setItem(
      "obsidian-todos-file-state",
      JSON.stringify({ filePath: "/saved.md", content: "saved content" }),
    );

    const { result } = renderHook(() => useFileState(createMockRpc()));
    expect(result.current.state.filePath).toBe("/saved.md");
    expect(result.current.state.content).toBe("saved content");
    expect(result.current.state.isDirty).toBe(false);
    expect(result.current.state.saveStatus).toBe("idle");
  });

  it("re-reads file from disk on mount when isElectrobun and has persisted path", async () => {
    localStorage.setItem(
      "obsidian-todos-file-state",
      JSON.stringify({ filePath: "/file.md", content: "stale" }),
    );

    const readFile = vi.fn(async () => "fresh from disk");
    const rpc = createMockRpc({ isElectrobun: true, readFile });

    const { result } = renderHook(() => useFileState(rpc));

    await vi.waitFor(() => {
      expect(readFile).toHaveBeenCalledWith("/file.md");
    });

    await vi.waitFor(() => {
      expect(result.current.state.content).toBe("fresh from disk");
    });
  });
});
