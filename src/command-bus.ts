export type PlayerAdapter = {
  play(): Promise<void>;
  pause(): Promise<void>;
};

export class CommandBus {
  constructor(private readonly adapter: PlayerAdapter) {}

  dispatch(_command: {
    type: "command";
    id: string;
    name: "play" | "pause";
  }): Promise<void> {
    throw new Error("not implemented");
  }
}
