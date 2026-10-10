// Only destinations the app can return to after authentication. Never pass a
// visitor-controlled URL directly to Clerk or window.location.
export function authDestination(value: string | string[] | undefined): string {
  if (typeof value !== "string") return "/library";
  if (value === "/new" || value === "/library") return value;
  if (/^\/(?:reports|research|new\/refine)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return value;
  return "/library";
}

export function authRoute(path: "/sign-in" | "/sign-up" | "/sso-callback", destination: string, verify = false): string {
  const query = new URLSearchParams({ redirect_url: authDestination(destination) });
  if (verify) query.set("verify", "1");
  return `${path}?${query}`;
}
