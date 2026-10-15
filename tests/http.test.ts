import { describe, it, expect } from "vitest";

import { build } from "../src/http.js";
import { createFakeAdapter } from "./helpers/fake-adapter.js";

describe("HTTP", () => {
  it("should return 200 OK", async () => {
    const app = await build({ adapter: createFakeAdapter() });

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    await app.close();
  });
});
