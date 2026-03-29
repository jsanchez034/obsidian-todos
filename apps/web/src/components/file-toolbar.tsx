import { FileText } from "lucide-react";

import type { SaveStatus } from "@/hooks/use-file-state";

interface FileToolbarProps {
  filePath: string | null;
  saveStatus: SaveStatus;
}

function SaveIndicator({ status }: { status: SaveStatus }) {
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
  const filename = filePath?.split("/").pop() ?? null;

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        {filename && (
          <span className="flex items-center gap-1 truncate text-sm text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            {filename}
          </span>
        )}
      </div>
      <SaveIndicator status={saveStatus} />
    </div>
  );
}
