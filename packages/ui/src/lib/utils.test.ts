import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles Tailwind conflicts (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles conditional/falsy inputs", () => {
    // oxlint-disable-next-line no-constant-binary-expression
    expect(cn("foo", false && "bar", undefined, null, "baz")).toBe("foo baz");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});
