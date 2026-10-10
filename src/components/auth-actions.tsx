"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
export function AuthActions({ largeTarget = false }: { largeTarget?: boolean }) { const { isSignedIn, isLoaded } = useUser(); if (!isLoaded) return <span className="muted">Loading account…</span>; return isSignedIn ? <UserButton appearance={largeTarget ? { elements: { userButtonTrigger: { minWidth: 44, minHeight: 44, padding: 8 } } } : undefined}/> : <Link href="/sign-in" className="nav-signin">Sign in <span aria-hidden="true">↗</span></Link>; }
