// RPC schema types — kept framework-agnostic so both web and desktop can import.
// The actual Electrobun RPCSchema/ElectrobunRPCSchema types are structurally
// compatible with this definition.

export type AppTheme = "light" | "dark" | "nasa";

export interface AppRPCSchema {
  bun: {
    requests: {
      openFile: {
        params: void;
        response: { path: string; content: string } | null;
      };
      readFile: { params: { path: string }; response: string };
      saveFile: {
        params: { path: string; content: string };
        response: boolean;
      };
      getConfig: {
        params: void;
        response: { theme?: AppTheme; scanlines: boolean };
      };
    };
    messages: {
      webviewReady: {};
    };
  };
  webview: {
    requests: {};
    messages: {
      fileOpened: { path: string; content: string };
      fileChanged: { path: string; content: string };
      windowShown: {};
      configChanged: { theme?: AppTheme; scanlines: boolean };
    };
  };
}
