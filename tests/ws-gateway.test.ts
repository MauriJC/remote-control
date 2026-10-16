import { describe, it, expect, vi } from "vitest";
import { WebSocket } from "ws";
import { build } from "../src/http.js";
import type { Ack, Command } from "../src/protocol.js";
import { createFakeAdapter } from "./helpers/fake-adapter.js";

const EXPECTED_TOKEN = "secret-token";

function portOf(app: {
  server: { address(): string | { port: number } | null };
}) {
  const address = app.server.address();
  if (typeof address === "object" && address) {
    return address.port;
  }
  throw new Error("server has no port");
}

/** new WebSocket() no espera: devolvemos una Promise que se cumple en `open`. */
function waitForOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once("open", () => resolve()); // Estos son eventos del websocket, son estandar de la API de websocket
    socket.once("error", reject);
  });
}

/** Los mensajes llegan como Buffer: se pasan a texto y después a objeto. */
function waitForMessage(socket: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    socket.once("message", (message) =>
      resolve(JSON.parse(message.toString())),
    );
    socket.once("error", reject);
  });
}

/** Rechazo = el server cierra el tubo. */
function waitForClose(socket: WebSocket): Promise<void> {
  if (socket.readyState === WebSocket.CLOSED) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    socket.once("close", () => resolve());
  });
}

describe("WebSocket gateway", () => {
  it("closes the socket when the token is missing or wrong", async () => {
    const app = await build({
      authToken: EXPECTED_TOKEN,
      adapter: createFakeAdapter(),
    });
    await app.listen({ port: 0, host: "127.0.0.1" });

    const socket = new WebSocket(`ws://127.0.0.1:${portOf(app)}/ws`);
    await waitForClose(socket);

    expect(socket.readyState).toBe(WebSocket.CLOSED);
    await app.close();
  });

  it("keeps the socket open when the token matches", async () => {
    const app = await build({
      authToken: EXPECTED_TOKEN,
      adapter: createFakeAdapter(),
    });
    await app.listen({ port: 0, host: "127.0.0.1" });

    const socket = new WebSocket(
      `ws://127.0.0.1:${portOf(app)}/ws?token=${EXPECTED_TOKEN}`,
    );
    await waitForOpen(socket);

    expect(socket.readyState).toBe(WebSocket.OPEN);
    socket.close();
    await waitForClose(socket);
    await app.close();
  });

  it("answers a command with a successfull ack", async () => {
    const adapter = createFakeAdapter();
    const app = await build({ authToken: EXPECTED_TOKEN, adapter });
    await app.listen({ port: 0, host: "127.0.0.1" });
    const socket = new WebSocket(
      `ws://127.0.0.1:${portOf(app)}/ws?token=${EXPECTED_TOKEN}`,
    );
    await waitForOpen(socket);

    const command: Command = { type: "command", id: "cmd-1", name: "play" };
    const reply = waitForMessage(socket);
    socket.send(JSON.stringify(command));
    const ack = await reply;

    const expectedAck: Ack = { type: "ack", id: command.id, ok: true };
    expect(ack).toEqual(expectedAck);
    expect(adapter.play).toHaveBeenCalledOnce();

    socket.close();
    await waitForClose(socket);
    await app.close();
  });

  it("answers a command with an error ack", async () => {
    const adapter = createFakeAdapter();
    adapter.play = vi
      .fn()
      .mockRejectedValue(new Error("Player exploded unexpectedly"));
    const app = await build({ authToken: EXPECTED_TOKEN, adapter });
    await app.listen({ port: 0, host: "127.0.0.1" });
    const socket = new WebSocket(
      `ws://127.0.0.1:${portOf(app)}/ws?token=${EXPECTED_TOKEN}`,
    );
    await waitForOpen(socket);

    const command: Command = { type: "command", id: "cmd-1", name: "play" };
    const reply = waitForMessage(socket);
    socket.send(JSON.stringify(command));
    const ack = await reply;

    const expectedAck: Ack = {
      type: "ack",
      id: command.id,
      ok: false,
      error: "Player exploded unexpectedly",
    };
    expect(ack).toEqual(expectedAck);
    expect(adapter.play).toHaveBeenCalledOnce();
    expect(socket.readyState).toBe(socket.OPEN);

    socket.close();
    await waitForClose(socket);
    await app.close();
  });

  it("closes the socket when the token is missing or wrong and a command is received", async () => {
    const adapter = createFakeAdapter();
    const app = await build({
      authToken: "WrongToken",
      adapter: adapter,
    });
    await app.listen({ port: 0, host: "127.0.0.1" });

    const socket = new WebSocket(`ws://127.0.0.1:${portOf(app)}/ws`);
    await waitForClose(socket);

    expect(adapter.play).not.toHaveBeenCalled();
    expect(socket.readyState).toBe(WebSocket.CLOSED);
    await app.close();
  });
});
