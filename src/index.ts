import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "./http.js";
import { config } from "./config.js";
import { FakeAdapter } from "./fake-adapter.js";
import { launchTvBrowser, resolveExtensionPaths } from "./browser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticRoot = path.join(__dirname, "../web/dist");

const adapter = new FakeAdapter();
adapter.loadVideo("dQw4w9WgXcQ", "Fake demo video");

if (!config.authToken) {
  console.warn("AUTH_TOKEN is empty — WebSocket clients will be rejected.");
}

let browserContext: Awaited<ReturnType<typeof launchTvBrowser>> | undefined;

if (config.launchBrowser) {
  const extensions = resolveExtensionPaths(
    config.projectRoot,
    config.extensionPaths,
  );
  browserContext = await launchTvBrowser({
    userDataDir: config.userDataDir,
    extensionPaths: extensions,
    startUrl: config.browserStartUrl,
  });
  console.log("Chromium TV browser started (headed, persistent profile).");
}

const app = await build({
  authToken: config.authToken,
  adapter,
  staticRoot: existsSync(staticRoot) ? staticRoot : undefined,
});

await app.listen({ port: config.port, host: "0.0.0.0" });
console.log(`Remote control listening on http://0.0.0.0:${config.port}`);

const shutdown = async () => {
  await app.close();
  await browserContext?.close();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
