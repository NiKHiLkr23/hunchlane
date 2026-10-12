import Link from "next/link";
import localFont from "next/font/local";
import { LoaderCircle } from "lucide-react";
import { GoogleAuth } from "./google-auth";
import { authRoute } from "@/lib/auth-navigation";

export type AuthMode = "sign-in" | "sign-up";
const googleFont = localFont({
  src: "../app/fonts/GoogleSans-Medium.ttf",
  weight: "500",
  display: "swap",
});

export function GoogleButtonFace({ busy = false }: { busy?: boolean }) {
  return (
    <>
      {busy ? (
        <LoaderCircle size={20} className="spinner" aria-hidden="true" />
      ) : (
        <img src="/auth/google-g.png" width="20" height="20" alt="" />
      )}
      <span className={googleFont.className}>Continue with Google</span>
    </>
  );
}

export function GoogleLoadingButton() {
  return <button className="google-button" disabled aria-busy="true">
    <GoogleButtonFace busy />
  </button>;
}

export function AuthLoading() {
  return (
    <div className="auth-content">
      <h1>Welcome back.</h1>
      <p className="auth-description">Sign in to explore your idea.</p>
      <GoogleLoadingButton />
    </div>
  );
}

export function AuthContent({
  mode,
  configured,
  destination,
  verify = false,
}: {
  mode: AuthMode;
  configured: boolean;
  destination: string;
  verify?: boolean;
}) {
  const signup = mode === "sign-up";
  const alternate = authRoute(signup ? "/sign-in" : "/sign-up", destination);
  return (
    <div className="auth-content">
      <h1>
        {signup ? (
          <>
            Your next idea
            <br />
            starts here.
          </>
        ) : (
          "Welcome back."
        )}
      </h1>
      <p className="auth-description">
        {signup
          ? "Create your Hunchlane account to keep your research and return to your ideas."
          : "Sign in to explore your idea."}
      </p>
      {configured ? (
        <GoogleAuth
          mode={mode}
          destination={destination}
          verify={verify}
          button={<GoogleButtonFace />}
          busyButton={<GoogleButtonFace busy />}
        />
      ) : (
        <div>
          <button
            className="google-button"
            disabled
            aria-describedby="auth-unavailable"
          >
            <GoogleButtonFace />
          </button>
          <p
            className="auth-status auth-error"
            id="auth-unavailable"
            role="status"
          >
            Sign-in is being connected. Your draft stays on this device.
          </p>
          <Link className="auth-recovery" href="/sample">
            Explore the sample report <span aria-hidden="true">↗</span>
          </Link>
        </div>
      )}
      {signup && (
        <p className="auth-switch">
          Already have an account? <Link href={alternate}>Sign in</Link>
        </p>
      )}
    </div>
  );
}
