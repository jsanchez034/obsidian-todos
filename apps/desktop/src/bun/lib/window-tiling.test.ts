import { describe, expect, it } from "vitest";

import { type Rect, type TilePreset, tileFrame } from "./window-tiling";

const STANDARD: Rect = { x: 0, y: 0, width: 1920, height: 1080 };
const OFFSET: Rect = { x: 100, y: 50, width: 1820, height: 1030 };

describe("tileFrame — standard work area at origin", () => {
  it("left-half places window on the left half", () => {
    expect(tileFrame("left-half", STANDARD)).toEqual({
      x: 0,
      y: 0,
      width: 960,
      height: 1080,
    });
  });

  it("right-half places window on the right half", () => {
    expect(tileFrame("right-half", STANDARD)).toEqual({
      x: 960,
      y: 0,
      width: 960,
      height: 1080,
    });
  });

  it("top-half places window on the top half", () => {
    expect(tileFrame("top-half", STANDARD)).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 540,
    });
  });

  it("bottom-half places window on the bottom half", () => {
    expect(tileFrame("bottom-half", STANDARD)).toEqual({
      x: 0,
      y: 540,
      width: 1920,
      height: 540,
    });
  });

  it("top-left places window in the top-left quadrant", () => {
    expect(tileFrame("top-left", STANDARD)).toEqual({
      x: 0,
      y: 0,
      width: 960,
      height: 540,
    });
  });

  it("top-right places window in the top-right quadrant", () => {
    expect(tileFrame("top-right", STANDARD)).toEqual({
      x: 960,
      y: 0,
      width: 960,
      height: 540,
    });
  });

  it("bottom-left places window in the bottom-left quadrant", () => {
    expect(tileFrame("bottom-left", STANDARD)).toEqual({
      x: 0,
      y: 540,
      width: 960,
      height: 540,
    });
  });

  it("bottom-right places window in the bottom-right quadrant", () => {
    expect(tileFrame("bottom-right", STANDARD)).toEqual({
      x: 960,
      y: 540,
      width: 960,
      height: 540,
    });
  });

  it("fill returns the entire work area", () => {
    expect(tileFrame("fill", STANDARD)).toEqual(STANDARD);
  });

  it("vertical-split-left mirrors left-half", () => {
    expect(tileFrame("vertical-split-left", STANDARD)).toEqual(tileFrame("left-half", STANDARD));
  });

  it("vertical-split-right mirrors right-half", () => {
    expect(tileFrame("vertical-split-right", STANDARD)).toEqual(tileFrame("right-half", STANDARD));
  });
});

describe("tileFrame — work area with non-zero origin (catches hard-coded zeros)", () => {
  it("left-half respects work area origin", () => {
    expect(tileFrame("left-half", OFFSET)).toEqual({
      x: 100,
      y: 50,
      width: 910,
      height: 1030,
    });
  });

  it("right-half respects work area origin", () => {
    expect(tileFrame("right-half", OFFSET)).toEqual({
      x: 1010,
      y: 50,
      width: 910,
      height: 1030,
    });
  });

  it("top-half respects work area origin", () => {
    expect(tileFrame("top-half", OFFSET)).toEqual({
      x: 100,
      y: 50,
      width: 1820,
      height: 515,
    });
  });

  it("bottom-half respects work area origin", () => {
    expect(tileFrame("bottom-half", OFFSET)).toEqual({
      x: 100,
      y: 565,
      width: 1820,
      height: 515,
    });
  });

  it("top-left quadrant respects work area origin", () => {
    expect(tileFrame("top-left", OFFSET)).toEqual({
      x: 100,
      y: 50,
      width: 910,
      height: 515,
    });
  });

  it("bottom-right quadrant respects work area origin", () => {
    expect(tileFrame("bottom-right", OFFSET)).toEqual({
      x: 1010,
      y: 565,
      width: 910,
      height: 515,
    });
  });

  it("fill respects work area origin", () => {
    expect(tileFrame("fill", OFFSET)).toEqual(OFFSET);
  });
});

describe("TilePreset type union", () => {
  it("accepts all expected preset names", () => {
    const presets: TilePreset[] = [
      "left-half",
      "right-half",
      "top-half",
      "bottom-half",
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
      "fill",
      "vertical-split-left",
      "vertical-split-right",
    ];
    for (const preset of presets) {
      const frame = tileFrame(preset, STANDARD);
      expect(frame).toHaveProperty("x");
      expect(frame).toHaveProperty("y");
      expect(frame).toHaveProperty("width");
      expect(frame).toHaveProperty("height");
    }
  });
});
