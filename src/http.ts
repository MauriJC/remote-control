"use strict";

import fastify from "fastify";

export function build(opts = {}) {
  const app = fastify(opts);
  app.get("/health", async function (request, reply) {
    return { status: "200" };
  });

  return app;
}

export default build;
