import Link from "next/link";
import localFont from "next/font/local";
import { LoaderCircle } from "lucide-react";
import { AuthDraft } from "./auth-draft";
import { GoogleAuth } from "./google-auth";
import { authRoute } from "@/lib/auth-navigation";

export type AuthMode = "sign-in" | "sign-up";
const googleFont = localFont({ src: "../app/fonts/GoogleSans-Medium.ttf", weight: "500", display: "swap" });

export function GoogleButtonFace({ busy = false }: { busy?: boolean }) {
  return <>{busy ? <LoaderCircle size={20} className="spinner" aria-hidden="true"/> : <img src="/auth/google-g.png" width="20" height="20" alt=""/>}<span className={googleFont.className}>{busy ? "Opening Google…" : "Continue with Google"}</span></>;
}

export function AuthLoading() {
  return <div className="auth-content"><span className="auth-overline">YOUR NEXT STEP</span><h1>A place for your ideas.</h1><p className="auth-description">Getting sign-in ready…</p><button className="google-button" disabled><GoogleButtonFace/></button><p className="auth-status" role="status">Loading secure sign-in.</p></div>;
}

export function AuthContent({ mode, configured, destination, verify = false }: { mode: AuthMode; configured: boolean; destination: string; verify?: boolean }) {
  const signup = mode === "sign-up";
  const alternate = authRoute(signup ? "/sign-in" : "/sign-up", destination);
  return <div className="auth-content">
    <span className="auth-overline">{signup ? "A NEW BEGINNING" : "YOUR NEXT STEP"}</span>
    <h1>{signup ? <>Your next idea<br/>starts here.</> : "Welcome back."}</h1>
    <p className="auth-description">{signup ? "Create your Hunchlane account to keep your research and return to your ideas." : "Sign in to explore an idea and keep your research in one place."}</p>
    {configured ? <GoogleAuth mode={mode} destination={destination} verify={verify} button={<GoogleButtonFace/>} busyButton={<GoogleButtonFace busy/>}/> : <div>
      <button className="google-button" disabled aria-describedby="auth-unavailable"><GoogleButtonFace/></button>
      <p className="auth-status auth-error" id="auth-unavailable" role="status">Sign-in is being connected. Your draft stays on this device.</p>
      <Link className="auth-recovery" href="/sample">Explore the sample report <span aria-hidden="true">↗</span></Link>
    </div>}
    <p className="auth-reassurance">{destination === "/new" ? "You’ll return to your idea. Research starts only when you choose to start it." : "Your research stays private until you choose to share a report."}</p>
    <AuthDraft/>
    <p className="auth-switch">{signup ? "Already have an account?" : "New to Hunchlane?"} <Link href={alternate}>{signup ? "Sign in" : "Create an account"}</Link></p>
  </div>;
}
