import { describe, it, expect } from "vitest";
import { verifyToken } from "../src/auth.js";

describe("Authentication", () => {
  it("received token must match expected token", () => {
    const EXPECTED_AUTH_TOKEN = "1234567890";
    const RECEIVED_AUTH_TOKEN = "1234567890";

    const verifyResult = verifyToken(RECEIVED_AUTH_TOKEN, EXPECTED_AUTH_TOKEN);

    expect(verifyResult).toBe(true);
  });

  it("invalid token", () => {
    const RECEIVED_AUTH_TOKEN = "invalid-token";
    const EXPECTED_AUTH_TOKEN = "1234567890";

    const verifyResult = verifyToken(RECEIVED_AUTH_TOKEN, EXPECTED_AUTH_TOKEN);
    expect(verifyResult).toBe(false);
  });
});
