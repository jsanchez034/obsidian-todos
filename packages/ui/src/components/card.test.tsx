import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "./card";

describe("Card", () => {
  it("renders with default size", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("data-slot", "card");
    expect(card).toHaveAttribute("data-size", "default");
  });

  it("renders with sm size", () => {
    render(<Card data-testid="card" size="sm">Content</Card>);
    expect(screen.getByTestId("card")).toHaveAttribute("data-size", "sm");
  });

  it("merges custom className", () => {
    render(<Card data-testid="card" className="custom">Content</Card>);
    expect(screen.getByTestId("card")).toHaveClass("custom");
  });
});

describe("Card compound components", () => {
  it.each([
    ["CardHeader", CardHeader, "card-header"],
    ["CardTitle", CardTitle, "card-title"],
    ["CardDescription", CardDescription, "card-description"],
    ["CardAction", CardAction, "card-action"],
    ["CardContent", CardContent, "card-content"],
    ["CardFooter", CardFooter, "card-footer"],
  ] as const)("%s renders with correct data-slot", (_, Component, slot) => {
    render(<Component data-testid="el">Child</Component>);
    expect(screen.getByTestId("el")).toHaveAttribute("data-slot", slot);
  });
});
