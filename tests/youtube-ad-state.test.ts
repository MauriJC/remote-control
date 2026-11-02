import { describe, it, expect } from "vitest";
import { isYouTubeAdShowing } from "../src/youtube-ad-state.js";

function mockPlayer(options: {
  adShowing?: boolean;
  visibleOverlay?: boolean;
}): HTMLElement {
  return {
    classList: {
      contains: (name: string) =>
        name === "ad-showing" && Boolean(options.adShowing),
    },
    querySelector: (sel: string) => {
      if (
        options.visibleOverlay &&
        sel === ".ytp-ad-player-overlay"
      ) {
        return {
          getBoundingClientRect: () => ({
            width: 100,
            height: 50,
          }),
        };
      }
      return null;
    },
  } as unknown as HTMLElement;
}

describe("isYouTubeAdShowing", () => {
  it("returns false without player", () => {
    expect(isYouTubeAdShowing(null)).toBe(false);
  });

  it("detects ad-showing class", () => {
    expect(isYouTubeAdShowing(mockPlayer({ adShowing: true }))).toBe(true);
  });

  it("detects visible ad overlay", () => {
    expect(isYouTubeAdShowing(mockPlayer({ visibleOverlay: true }))).toBe(true);
  });

  it("returns false for normal player", () => {
    expect(isYouTubeAdShowing(mockPlayer({}))).toBe(false);
  });
});
