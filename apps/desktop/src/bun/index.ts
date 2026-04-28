import { watch, type FSWatcher } from "fs";
import { basename, join } from "path";
import {
  ApplicationMenu,
  BrowserView,
  BrowserWindow,
  ContextMenu,
  GlobalShortcut,
  Screen,
  Tray,
  Utils,
} from "electrobun/bun";
import type { AppRPCSchema } from "../../../web/src/lib/rpc-schema";
import { alwaysOnTopSequence } from "./lib/always-on-top-sequence";
import { loadConfig, ensureConfig } from "./lib/config";
import { loadState, removeRecentFile, trackRecentFile } from "./lib/state";
import { decideToggleAction } from "./lib/toggle-decision";
import { calculatePopupPosition } from "./lib/window-position";
import { isValidFrameInput } from "./lib/window-rpc-validators";

const POPUP_WIDTH = 400;
const POPUP_HEIGHT = 600;

interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Compute the current anchor frame (where Restore should send the window).
// Recomputed on each call so tray repositioning is picked up automatically.
function computeAnchorFrame(): Frame {
  const bounds = tray.getBounds();
  const workArea = Screen.getPrimaryDisplay().workArea;
  const { x, y } = calculatePopupPosition(bounds, workArea, POPUP_WIDTH, POPUP_HEIGHT);
  return { x, y, width: POPUP_WIDTH, height: POPUP_HEIGHT };
}

// Apply the alwaysOnTop sequence around a frame change. Order matters:
// disabling before zooming up prevents a frame above full-screen apps;
// enabling after zooming down avoids a flash above other windows.
function applyAlwaysOnTopSequence(target: Frame, apply: () => void) {
  const seq = alwaysOnTopSequence(target, computeAnchorFrame());
  if (seq.before === "off" && popupWindow) popupWindow.setAlwaysOnTop(false);
  apply();
  if (seq.after === "on" && popupWindow) popupWindow.setAlwaysOnTop(true);
}

// Hide dock icon — this is a menu bar-only app
Utils.setDockIconVisible(false);

// --- Config ---
function getConfigDir(): string {
  try {
    return Utils.paths.userData;
  } catch {
    // In dev mode, version.json doesn't exist so userData throws.
    // Fall back to ~/Library/Application Support/obsidian-todos
    return join(Utils.paths.appData, "obsidian-todos");
  }
}
const CONFIG_DIR = getConfigDir();
const CONFIG_PATH = join(CONFIG_DIR, "config.json");
const STATE_PATH = join(CONFIG_DIR, "state.json");

// Path of the currently open file, or null if none. Persists across popup
// window lifecycles — hiding the popup destroys the window, but we keep the
// path so re-showing can re-hydrate the fresh webview.
let currentFilePath: string | null = null;

// Pending file to send to webview once it signals ready
let pendingFile: { path: string; content: string } | null = null;

// File watching state
let currentWatcher: FSWatcher | null = null;
let selfSaving = false;
let watchDebounce: ReturnType<typeof setTimeout> | null = null;

function startWatching(filePath: string) {
  if (currentWatcher) {
    currentWatcher.close();
    currentWatcher = null;
  }

  currentWatcher = watch(filePath, { persistent: false }, (_eventType) => {
    if (selfSaving) return;
    if (watchDebounce) clearTimeout(watchDebounce);
    watchDebounce = setTimeout(async () => {
      try {
        const content = await Bun.file(filePath).text();
        if (popupWindow) {
          popupWindow.webview.rpc!.send.fileChanged({ path: filePath, content });
        }
      } catch {
        // File may be temporarily unavailable during write
      }
    }, 300);
  });
}

// Define RPC handlers for file operations
const rpc = BrowserView.defineRPC<AppRPCSchema>({
  handlers: {
    requests: {
      openFile: async () => {
        const paths = await Utils.openFileDialog({
          startingFolder: "~/",
          allowedFileTypes: "md",
          canChooseFiles: true,
          canChooseDirectory: false,
          allowsMultipleSelection: false,
        });
        if (!paths || paths.length === 0) return null;
        const filePath = paths[0]!;
        const content = await Bun.file(filePath).text();
        currentFilePath = filePath;
        startWatching(filePath);
        return { path: filePath, content };
      },
      readFile: async ({ path }: { path: string }) => {
        return await Bun.file(path).text();
      },
      saveFile: async ({ path, content }: { path: string; content: string }) => {
        try {
          selfSaving = true;
          await Bun.write(path, content);
          setTimeout(() => {
            selfSaving = false;
          }, 500);
          return true;
        } catch {
          selfSaving = false;
          return false;
        }
      },
      getConfig: async () => {
        const config = await loadConfig(CONFIG_PATH);
        return { theme: config.theme, scanlines: config.scanlines };
      },
      closeWindow: async () => {
        if (!popupWindow) return false;
        hidePopup();
        return true;
      },
      setWindowFrame: async (params: unknown) => {
        if (!isValidFrameInput(params)) return false;
        if (!popupWindow) return false;
        const target: Frame = {
          x: params.x,
          y: params.y,
          width: params.width,
          height: params.height,
        };
        applyAlwaysOnTopSequence(target, () => {
          popupWindow?.setFrame(target.x, target.y, target.width, target.height);
        });
        return true;
      },
      setWindowFullScreen: async ({ value }: { value: boolean }) => {
        if (typeof value !== "boolean") return false;
        if (!popupWindow) return false;
        if (value) {
          // Resizable:false prevents native macOS fullscreen — use frame-based
          // pseudo-fullscreen covering the full display bounds instead.
          popupWindow.setAlwaysOnTop(false);
          const { bounds } = Screen.getPrimaryDisplay();
          popupWindow.setFrame(bounds.x, bounds.y, bounds.width, bounds.height);
        } else {
          const anchor = computeAnchorFrame();
          applyAlwaysOnTopSequence(anchor, () => {
            popupWindow?.setFrame(anchor.x, anchor.y, anchor.width, anchor.height);
          });
        }
        return true;
      },
      restoreWindow: async () => {
        if (!popupWindow) return false;
        const anchor = computeAnchorFrame();
        applyAlwaysOnTopSequence(anchor, () => {
          popupWindow?.setFrame(anchor.x, anchor.y, anchor.width, anchor.height);
        });
        return true;
      },
      getDisplayWorkArea: async () => {
        return Screen.getPrimaryDisplay().workArea;
      },
    },
    messages: {
      webviewReady: async () => {
        if (pendingFile) {
          popupWindow?.webview.rpc!.send.fileOpened(pendingFile);
          pendingFile = null;
          return;
        }
        // Fresh window after hotkey/tray-click show — re-hydrate from disk
        if (currentFilePath) {
          try {
            const content = await Bun.file(currentFilePath).text();
            popupWindow?.webview.rpc!.send.fileOpened({ path: currentFilePath, content });
          } catch {
            // File may have been deleted externally — leave editor empty
          }
        }
      },
    },
  },
});

// Create tray icon — no menu attached (we handle clicks manually)
const tray = new Tray({
  title: "",
  image: "views://assets/tray-icon-Template.png",
  template: true,
  width: 22,
  height: 22,
});

// Popup window management.
//
// The popup is destroyed on hide (via the global hotkey) rather than minimized.
// This releases OS-level focus immediately so the global hotkey fires on the
// next press — minimize keeps focus during its animation, which caused
// WKWebView to swallow Cmd+Shift+G as "Find Previous" (beep) and the global
// shortcut never fired.
//
// Click-away (loss of OS focus) does NOT close the popup — the user can focus
// other apps and return to the popup intact. The global hotkey still toggles
// destroy/focus/show via `decideToggleAction`.
let popupWindow: BrowserWindow<typeof rpc> | null = null;
let isPopupFocused = false;

function showPopup() {
  if (popupWindow) {
    popupWindow.show();
    return;
  }

  const bounds = tray.getBounds();
  const display = Screen.getPrimaryDisplay();
  const workArea = display.workArea;

  const { x, y } = calculatePopupPosition(bounds, workArea, POPUP_WIDTH, POPUP_HEIGHT);

  popupWindow = new BrowserWindow({
    title: "obsidian-todos",
    url: "views://popup/index.html",
    frame: { width: POPUP_WIDTH, height: POPUP_HEIGHT, x, y },
    styleMask: {
      Borderless: true,
      Titled: false,
      Closable: false,
      Resizable: false,
      Miniaturizable: true,
    },
    rpc,
  });

  popupWindow.setAlwaysOnTop(true);
  popupWindow.on("close", () => {
    popupWindow = null;
    isPopupFocused = false;
  });
  popupWindow.on("focus", () => {
    isPopupFocused = true;
  });
  popupWindow.on("blur", () => {
    isPopupFocused = false;
  });
}

function hidePopup() {
  if (!popupWindow) return;
  const w = popupWindow;
  popupWindow = null;
  w.close();
}

// Open a file by its path — shared by tray menu "Open File..." and recent file clicks
async function openFileByPath(filePath: string) {
  const content = await Bun.file(filePath).text();
  currentFilePath = filePath;
  startWatching(filePath);

  const fileData = { path: filePath, content };

  if (popupWindow) {
    popupWindow.webview.rpc!.send.fileOpened(fileData);
    popupWindow.show();
  } else {
    // Window doesn't exist yet — store pending file and create window.
    // The webview will send webviewReady once mounted, triggering the pending file send.
    pendingFile = fileData;
    showPopup();
  }
}

// Open file dialog directly from the main process (for tray menu "Open File...")
async function openFileFromTray() {
  const paths = await Utils.openFileDialog({
    startingFolder: "~/",
    allowedFileTypes: "md",
    canChooseFiles: true,
    canChooseDirectory: false,
    allowsMultipleSelection: false,
  });
  if (!paths || paths.length === 0) return;
  const filePath = paths[0]!;
  await trackRecentFile(STATE_PATH, filePath);
  await openFileByPath(filePath);
}

// Open a recent file, handling missing files with a notification
async function openRecentFile(filePath: string) {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    await removeRecentFile(STATE_PATH, filePath);
    Utils.showNotification({
      title: "File not found",
      body: `${basename(filePath)} has been removed from recent files.`,
      silent: true,
    });
    return;
  }
  await trackRecentFile(STATE_PATH, filePath);
  await openFileByPath(filePath);
}

function togglePopup() {
  const action = decideToggleAction({
    exists: popupWindow !== null,
    focused: isPopupFocused,
    hasCurrentFile: currentFilePath !== null,
  });
  switch (action) {
    case "hide":
      hidePopup();
      break;
    case "focus":
      popupWindow?.focus();
      break;
    case "show":
      showPopup();
      break;
    case "show-tray-menu":
      showTrayContextMenu();
      break;
  }
}

async function showTrayContextMenu() {
  const state = await loadState(STATE_PATH);
  const menuItems: any[] = [{ type: "normal", label: "Open File...", action: "open-file" }];

  if (state.recentFiles.length > 0) {
    menuItems.push({ type: "separator" });
    menuItems.push({
      type: "normal",
      label: "Recent",
      submenu: state.recentFiles.map((filePath) => ({
        type: "normal",
        label: basename(filePath),
        action: "open-recent",
        data: { path: filePath },
      })),
    });
  }

  menuItems.push({ type: "separator" });
  menuItems.push({ type: "normal", label: "Preferences...", action: "preferences" });
  menuItems.push({ type: "separator" });
  menuItems.push({ type: "normal", label: "Quit", action: "quit" });

  ContextMenu.showContextMenu(menuItems);
}

// Handle context menu item clicks
ContextMenu.on("context-menu-clicked", (event: any) => {
  const action = event?.data?.action ?? "";
  if (action === "quit") {
    hidePopup();
    process.exit(0);
  }
  if (action === "open-file") {
    openFileFromTray();
  }
  if (action === "open-recent") {
    const filePath = event?.data?.data?.path;
    if (filePath) openRecentFile(filePath);
  }
  if (action === "preferences") {
    Bun.spawn(["open", CONFIG_PATH]);
  }
});

// Handle tray icon clicks
tray.on("tray-clicked", (event: any) => {
  const action = event?.data?.action ?? "";

  // If this is a menu item action (from tray.setMenu), handle it
  if (action === "quit") {
    hidePopup();
    process.exit(0);
  }
  if (action === "open-file") {
    openFileFromTray();
    return;
  }
  if (action === "open-recent") {
    const filePath = event?.data?.data?.path;
    if (filePath) openRecentFile(filePath);
    return;
  }
  if (action === "preferences") {
    Bun.spawn(["open", CONFIG_PATH]);
    return;
  }

  // Regular icon click (no action) — show context menu
  if (!action) {
    showTrayContextMenu();
  }
});

// The hotkey is bound twice: as a global shortcut (fires when app is inactive)
// and as the App menu's Hide accelerator. Menu accelerators are dispatched by
// AppKit before the key event reaches the focused webview, so pressing the
// hotkey while the popup is focused:
//   (a) doesn't beep (menu intercepts before WKWebView's Find Previous), and
//   (b) synchronously calls NSApp hide:, deactivating the app so the next
//       press fires the global shortcut instead of racing with close timing.
function setApplicationMenuWithHotkey(hotkey: string) {
  ApplicationMenu.setApplicationMenu([
    {
      submenu: [
        { label: "Hide", role: "hide", accelerator: hotkey },
        { type: "separator" },
        { label: "Quit", role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
  ]);
}

// --- Global hotkey setup ---
let currentHotkey: string | null = null;

async function registerHotkey() {
  const config = await loadConfig(CONFIG_PATH);
  const hotkey = config.hotkey;

  if (currentHotkey) {
    GlobalShortcut.unregister(currentHotkey);
    currentHotkey = null;
  }

  const registered = GlobalShortcut.register(hotkey, () => {
    togglePopup();
  });
  if (registered) {
    currentHotkey = hotkey;
    console.log(`Global shortcut registered: ${hotkey}`);
  } else {
    console.error(`Failed to register global shortcut: ${hotkey}`);
  }

  setApplicationMenuWithHotkey(hotkey);
}

// Initialize config and hotkey
await ensureConfig(CONFIG_DIR, CONFIG_PATH);
await registerHotkey();

// Watch config file for live hotkey and theme changes
let configDebounce: ReturnType<typeof setTimeout> | null = null;
watch(CONFIG_PATH, { persistent: false }, () => {
  if (configDebounce) clearTimeout(configDebounce);
  configDebounce = setTimeout(async () => {
    registerHotkey();
    const config = await loadConfig(CONFIG_PATH);
    if (popupWindow) {
      popupWindow.webview.rpc!.send.configChanged({
        theme: config.theme,
        scanlines: config.scanlines,
      });
    }
  }, 300);
});

console.log("Obsidian Todos menu bar app started.");
