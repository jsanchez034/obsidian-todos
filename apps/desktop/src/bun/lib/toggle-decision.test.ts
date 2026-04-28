import { describe, expect, it } from "vitest";

import { decideToggleAction } from "./toggle-decision";

describe("decideToggleAction", () => {
  it("returns 'hide' when popup exists and is focused", () => {
    expect(decideToggleAction({ exists: true, focused: true, hasCurrentFile: true })).toBe("hide");
    expect(decideToggleAction({ exists: true, focused: true, hasCurrentFile: false })).toBe("hide");
  });

  it("returns 'focus' when popup exists but is not focused", () => {
    expect(decideToggleAction({ exists: true, focused: false, hasCurrentFile: true })).toBe(
      "focus",
    );
    expect(decideToggleAction({ exists: true, focused: false, hasCurrentFile: false })).toBe(
      "focus",
    );
  });

  it("returns 'show' when popup does not exist and currentFile is set", () => {
    expect(decideToggleAction({ exists: false, focused: false, hasCurrentFile: true })).toBe(
      "show",
    );
  });

  it("returns 'show-tray-menu' when popup does not exist and no currentFile", () => {
    expect(decideToggleAction({ exists: false, focused: false, hasCurrentFile: false })).toBe(
      "show-tray-menu",
    );
  });

  it("ignores 'focused' when popup does not exist", () => {
    // focused must be false if window doesn't exist, but defensive: result should still be deterministic
    expect(decideToggleAction({ exists: false, focused: true, hasCurrentFile: true })).toBe("show");
    expect(decideToggleAction({ exists: false, focused: true, hasCurrentFile: false })).toBe(
      "show-tray-menu",
    );
  });
});
