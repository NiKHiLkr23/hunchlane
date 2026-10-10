import { describe, expect, it } from "vitest";
import { authDestination, authRoute } from "../src/lib/auth-navigation";

describe("authentication return navigation", () => {
  it("returns drafts to review and preserves owned report routes without starting research", () => {
    expect(authDestination("/new")).toBe("/new");
    const report = "/reports/d8494248-cbe7-4b14-9a4d-1dad6dfc4d1d";
    expect(authDestination(report)).toBe(report);
    expect(authRoute("/sso-callback", "/new")).toBe("/sso-callback?redirect_url=%2Fnew");
    expect(authRoute("/sign-up", "/new", true)).toBe("/sign-up?redirect_url=%2Fnew&verify=1");
  });
  it("rejects external URLs, ambiguous parameters, auth loops and unrecognized paths", () => {
    for (const value of [undefined, ["/new", "//evil.example"], "https://evil.example", "//evil.example", "/\\evil.example", "/%2f%2fevil.example", "/new?redirect_url=https://evil.example", "/new\n", "/sign-in", "/api/runs", "/reports/not-an-id", "/new/../sign-in"]) {
      expect(authDestination(value)).toBe("/library");
    }
    expect(authRoute("/sign-in", "https://evil.example")).toBe("/sign-in?redirect_url=%2Flibrary");
  });
});
