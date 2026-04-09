import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders with data-slot attribute", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveAttribute("data-slot", "skeleton");
  });

  it("applies animation class", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("animate-pulse");
  });

  it("merges custom className", () => {
    render(<Skeleton data-testid="skeleton" className="w-20 h-4" />);
    const el = screen.getByTestId("skeleton");
    expect(el).toHaveClass("w-20");
    expect(el).toHaveClass("h-4");
  });
});
