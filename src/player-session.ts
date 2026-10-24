import type { PlayerAdapter } from "./command-bus.js";
import { type StateMessage } from "./protocol.js";

/** Holds current player view and builds state messages for the gateway. */
export class PlayerSession {
  constructor(private readonly adapter: PlayerAdapter) {}

  stateMessage(): StateMessage {
    return { type: "state", ...this.adapter.readState() };
  }
}
