import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RpcClient } from "@/hooks/use-electrobun-rpc";

// Mock MDXEditor — it requires a full browser layout engine
vi.mock("@mdxeditor/editor", () => ({
  MDXEditor: ({ onChange, markdown }: { onChange?: (v: string) => void; markdown: string }) => (
    <textarea
      data-testid="mock-editor"
      value={markdown}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
  headingsPlugin: () => ({}),
  listsPlugin: () => ({}),
  markdownShortcutPlugin: () => ({}),
  diffSourcePlugin: () => ({}),
  toolbarPlugin: () => ({}),
  BoldItalicUnderlineToggles: () => null,
  ListsToggle: () => null,
  DiffSourceToggleWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Separator: () => null,
}));

// Mock sonner Toaster
vi.mock("@obsidian-todos/ui/components/sonner", () => ({
  Toaster: () => null,
}));

// Track subscribe callbacks so we can emit events in tests
let subscriptions: Map<string, Set<(data: any) => void>>;
let mockRpc: RpcClient;

vi.mock("@/hooks/use-electrobun-rpc", () => ({
  useElectrobunRpc: () => mockRpc,
}));

function emitRpcEvent(event: string, data: any) {
  const cbs = subscriptions.get(event);
  if (cbs) {
    for (const cb of cbs) cb(data);
  }
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  subscriptions = new Map();

  mockRpc = {
    openFile: vi.fn(async () => null),
    readFile: vi.fn(async () => ""),
    saveFile: vi.fn(async () => true),
    subscribe: vi.fn((event: string, callback: (data: any) => void) => {
      if (!subscriptions.has(event)) subscriptions.set(event, new Set());
      subscriptions.get(event)!.add(callback);
      return () => subscriptions.get(event)?.delete(callback);
    }),
    isElectrobun: false,
  };
});

afterEach(() => {
  vi.useRealTimers();
});

// Dynamic import so mocks are applied before module loads
async function renderApp() {
  const { App } = await import("@/app");
  return render(<App />);
}

describe("App save flow", () => {
  it("shows placeholder when no file is open", async () => {
    await renderApp();
    expect(screen.getByText("Open a file from the tray icon menu")).toBeInTheDocument();
  });

  it("shows editor when file is opened via RPC event", async () => {
    await renderApp();

    act(() => {
      emitRpcEvent("fileOpened", { path: "/test.md", content: "# Hello" });
    });

    expect(screen.getByTestId("mock-editor")).toBeInTheDocument();
    expect(screen.getByText("test.md")).toBeInTheDocument();
  });

  it("debounced auto-save fires after 1500ms on content change", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderApp();

    act(() => {
      emitRpcEvent("fileOpened", { path: "/test.md", content: "original" });
    });

    const editor = screen.getByTestId("mock-editor");
    await user.clear(editor);
    await user.type(editor, "updated content");

    // Save should not have been called yet
    expect(mockRpc.saveFile).not.toHaveBeenCalled();

    // Advance past the 1500ms debounce
    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    expect(mockRpc.saveFile).toHaveBeenCalledWith("/test.md", "updated content");
  });

  it("Cmd+S triggers immediate save", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderApp();

    act(() => {
      emitRpcEvent("fileOpened", { path: "/test.md", content: "original" });
    });

    // Change content to make it dirty
    const editor = screen.getByTestId("mock-editor");
    await user.clear(editor);
    await user.type(editor, "changed");

    // Cmd+S
    await user.keyboard("{Meta>}s{/Meta}");

    expect(mockRpc.saveFile).toHaveBeenCalledWith("/test.md", "changed");
  });

  it("external file change updates content when not dirty", async () => {
    await renderApp();

    act(() => {
      emitRpcEvent("fileOpened", { path: "/test.md", content: "original" });
    });

    act(() => {
      emitRpcEvent("fileChanged", { path: "/test.md", content: "external update" });
    });

    expect((screen.getByTestId("mock-editor") as HTMLTextAreaElement).value).toBe(
      "external update",
    );
  });

  it("external file change is ignored when dirty", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderApp();

    act(() => {
      emitRpcEvent("fileOpened", { path: "/test.md", content: "original" });
    });

    // Make dirty
    const editor = screen.getByTestId("mock-editor");
    await user.clear(editor);
    await user.type(editor, "my unsaved changes");

    // External change should be ignored
    act(() => {
      emitRpcEvent("fileChanged", { path: "/test.md", content: "external update" });
    });

    expect((screen.getByTestId("mock-editor") as HTMLTextAreaElement).value).toBe(
      "my unsaved changes",
    );
  });
});
