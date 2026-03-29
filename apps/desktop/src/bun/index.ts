import { watch, type FSWatcher } from "fs";
import {
  ApplicationMenu,
  BrowserView,
  BrowserWindow,
  ContextMenu,
  Screen,
  Tray,
  Utils,
} from "electrobun/bun";
import type { AppRPCSchema } from "../../web/src/lib/rpc-schema";

// Hide dock icon — this is a menu bar-only app
Utils.setDockIconVisible(false);

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
          popupWindow.webview.rpc.send.fileChanged({ path: filePath, content });
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
          popupWindow?.webview.rpc.send.fileOpened(pendingFile);
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
let popupWindow: BrowserWindow | null = null;

function showPopup() {
  if (popupWindow) {
    popupWindow.setAlwaysOnTop(true);
    popupWindow.show();
    popupWindow.webview.rpc.send.windowShown({});
    return;
  }

  const bounds = tray.getBounds();
  const display = Screen.getPrimaryDisplay();
  const workArea = display.workArea;
  const popupWidth = 400;
  const popupHeight = 600;

  let x: number;
  let y: number;

  if (bounds.x === 0 && bounds.y === 0 && bounds.width === 0) {
    x = workArea.x + workArea.width - popupWidth - 10;
    y = workArea.y;
  } else {
    x = Math.round(bounds.x + bounds.width / 2 - popupWidth / 2);
    y = bounds.y + bounds.height + 4;
  }

  x = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - popupWidth));
  y = Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - popupHeight));

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
}

function hidePopup() {
  if (popupWindow) {
    if (popupWindow?.isAlwaysOnTop()) {
      popupWindow.setAlwaysOnTop(false);
    }
    popupWindow.minimize();
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
  const content = await Bun.file(filePath).text();
  hasFileLoaded = true;
  startWatching(filePath);

  const fileData = { path: filePath, content };
  const windowAlreadyExists = popupWindow !== null;

  if (windowAlreadyExists) {
    showPopup();
    popupWindow!.webview.rpc.send.fileOpened(fileData);
  } else {
    // Window doesn't exist yet — store pending file and create window
    // The webview will send webviewReady once mounted, triggering the pending file send
    pendingFile = fileData;
    showPopup();
  }
}

function showTrayContextMenu() {
  ContextMenu.showContextMenu([
    { type: "normal", label: "Open File...", action: "open-file" },
    { type: "separator" },
    { type: "normal", label: "Quit", action: "quit" },
  ]);
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

  // Regular icon click (no action)
  if (!action) {
    // Left-click behavior depends on state
    if (hasFileLoaded) {
      // Toggle popup
      if (!popupWindow?.isMinimized()) {
        hidePopup();
      } else {
        showPopup();
      }
    }

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

console.log("Obsidian Todos menu bar app started.");
