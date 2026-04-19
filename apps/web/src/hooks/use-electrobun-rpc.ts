import { useMemo } from "react";
import type { AppRPCSchema, AppTheme } from "@/lib/rpc-schema";

export interface RpcClient {
  openFile: () => Promise<{ path: string; content: string } | null>;
  readFile: (path: string) => Promise<string>;
  saveFile: (path: string, content: string) => Promise<boolean>;
  getConfig: () => Promise<{ theme?: AppTheme; scanlines: boolean }>;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  isElectrobun: boolean;
}

// Module-level event emitter for RPC messages from bun
const listeners = new Map<string, Set<(data: any) => void>>();

function emit(event: string, data: any) {
  const set = listeners.get(event);
  if (set) {
    for (const cb of set) cb(data);
  }
}

function subscribe(event: string, callback: (data: any) => void): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(callback);
  return () => {
    listeners.get(event)?.delete(callback);
  };
}

// Lazy-init the Electroview connection once. An in-flight promise cache
// prevents concurrent callers from each constructing their own Electroview
// (which would give them disjoint request-id spaces and cause responses to
// resolve the wrong promise).
let electroviewInstance: any = null;
let rpcInstance: any = null;
let initPromise: Promise<any> | null = null;

function initElectroview(): Promise<any> {
  if (electroviewInstance) return Promise.resolve(rpcInstance);
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const { Electroview } = await import("electrobun/view");
      const rpc = Electroview.defineRPC<AppRPCSchema>({
        maxRequestTime: 120_000,
        handlers: {
          requests: {},
          messages: {
            fileOpened: (data: any) => emit("fileOpened", data),
            fileChanged: (data: any) => emit("fileChanged", data),
            windowShown: () => emit("windowShown", {}),
            configChanged: (data: any) => emit("configChanged", data),
          },
        },
      });
      electroviewInstance = new Electroview({ rpc });
      rpcInstance = rpc;

      // Signal to bun that webview is ready to receive messages
      rpc.send.webviewReady({});

      return rpc;
    } catch {
      initPromise = null;
      return null;
    }
  })();
  return initPromise;
}

function isInElectrobun(): boolean {
  return typeof window !== "undefined" && "__electrobunWebviewId" in window;
}

const mockRpc: RpcClient = {
  openFile: async () => {
    console.log("[mock] openFile called — not in Electrobun");
    return null;
  },
  readFile: async () => {
    console.log("[mock] readFile called — not in Electrobun");
    return "";
  },
  saveFile: async () => {
    console.log("[mock] saveFile called — not in Electrobun");
    return false;
  },
  getConfig: async () => {
    console.log("[mock] getConfig called — not in Electrobun");
    return { scanlines: true };
  },
  subscribe: () => () => {},
  isElectrobun: false,
};

function createElectrobunRpc(): RpcClient {
  // Eagerly init so message handlers are registered before any messages arrive
  initElectroview();

  return {
    openFile: async () => {
      const rpc = await initElectroview();
      if (!rpc) return null;
      return rpc.request.openFile();
    },
    readFile: async (path: string) => {
      const rpc = await initElectroview();
      if (!rpc) return "";
      return rpc.request.readFile({ path });
    },
    saveFile: async (path: string, content: string) => {
      const rpc = await initElectroview();
      if (!rpc) return false;
      return rpc.request.saveFile({ path, content });
    },
    getConfig: async () => {
      const rpc = await initElectroview();
      if (!rpc) return { scanlines: true };
      return rpc.request.getConfig();
    },
    subscribe,
    isElectrobun: true,
  };
}

export function useElectrobunRpc(): RpcClient {
  return useMemo(() => {
    if (isInElectrobun()) {
      return createElectrobunRpc();
    }
    return mockRpc;
  }, []);
}
