"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClerkFailed, ClerkLoaded, ClerkLoading, HandleSSOCallback, TaskChooseOrganization, TaskResetPassword, TaskSetupMFA, useSession } from "@clerk/nextjs";
import { authRoute } from "@/lib/auth-navigation";

export function AuthCallback({ destination }: { destination: string }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setSlow(true), 15000); return () => clearTimeout(timer); }, []);
  return <div className="auth-content">
    <span className="auth-overline">ONE MOMENT</span><h1>Let’s get you settled.</h1>
    <ClerkLoading><p className="auth-description" role="status">Loading secure sign-in.</p></ClerkLoading>
    <ClerkFailed><p className="auth-status auth-error" role="alert">We couldn’t connect to sign-in. Your draft stays on this device.</p></ClerkFailed>
    <ClerkLoaded><ResolveCallback destination={destination}/></ClerkLoaded>
    {slow && <p className="auth-status" role="status">Taking longer than expected? Return to sign-in and try again. Any saved draft stays on this device.</p>}
    <Link className="auth-recovery" href={authRoute("/sign-in", destination)}>Back to sign-in</Link>
  </div>;
}

function ResolveCallback({ destination }: { destination: string }) {
  const { session } = useSession();
  if (session?.currentTask) {
    const task = session.currentTask.key;
    const props = { redirectUrlComplete: destination };
    if (task === "choose-organization") return <TaskChooseOrganization {...props}/>;
    if (task === "reset-password") return <TaskResetPassword {...props}/>;
    if (task === "setup-mfa") return <TaskSetupMFA {...props}/>;
    return <p className="auth-status auth-error" role="alert">Your account needs an additional setup step. Return to sign-in to complete it.</p>;
  }
  return <>
    <p className="auth-description" role="status">Finishing your Google sign-in. You’ll return to {destination === "/new" ? "your idea" : "your research"}.</p>
    <HandleSSOCallback
      navigateToApp={({ session: activeSession, decorateUrl }) => {
        const target = activeSession?.currentTask ? authRoute("/sso-callback", destination) : destination;
        window.location.assign(decorateUrl(target));
      }}
      navigateToSignIn={() => window.location.assign(authRoute("/sign-in", destination, true))}
      navigateToSignUp={() => window.location.assign(authRoute("/sign-up", destination, true))}
    />
  </>;
}
