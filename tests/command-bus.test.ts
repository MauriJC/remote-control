import { describe, it, expect } from "vitest";
import { CommandBus } from "../src/command-bus.js";
import type { PlayerAdapter } from "../src/command-bus.js";

/** Promise que no termina hasta que llames a resolve(). */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("CommandBus", () => {
  it("does not start the second command until the first one finishes", async () => {
    const playGate = deferred();
    let pauseCalls = 0;

    // Este mock de momento simula el comportamiento de un reproductor de video.
    const adapter: PlayerAdapter = {
      play: () => playGate.promise,
      pause: async () => {
        pauseCalls += 1;
      },
    };

    const bus = new CommandBus(adapter);

    // Los dos comandos llegan juntos, como dos toques rápidos en el teléfono.
    const playAck = bus.dispatch({ type: "command", id: "a", name: "play" });
    const pauseAck = bus.dispatch({ type: "command", id: "b", name: "pause" });

    // play todavía no terminó → pause NO tiene que haber corrido.
    expect(pauseCalls).toBe(0);

    // Recién ahora "YouTube" termina el play.
    playGate.resolve();
    await playAck;
    await pauseAck;

    // El bus soltó el carril: ahora sí pause.
    expect(pauseCalls).toBe(1);
  });
});
