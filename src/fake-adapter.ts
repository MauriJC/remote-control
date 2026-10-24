import type { PlayerAdapter } from "./command-bus.js";
import { emptyPlayerState, type PlayerState } from "./protocol.js";

/** Simulated YouTube player in RAM (Etapa 1). */
export class FakeAdapter implements PlayerAdapter {
  private state: PlayerState = emptyPlayerState();

  async play(): Promise<void> {
    this.state = { ...this.state, playing: true, error: undefined };
  }

  async pause(): Promise<void> {
    this.state = { ...this.state, playing: false };
  }

  readState(): PlayerState {
    return { ...this.state };
  }

  /** For tests / demo: load a fake video id and title. */
  loadVideo(videoId: string, title?: string): void {
    this.state = {
      ...this.state,
      videoId,
      title: title ?? `Video ${videoId}`,
      duration: 120,
      currentTime: 0,
    };
  }
}
