import type { Page } from "playwright";
import type { PlayerAdapter } from "./command-bus.js";
import { emptyPlayerState, type PlayerState } from "./protocol.js";

type ReadResult = PlayerState | { error: string };

function isTransientPageError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Execution context was destroyed") ||
    msg.includes("Target closed") ||
    msg.includes("Frame was detached") ||
    msg.includes("page has been closed")
  );
}

/** Serializes Playwright calls (poll + commands must not overlap). */
export class YouTubeAdapter implements PlayerAdapter {
  private cache: PlayerState = emptyPlayerState({
    error: "Player state not loaded yet",
  });

  private pageChain: Promise<unknown> = Promise.resolve();

  constructor(private readonly page: Page) {}

  private withPage<T>(task: () => Promise<T>): Promise<T> {
    const next = this.pageChain.then(task, task);
    this.pageChain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  async refreshState(): Promise<void> {
    await this.withPage(async () => {
      try {
        const result = await this.page.evaluate((): ReadResult & {
          ytpErrorText?: string;
        } => {
          const el = document.getElementById("movie_player") as
            | (HTMLElement & {
                getVideoData?: () => { video_id?: string; title?: string };
                getDuration?: () => number;
                getCurrentTime?: () => number;
                getVolume?: () => number;
                isMuted?: () => boolean;
                getPlaybackQuality?: () => string;
                getPlayerState?: () => number;
              })
            | null;

        const errorRoot = document.querySelector(
          ".html5-video-player.ytp-error",
        ) as HTMLElement | null;
        let ytpErrorText: string | undefined;
        if (errorRoot) {
          const rect = errorRoot.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            ytpErrorText = (errorRoot.textContent ?? "").trim().slice(0, 160);
          }
        }

          if (!el) {
            return { error: "movie_player not found on page" };
          }

          if (typeof el.getVideoData !== "function") {
            return {
              error: "YouTube player API unavailable (open a watch page?)",
            };
          }

          const data = el.getVideoData();
          const state = el.getPlayerState?.() ?? 2; // YT_PAUSED
          const playing = state === 1; // YT_PLAYING

          return {
            playing,
            title: data.title ?? "",
            videoId: data.video_id ?? "",
            currentTime: Math.floor(el.getCurrentTime?.() ?? 0),
            duration: Math.floor(el.getDuration?.() ?? 0),
            volume: el.isMuted?.() ? 0 : Math.round(el.getVolume?.() ?? 0),
            adPlaying: false,
            quality: el.getPlaybackQuality?.() ?? "",
            ytpErrorText: ytpErrorText || undefined,
          };
        });

        if ("error" in result) {
          this.cache = emptyPlayerState({ error: result.error });
          return;
        }

        const { ytpErrorText, ...state } = result;
        this.cache =
          ytpErrorText && ytpErrorText.length > 0
            ? { ...state, error: ytpErrorText }
            : state;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (isTransientPageError(err)) {
          const { error: _prev, ...rest } = this.cache;
          this.cache = { ...rest, error: "Page is loading…" };
          return;
        }

        this.cache = emptyPlayerState({
          error: msg,
        });
      }
    });
  }

  readState(): PlayerState {
    return { ...this.cache };
  }

  async play(): Promise<void> {
    await this.runPlayerCommand("playVideo");
    await this.refreshState();
  }

  async pause(): Promise<void> {
    await this.runPlayerCommand("pauseVideo");
    await this.refreshState();
  }

  async seekTo(seconds: number): Promise<void> {
    if (!Number.isFinite(seconds)) {
      throw new Error("Invalid seek position");
    }
    const sec = Math.max(0, Math.floor(seconds));
    await this.withPage(() => this.performSeek(sec));
    await this.refreshState();
  }

  async setVolume(volume: number): Promise<void> {
    const vol = Math.max(0, Math.min(100, Math.round(volume)));
    await this.runSeekOrVolume(vol);
    await this.refreshState();
  }

  async enterFullscreen(): Promise<void> {
    await this.withPage(async () => {
      try {
        const err = await this.page.evaluate(async () => {
          const video = document.querySelector(
            "#movie_player video",
          ) as HTMLVideoElement | null;
          const target = video ?? document.getElementById("movie_player");
          if (!target?.requestFullscreen) {
            return "Fullscreen unavailable on this page";
          }
          await target.requestFullscreen();
          return null;
        });
        if (err) {
          throw new Error(err);
        }
      } catch (err) {
        if (isTransientPageError(err)) {
          throw new Error("YouTube page is loading, try again");
        }
        throw err;
      }
    });
  }

  /** Progress bar click (like a user), then API / URL fallbacks for unbuffered seeks. */
  private async performSeek(targetSeconds: number): Promise<void> {
    type SeekMeta =
      | { error: string }
      | {
          duration: number;
          target: number;
          wasPlaying: boolean;
          videoId: string;
        };

    const meta = (await this.page.evaluate((rawTarget) => {
      const el = document.getElementById("movie_player") as {
        getVideoData?: () => { video_id?: string };
        getDuration?: () => number;
        getPlayerState?: () => number;
        pauseVideo?: () => void;
      } | null;

      if (!el) {
        return { error: "movie_player not found on page" };
      }
      if (typeof el.getVideoData !== "function") {
        return { error: "YouTube player API unavailable (open a watch page?)" };
      }

      const duration = Math.floor(el.getDuration?.() ?? 0);
      if (duration <= 0) {
        return { error: "Video duration not ready yet" };
      }

      const data = el.getVideoData();
      const videoId = data.video_id ?? "";
      if (!videoId) {
        return { error: "No video id on page" };
      }

      el.pauseVideo?.();
      const target = Math.max(0, Math.min(rawTarget, duration));
      const wasPlaying = el.getPlayerState?.() === 1;

      return { duration, target, wasPlaying, videoId };
    }, targetSeconds)) as SeekMeta;

    if ("error" in meta) {
      throw new Error(meta.error);
    }

    const player = this.page.locator("#movie_player");
    const playerBox = await player.boundingBox();
    if (playerBox) {
      await this.page.mouse.move(
        playerBox.x + playerBox.width / 2,
        playerBox.y + playerBox.height * 0.75,
      );
    }

    const bar = this.page.locator("#movie_player .ytp-progress-bar");
    let usedBar = false;
    if (await bar.isVisible().catch(() => false)) {
      const barBox = await bar.boundingBox();
      if (barBox && meta.duration > 0) {
        const fraction = meta.target / meta.duration;
        const x = Math.max(
          2,
          Math.min(barBox.width - 2, barBox.width * fraction),
        );
        await bar.click({
          position: { x, y: barBox.height / 2 },
          force: true,
        });
        usedBar = true;
      }
    }

    if (!usedBar) {
      await this.seekViaPlayerApi(meta.target, meta.wasPlaying);
    }

    let applied = await this.waitUntilNearTime(meta.target);
    if (!applied) {
      await this.seekViaWatchUrl(meta.videoId, meta.target, meta.wasPlaying);
      applied = await this.waitUntilNearTime(meta.target, 6, 15000);
    }

    if (!applied) {
      throw new Error("Seek did not apply — try again in a moment");
    }

    if (meta.wasPlaying) {
      await this.page.evaluate(() => {
        (
          document.getElementById("movie_player") as { playVideo?: () => void }
        )?.playVideo?.();
      });
    }
  }

  private async seekViaPlayerApi(
    target: number,
    wasPlaying: boolean,
  ): Promise<void> {
    await this.page.evaluate(
      ({ seekTarget, resume }) => {
        const el = document.getElementById("movie_player") as {
          seekTo?: (s: number, allowSeekAhead: boolean) => void;
          playVideo?: () => void;
        } | null;
        el?.seekTo?.(seekTarget, true);
        if (resume) {
          el?.playVideo?.();
        }
      },
      { seekTarget: target, resume: wasPlaying },
    );
  }

  private async seekViaWatchUrl(
    videoId: string,
    target: number,
    wasPlaying: boolean,
  ): Promise<void> {
    const t = Math.max(0, Math.floor(target));
    await this.page.goto(
      `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&t=${t}s`,
      { waitUntil: "domcontentloaded" },
    );
    if (!wasPlaying) {
      await this.page
        .waitForFunction(() => {
          const el = document.getElementById("movie_player") as {
            pauseVideo?: () => void;
          } | null;
          return typeof el?.pauseVideo === "function";
        })
        .catch(() => undefined);
      await this.page.evaluate(() => {
        (
          document.getElementById("movie_player") as { pauseVideo?: () => void }
        )?.pauseVideo?.();
      });
    }
  }

  private async waitUntilNearTime(
    target: number,
    tolerance = 4,
    timeoutMs = 8000,
  ): Promise<boolean> {
    try {
      await this.page.waitForFunction(
        ({ t, tol }) => {
          const el = document.getElementById("movie_player") as {
            getCurrentTime?: () => number;
          } | null;
          const cur = Math.floor(el?.getCurrentTime?.() ?? -999);
          return Math.abs(cur - t) <= tol;
        },
        { t: target, tol: tolerance },
        { timeout: timeoutMs },
      );
      return true;
    } catch {
      return false;
    }
  }

  private async runSeekOrVolume(value: number): Promise<void> {
    await this.withPage(async () => {
      try {
        const ok = await this.page.evaluate((playerValue) => {
          const el = document.getElementById("movie_player") as {
            setVolume?: (v: number) => void;
            isMuted?: () => boolean;
            unMute?: () => void;
          } | null;

          if (!el) {
            return "movie_player not found on page";
          }

          if (typeof el.setVolume !== "function") {
            return "YouTube player API unavailable (open a watch page?)";
          }
          el.setVolume(playerValue);
          if (playerValue > 0 && el.isMuted?.()) {
            el.unMute?.();
          }
          return null;
        }, value);
        if (ok) {
          throw new Error(ok);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("movie_player")) {
          throw err;
        }
        if (err instanceof Error && err.message.includes("player API")) {
          throw err;
        }
        if (isTransientPageError(err)) {
          throw new Error("YouTube page is loading, try again");
        }
        throw err;
      }
    });
  }

  private async runPlayerCommand(
    method: "playVideo" | "pauseVideo",
  ): Promise<void> {
    await this.withPage(async () => {
      try {
        const ok = await this.page.evaluate((playerMethod) => {
          const el = document.getElementById("movie_player") as {
            playVideo?: () => void;
            pauseVideo?: () => void;
          } | null;
          if (!el) {
            return "movie_player not found on page";
          }
          const fn = el[playerMethod];
          if (typeof fn !== "function") {
            return "YouTube player API unavailable (open a watch page?)";
          }
          fn.call(el);
          return null;
        }, method);
        if (ok) {
          throw new Error(ok);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("movie_player")) {
          throw err;
        }
        if (err instanceof Error && err.message.includes("player API")) {
          throw err;
        }
        if (isTransientPageError(err)) {
          throw new Error("YouTube page is loading, try again");
        }
        throw err;
      }
    });
  }
}
