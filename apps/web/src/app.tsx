import { useCallback, useEffect, useRef, useState } from "react";

import { Toaster } from "@obsidian-todos/ui/components/sonner";

import { FileToolbar } from "@/components/file-toolbar";
import { MarkdownEditor, type MarkdownEditorMethods } from "@/components/markdown-editor";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { useElectrobunRpc } from "@/hooks/use-electrobun-rpc";
import { type FileState, useFileState } from "@/hooks/use-file-state";

function AppContent() {
  const rpc = useElectrobunRpc();
  const { theme, setTheme } = useTheme();
  const { state, setFile, setContent, setSaveStatus } = useFileState(rpc);
  const [scanlines, setScanlines] = useState(false);
  const editorRef = useRef<MarkdownEditorMethods>(null);

  // Use refs to always have the latest values in async callbacks
  const stateRef = useRef<FileState>(state);
  stateRef.current = state;

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSave = useCallback(async () => {
    const current = stateRef.current;
    if (!current.filePath || !current.isDirty) return;
    setSaveStatus("saving");
    const ok = await rpc.saveFile(current.filePath, current.content);
    setSaveStatus(ok ? "saved" : "error");
  }, [rpc, setSaveStatus]);

  const debounceSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => performSave(), 1500);
  }, [performSave]);

  const handleContentChange = useCallback(
    (content: string) => {
      setContent(content);
      debounceSave();
    },
    [setContent, debounceSave],
  );

  // Cmd+S / Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        performSave();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [performSave]);

  // Load config from desktop on mount — applies theme default and scanlines
  useEffect(() => {
    rpc.getConfig().then((config) => {
      if (config.theme !== undefined) setTheme(config.theme);
      setScanlines(config.scanlines ?? false);
    });
  }, [rpc, setScanlines, setTheme]);

  // Subscribe to live config changes from desktop
  useEffect(() => {
    return rpc.subscribe("configChanged", (data: { theme?: string; scanlines: boolean }) => {
      if (data.theme !== undefined) setTheme(data.theme);
      setScanlines(data.scanlines ?? false);
    });
  }, [rpc, setScanlines, setTheme]);

  // Subscribe to file opened from tray menu
  useEffect(() => {
    return rpc.subscribe("fileOpened", (data: { path: string; content: string }) => {
      setFile(data.path, data.content);
      editorRef.current?.setMarkdown(data.content);
    });
  }, [rpc, setFile]);

  // Subscribe to external file changes
  useEffect(() => {
    return rpc.subscribe("fileChanged", (data: { path: string; content: string }) => {
      if (!stateRef.current.isDirty) {
        setFile(data.path, data.content);
        editorRef.current?.setMarkdown(data.content);
      }
    });
  }, [rpc, setFile]);

  const isNasa = theme === "nasa";

  const emptyState = isNasa ? (
    <div className="flex h-full flex-col items-center justify-center gap-2 font-mono">
      <p className="text-sm tracking-widest text-primary">MISSION CONTROL — AWAITING INPUT</p>
      <p className="text-xs text-muted-foreground">&gt; Open a file from the tray menu</p>
      <p className="text-xs text-muted-foreground">&gt; to begin transmission</p>
    </div>
  ) : (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <p>Open a file from the tray icon menu</p>
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <FileToolbar filePath={state.filePath} saveStatus={state.saveStatus} />
      <div
        className={`relative flex-1 overflow-y-auto${isNasa ? " nasa-editor-container" : ""}`}
        data-scanlines={String(scanlines)}
      >
        {!state.filePath ? (
          emptyState
        ) : (
          <MarkdownEditor
            ref={editorRef}
            content={state.content}
            onContentChange={handleContentChange}
          />
        )}
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="obsidian-todos-theme">
      <AppContent />
      <Toaster />
    </ThemeProvider>
  );
}
