import websocket from "@fastify/websocket";
import type { FastifyInstance } from "fastify";
import { verifyToken } from "./auth.js";
import { CommandBus } from "./command-bus.js";
import { Ack, Command } from "./protocol.js";

export async function registerWsGateway(
  app: FastifyInstance,
  expectedToken: string,
  bus: CommandBus,
) {
  await app.register(websocket);

  app.get("/ws", { websocket: true }, (socket, request) => {
    const query = request.query as { token?: string };
    const received = query.token ?? "";

    if (!expectedToken || !verifyToken(received, expectedToken)) {
      socket.close();
      return;
    }
    socket.on("message", async (data) => {
      const command = JSON.parse(data.toString()) as Command;
      const result = await bus.dispatch(command);
      const ack: Ack = {
        type: "ack",
        id: command.id,
        ...result,
      };
      socket.send(JSON.stringify(ack)); // objeto → string
    });
  });
}
