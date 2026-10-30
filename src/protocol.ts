type CommandBase = {
  type: "command";
  id: string;
};

export type Command =
  | (CommandBase & { name: "play" | "pause" })
  | (CommandBase & { name: "seek"; seconds: number })
  | (CommandBase & { name: "setVolume"; volume: number })
  | (CommandBase & { name: "fullscreen" });

export type Ack = {
  type: "ack";
  id: string;
  ok: boolean;
  error?: string;
};

export type PlayerState = {
  playing: boolean;
  title: string;
  videoId: string;
  currentTime: number;
  duration: number;
  volume: number;
  adPlaying: boolean;
  quality: string;
  error?: string;
};

export type StateMessage = { type: "state" } & PlayerState;

export type ServerMessage = Ack | StateMessage;

export const emptyPlayerState = (
  overrides: Partial<PlayerState> = {},
): PlayerState => ({
  playing: false,
  title: "Fake player",
  videoId: "",
  currentTime: 0,
  duration: 0,
  volume: 50,
  adPlaying: false,
  quality: "480p",
  ...overrides,
});

export const parseWatchUrl = (url: string) => {
  const urlObj = new URL(url);
  const searchParams = urlObj.searchParams;
  const videoId = searchParams.get("v");
  const time = searchParams.get("t");
  return {
    videoId,
    time: time ? parseInt(time) : undefined,
  };
};
