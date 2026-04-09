import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button, buttonVariants } from "./button";

describe("Button", () => {
  it("renders with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies data-slot attribute", () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-slot", "button");
  });

  it("applies default variant and size classes", () => {
    const classes = buttonVariants({ variant: "default", size: "default" });
    expect(classes).toContain("bg-primary");
    expect(classes).toContain("h-8");
  });

  it.each(["default", "outline", "secondary", "ghost", "destructive", "link"] as const)(
    "applies %s variant classes",
    (variant) => {
      const classes = buttonVariants({ variant });
      expect(classes).toBeTruthy();
      expect(classes).not.toBe(buttonVariants({ variant: variant === "default" ? "ghost" : "default" }));
    },
  );

  it.each(["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"] as const)(
    "applies %s size classes",
    (size) => {
      const classes = buttonVariants({ size });
      expect(classes).toBeTruthy();
    },
  );

  it("merges custom className", () => {
    render(<Button className="custom-class">Test</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("renders as disabled", () => {
    render(<Button disabled>Test</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
