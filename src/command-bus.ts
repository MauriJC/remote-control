import { Command } from "./protocol.js";

export type PlayerAdapter = {
  play(): Promise<void>;
  pause(): Promise<void>;
};

type QueuedCommand = {
  run: () => Promise<void>;
  resolve: () => void;
};

export class CommandBus {
  private readonly queue: QueuedCommand[] = [];
  private running = false;
  private readonly commands = new Map<string, Promise<void>>();

  constructor(private readonly adapter: PlayerAdapter) {}

  dispatch(command: Command): Promise<void> {
    const existing = this.commands.get(command.id);
    if (existing) {
      return existing;
    }

    const promise = new Promise<void>((resolve) => {
      this.queue.push({
        run: () =>
          command.name === "play" ? this.adapter.play() : this.adapter.pause(),
        resolve,
      });
      void this.runNext();
    });

    this.commands.set(command.id, promise);
    return promise;
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
    await next.run();
    next.resolve();
    this.running = false;
    await this.runNext();
  }
}
