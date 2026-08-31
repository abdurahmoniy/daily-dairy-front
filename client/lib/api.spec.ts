import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "./api";

describe("resolveApiBaseUrl", () => {
  it("uses the Daily Dairy backend when no API URL is configured", () => {
    expect(resolveApiBaseUrl()).toBe(
      "https://daily-dairy-backend.netlify.app/api",
    );
  });

  it("normalizes configured API URLs to include the /api suffix once", () => {
    expect(resolveApiBaseUrl("https://example.com")).toBe(
      "https://example.com/api",
    );
    expect(resolveApiBaseUrl("https://example.com/api")).toBe(
      "https://example.com/api",
    );
  });
});
