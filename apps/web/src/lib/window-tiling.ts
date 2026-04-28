export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TilePreset =
  | "left-half"
  | "right-half"
  | "top-half"
  | "bottom-half"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "fill"
  | "vertical-split-left"
  | "vertical-split-right";

export function tileFrame(preset: TilePreset, workArea: Rect): Rect {
  const halfW = Math.floor(workArea.width / 2);
  const halfH = Math.floor(workArea.height / 2);
  const rightX = workArea.x + halfW;
  const bottomY = workArea.y + halfH;

  switch (preset) {
    case "fill":
      return { ...workArea };
    case "left-half":
    case "vertical-split-left":
      return { x: workArea.x, y: workArea.y, width: halfW, height: workArea.height };
    case "right-half":
    case "vertical-split-right":
      return { x: rightX, y: workArea.y, width: halfW, height: workArea.height };
    case "top-half":
      return { x: workArea.x, y: workArea.y, width: workArea.width, height: halfH };
    case "bottom-half":
      return { x: workArea.x, y: bottomY, width: workArea.width, height: halfH };
    case "top-left":
      return { x: workArea.x, y: workArea.y, width: halfW, height: halfH };
    case "top-right":
      return { x: rightX, y: workArea.y, width: halfW, height: halfH };
    case "bottom-left":
      return { x: workArea.x, y: bottomY, width: halfW, height: halfH };
    case "bottom-right":
      return { x: rightX, y: bottomY, width: halfW, height: halfH };
  }
}
