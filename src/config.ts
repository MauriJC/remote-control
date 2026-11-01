import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const launchBrowser = process.env.LAUNCH_BROWSER === "true";

function parsePlaybackQualityCap(raw: string | undefined): number | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return undefined;
  }
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 144 || n > 4320) {
    console.warn(
      `Invalid PLAYBACK_QUALITY_CAP="${trimmed}" — use 480, 720, 1080, or omit for Auto.`,
    );
    return undefined;
  }
  return n;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  authToken: process.env.AUTH_TOKEN ?? "",
  userDataDir:
    process.env.USER_DATA_DIR ??
    path.join(projectRoot, "data", "chromium-profile"),
  launchBrowser,
  browserStartUrl: process.env.BROWSER_START_URL ?? "https://www.youtube.com",
  extensionPaths: process.env.EXTENSION_PATHS,
  /** Opt-in: uBO via --load-extension breaks YouTube ~40s on Playwright Chromium (see extensions/README). */
  loadExtensions: process.env.LOAD_EXTENSIONS === "true",
  /** Installed browser: chrome | msedge | chromium (default). Store installs need chrome/msedge. */
  browserChannel: process.env.BROWSER_CHANNEL?.trim() || undefined,
  /** Optional max height (480, 720, …). Omit = YouTube Auto. */
  playbackQualityCap: parsePlaybackQualityCap(process.env.PLAYBACK_QUALITY_CAP),
  projectRoot,
  /** fake = RAM simulator; youtube = read state from browser (Etapa 3+) */
  playerMode:
    process.env.PLAYER_MODE ??
    (launchBrowser ? "youtube" : "fake"),
};
