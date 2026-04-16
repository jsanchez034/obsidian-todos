const MAX_RECENT_FILES = 3;

export interface AppState {
  recentFiles: string[];
}

const DEFAULT_STATE: AppState = { recentFiles: [] };

export async function loadState(statePath: string): Promise<AppState> {
  try {
    const text = await Bun.file(statePath).text();
    return { ...DEFAULT_STATE, ...JSON.parse(text) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveState(statePath: string, state: AppState): Promise<void> {
  await Bun.write(statePath, JSON.stringify(state, null, 2) + "\n");
}

export async function trackRecentFile(statePath: string, filePath: string): Promise<void> {
  const state = await loadState(statePath);
  const filtered = state.recentFiles.filter((p) => p !== filePath);
  state.recentFiles = [filePath, ...filtered].slice(0, MAX_RECENT_FILES);
  await saveState(statePath, state);
}

export async function removeRecentFile(statePath: string, filePath: string): Promise<void> {
  const state = await loadState(statePath);
  state.recentFiles = state.recentFiles.filter((p) => p !== filePath);
  await saveState(statePath, state);
}
