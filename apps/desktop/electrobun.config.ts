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
      defaultRenderer: "cef",
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
