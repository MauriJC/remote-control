import { describe, it, expect } from "vitest";
import { parseWatchUrl } from "../src/protocol.js";

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
// Ej de link https://www.youtube.com/watch?v=G3cz7_z2rxk&t=4633s
