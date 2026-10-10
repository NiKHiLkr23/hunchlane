"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { IdeaBriefSchema, type IdeaBrief } from "@/core/types";

export function AuthDraft() {
  const [draft, setDraft] = useState<IdeaBrief | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hunchlane.idea-draft.v1");
      if (!saved) return;
      const parsed = IdeaBriefSchema.safeParse(JSON.parse(saved));
      if (parsed.success) setDraft(parsed.data);
    } catch { /* Storage can be unavailable; authentication still works. */ }
  }, []);
  if (!draft) return null;
  return <aside className="auth-draft" aria-label="Your local draft">
    <div className="auth-draft-label"><FileText size={15}/><span>Saved on this device</span></div>
    <p>{draft.idea}</p>
    <Link href="/new">Back to your idea <span aria-hidden="true">↗</span></Link>
  </aside>;
}
