import type { PlayerAdapter } from "./command-bus.js";
import { type PlayerState, type StateMessage } from "./protocol.js";

type PollableAdapter = PlayerAdapter & {
  refreshState(): Promise<void>;
};

function isPollable(adapter: PlayerAdapter): adapter is PollableAdapter {
  return typeof (adapter as PollableAdapter).refreshState === "function";
}

function snapshotKey(state: PlayerState): string {
  return JSON.stringify({
    ...state,
    currentTime: Math.floor(state.currentTime),
  });
}

/** Holds player view, polls for changes, notifies gateway to broadcast. */
export class PlayerSession {
  private lastKey: string | null = null;
  private pollTimer: ReturnType<typeof setInterval> | undefined;
  private broadcastState?: () => void;

  constructor(private readonly adapter: PlayerAdapter) {}

  attachBroadcaster(broadcastState: () => void): void {
    this.broadcastState = broadcastState;
  }

  stateMessage(): StateMessage {
    return { type: "state", ...this.adapter.readState() };
  }

  startPolling(intervalMs = 1000): void {
    if (!isPollable(this.adapter)) {
      return;
    }

    void this.pollOnce();

    this.pollTimer = setInterval(() => {
      void this.pollOnce();
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  private async pollOnce(): Promise<void> {
    if (!isPollable(this.adapter)) {
      return;
    }

    try {
      await this.adapter.refreshState();
    } catch {
      return;
    }

    const key = snapshotKey(this.adapter.readState());
    if (key === this.lastKey) {
      return;
    }

    this.lastKey = key;
    this.broadcastState?.();
  }
}
