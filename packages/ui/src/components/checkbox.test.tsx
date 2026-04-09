import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("renders unchecked by default", () => {
    render(<Checkbox aria-label="Toggle" />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("toggles on click", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Toggle" />);
    const checkbox = screen.getByRole("checkbox");

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("renders with data-slot attribute", () => {
    render(<Checkbox aria-label="Toggle" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("data-slot", "checkbox");
  });
});
