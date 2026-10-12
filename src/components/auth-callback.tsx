"use client";

import Link from "next/link";
import { ClerkFailed, ClerkLoaded, ClerkLoading, HandleSSOCallback, TaskChooseOrganization, TaskResetPassword, TaskSetupMFA, useSession } from "@clerk/nextjs";
import { authRoute } from "@/lib/auth-navigation";

export function AuthCallback({ destination, loadingButton }: { destination: string; loadingButton: React.ReactNode }) {
  return <div className="auth-content">
    <ClerkLoading>{loadingButton}</ClerkLoading>
    <ClerkFailed><p className="auth-status auth-error" role="alert">We couldn’t connect to sign-in. Your draft stays on this device.</p><Link className="auth-recovery" href={authRoute("/sign-in", destination)}>Back to sign-in</Link></ClerkFailed>
    <ClerkLoaded><ResolveCallback destination={destination} loadingButton={loadingButton}/></ClerkLoaded>
  </div>;
}

function ResolveCallback({ destination, loadingButton }: { destination: string; loadingButton: React.ReactNode }) {
  const { session } = useSession();
  if (session?.currentTask) {
    const task = session.currentTask.key;
    const props = { redirectUrlComplete: destination };
    if (task === "choose-organization") return <TaskChooseOrganization {...props}/>;
    if (task === "reset-password") return <TaskResetPassword {...props}/>;
    if (task === "setup-mfa") return <TaskSetupMFA {...props}/>;
    return <><p className="auth-status auth-error" role="alert">Your account needs an additional setup step. Return to sign-in to complete it.</p><Link className="auth-recovery" href={authRoute("/sign-in", destination)}>Back to sign-in</Link></>;
  }
  return <>
    {loadingButton}
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
