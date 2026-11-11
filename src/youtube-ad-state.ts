/** Whether YouTube's in-player ad UI is visible (works without uBlock). Self-contained for page.evaluate. */
export function isYouTubeAdShowing(player: HTMLElement | null): boolean {
  if (!player) {
    return false;
  }

  if (player.classList.contains("ad-showing")) {
    return true;
  }

  const selectors = [
    ".ytp-ad-player-overlay",
    ".ytp-ad-module",
    ".ytp-ad-preview-slot",
  ];
  for (const sel of selectors) {
    const node = player.querySelector(sel) as HTMLElement | null;
    if (node?.getBoundingClientRect) {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return true;
      }
    }
  }

  return false;
}

export function findYouTubeSkipButton(
  player: HTMLElement | null,
): HTMLElement | null {
  if (!player) {
    return null;
  }

  const selectors = [
    ".ytp-skip-ad-button",
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-skip-ad-button__button",
  ];

  for (const sel of selectors) {
    for (const node of player.querySelectorAll(sel)) {
      const el = node as HTMLElement;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        continue;
      }
      if ((el as HTMLButtonElement).disabled) {
        continue;
      }
      if (el.getAttribute("aria-disabled") === "true") {
        continue;
      }
      return el;
    }
  }

  return null;
}

export function isYouTubeAdSkippable(player: HTMLElement | null): boolean {
  return findYouTubeSkipButton(player) !== null;
}
