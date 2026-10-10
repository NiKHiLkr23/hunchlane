"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { type IdeaBrief } from "@/core/types";

import { readIdeaDraft } from "@/lib/idea-draft";

export function AuthDraft() {
  const [draft, setDraft] = useState<IdeaBrief | null>(null);
  useEffect(() => {
    const saved=readIdeaDraft();
    if(saved?.brief.idea.trim()) setDraft(saved.brief);
  }, []);
  if (!draft) return null;
  return <aside className="auth-draft" aria-label="Your local draft">
    <div className="auth-draft-label"><FileText size={15}/><span>Saved on this device</span></div>
    <p>{draft.idea}</p>
    <Link href="/new">Back to your idea <span aria-hidden="true">↗</span></Link>
  </aside>;
}
