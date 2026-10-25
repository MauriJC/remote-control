import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

export const config = {
  port: Number(process.env.PORT ?? 3000),
  authToken: process.env.AUTH_TOKEN ?? "",
  userDataDir:
    process.env.USER_DATA_DIR ??
    path.join(projectRoot, "data", "chromium-profile"),
  launchBrowser: process.env.LAUNCH_BROWSER === "true",
  browserStartUrl: process.env.BROWSER_START_URL ?? "https://www.youtube.com",
  extensionPaths: process.env.EXTENSION_PATHS,
  projectRoot,
};
