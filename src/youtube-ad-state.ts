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
