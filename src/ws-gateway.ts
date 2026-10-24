import websocket from "@fastify/websocket";
import { WebSocket } from "ws";
import type { FastifyInstance } from "fastify";
import { verifyToken } from "./auth.js";
import { CommandBus } from "./command-bus.js";
import { PlayerSession } from "./player-session.js";
import { Ack, Command } from "./protocol.js";

export async function registerWsGateway(
  app: FastifyInstance,
  expectedToken: string,
  bus: CommandBus,
  session: PlayerSession,
) {
  await app.register(websocket);

  const clients = new Set<WebSocket>();

  const broadcast = (payload: string) => {
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  };

  app.get("/ws", { websocket: true }, (socket, request) => {
    const query = request.query as { token?: string };
    const received = query.token ?? "";

    if (!expectedToken || !verifyToken(received, expectedToken)) {
      socket.close();
      return;
    }

    clients.add(socket);
    socket.send(JSON.stringify(session.stateMessage()));

    socket.on("close", () => {
      clients.delete(socket);
    });

    socket.on("message", async (data) => {
      const command = JSON.parse(data.toString()) as Command;
      const result = await bus.dispatch(command);
      const ack: Ack = {
        type: "ack",
        id: command.id,
        ...result,
      };
      socket.send(JSON.stringify(ack));

      if (result.ok) {
        broadcast(JSON.stringify(session.stateMessage()));
      }
    });
  });
}
