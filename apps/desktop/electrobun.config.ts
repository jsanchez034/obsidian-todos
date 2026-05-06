import type { ElectrobunConfig } from "electrobun";

const webBuildDir = "../web/dist";

export default {
  app: {
    name: "obsidian-todos",
    identifier: "dev.bettertstack.obsidian-todos.desktop",
    version: "0.0.2",
  },
  runtime: {
    exitOnLastWindowClosed: false,
  },
  build: {
    bun: {
      entrypoint: "src/bun/index.ts",
    },
    copy: {
      [webBuildDir]: "views/popup",
      "assets/tray-icon-Template.png": "views/assets/tray-icon-Template.png",
      "assets/tray-icon-Template@2x.png": "views/assets/tray-icon-Template@2x.png",
    },
    mac: {
      bundleCEF: false,
      defaultRenderer: "native",
      // Codesign only when ELECTROBUN_DEVELOPER_ID is set (release builds).
      // Notarization stays off — we use a self-signed cert; users bypass
      // Gatekeeper once via right-click → Open on first launch.
      codesign: Boolean(process.env.ELECTROBUN_DEVELOPER_ID),
      notarize: false,
      entitlements: {
        "com.apple.security.cs.allow-jit": true,
        "com.apple.security.cs.allow-unsigned-executable-memory": true,
        "com.apple.security.cs.disable-library-validation": true,
        "com.apple.security.files.user-selected.read-write":
          "obsidian-todos needs access to read and write the Markdown files you select.",
        "com.apple.security.files.documents.read-write":
          "obsidian-todos reads and writes Markdown files in your Documents folder.",
        "com.apple.security.files.desktop.read-write":
          "obsidian-todos reads and writes Markdown files on your Desktop.",
        "com.apple.security.files.downloads.read-write":
          "obsidian-todos reads and writes Markdown files in your Downloads folder.",
      },
    },
    linux: {
      bundleCEF: true,
      defaultRenderer: "cef",
    },
    win: {
      bundleCEF: true,
      defaultRenderer: "cef",
    },
  },
} satisfies ElectrobunConfig;
