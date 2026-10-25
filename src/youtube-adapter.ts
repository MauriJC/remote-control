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
      const result = await this.page.evaluate((): ReadResult => {
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
        };
      });

      if ("error" in result) {
        this.cache = emptyPlayerState({ error: result.error });
        return;
      }

      this.cache = result;
    } catch (err) {
      if (isTransientPageError(err)) {
        const { error: _prev, ...rest } = this.cache;
        this.cache = { ...rest, error: "Page is loading…" };
        return;
      }

      this.cache = emptyPlayerState({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  readState(): PlayerState {
    return { ...this.cache };
  }

  /** Etapa 4: control real vía movie_player. */
  async play(): Promise<void> {
    await this.runPlayerCommand(() => {
      const el = document.getElementById("movie_player") as {
        playVideo?: () => void;
      } | null;
      el?.playVideo?.();
    });
    await this.refreshState();
  }

  async pause(): Promise<void> {
    await this.runPlayerCommand(() => {
      const el = document.getElementById("movie_player") as {
        pauseVideo?: () => void;
      } | null;
      el?.pauseVideo?.();
    });
    await this.refreshState();
  }

  private async runPlayerCommand(fn: () => void): Promise<void> {
    try {
      await this.page.evaluate(fn);
    } catch (err) {
      if (isTransientPageError(err)) {
        throw new Error("YouTube page is loading, try again");
      }
      throw err;
    }
  }
}
