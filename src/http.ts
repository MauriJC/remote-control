import fastify from "fastify";
import { registerWsGateway } from "./ws-gateway.js";
import { CommandBus, PlayerAdapter } from "./command-bus.js";

export async function build(opts: {
  authToken?: string;
  adapter: PlayerAdapter;
}) {
  const app = fastify();
  const bus = new CommandBus(opts.adapter);

  app.get("/health", async function () {
    return { status: "ok" };
  });

  await registerWsGateway(app, opts.authToken ?? "", bus);
  return app;
}
