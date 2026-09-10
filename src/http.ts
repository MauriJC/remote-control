import fastify from "fastify";
import { registerWsGateway } from "./ws-gateway.js";

export async function build(opts: { authToken?: string } = {}) {
  const app = fastify();

  app.get("/health", async function () {
    return { status: "ok" };
  });

  await registerWsGateway(app, opts.authToken ?? "");
  return app;
}
