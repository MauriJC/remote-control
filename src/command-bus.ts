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

  constructor(private readonly adapter: PlayerAdapter) {}

  dispatch(command: {
    type: "command";
    id: string;
    name: "play" | "pause";
  }): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push({
        run: () =>
          command.name === "play"
            ? this.adapter.play()
            : this.adapter.pause(),
        resolve,
      });
      void this.runNext();
    });
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
