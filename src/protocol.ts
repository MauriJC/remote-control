type CommandBase = {
  type: "command";
  id: string;
};

export type Command =
  | (CommandBase & { name: "play" | "pause" })
  | (CommandBase & { name: "seek"; seconds: number })
  | (CommandBase & { name: "setVolume"; volume: number })
  | (CommandBase & { name: "fullscreen" })
  | (CommandBase & { name: "openUrl"; url: string });

export type Ack = {
  type: "ack";
  id: string;
  ok: boolean;
  error?: string;
};

export type PlayerState = {
  playing: boolean;
  buffering: boolean;
  title: string;
  videoId: string;
  currentTime: number;
  duration: number;
  volume: number;
  adPlaying: boolean;
  adSkippable: boolean;
  quality: string;
  error?: string;
};

export type StateMessage = { type: "state" } & PlayerState;

export type ServerMessage = Ack | StateMessage;

export const emptyPlayerState = (
  overrides: Partial<PlayerState> = {},
): PlayerState => ({
  playing: false,
  buffering: false,
  title: "Fake player",
  videoId: "",
  currentTime: 0,
  duration: 0,
  volume: 50,
  adPlaying: false,
  adSkippable: false,
  quality: "480p",
  ...overrides,
});

export type ParsedYouTubeWatch = {
  videoId: string;
  startSeconds?: number;
};

const YOUTUBE_VIDEO_ID = /^[\w-]{11}$/;

/** Bare pasted ids only; URLs still use {@link YOUTUBE_VIDEO_ID}. */
function looksLikeBareYouTubeVideoId(id: string): boolean {
  if (!YOUTUBE_VIDEO_ID.test(id)) {
    return false;
  }
  if (/^[a-z]+(-[a-z]+)+$/.test(id)) {
    return false;
  }
  return true;
}

/** Parse watch URL, youtu.be, or bare 11-char video id. */
export function parseYouTubeWatchInput(input: string): ParsedYouTubeWatch | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (looksLikeBareYouTubeVideoId(trimmed)) {
    return { videoId: trimmed };
  }

  try {
    let href = trimmed;
    if (!/^https?:\/\//i.test(href)) {
      href = `https://${href}`;
    }
    const url = new URL(href);
    let videoId: string | null = null;

    const host = url.hostname.replace(/^www\./i, "");
    if (host === "youtu.be") {
      videoId = url.pathname.replace(/^\//, "").split("/")[0] || null;
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      videoId = url.searchParams.get("v");
      if (!videoId && url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.split("/")[2] ?? null;
      }
    }

    if (!videoId || !YOUTUBE_VIDEO_ID.test(videoId)) {
      return null;
    }

    const tParam =
      url.searchParams.get("t") ??
      url.searchParams.get("start") ??
      url.hash.match(/[#&]t=(\d+)/)?.[1];
    const startSeconds = parseStartTimeParam(tParam ?? undefined);

    return { videoId, startSeconds };
  } catch {
    return null;
  }
}

export function parseStartTimeParam(raw: string | undefined): number | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  const t = raw.trim();
  const plain = t.match(/^(\d+)s?$/i);
  if (plain) {
    return parseInt(plain[1], 10);
  }
  let total = 0;
  const h = t.match(/(\d+)h/i);
  const m = t.match(/(\d+)m/i);
  const s = t.match(/(\d+)s/i);
  if (h) total += parseInt(h[1], 10) * 3600;
  if (m) total += parseInt(m[1], 10) * 60;
  if (s) total += parseInt(s[1], 10);
  return total > 0 ? total : undefined;
}

export function buildYouTubeWatchUrl(
  videoId: string,
  startSeconds?: number,
): string {
  let url = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  if (startSeconds !== undefined && startSeconds > 0) {
    url += `&t=${Math.floor(startSeconds)}s`;
  }
  return url;
}

/** @deprecated use parseYouTubeWatchInput */
export const parseWatchUrl = (url: string) => {
  const parsed = parseYouTubeWatchInput(url);
  return {
    videoId: parsed?.videoId ?? null,
    time: parsed?.startSeconds,
  };
};
