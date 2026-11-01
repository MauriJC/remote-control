import { describe, it, expect } from "vitest";
import {
  parseWatchUrl,
  parseYouTubeWatchInput,
  buildYouTubeWatchUrl,
  parseStartTimeParam,
} from "../src/protocol.js";

describe("protocol", () => {
  it("should return the video id from a valid YouTube URL", () => {
    const link = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const parsed = parseWatchUrl(link);
    expect(parsed).toEqual({
      videoId: "dQw4w9WgXcQ",
      time: undefined,
    });
  });

  it("should return the video id from a valid YouTube URL with time", () => {
    const link = "https://www.youtube.com/watch?v=G3cz7_z2rxk&t=4633s";
    const expectedResult = {
      videoId: "G3cz7_z2rxk",
      time: 4633,
    };
    const parsed = parseWatchUrl(link);
    expect(parsed).toEqual(expectedResult);
  });
});

describe("parseYouTubeWatchInput", () => {
  it("parses bare video id", () => {
    expect(parseYouTubeWatchInput("dQw4w9WgXcQ")).toEqual({
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("parses youtu.be links", () => {
    expect(parseYouTubeWatchInput("https://youtu.be/dQw4w9WgXcQ?t=30")).toEqual({
      videoId: "dQw4w9WgXcQ",
      startSeconds: 30,
    });
  });

  it("returns null for garbage", () => {
    expect(parseYouTubeWatchInput("not-youtube")).toBeNull();
  });
});

describe("buildYouTubeWatchUrl", () => {
  it("builds watch URL with optional start", () => {
    expect(buildYouTubeWatchUrl("abc12345678", 90)).toBe(
      "https://www.youtube.com/watch?v=abc12345678&t=90s",
    );
  });
});

describe("parseStartTimeParam", () => {
  it("parses h/m/s fragments", () => {
    expect(parseStartTimeParam("1h2m3s")).toBe(3723);
  });
});
