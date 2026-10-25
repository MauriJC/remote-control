import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "./http.js";
import { config } from "./config.js";
import { FakeAdapter } from "./fake-adapter.js";
import { YouTubeAdapter } from "./youtube-adapter.js";
import { launchTvBrowser, resolveExtensionPaths } from "./browser.js";
import type { PlayerAdapter } from "./command-bus.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticRoot = path.join(__dirname, "../web/dist");

if (!config.authToken) {
  console.warn("AUTH_TOKEN is empty — WebSocket clients will be rejected.");
}

let browserContext: Awaited<ReturnType<typeof launchTvBrowser>> | undefined;
let adapter: PlayerAdapter;

if (config.launchBrowser) {
  const extensions = resolveExtensionPaths(
    config.projectRoot,
    config.extensionPaths,
  );
  const extensionPaths = config.loadExtensions ? extensions : [];
  if (!config.loadExtensions && extensions.length > 0) {
    console.log(
      "LOAD_EXTENSIONS not set — skipping extensions/ (stable YouTube playback).",
    );
  }
  if (
    config.playerMode === "youtube" &&
    config.loadExtensions &&
    extensions.length > 0
  ) {
    console.warn(
      "YouTube + LOAD_EXTENSIONS=true: uBO Lite often kills playback at ~40–45s " +
        "(ERR_BLOCKED_BY_CLIENT). Use LOAD_EXTENSIONS=false or BROWSER_CHANNEL=chrome with a tuned profile.",
    );
  }
  browserContext = await launchTvBrowser({
    userDataDir: config.userDataDir,
    extensionPaths,
    startUrl: config.browserStartUrl,
    browserChannel: config.browserChannel,
  });
  console.log("Chromium TV browser started (headed, persistent profile).");
}

if (config.playerMode === "youtube") {
  if (!browserContext) {
    console.error("PLAYER_MODE=youtube requires LAUNCH_BROWSER=true");
    process.exit(1);
  }
  const page = browserContext.pages()[0] ?? (await browserContext.newPage());
  const youtube = new YouTubeAdapter(page);
  await youtube.refreshState();
  adapter = youtube;
  console.log("Using YouTubeAdapter (live readState from movie_player).");
} else {
  const fake = new FakeAdapter();
  fake.loadVideo("dQw4w9WgXcQ", "Fake demo video");
  adapter = fake;
  console.log("Using FakeAdapter (simulated player).");
}

const { app, session } = await build({
  authToken: config.authToken,
  adapter,
  staticRoot: existsSync(staticRoot) ? staticRoot : undefined,
  enableStatePoll: config.playerMode === "youtube",
});

await app.listen({ port: config.port, host: "0.0.0.0" });
console.log(`Remote control listening on http://0.0.0.0:${config.port}`);

const shutdown = async () => {
  session.stopPolling();
  await app.close();
  await browserContext?.close();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
