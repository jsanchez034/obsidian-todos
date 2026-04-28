interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AlwaysOnTopSequence {
  before: "off" | "on" | null;
  after: "off" | "on" | null;
}

function framesEqual(a: Frame, b: Frame): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export function alwaysOnTopSequence(target: Frame, anchor: Frame): AlwaysOnTopSequence {
  if (framesEqual(target, anchor)) {
    return { before: null, after: "on" };
  }
  return { before: "off", after: null };
}
