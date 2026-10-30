import type { Ack, Command, PlayerState, StateMessage } from "@protocol";

export type RemoteClientHandlers = {
  onState(state: PlayerState): void;
  onAck?(ack: Ack): void;
  onStatus?(text: string): void;
};

export type OutgoingCommand =
  | { name: "play" | "pause" }
  | { name: "seek"; seconds: number }
  | { name: "setVolume"; volume: number }
  | { name: "fullscreen" };

type WebSocketFactory = (url: string) => WebSocket;

let commandCounter = 0;

function nextCommandId(): string {
  commandCounter += 1;
  return `cmd-${commandCounter}`;
}

export class RemoteClient {
  private socket: WebSocket | null = null;

  constructor(
    private readonly createSocket: WebSocketFactory = (url) => new WebSocket(url),
    private readonly handlers: RemoteClientHandlers,
  ) {}

  connect(token: string): void {
    this.disconnect();
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
    this.handlers.onStatus?.("Connecting…");

    const socket = this.createSocket(url);
    this.socket = socket;

    socket.addEventListener("open", () => {
      this.handlers.onStatus?.("Connected");
    });

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(String(event.data)) as Ack | StateMessage;
      if (data.type === "state") {
        const { type: _t, ...state } = data;
        this.handlers.onState(state);
        return;
      }
      if (data.type === "ack") {
        this.handlers.onAck?.(data);
      }
    });

    socket.addEventListener("close", () => {
      this.handlers.onStatus?.("Disconnected");
      if (this.socket === socket) {
        this.socket = null;
      }
    });

    socket.addEventListener("error", () => {
      this.handlers.onStatus?.("Connection error");
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  get connected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  sendCommand(payload: OutgoingCommand): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    const command = {
      type: "command",
      id: nextCommandId(),
      ...payload,
    } as Command;
    this.socket.send(JSON.stringify(command));
  }
}
