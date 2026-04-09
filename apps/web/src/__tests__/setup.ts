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

// next-themes requires window.matchMedia which jsdom doesn't provide
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
