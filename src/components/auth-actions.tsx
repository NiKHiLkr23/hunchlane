"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
export function AuthActions({ largeTarget = false }: { largeTarget?: boolean }) { const { isSignedIn, isLoaded } = useUser(); if (!isLoaded) return <span className="app-account-loading" role="status"><span className="sr-only">Loading account…</span></span>; return isSignedIn ? <UserButton appearance={largeTarget ? { elements: { userButtonTrigger: { minWidth: 44, minHeight: 44, padding: 8 } } } : undefined}/> : <Link href="/sign-in" className="nav-signin">Sign in</Link>; }

export function MyIdeasLink({ onClick }: { onClick?: () => void }) {
  const { isSignedIn, isLoaded } = useUser();
  return isLoaded && isSignedIn ? <Link href="/library" onClick={onClick}>My ideas</Link> : null;
}
