import { Command } from "./protocol.js";

export type PlayerAdapter = {
  play(): Promise<void>;
  pause(): Promise<void>;
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
