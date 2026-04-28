export type ToggleAction = "hide" | "focus" | "show" | "show-tray-menu";

export interface ToggleState {
  exists: boolean;
  focused: boolean;
  hasCurrentFile: boolean;
}

export function decideToggleAction({ exists, focused, hasCurrentFile }: ToggleState): ToggleAction {
  if (exists) {
    return focused ? "hide" : "focus";
  }
  return hasCurrentFile ? "show" : "show-tray-menu";
}
