import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { chromium, type BrowserContext } from "playwright";

export type TvBrowserOptions = {
  userDataDir: string;
  extensionPaths: string[];
  startUrl?: string;
};

/** Headed Chromium on the TV monitor; profile and extensions persist in userDataDir. */
export async function launchTvBrowser(
  opts: TvBrowserOptions,
): Promise<BrowserContext> {
  const extensions = opts.extensionPaths
    .filter((p) => existsSync(path.join(p, "manifest.json")))
    .map((p) => path.resolve(p));

  const args: string[] = [];

  if (extensions.length > 0) {
    const list = extensions.join(",");
    args.push(`--disable-extensions-except=${list}`, `--load-extension=${list}`);
    console.log("Loading extensions:", extensions);
  } else if (opts.extensionPaths.length > 0) {
    console.warn(
      "No valid extension folders (need manifest.json). Checked:",
      opts.extensionPaths,
    );
  }

  const context = await chromium.launchPersistentContext(opts.userDataDir, {
    headless: false,
    args,
    viewport: null,
  });

  const pages = context.pages();
  const page = pages[0] ?? (await context.newPage());
  if (opts.startUrl) {
    await page.goto(opts.startUrl, { waitUntil: "domcontentloaded" });
  }

  return context;
}

export function resolveExtensionPaths(
  rootDir: string,
  envPaths: string | undefined,
): string[] {
  if (envPaths?.trim()) {
    return envPaths
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => (path.isAbsolute(p) ? p : path.join(rootDir, p)));
  }

  const extensionsDir = path.join(rootDir, "extensions");
  if (!existsSync(extensionsDir)) {
    return [];
  }

  return readdirSync(extensionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(extensionsDir, entry.name))
    .filter((dir) => existsSync(path.join(dir, "manifest.json")));
}
