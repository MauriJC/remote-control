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

  it("a command with the same id should be processed once", async () => {
    let playCalls = 0;
    const adapter: PlayerAdapter = {
      play: async () => {
        playCalls++;
      },
      pause: async () => {},
    };

    const bus = new CommandBus(adapter);
    const playAckA = bus.dispatch({ type: "command", id: "a", name: "play" });
    const playAckB = bus.dispatch({ type: "command", id: "a", name: "play" });

    await playAckA;
    await playAckB;
    expect(playCalls).toBe(1);
    expect(playAckA).toBe(playAckB);
  });

  it("keeps the duplicate id waiting until the original command finishes", async () => {
    const playGate = deferred();
    let playCalls = 0;
    const adapter: PlayerAdapter = {
      play: () => {
        playCalls += 1;
        return playGate.promise;
      },
      pause: async () => {},
    };

    const bus = new CommandBus(adapter);
    const playAckA = bus.dispatch({ type: "command", id: "a", name: "play" });
    const playAckB = bus.dispatch({ type: "command", id: "a", name: "play" });

    expect(playAckA).toBe(playAckB);
    expect(playCalls).toBe(1);

    let duplicateSettled = false;
    void playAckB.then(() => {
      // This then is executed when the duplicate command finishes. If the promise was resolved, the duplicate command would have been executed incorrectly
      duplicateSettled = true;
    });
    await Promise.resolve();
    expect(duplicateSettled).toBe(false);

    playGate.resolve();
    await playAckA;
    await playAckB;
    expect(duplicateSettled).toBe(true);
    expect(playCalls).toBe(1);
  });
});

/**
 * TODO:
 *  Considerate the case of promise rejection. What will happen to a duplicate rejected command?
 */
