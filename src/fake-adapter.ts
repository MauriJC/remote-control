import type { PlayerAdapter } from "./command-bus.js";
import {
  emptyPlayerState,
  parseYouTubeWatchInput,
  type PlayerState,
} from "./protocol.js";

/** Simulated YouTube player in RAM (Etapa 1). */
export class FakeAdapter implements PlayerAdapter {
  private state: PlayerState = emptyPlayerState();

  async play(): Promise<void> {
    this.state = { ...this.state, playing: true, error: undefined };
  }

  async pause(): Promise<void> {
    this.state = { ...this.state, playing: false };
  }

  async seekTo(seconds: number): Promise<void> {
    const duration = this.state.duration || 0;
    const clamped =
      duration > 0
        ? Math.max(0, Math.min(seconds, duration))
        : Math.max(0, seconds);
    this.state = { ...this.state, currentTime: Math.floor(clamped) };
  }

  async setVolume(volume: number): Promise<void> {
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    this.state = { ...this.state, volume: clamped };
  }

  async enterFullscreen(): Promise<void> {
    /* no-op in RAM simulator */
  }

  async openWatchUrl(input: string): Promise<void> {
    const parsed = parseYouTubeWatchInput(input);
    if (!parsed) {
      throw new Error("Invalid YouTube URL or video id");
    }
    this.loadVideo(parsed.videoId);
    if (parsed.startSeconds !== undefined) {
      await this.seekTo(parsed.startSeconds);
    }
    this.state = { ...this.state, playing: true, error: undefined };
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
