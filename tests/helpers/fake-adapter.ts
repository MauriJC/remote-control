import { vi } from "vitest";
import type { PlayerAdapter } from "../../src/command-bus.js";

export function createFakeAdapter(): PlayerAdapter {
  return {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn().mockResolvedValue(undefined),
  };
}
