"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClerkFailed, ClerkLoaded, ClerkLoading, SignIn, SignUp, useSession, useSignIn, useUser } from "@clerk/nextjs";
import { authRoute } from "@/lib/auth-navigation";
import type { AuthMode } from "./auth-content";

const appearance = { variables: { colorPrimary: "#175d50", fontFamily: "var(--font-studio), sans-serif", borderRadius: "12px" } };

export function GoogleAuth(props: { mode: AuthMode; destination: string; verify: boolean; button: React.ReactNode; busyButton: React.ReactNode }) {
  return <>
    <ClerkLoading><button className="google-button" disabled>{props.button}</button><p className="auth-status" role="status">Loading secure sign-in.</p></ClerkLoading>
    <ClerkFailed><p className="auth-status auth-error" role="alert">Sign-in couldn’t connect. Your draft is still on this device.</p><button className="auth-recovery" onClick={() => window.location.reload()}>Reload sign-in</button></ClerkFailed>
    <ClerkLoaded><ReadyGoogleAuth {...props}/></ClerkLoaded>
  </>;
}

function ReadyGoogleAuth({ mode, destination, verify, button, busyButton }: { mode: AuthMode; destination: string; verify: boolean; button: React.ReactNode; busyButton: React.ReactNode }) {
  const { signIn } = useSignIn();
  const { isSignedIn } = useUser();
  const { session } = useSession();
  const router = useRouter();
  const pending = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (session?.currentTask) router.replace(authRoute("/sso-callback", destination));
    else if (isSignedIn) router.replace(destination);
  }, [isSignedIn, session?.currentTask, destination, router]);
  useEffect(() => { if (error && !busy) buttonRef.current?.focus(); }, [error, busy]);
  useEffect(() => {
    const reset = () => { pending.current = false; setBusy(false); };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  async function continueWithGoogle() {
    if (pending.current || isSignedIn) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const result = await signIn.sso({ strategy: "oauth_google", redirectUrl: destination, redirectCallbackUrl: authRoute("/sso-callback", destination) });
      if (result.error) throw result.error;
    } catch {
      setError("Google sign-in couldn’t open. Please try again. Your draft is safe on this device.");
      pending.current = false; setBusy(false);
    }
  }
  // Native Clerk UI handles additional verification, such as MFA and missing
  // profile information. The ordinary entry screen only offers Google.
  if (verify) {
    const common = { routing: "hash" as const, forceRedirectUrl: destination, appearance, fallback: <p className="auth-status" role="status">Loading account verification.</p> };
    return <div className="auth-verification">{mode === "sign-in" ? <SignIn {...common} signUpUrl={authRoute("/sign-up", destination, true)} signUpForceRedirectUrl={destination}/> : <SignUp {...common} signInUrl={authRoute("/sign-in", destination, true)} signInForceRedirectUrl={destination}/>}</div>;
  }
  return <>
    <button ref={buttonRef} type="button" className="google-button" onClick={continueWithGoogle} disabled={busy || Boolean(isSignedIn)} aria-busy={busy} aria-describedby={error ? "auth-google-error" : undefined}>{busy ? busyButton : button}</button>
    <div id="clerk-captcha"/>
    {busy && <p className="auth-status" role="status">Opening Google’s secure sign-in.</p>}
    {error && <p id="auth-google-error" className="auth-status auth-error" role="alert">{error}</p>}
  </>;
}
