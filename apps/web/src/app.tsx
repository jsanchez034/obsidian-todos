import { useCallback, useEffect, useRef } from "react";
import type { MDXEditorMethods } from "@mdxeditor/editor";

import { Toaster } from "@obsidian-todos/ui/components/sonner";

import { FileToolbar } from "@/components/file-toolbar";
import { MarkdownEditor } from "@/components/markdown-editor";
import { ThemeProvider } from "@/components/theme-provider";
import { useElectrobunRpc } from "@/hooks/use-electrobun-rpc";
import { useFileState } from "@/hooks/use-file-state";

export function App() {
  const rpc = useElectrobunRpc();
  const { state, setFile, setContent, setSaveStatus } = useFileState(rpc);
  const editorRef = useRef<MDXEditorMethods>(null);

  // Use refs to always have the latest values in async callbacks
  const stateRef = useRef(state);
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

  // Subscribe to window shown — re-read file from disk
  useEffect(() => {
    return rpc.subscribe("windowShown", async () => {
      const current = stateRef.current;
      if (current.filePath && rpc.isElectrobun && !current.isDirty) {
        const content = await rpc.readFile(current.filePath);
        if (content) {
          setFile(current.filePath, content);
          editorRef.current?.setMarkdown(content);
        }
      }
    });
  }, [rpc, setFile]);

  // Fallback: visibilitychange for when bun message arrives before webview is ready
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") {
        const current = stateRef.current;
        if (current.filePath && rpc.isElectrobun && !current.isDirty) {
          rpc.readFile(current.filePath).then((content) => {
            if (content) {
              setFile(current.filePath!, content);
              editorRef.current?.setMarkdown(content);
            }
          });
        }
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [rpc, setFile]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="obsidian-todos-theme">
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <FileToolbar filePath={state.filePath} saveStatus={state.saveStatus} />
        <div className="flex-1 overflow-auto">
          {!state.filePath ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>Open a file from the tray icon menu</p>
            </div>
          ) : (
            <MarkdownEditor
              ref={editorRef}
              content={state.content}
              onContentChange={handleContentChange}
            />
          )}
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
