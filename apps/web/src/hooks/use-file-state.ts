import { useCallback, useEffect, useState } from "react";

import type { RpcClient } from "./use-electrobun-rpc";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface FileState {
  filePath: string | null;
  content: string;
  isDirty: boolean;
  saveStatus: SaveStatus;
}

const STORAGE_KEY = "obsidian-todos-file-state";

function loadPersistedState(): Partial<FileState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        filePath: parsed.filePath ?? null,
        content: parsed.content ?? "",
      };
    }
  } catch {
    // ignore
  }
  return {};
}

function persistState(state: FileState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        filePath: state.filePath,
        content: state.content,
      }),
    );
  } catch {
    // ignore
  }
}

export function useFileState(rpc: RpcClient) {
  const [state, setState] = useState<FileState>(() => {
    const persisted = loadPersistedState();
    return {
      filePath: persisted.filePath ?? null,
      content: persisted.content ?? "",
      isDirty: false,
      saveStatus: "idle" as SaveStatus,
    };
  });

  // On mount, re-read file from disk if we have a persisted path
  useEffect(() => {
    if (state.filePath && rpc.isElectrobun) {
      rpc.readFile(state.filePath).then((content) => {
        if (content) {
          setState((prev) => ({ ...prev, content, isDirty: false }));
        }
      });
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state changes
  useEffect(() => {
    persistState(state);
  }, [state]);

  const setFile = useCallback((filePath: string, content: string) => {
    setState((prev) => ({
      ...prev,
      filePath,
      content,
      isDirty: false,
      saveStatus: "idle",
    }));
  }, []);

  const setContent = useCallback((content: string) => {
    setState((prev) => ({ ...prev, content, isDirty: true, saveStatus: "idle" }));
  }, []);

  const setSaveStatus = useCallback((saveStatus: SaveStatus) => {
    setState((prev) => ({
      ...prev,
      saveStatus,
      isDirty: saveStatus === "saved" ? false : prev.isDirty,
    }));
  }, []);

  return { state, setFile, setContent, setSaveStatus };
}
