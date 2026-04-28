import { describe, expect, it } from "vitest";

import { isValidFrameInput } from "./window-rpc-validators";

describe("isValidFrameInput", () => {
  it("accepts a well-formed frame at origin", () => {
    expect(isValidFrameInput({ x: 0, y: 0, width: 400, height: 600 })).toBe(true);
  });

  it("accepts a frame with positive offset", () => {
    expect(isValidFrameInput({ x: 100, y: 50, width: 1820, height: 1030 })).toBe(true);
  });

  it("accepts negative x and y (multi-monitor setups can have negative origins)", () => {
    expect(isValidFrameInput({ x: -100, y: -50, width: 400, height: 600 })).toBe(true);
  });

  it("rejects non-object inputs", () => {
    expect(isValidFrameInput(null)).toBe(false);
    expect(isValidFrameInput(undefined)).toBe(false);
    expect(isValidFrameInput("frame")).toBe(false);
    expect(isValidFrameInput(42)).toBe(false);
    expect(isValidFrameInput([0, 0, 400, 600])).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(isValidFrameInput({ x: 0, y: 0, width: 400 })).toBe(false);
    expect(isValidFrameInput({ x: 0, width: 400, height: 600 })).toBe(false);
    expect(isValidFrameInput({})).toBe(false);
  });

  it("rejects NaN values", () => {
    expect(isValidFrameInput({ x: NaN, y: 0, width: 400, height: 600 })).toBe(false);
    expect(isValidFrameInput({ x: 0, y: NaN, width: 400, height: 600 })).toBe(false);
    expect(isValidFrameInput({ x: 0, y: 0, width: NaN, height: 600 })).toBe(false);
    expect(isValidFrameInput({ x: 0, y: 0, width: 400, height: NaN })).toBe(false);
  });

  it("rejects Infinity values", () => {
    expect(isValidFrameInput({ x: Infinity, y: 0, width: 400, height: 600 })).toBe(false);
    expect(isValidFrameInput({ x: 0, y: -Infinity, width: 400, height: 600 })).toBe(false);
    expect(isValidFrameInput({ x: 0, y: 0, width: Infinity, height: 600 })).toBe(false);
  });

  it("rejects non-positive widths and heights", () => {
    expect(isValidFrameInput({ x: 0, y: 0, width: 0, height: 600 })).toBe(false);
    expect(isValidFrameInput({ x: 0, y: 0, width: 400, height: 0 })).toBe(false);
    expect(isValidFrameInput({ x: 0, y: 0, width: -100, height: 600 })).toBe(false);
    expect(isValidFrameInput({ x: 0, y: 0, width: 400, height: -1 })).toBe(false);
  });

  it("rejects non-number fields", () => {
    expect(isValidFrameInput({ x: "0", y: 0, width: 400, height: 600 })).toBe(false);
    expect(isValidFrameInput({ x: 0, y: 0, width: "400", height: 600 })).toBe(false);
    expect(isValidFrameInput({ x: 0, y: 0, width: 400, height: true })).toBe(false);
    expect(isValidFrameInput({ x: null, y: 0, width: 400, height: 600 })).toBe(false);
  });
});
