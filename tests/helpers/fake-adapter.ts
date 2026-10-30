import { vi } from "vitest";
import type { PlayerAdapter } from "../../src/command-bus.js";
import { emptyPlayerState } from "../../src/protocol.js";

export function createFakeAdapter(): PlayerAdapter {
  let playing = false;
  return {
    play: vi.fn().mockImplementation(async () => {
      playing = true;
    }),
    pause: vi.fn().mockImplementation(async () => {
      playing = false;
    }),
    seekTo: vi.fn().mockResolvedValue(undefined),
    setVolume: vi.fn().mockResolvedValue(undefined),
    enterFullscreen: vi.fn().mockResolvedValue(undefined),
    readState: () => emptyPlayerState({ playing }),
  };
}
