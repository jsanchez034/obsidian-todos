import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// We need to reset module state between tests since the module has global state
let useElectrobunRpc: typeof import("./use-electrobun-rpc").useElectrobunRpc;

describe("useElectrobunRpc", () => {
  afterEach(() => {
    vi.resetModules();
    // Clean up electrobun marker if set
    delete (window as any).__electrobunWebviewId;
  });

  async function loadModule() {
    const mod = await import("./use-electrobun-rpc");
    useElectrobunRpc = mod.useElectrobunRpc;
  }

  it("returns mock client when not in Electrobun", async () => {
    await loadModule();
    const { result } = renderHook(() => useElectrobunRpc());
    expect(result.current.isElectrobun).toBe(false);
  });

  it("mock openFile returns null", async () => {
    await loadModule();
    const { result } = renderHook(() => useElectrobunRpc());
    const file = await result.current.openFile();
    expect(file).toBeNull();
  });

  it("mock readFile returns empty string", async () => {
    await loadModule();
    const { result } = renderHook(() => useElectrobunRpc());
    const content = await result.current.readFile("/any/path.md");
    expect(content).toBe("");
  });

  it("mock saveFile returns false", async () => {
    await loadModule();
    const { result } = renderHook(() => useElectrobunRpc());
    const saved = await result.current.saveFile("/path.md", "content");
    expect(saved).toBe(false);
  });

  it("subscribe returns an unsubscribe function", async () => {
    await loadModule();
    const { result } = renderHook(() => useElectrobunRpc());
    const callback = vi.fn();
    const unsubscribe = result.current.subscribe("fileOpened", callback);
    expect(typeof unsubscribe).toBe("function");
  });
});
