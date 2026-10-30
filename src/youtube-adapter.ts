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

export class YouTubeAdapter implements PlayerAdapter {
  private cache: PlayerState = emptyPlayerState({
    error: "Player state not loaded yet",
  });

  constructor(private readonly page: Page) {}

  async refreshState(): Promise<void> {
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

        const ytpError = document.querySelector(
          ".ytp-error, .ytp-error-content, .html5-video-player.ytp-error",
        );
        const ytpErrorText = (ytpError?.textContent ?? "").trim().slice(0, 160);

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
  }

  readState(): PlayerState {
    return { ...this.cache };
  }

  /** Etapa 4: control real vía movie_player. */
  async play(): Promise<void> {
    await this.runPlayerCommand("playVideo");
    await this.refreshState();
  }

  async pause(): Promise<void> {
    await this.runPlayerCommand("pauseVideo");
    await this.refreshState();
  }

  private async runPlayerCommand(
    method: "playVideo" | "pauseVideo",
  ): Promise<void> {
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
  }
}
