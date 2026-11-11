import { describe, it, expect } from "vitest";
import {
  findYouTubeSkipButton,
  isYouTubeAdShowing,
  isYouTubeAdSkippable,
} from "../src/youtube-ad-state.js";

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

function mockSkipPlayer(
  buttons: Array<{
    selector: string;
    width: number;
    height: number;
    disabled?: boolean;
    ariaDisabled?: string;
  }>,
): HTMLElement {
  return {
    querySelectorAll: (sel: string) =>
      buttons
        .filter((button) => button.selector === sel)
        .map((button) => ({
          getBoundingClientRect: () => ({
            width: button.width,
            height: button.height,
          }),
          disabled: Boolean(button.disabled),
          getAttribute: (name: string) =>
            name === "aria-disabled" ? (button.ariaDisabled ?? null) : null,
        })),
  } as unknown as HTMLElement;
}

describe("isYouTubeAdSkippable", () => {
  it("returns false without player", () => {
    expect(isYouTubeAdSkippable(null)).toBe(false);
    expect(findYouTubeSkipButton(null)).toBeNull();
  });

  it("returns true for a visible enabled skip button", () => {
    const player = mockSkipPlayer([
      { selector: ".ytp-skip-ad-button", width: 80, height: 24 },
    ]);
    expect(isYouTubeAdSkippable(player)).toBe(true);
  });

  it("returns false when the rect has no size", () => {
    const player = mockSkipPlayer([
      { selector: ".ytp-skip-ad-button", width: 0, height: 24 },
    ]);
    expect(isYouTubeAdSkippable(player)).toBe(false);
  });

  it("returns false when the button is disabled", () => {
    const player = mockSkipPlayer([
      {
        selector: ".ytp-skip-ad-button",
        width: 80,
        height: 24,
        disabled: true,
      },
    ]);
    expect(isYouTubeAdSkippable(player)).toBe(false);
  });

  it("returns false when aria-disabled is true", () => {
    const player = mockSkipPlayer([
      {
        selector: ".ytp-skip-ad-button",
        width: 80,
        height: 24,
        ariaDisabled: "true",
      },
    ]);
    expect(isYouTubeAdSkippable(player)).toBe(false);
  });

  it("returns false when no skip button exists", () => {
    expect(isYouTubeAdSkippable(mockSkipPlayer([]))).toBe(false);
  });

  it("accepts the next selector when the earlier one is disabled", () => {
    const player = mockSkipPlayer([
      {
        selector: ".ytp-skip-ad-button",
        width: 80,
        height: 24,
        disabled: true,
      },
      { selector: ".ytp-ad-skip-button", width: 80, height: 24 },
    ]);
    expect(isYouTubeAdSkippable(player)).toBe(true);
  });
});
