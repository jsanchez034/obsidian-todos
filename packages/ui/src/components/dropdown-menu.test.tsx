import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./dropdown-menu";

describe("DropdownMenu", () => {
  it("renders trigger", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toHaveAttribute("aria-haspopup", "menu");
  });

  it("opens menu and renders items when open", async () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByRole("menuitem", { name: "Item 1" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Item 2" })).toBeInTheDocument();
  });

  it("fires onClick on menu item", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onClick}>Action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("menuitem", { name: "Action" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders separator", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("renders label", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Group</DropdownMenuLabel>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByText("Group")).toBeInTheDocument();
  });
});

describe("DropdownMenuCheckboxItem", () => {
  it("renders checkbox item and fires onCheckedChange", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={false} onCheckedChange={onCheckedChange}>
            Show sidebar
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("menuitemcheckbox", { name: "Show sidebar" }));
    expect(onCheckedChange).toHaveBeenCalledOnce();
  });
});

describe("DropdownMenuRadioGroup", () => {
  it("selects radio item", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="a" onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="a">Option A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">Option B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole("menuitemradio", { name: "Option B" }));
    expect(onValueChange).toHaveBeenCalledWith("b", expect.anything());
  });
});
