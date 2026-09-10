import { describe, it, expect } from "vitest";
import { WebSocket } from "ws";
import { build } from "../src/http.js";

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
    const app = await build({ authToken: EXPECTED_TOKEN });
    await app.listen({ port: 0, host: "127.0.0.1" });

    const socket = new WebSocket(`ws://127.0.0.1:${portOf(app)}/ws`);
    await waitForClose(socket);

    expect(socket.readyState).toBe(WebSocket.CLOSED);
    await app.close();
  });

  it("keeps the socket open when the token matches", async () => {
    const app = await build({ authToken: EXPECTED_TOKEN });
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
});
