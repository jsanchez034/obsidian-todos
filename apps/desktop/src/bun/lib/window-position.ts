interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PopupPosition {
  x: number;
  y: number;
}

export function calculatePopupPosition(
  trayBounds: Bounds,
  workArea: Bounds,
  popupWidth: number,
  popupHeight: number,
): PopupPosition {
  let x: number;
  let y: number;

  if (trayBounds.x === 0 && trayBounds.y === 0 && trayBounds.width === 0) {
    // Tray bounds unavailable — fall back to top-right
    x = workArea.x + workArea.width - popupWidth - 10;
    y = workArea.y;
  } else {
    // Center popup under tray icon
    x = Math.round(trayBounds.x + trayBounds.width / 2 - popupWidth / 2);
    y = trayBounds.y + trayBounds.height + 4;
  }

  // Clamp to screen work area
  x = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - popupWidth));
  y = Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - popupHeight));

  return { x, y };
}
