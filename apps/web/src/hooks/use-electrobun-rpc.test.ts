import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const stubs = vi.hoisted(() => {
  const defineRPCSpy = vi.fn();
  const electroviewCtorSpy = vi.fn();
  return { defineRPCSpy, electroviewCtorSpy };
});

vi.mock("electrobun/view", () => {
  class FakeElectroview {
    constructor(_config: unknown) {
      stubs.electroviewCtorSpy();
    }
    static defineRPC(_config: unknown) {
      stubs.defineRPCSpy();
      return {
        request: new Proxy(
          {},
          {
            get: () => () => Promise.resolve(null),
          },
        ),
        send: new Proxy(
          {},
          {
            get: () => () => {},
          },
        ),
        setTransport: () => {},
        addMessageListener: () => {},
        removeMessageListener: () => {},
      };
    }
  }
  return { Electroview: FakeElectroview };
});

let useElectrobunRpc: typeof import("./use-electrobun-rpc").useElectrobunRpc;

describe("useElectrobunRpc", () => {
  afterEach(() => {
    vi.resetModules();
    delete (window as any).__electrobunWebviewId;
    stubs.defineRPCSpy.mockClear();
    stubs.electroviewCtorSpy.mockClear();
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

  it("concurrent rpc calls share a single Electroview instance", async () => {
    // Bug: each concurrent call to initElectroview() creates its own Electroview,
    // so request ids collide across instances and responses resolve the wrong promise
    // (e.g. getConfig() resolves with readFile()'s payload).
    //
    // In this test environment the symptom is even more visible: only the first
    // concurrent in-flight import resolves to the mocked Electroview; the rest
    // resolve to the real Electroview which then throws in its ctor (no live
    // bun socket). With the bug, three of the four wrappers therefore see
    // `rpc === null` and fall back to defaults. With the fix, all wrappers
    // share a single mocked rpc and receive the mock's null payloads.
    (window as any).__electrobunWebviewId = 1;

    const mod = await import("./use-electrobun-rpc");
    const { result } = renderHook(() => mod.useElectrobunRpc());

    const [readResult, configResult, saveResult] = await Promise.all([
      result.current.readFile("/a.md"),
      result.current.getConfig(),
      result.current.saveFile("/a.md", "x"),
    ]);

    expect(readResult).toBeNull();
    expect(configResult).toBeNull();
    expect(saveResult).toBeNull();
    expect(stubs.defineRPCSpy).toHaveBeenCalledTimes(1);
    expect(stubs.electroviewCtorSpy).toHaveBeenCalledTimes(1);
  });
});
