import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { waitForEvent } from "./wait-for-event.js";

describe("waitForEvent", () => {
  it("resolves once the event is emitted", async () => {
    const emitter = new EventEmitter();
    const wait = waitForEvent(emitter, "open");

    emitter.emit("open");

    await expect(wait).resolves.toBeUndefined();
  });

  it("resolves with the data emitted with the event", async () => {
    const emitter = new EventEmitter();
    const wait = waitForEvent(emitter, "message");

    emitter.emit("message", { text: "hola" });

    await expect(wait).resolves.toEqual({ text: "hola" });
  });

  it("error event returns the error", async () => {
    const emitter = new EventEmitter();
    const wait = waitForEvent(emitter, "message");

    emitter.emit("error", new Error("error"));

    await expect(wait).rejects.toThrow("error");
  });
});
