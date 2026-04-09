import { describe, expect, it } from "vitest";

import { calculatePopupPosition } from "./window-position";

const POPUP_WIDTH = 400;
const POPUP_HEIGHT = 600;

describe("calculatePopupPosition", () => {
  it("centers popup under tray icon", () => {
    const trayBounds = { x: 1000, y: 0, width: 22, height: 22 };
    const workArea = { x: 0, y: 0, width: 1920, height: 1080 };

    const { x, y } = calculatePopupPosition(trayBounds, workArea, POPUP_WIDTH, POPUP_HEIGHT);

    // Centered: 1000 + 22/2 - 400/2 = 811
    expect(x).toBe(811);
    // Below tray: 0 + 22 + 4 = 26
    expect(y).toBe(26);
  });

  it("falls back to top-right when tray bounds are zeroed", () => {
    const trayBounds = { x: 0, y: 0, width: 0, height: 0 };
    const workArea = { x: 0, y: 0, width: 1920, height: 1080 };

    const { x, y } = calculatePopupPosition(trayBounds, workArea, POPUP_WIDTH, POPUP_HEIGHT);

    // Top-right: 1920 - 400 - 10 = 1510
    expect(x).toBe(1510);
    expect(y).toBe(0);
  });

  it("clamps position to left edge of work area", () => {
    const trayBounds = { x: 10, y: 0, width: 22, height: 22 };
    const workArea = { x: 0, y: 0, width: 1920, height: 1080 };

    const { x, y } = calculatePopupPosition(trayBounds, workArea, POPUP_WIDTH, POPUP_HEIGHT);

    // Centered would be: 10 + 11 - 200 = -179, clamped to 0
    expect(x).toBe(0);
    expect(y).toBe(26);
  });

  it("clamps position to right edge of work area", () => {
    const trayBounds = { x: 1900, y: 0, width: 22, height: 22 };
    const workArea = { x: 0, y: 0, width: 1920, height: 1080 };

    const { x, y } = calculatePopupPosition(trayBounds, workArea, POPUP_WIDTH, POPUP_HEIGHT);

    // Centered would be 1711, clamped to 1920 - 400 = 1520
    expect(x).toBe(1520);
    expect(y).toBe(26);
  });

  it("clamps position to bottom edge of work area", () => {
    const trayBounds = { x: 500, y: 500, width: 22, height: 22 };
    const workArea = { x: 0, y: 0, width: 1920, height: 600 };

    const pos = calculatePopupPosition(trayBounds, workArea, POPUP_WIDTH, POPUP_HEIGHT);

    // y would be 526, but workArea height is 600, so clamped to 600 - 600 = 0
    expect(pos.y).toBe(0);
  });

  it("handles non-zero work area origin", () => {
    const trayBounds = { x: 0, y: 0, width: 0, height: 0 };
    const workArea = { x: 100, y: 50, width: 1820, height: 1030 };

    const { x, y } = calculatePopupPosition(trayBounds, workArea, POPUP_WIDTH, POPUP_HEIGHT);

    // Top-right fallback: 100 + 1820 - 400 - 10 = 1510
    expect(x).toBe(1510);
    expect(y).toBe(50);
  });
});
