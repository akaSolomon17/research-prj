import "@testing-library/jest-dom/vitest";

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  // Recharts depends on ResizeObserver in jsdom tests.
  globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
}
