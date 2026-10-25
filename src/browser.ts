import { existsSync } from "node:fs";
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
  const extensions = opts.extensionPaths.filter((p) => existsSync(p));
  const args: string[] = [];

  if (extensions.length > 0) {
    const list = extensions.join(",");
    args.push(`--disable-extensions-except=${list}`, `--load-extension=${list}`);
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

  const defaults = [
    path.join(rootDir, "extensions", "ublock-origin"),
    path.join(rootDir, "extensions", "h264ify"),
  ];
  return defaults.filter((p) => existsSync(p));
}
