import { Popover, PopoverContent, PopoverTrigger } from "@obsidian-todos/ui/components/popover";
import { useState } from "react";

import { ZoomPopover } from "@/components/zoom-popover";
import { useElectrobunRpc } from "@/hooks/use-electrobun-rpc";

const NO_DRAG = { WebkitAppRegion: "no-drag" } as React.CSSProperties;
const DRAG = { WebkitAppRegion: "drag" } as React.CSSProperties;

interface DotButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color: string;
}

function DotButton({ color, className, children, ...props }: DotButtonProps) {
  return (
    <button
      type="button"
      style={NO_DRAG}
      className={`group inline-flex size-3 items-center justify-center rounded-full text-black/55 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${color} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

function CloseGlyph() {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="size-2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      <path
        d="M3.5 3.5 L8.5 8.5 M8.5 3.5 L3.5 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ZoomGlyph() {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="size-2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[popup-open]:opacity-100"
    >
      <path
        d="M3.5 6.5 L3.5 3.5 L6.5 3.5 M5.5 8.5 L8.5 8.5 L8.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function TitleBar() {
  const rpc = useElectrobunRpc();
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <div
      data-titlebar
      style={DRAG}
      className="flex h-7 shrink-0 items-center gap-2 border-b border-border bg-background px-3 select-none"
    >
      <DotButton
        color="bg-[#ff5f57] hover:bg-[#ff5f57]/90"
        aria-label="Close window"
        onClick={() => {
          void rpc.closeWindow();
        }}
      >
        <CloseGlyph />
      </DotButton>
      <Popover open={zoomOpen} onOpenChange={setZoomOpen}>
        <PopoverTrigger
          render={
            <DotButton color="bg-[#28c941] hover:bg-[#28c941]/90" aria-label="Zoom window">
              <ZoomGlyph />
            </DotButton>
          }
        />
        <PopoverContent align="start" sideOffset={8} className="w-72">
          <ZoomPopover onAction={() => setZoomOpen(false)} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
