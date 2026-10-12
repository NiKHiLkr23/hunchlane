import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const clerk = vi.hoisted(() => ({
  state: "loading",
  task: null as null | { key: string },
  handleCallback: vi.fn(() => null),
}));
vi.mock("next/font/local", () => ({ default: () => ({ className: "google-font" }) }));
vi.mock("@clerk/nextjs", () => ({
  ClerkLoading: ({ children }: { children: ReactNode }) => clerk.state === "loading" ? children : null,
  ClerkLoaded: ({ children }: { children: ReactNode }) => clerk.state === "loaded" ? children : null,
  ClerkFailed: ({ children }: { children: ReactNode }) => clerk.state === "failed" ? children : null,
  useSession: () => ({ session: { currentTask: clerk.task } }),
  HandleSSOCallback: clerk.handleCallback,
  TaskChooseOrganization: () => createElement("div", null, "Choose organization"),
  TaskResetPassword: () => createElement("div", null, "Reset password"),
  TaskSetupMFA: () => createElement("div", null, "Set up MFA"),
}));

import { AuthCallback } from "../src/components/auth-callback";
import { GoogleLoadingButton } from "../src/components/auth-content";

function renderCallback() {
  return renderToStaticMarkup(createElement(AuthCallback, {
    destination: "/new",
    loadingButton: createElement(GoogleLoadingButton),
  }));
}

describe("Google sign-in callback", () => {
  beforeEach(() => {
    clerk.state = "loading";
    clerk.task = null;
    clerk.handleCallback.mockClear();
  });

  it.each(["loading", "loaded"])("shows only the busy Google action during %s", state => {
    clerk.state = state;
    const html = renderCallback();
    expect(html).toContain("Continue with Google");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
    expect(html).toContain("spinner");
    expect(html).not.toMatch(/<h1\b|<p\b|Back to sign-in|ONE MOMENT/);
    expect(clerk.handleCallback).toHaveBeenCalledTimes(state === "loaded" ? 1 : 0);
  });

  it("preserves error recovery and the idea return path", () => {
    clerk.state = "failed";
    const html = renderCallback();
    expect(html).toContain('role="alert"');
    expect(html).toContain("Back to sign-in");
    expect(html).toContain("/sign-in?redirect_url=%2Fnew");
    expect(html).not.toContain("spinner");
  });

  it("keeps provider-required account verification available", () => {
    clerk.state = "loaded";
    clerk.task = { key: "setup-mfa" };
    expect(renderCallback()).toContain("Set up MFA");
    expect(clerk.handleCallback).not.toHaveBeenCalled();
  });
});
