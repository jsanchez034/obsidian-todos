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
import { loadConfig, ensureConfig } from "./lib/config";
import { loadState, removeRecentFile, trackRecentFile } from "./lib/state";
import { calculatePopupPosition } from "./lib/window-position";

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

// Track whether a file has been opened (so we know if popup toggle makes sense)
let hasFileLoaded = false;

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
        hasFileLoaded = true;
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
    },
    messages: {
      webviewReady: () => {
        if (pendingFile) {
          popupWindow?.webview.rpc!.send.fileOpened(pendingFile);
          pendingFile = null;
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

// Popup window management
let popupWindow: BrowserWindow<typeof rpc> | null = null;

function showPopup() {
  if (popupWindow) {
    popupWindow.setAlwaysOnTop(true);
    popupWindow.show();
    popupWindow.webview.rpc!.send.windowShown({});
    return;
  }

  const bounds = tray.getBounds();
  const display = Screen.getPrimaryDisplay();
  const workArea = display.workArea;
  const popupWidth = 400;
  const popupHeight = 600;

  const { x, y } = calculatePopupPosition(bounds, workArea, popupWidth, popupHeight);

  popupWindow = new BrowserWindow({
    title: "obsidian-todos",
    url: "views://popup/index.html",
    frame: { width: popupWidth, height: popupHeight, x, y },
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
    if (popupWindow?.isAlwaysOnTop()) {
      popupWindow.setAlwaysOnTop(false);
    }
    popupWindow?.minimize();
  });
  popupWindow.on("blur", () => {
    hidePopup();
  });
}

function hidePopup() {
  if (popupWindow) {
    if (popupWindow?.isAlwaysOnTop()) {
      popupWindow.setAlwaysOnTop(false);
    }
    popupWindow.minimize();
  }
}

// Open a file by its path — shared by tray menu "Open File..." and recent file clicks
async function openFileByPath(filePath: string) {
  const content = await Bun.file(filePath).text();
  hasFileLoaded = true;
  startWatching(filePath);

  const fileData = { path: filePath, content };
  const windowAlreadyExists = popupWindow !== null;

  if (windowAlreadyExists) {
    showPopup();
    popupWindow!.webview.rpc!.send.fileOpened(fileData);
  } else {
    // Window doesn't exist yet — store pending file and create window
    // The webview will send webviewReady once mounted, triggering the pending file send
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
  if (hasFileLoaded && popupWindow && !popupWindow.isMinimized()) {
    hidePopup();
  } else if (hasFileLoaded) {
    showPopup();
  } else {
    showTrayContextMenu();
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

// App menu for keyboard shortcuts
ApplicationMenu.setApplicationMenu([
  {
    submenu: [{ label: "Quit", role: "quit" }],
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

// --- Global hotkey setup ---
let currentHotkey: string | null = null;

async function registerHotkey() {
  const config = await loadConfig(CONFIG_PATH);
  const hotkey = config.hotkey;

  if (currentHotkey) {
    GlobalShortcut.unregister(currentHotkey);
    currentHotkey = null;
  }

  const registered = GlobalShortcut.register(hotkey, togglePopup);
  if (registered) {
    currentHotkey = hotkey;
    console.log(`Global shortcut registered: ${hotkey}`);
  } else {
    console.error(`Failed to register global shortcut: ${hotkey}`);
  }
}

// Initialize config and hotkey
await ensureConfig(CONFIG_DIR, CONFIG_PATH);
await registerHotkey();

// Watch config file for live hotkey changes
let configDebounce: ReturnType<typeof setTimeout> | null = null;
watch(CONFIG_PATH, { persistent: false }, () => {
  if (configDebounce) clearTimeout(configDebounce);
  configDebounce = setTimeout(() => {
    registerHotkey();
  }, 300);
});

console.log("Obsidian Todos menu bar app started.");
