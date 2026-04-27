import { describe, expect, it } from "vitest";

import { alwaysOnTopSequence } from "./always-on-top-sequence";

const ANCHOR = { x: 100, y: 26, width: 400, height: 600 };

describe("alwaysOnTopSequence", () => {
  it("returns { before: 'off', after: null } when target differs from anchor (zoom-in)", () => {
    expect(alwaysOnTopSequence({ x: 0, y: 0, width: 1920, height: 1080 }, ANCHOR)).toEqual({
      before: "off",
      after: null,
    });
  });

  it("returns { before: null, after: 'on' } when target equals anchor (zoom-out / restore)", () => {
    expect(alwaysOnTopSequence({ ...ANCHOR }, ANCHOR)).toEqual({
      before: null,
      after: "on",
    });
  });

  it("treats partial frame mismatch as zoom-in (any field differs)", () => {
    expect(alwaysOnTopSequence({ ...ANCHOR, width: ANCHOR.width + 1 }, ANCHOR)).toEqual({
      before: "off",
      after: null,
    });
    expect(alwaysOnTopSequence({ ...ANCHOR, x: ANCHOR.x - 5 }, ANCHOR)).toEqual({
      before: "off",
      after: null,
    });
  });

  it("treats fullScreen-style 'larger than anchor' as zoom-in", () => {
    expect(alwaysOnTopSequence({ x: 0, y: 0, width: 3840, height: 2160 }, ANCHOR)).toEqual({
      before: "off",
      after: null,
    });
  });
});
