import { Command, type PlayerState } from "./protocol.js";

export type PlayerAdapter = {
  play(): Promise<void>;
  pause(): Promise<void>;
  seekTo(seconds: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  enterFullscreen(): Promise<void>;
  readState(): PlayerState;
};

type QueuedCommand = {
  run: () => Promise<void>;
  resolve: (result: CommandResult) => void;
};

type CommandResult = { ok: true } | { ok: false; error: string };
type CommandPromise = Promise<CommandResult>;

export class CommandBus {
  private readonly queue: QueuedCommand[] = [];
  private running = false;
  private readonly commands = new Map<string, CommandPromise>();

  constructor(private readonly adapter: PlayerAdapter) {}

  dispatch(command: Command): CommandPromise {
    const existing = this.commands.get(command.id);
    if (existing) {
      return existing;
    }

    const promise = new Promise<CommandResult>((resolve) => {
      this.queue.push({
        run: () => this.runCommand(command),
        resolve,
      });
      void this.runNext();
    });

    this.commands.set(command.id, promise);
    return promise;
  }

  private runCommand(command: Command): Promise<void> {
    switch (command.name) {
      case "play":
        return this.adapter.play();
      case "pause":
        return this.adapter.pause();
      case "seek":
        return this.adapter.seekTo(command.seconds);
      case "setVolume":
        return this.adapter.setVolume(command.volume);
      case "fullscreen":
        return this.adapter.enterFullscreen();
      default: {
        const _exhaustive: never = command;
        return Promise.reject(new Error("Unknown command"));
      }
    }
  }

  private async runNext(): Promise<void> {
    if (this.running) {
      return;
    }

    const next = this.queue.shift();
    if (!next) {
      return;
    }

    this.running = true;
    try {
      await next.run();
      next.resolve({ ok: true });
    } catch (error) {
      next.resolve({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.running = false;
    }
    await this.runNext();
  }
}
