import "@testing-library/jest-dom/vitest";

// @base-ui/react requires PointerEvent which jsdom doesn't provide
if (typeof globalThis.PointerEvent === "undefined") {
  class PointerEvent extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? "";
    }
  }
  globalThis.PointerEvent = PointerEvent as any;
}
