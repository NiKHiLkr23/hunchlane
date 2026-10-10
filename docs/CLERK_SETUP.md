# Clerk configuration check

The user-provided Next.js guide targets Clerk application `app_3KV8P0TCx9AotSiKDfK3TxUfBG5`. Hunchlane already has the Next.js SDK and configured keys. Its sign-in component displays “Sign in to Hunchlane.” Keep the existing application and user data when making changes.

Verified source setup:

- `@clerk/nextjs` is installed.
- `ClerkProvider` is inside `body` in the root layout.
- Next.js 16 uses `src/proxy.ts` with `clerkMiddleware()`.
- Matchers include the API path followed by `/__clerk/:path*` once.
- Owner checks await `auth()` and reject unsigned users.
- Sign-in/sign-up catch-all routes use Clerk components.
- Navigation uses the existing sign-in link and signed-in `UserButton`; sign-up is available on the sign-in screen.
- Provider and database secrets stay on the server. Local key values are not printed or committed.
- Draft ideas remain in browser storage across the sign-in redirect.

The configured sign-in page rendered in the local app, and a read-only Clerk backend SDK request verified the server credential. Complete an actual sign-up/sign-in at http://localhost:3100/sign-in, verify the profile button and private library, and then check isolation with a second account. These checks alone do not prove the complete authentication flow.

The guide's CLI bootstrap is useful for a fresh setup. Running `clerk init` over an existing configured application may modify SDK setup, routes and local configuration, so the current implementation is inspected and corrected directly. No new Clerk application or CLI authorization has been created.
