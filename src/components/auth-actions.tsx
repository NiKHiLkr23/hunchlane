"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
export function AuthActions() { const { isSignedIn, isLoaded } = useUser(); if (!isLoaded) return <span className="muted">Loading account…</span>; return isSignedIn ? <UserButton/> : <Link href="/sign-in" className="nav-signin">Sign in <span aria-hidden="true">↗</span></Link>; }
