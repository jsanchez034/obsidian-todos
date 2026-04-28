// RPC schema types — kept framework-agnostic so both web and desktop can import.
// The actual Electrobun RPCSchema/ElectrobunRPCSchema types are structurally
// compatible with this definition.

export type AppTheme = "light" | "dark" | "nasa";

export interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
      closeWindow: { params: void; response: boolean };
      setWindowFrame: {
        params: FrameRect;
        response: boolean;
      };
      setWindowFullScreen: {
        params: { value: boolean };
        response: boolean;
      };
      restoreWindow: { params: void; response: boolean };
      getDisplayWorkArea: {
        params: void;
        response: FrameRect;
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
      configChanged: { theme?: AppTheme; scanlines: boolean };
    };
  };
}
