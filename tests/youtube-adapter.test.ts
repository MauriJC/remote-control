import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import {
  YouTubeAdapter,
  buildYouTubeSeekUrl,
  capToYouTubeQualityLabel,
} from "../src/youtube-adapter.js";

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "fake-player.html",
);

describe("capToYouTubeQualityLabel", () => {
  it("maps cap pixels to YouTube labels", () => {
    expect(capToYouTubeQualityLabel(480)).toBe("large");
    expect(capToYouTubeQualityLabel(720)).toBe("hd720");
  });
});

describe("buildYouTubeSeekUrl", () => {
  it("builds a watch URL with t= when no current href", () => {
    expect(buildYouTubeSeekUrl("abc123", 90)).toBe(
      "https://www.youtube.com/watch?v=abc123&t=90s",
    );
  });

  it("updates t= on an existing watch URL and keeps list params", () => {
    const href =
      "https://www.youtube.com/watch?v=abc123&list=PLtest&index=2";
    expect(buildYouTubeSeekUrl("abc123", 45, href)).toBe(
      "https://www.youtube.com/watch?v=abc123&list=PLtest&index=2&t=45s",
    );
  });
});

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

  beforeEach(async () => {
    await page.evaluate(() => {
      const w = window as unknown as {
        __setPlaying: (v: boolean) => void;
        __setAdShowing: (v: boolean) => void;
        __setSkipButton: (v: boolean) => void;
      };
      w.__setPlaying(true);
      w.__setAdShowing(false);
      w.__setSkipButton(false);
    });
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
    expect(state.adPlaying).toBe(false);
    expect(state.adSkippable).toBe(false);
  });

  it("sets adPlaying when the fixture has ad-showing", async () => {
    await page.evaluate(() => {
      (window as unknown as { __setAdShowing: (v: boolean) => void }).__setAdShowing(
        true,
      );
    });

    const adapter = new YouTubeAdapter(page);
    await adapter.refreshState();

    expect(adapter.readState().adPlaying).toBe(true);
    expect(adapter.readState().adSkippable).toBe(false);
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
      buffering: false,
      title: "Held title",
      videoId: "abc",
      currentTime: 1,
      duration: 100,
      volume: 50,
      adPlaying: false,
      adSkippable: false,
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

  it("play() calls playVideo on the fixture player", async () => {
    await page.evaluate(() => {
      (window as unknown as { __setPlaying: (v: boolean) => void }).__setPlaying(
        false,
      );
    });

    const adapter = new YouTubeAdapter(page);
    await adapter.play();

    expect(adapter.readState().playing).toBe(true);
  });

  it("pause() calls pauseVideo on the fixture player", async () => {
    const adapter = new YouTubeAdapter(page);
    await adapter.pause();

    expect(adapter.readState().playing).toBe(false);
  });

  it("seekTo() updates currentTime on the fixture player", async () => {
    const adapter = new YouTubeAdapter(page);
    await adapter.seekTo(55);

    expect(adapter.readState().currentTime).toBe(55);
  });

  it("setVolume() updates volume on the fixture player", async () => {
    const adapter = new YouTubeAdapter(page);
    await adapter.setVolume(80);

    expect(adapter.readState().volume).toBe(80);
  });

  it("sets error when movie_player is missing", async () => {
    const blank = await browser.newPage();
    await blank.setContent("<html><body></body></html>");

    const adapter = new YouTubeAdapter(blank);
    await adapter.refreshState();

    expect(adapter.readState().error).toMatch(/movie_player not found/i);
    expect(adapter.readState().adSkippable).toBe(false);
    await blank.close();
  });

  it("sets adSkippable when the fixture has a visible skip button", async () => {
    await page.evaluate(() => {
      (window as unknown as { __setSkipButton: (v: boolean) => void }).__setSkipButton(
        true,
      );
    });

    const adapter = new YouTubeAdapter(page);
    await adapter.refreshState();

    expect(adapter.readState().adSkippable).toBe(true);
  });

  it("skipAd clicks the fixture skip button", async () => {
    await page.evaluate(() => {
      (window as unknown as { __setSkipButton: (v: boolean) => void }).__setSkipButton(
        true,
      );
    });

    const adapter = new YouTubeAdapter(page);
    await adapter.skipAd();

    const clicks = await page.evaluate(
      () => (window as unknown as { __skipClicks: number }).__skipClicks,
    );
    expect(clicks).toBe(1);
  });

  it("skipAd rejects when the fixture has no skip button", async () => {
    const adapter = new YouTubeAdapter(page);
    await expect(adapter.skipAd()).rejects.toThrow(
      "No se puede saltar el anuncio",
    );
  });
});
