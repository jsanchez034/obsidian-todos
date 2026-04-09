import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("applies data-slot attribute", () => {
    render(<Input placeholder="Test" />);
    expect(screen.getByPlaceholderText("Test")).toHaveAttribute("data-slot", "input");
  });

  it("merges custom className", () => {
    render(<Input placeholder="Test" className="custom" />);
    expect(screen.getByPlaceholderText("Test")).toHaveClass("custom");
  });

  it("forwards type prop", () => {
    render(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute("type", "email");
  });
});
