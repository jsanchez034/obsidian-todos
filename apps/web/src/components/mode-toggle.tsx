import { Button } from "@obsidian-todos/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@obsidian-todos/ui/components/dropdown-menu";
import { Moon, Sun, Terminal } from "lucide-react";

import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90 nasa:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0 nasa:scale-0" />
        <Terminal
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${theme === "nasa" ? "scale-100 rotate-0" : "scale-0 rotate-90"}`}
        />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("nasa")}>NASA</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
