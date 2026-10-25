import fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { registerWsGateway } from "./ws-gateway.js";
import { CommandBus, PlayerAdapter } from "./command-bus.js";
import { PlayerSession } from "./player-session.js";

export async function build(opts: {
  authToken?: string;
  adapter: PlayerAdapter;
  staticRoot?: string;
  enableStatePoll?: boolean;
}) {
  const app = fastify();
  const bus = new CommandBus(opts.adapter);
  const session = new PlayerSession(opts.adapter);

  app.get("/health", async function () {
    return { status: "ok" };
  });

  if (opts.staticRoot) {
    await app.register(fastifyStatic, {
      root: opts.staticRoot,
      prefix: "/",
    });
  }

  await registerWsGateway(app, opts.authToken ?? "", bus, session);

  if (opts.enableStatePoll) {
    session.startPolling(1000);
  }

  return { app, session };
}
