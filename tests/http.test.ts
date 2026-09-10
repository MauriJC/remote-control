import { describe, it, expect } from "vitest";

// This will be created later
import { build } from "../src/http.js";

describe("HTTP", () => {
  it("should return 200 OK", async () => {
    const app = build();

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    await app.close();
  });
});
