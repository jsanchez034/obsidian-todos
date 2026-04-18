import type React from "react";
import { FileText } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import type { SaveStatus } from "@/hooks/use-file-state";

interface FileToolbarProps {
  filePath: string | null;
  saveStatus: SaveStatus;
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const { theme } = useTheme();

  if (theme === "nasa") {
    if (status === "idle") return null;
    const nasaLabels: Record<Exclude<SaveStatus, "idle">, string> = {
      saving: "TRANSMITTING",
      saved: "NOMINAL",
      error: "FAULT",
    };
    const nasaStyles: Record<Exclude<SaveStatus, "idle">, string> = {
      saving: "animate-pulse font-mono text-xs tracking-widest",
      saved: "font-mono text-xs tracking-widest",
      error: "animate-[blink_1s_step-end_infinite] font-mono text-xs tracking-widest",
    };
    const nasaColors: Record<Exclude<SaveStatus, "idle">, React.CSSProperties> = {
      saving: { color: "oklch(0.78 0.18 85)" },
      saved: { color: "oklch(0.85 0.25 142)" },
      error: { color: "oklch(0.65 0.25 25)" },
    };
    return (
      <span className={nasaStyles[status]} style={nasaColors[status]}>
        ■ {nasaLabels[status]}
      </span>
    );
  }

  const labels: Record<SaveStatus, string> = {
    idle: "",
    saving: "Saving...",
    saved: "Saved",
    error: "Save failed",
  };
  if (status === "idle") return null;
  return (
    <span
      className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}
    >
      {labels[status]}
    </span>
  );
}

export function FileToolbar({ filePath, saveStatus }: FileToolbarProps) {
  const { theme } = useTheme();
  const filename = filePath?.split("/").pop() ?? null;
  const isNasa = theme === "nasa";

  return (
    <div className={`flex items-center gap-2 px-3 py-2${isNasa ? " font-mono" : ""}`}>
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        {filename && (
          <span
            className={`flex items-center gap-1 truncate text-sm${isNasa ? " tracking-wide" : " text-muted-foreground"}`}
            style={isNasa ? { color: "oklch(0.45 0.12 142)" } : undefined}
          >
            {isNasa ? (
              <span style={{ color: "oklch(0.78 0.18 85)" }}>▸</span>
            ) : (
              <FileText className="h-3.5 w-3.5 shrink-0" />
            )}
            {filename}
          </span>
        )}
      </div>
      <SaveIndicator status={saveStatus} />
    </div>
  );
}
