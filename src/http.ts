import fastify from "fastify";

function build(opts = {}) {
  const app = fastify(opts);
  app.get("/health", async function () {
    return { status: "ok" };
  });

  return app;
}

export { build };
