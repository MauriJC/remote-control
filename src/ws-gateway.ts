import websocket from "@fastify/websocket";
import type { FastifyInstance } from "fastify";
import { verifyToken } from "./auth.js";

export async function registerWsGateway(
  app: FastifyInstance,
  expectedToken: string,
) {
  await app.register(websocket);

  app.get("/ws", { websocket: true }, (socket, request) => {
    const query = request.query as { token?: string };
    const received = query.token ?? "";

    if (!expectedToken || !verifyToken(received, expectedToken)) {
      socket.close();
    }
  });
}
