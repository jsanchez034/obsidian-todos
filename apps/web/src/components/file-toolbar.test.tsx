import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FileToolbar } from "./file-toolbar";

describe("FileToolbar", () => {
  it("extracts and displays filename from path", () => {
    render(<FileToolbar filePath="/Users/jp/notes/todos.md" saveStatus="idle" />);
    expect(screen.getByText("todos.md")).toBeInTheDocument();
  });

  it("shows nothing when filePath is null", () => {
    const { container } = render(<FileToolbar filePath={null} saveStatus="idle" />);
    expect(container.querySelector("span")).toBeNull();
  });

  it("shows 'Saving...' for saving status", () => {
    render(<FileToolbar filePath="/test.md" saveStatus="saving" />);
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("shows 'Saved' for saved status", () => {
    render(<FileToolbar filePath="/test.md" saveStatus="saved" />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("shows 'Save failed' for error status", () => {
    render(<FileToolbar filePath="/test.md" saveStatus="error" />);
    expect(screen.getByText("Save failed")).toBeInTheDocument();
  });

  it("shows nothing for idle status", () => {
    render(<FileToolbar filePath="/test.md" saveStatus="idle" />);
    expect(screen.queryByText("Saving...")).toBeNull();
    expect(screen.queryByText("Saved")).toBeNull();
    expect(screen.queryByText("Save failed")).toBeNull();
  });
});
