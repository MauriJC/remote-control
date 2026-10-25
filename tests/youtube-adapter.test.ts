import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import { YouTubeAdapter } from "../src/youtube-adapter.js";

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "fake-player.html",
);

describe("YouTubeAdapter", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    await page.goto(`file://${fixturePath}`);
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
  });

  it("reads title, playing and time from movie_player", async () => {
    const adapter = new YouTubeAdapter(page);
    await adapter.refreshState();
    const state = adapter.readState();

    expect(state.error).toBeUndefined();
    expect(state.title).toBe("Fixture Video");
    expect(state.videoId).toBe("fake123");
    expect(state.playing).toBe(true);
    expect(state.currentTime).toBe(12);
    expect(state.duration).toBe(180);
    expect(state.volume).toBe(42);
  });

  it("reflects pause when the fixture player changes", async () => {
    await page.evaluate(() => {
      (window as unknown as { __setPlaying: (v: boolean) => void }).__setPlaying(
        false,
      );
    });

    const adapter = new YouTubeAdapter(page);
    await adapter.refreshState();

    expect(adapter.readState().playing).toBe(false);
  });

  it("keeps last state when navigation destroys the execution context", async () => {
    const goodState = {
      playing: true,
      title: "Held title",
      videoId: "abc",
      currentTime: 1,
      duration: 100,
      volume: 50,
      adPlaying: false,
      quality: "720p",
    };

    const evaluate = vi
      .fn()
      .mockResolvedValueOnce(goodState)
      .mockRejectedValueOnce(
        new Error(
          "Execution context was destroyed, most likely because of a navigation",
        ),
      );

    const mockPage = { evaluate } as unknown as Page;
    const adapter = new YouTubeAdapter(mockPage);

    await adapter.refreshState();
    expect(adapter.readState().title).toBe("Held title");

    await adapter.refreshState();
    expect(adapter.readState().title).toBe("Held title");
    expect(adapter.readState().error).toMatch(/loading/i);
  });

  it("sets error when movie_player is missing", async () => {
    const blank = await browser.newPage();
    await blank.setContent("<html><body></body></html>");

    const adapter = new YouTubeAdapter(blank);
    await adapter.refreshState();

    expect(adapter.readState().error).toMatch(/movie_player not found/i);
    await blank.close();
  });
});
