"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { Button } from "./ui/button";
import { IdeaBriefSchema, type IdeaBrief } from "@/core/types";
import { newDraft } from "@/core/idea-draft";
import { readIdeaDraft, saveIdeaDraft } from "@/lib/idea-draft";

const initial: IdeaBrief = {
  idea: "",
  category: "software",
  audience: "",
  location: "",
  answers: {},
};
const examples = [
  {
    label: "Grocery list for roommates",
    category: "software",
    tone: "green",
    idea: "A shared grocery list for roommates",
  },
  {
    label: "Meal kit for one person",
    category: "physical",
    tone: "amber",
    idea: "A meal kit portioned for one person",
  },
  {
    label: "Mending for work clothes",
    category: "service",
    tone: "violet",
    idea: "A same-day mending service for work clothes",
  },
  {
    label: "Office hours for a tutor",
    category: "software",
    tone: "teal",
    idea: "Office hours people can book with a neighborhood tutor",
  },
  {
    label: "Refills for kitchen basics",
    category: "physical",
    tone: "rose",
    idea: "A refill station for kitchen basics like soap and spices",
  },
] as const;
export function IdeaComposer() {
  const router = useRouter();
  const [brief, setBrief] = useState<IdeaBrief>(initial);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const ideaInput = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = readIdeaDraft();
    if (saved) setBrief(saved.brief);
    // Enable interactions only after hydration and draft restoration finish.
    setReady(true);
  }, []);

  function describe(event: React.FormEvent) {
    event.preventDefault();
    const parsed = IdeaBriefSchema.safeParse(brief);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      ideaInput.current?.focus();
      return;
    }
    if (!saveIdeaDraft({
      ...newDraft(),
      brief: parsed.data,
      step: "context",
      messages: [{ role: "user", text: parsed.data.idea }],
    })) {
      setError("Your browser could not save this draft. Allow local storage before continuing.");
      return;
    }
    const intent = { id: crypto.randomUUID(), brief: parsed.data, owner: null, createdAt: Date.now() };
    try {
      sessionStorage.setItem("hunchlane.agent.start.v1", JSON.stringify(intent));
    } catch {
      setError("This browser could not save your submission. Allow session storage before starting research.");
      return;
    }
    router.push(`/sign-in?redirect_url=${encodeURIComponent(`/new?start=${intent.id}`)}`);
  }

  return (
    <section className="composer compact-composer" aria-label="Describe your idea" aria-busy={!ready}>
      <form onSubmit={describe}>
        <div className="composer-field-head">
          <label htmlFor="idea" className="composer-label">What’s your idea?</label>
          <span className="muted char-count" id="idea-hint">{brief.idea.length}/3000</span>
        </div>
        <div className="composer-input">
          <textarea
            id="idea"
            ref={ideaInput}
            disabled={!ready}
            value={brief.idea}
            onChange={(event) => {
              setBrief((old) => ({ ...old, idea: event.target.value }));
              setError("");
            }}
            maxLength={3000}
            placeholder={"An app, a product, a service…\nWhat would you like to explore?"}
            rows={4}
            aria-invalid={Boolean(error)}
            aria-describedby={`idea-hint${error ? " idea-error" : ""}`}
          />
          <div className="composer-action">
            <Button type="submit" className="composer-send" aria-label="Explore my idea" disabled={!ready}>
              <ArrowUp size={18} />
            </Button>
          </div>
        </div>
        {error && <p className="error-message" role="alert" id="idea-error">{error}</p>}
      </form>
      <div className="example-row">
        <p className="example-prompt">Not sure where to start? Try these</p>
        <div className="example-pills">
          {examples.map((example) => (
            <button
              type="button"
              className="example-chip"
              key={example.label}
              disabled={!ready}
              onClick={() => {
                setBrief({ ...initial, idea: example.idea, category: example.category });
                setError("");
                ideaInput.current?.focus();
              }}
            >
              <span className="example-dot" data-tone={example.tone} aria-hidden="true" />
              {example.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
