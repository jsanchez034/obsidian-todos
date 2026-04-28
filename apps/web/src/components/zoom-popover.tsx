import { PopoverClose } from "@obsidian-todos/ui/components/popover";
import { Maximize2, Minimize2 } from "lucide-react";
import { useRef } from "react";

import { useElectrobunRpc } from "@/hooks/use-electrobun-rpc";
import { tileFrame, type TilePreset } from "@/lib/window-tiling";

interface TileLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

const TILE_LAYOUTS: Record<TilePreset, TileLayout> = {
  "left-half": { x: 1, y: 1, w: 11, h: 14 },
  "right-half": { x: 12, y: 1, w: 11, h: 14 },
  "top-half": { x: 1, y: 1, w: 22, h: 7 },
  "bottom-half": { x: 1, y: 8, w: 22, h: 7 },
  "top-left": { x: 1, y: 1, w: 11, h: 7 },
  "top-right": { x: 12, y: 1, w: 11, h: 7 },
  "bottom-left": { x: 1, y: 8, w: 11, h: 7 },
  "bottom-right": { x: 12, y: 8, w: 11, h: 7 },
  fill: { x: 1, y: 1, w: 22, h: 14 },
  "vertical-split-left": { x: 1, y: 1, w: 11, h: 14 },
  "vertical-split-right": { x: 12, y: 1, w: 11, h: 14 },
};

function TileIcon({ preset }: { preset: TilePreset }) {
  const { x, y, w, h } = TILE_LAYOUTS[preset];
  return (
    <svg viewBox="0 0 24 16" aria-hidden="true" className="h-4 w-6">
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.5"
      />
      <rect x={x} y={y} width={w} height={h} fill="currentColor" opacity="0.85" />
    </svg>
  );
}

interface TileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  preset: TilePreset;
  label: string;
}

function TileButton({ preset, label, className, ...props }: TileButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex h-10 w-12 items-center justify-center rounded-sm border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none${className ? ` ${className}` : ""}`}
      {...props}
    >
      <TileIcon preset={preset} />
    </button>
  );
}

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
}

function ActionButton({ label, icon, className, ...props }: ActionButtonProps) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none${className ? ` ${className}` : ""}`}
      {...props}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

interface ZoomPopoverProps {
  onAction: () => void;
}

export function ZoomPopover({ onAction }: ZoomPopoverProps) {
  const rpc = useElectrobunRpc();
  const containerRef = useRef<HTMLDivElement>(null);

  const tile = async (preset: TilePreset) => {
    const workArea = await rpc.getDisplayWorkArea();
    const frame = tileFrame(preset, workArea);
    await rpc.setWindowFrame(frame);
    onAction();
  };

  const fullScreen = async () => {
    await rpc.setWindowFullScreen(true);
    onAction();
  };

  const restore = async () => {
    await rpc.restoreWindow();
    onAction();
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-3 p-1 text-xs">
      {/* Required for Base UI trap-focus to activate FloatingFocusManager */}
      <PopoverClose className="sr-only">Close</PopoverClose>
      <section aria-labelledby="zoom-section-move">
        <h3
          id="zoom-section-move"
          className="mb-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase"
        >
          Move &amp; Resize
        </h3>
        <div className="flex gap-1">
          <TileButton
            tabIndex={0}
            preset="left-half"
            label="Left half"
            onClick={() => tile("left-half")}
          />
          <TileButton
            tabIndex={0}
            preset="right-half"
            label="Right half"
            onClick={() => tile("right-half")}
          />
          <TileButton
            tabIndex={0}
            preset="top-half"
            label="Top half"
            onClick={() => tile("top-half")}
          />
          <TileButton
            tabIndex={0}
            preset="bottom-half"
            label="Bottom half"
            onClick={() => tile("bottom-half")}
          />
        </div>
      </section>

      <section aria-labelledby="zoom-section-fill">
        <h3
          id="zoom-section-fill"
          className="mb-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase"
        >
          Fill &amp; Arrange
        </h3>
        <div className="flex gap-1">
          <TileButton tabIndex={0} preset="fill" label="Fill" onClick={() => tile("fill")} />
          <TileButton
            tabIndex={0}
            preset="vertical-split-left"
            label="Left side, split"
            onClick={() => tile("vertical-split-left")}
          />
          <TileButton
            tabIndex={0}
            preset="vertical-split-right"
            label="Right side, split"
            onClick={() => tile("vertical-split-right")}
          />
          <TileButton
            tabIndex={0}
            preset="top-left"
            label="Top-left quadrant"
            onClick={() => tile("top-left")}
          />
        </div>
      </section>

      <div className="-mx-2.5 border-t border-border" />

      <div className="flex flex-col gap-0.5">
        <ActionButton
          tabIndex={0}
          label="Full Screen"
          icon={<Maximize2 className="size-3.5" />}
          onClick={fullScreen}
        />
        <ActionButton
          tabIndex={0}
          label="Restore"
          icon={<Minimize2 className="size-3.5" />}
          onClick={restore}
        />
      </div>
    </div>
  );
}
