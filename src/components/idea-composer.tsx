"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUp,
  Globe2,
  LoaderCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { IdeaBriefSchema, clarify, type IdeaBrief } from "@/core/types";
import { FinancialAssumptions } from "./financial-assumptions";
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
export function IdeaComposer({
  compact = false,
  signedIn = false,
  authConfigured = false,
  fresh = false,
  autonomous = false,
}: {
  compact?: boolean;
  signedIn?: boolean;
  authConfigured?: boolean;
  fresh?: boolean;
  autonomous?: boolean;
}) {
  const router = useRouter();
  const [brief, setBrief] = useState<IdeaBrief>(initial),
    [step, setStep] = useState<"describe" | "clarify">("describe"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const ideaInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!fresh) {
      const saved = readIdeaDraft();
      if (saved) setBrief(saved.brief);
    }
    // Enable interactions only after hydration and draft restoration finish.
    setReady(true);
  }, [fresh]);
  function update<K extends keyof IdeaBrief>(key: K, value: IdeaBrief[K]) {
    setBrief((old) => ({ ...old, [key]: value }));
    setRequestId(null);
    setError("");
  }
  function saveDraft(value = brief) {
    return saveIdeaDraft({
      ...newDraft(),
      brief: value,
      step: "context",
      messages: [{ role: "user", text: value.idea }],
    });
  }
  function describe(event: React.FormEvent) {
    event.preventDefault();
    const parsed = IdeaBriefSchema.safeParse(brief);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      ideaInput.current?.focus();
      return;
    }
    if (!saveDraft(parsed.data)) {
      setError(
        "Your browser could not save this draft. Allow local storage before continuing."
      );
      return;
    }
    if (compact) {
      if(autonomous) {
        const intent={id:crypto.randomUUID(),brief:parsed.data,owner:null,createdAt:Date.now()};
        try { sessionStorage.setItem("hunchlane.agent.start.v1",JSON.stringify(intent)); }
        catch { setError("This browser could not save your submission. Allow session storage before starting research.");return; }
        router.push(`/sign-in?redirect_url=${encodeURIComponent(`/new?start=${intent.id}`)}`);
        return;
      }
      router.push("/new");
      return;
    }
    setStep("clarify");
    setError("");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    saveDraft();
    if (!signedIn) {
      if (authConfigured) router.push("/sign-in?redirect_url=%2Fnew");
      else
        setError(
          "Sign-in and live research are being connected. Your idea is saved on this device; explore the sample while you wait."
        );
      return;
    }
    setBusy(true);
    setError("");
    const id = requestId || crypto.randomUUID();
    setRequestId(id);
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, brief }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Research could not start.");
      router.push(`/research/${data.id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Research could not start. Your idea is saved."
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={compact ? "composer compact-composer" : "composer workbench"}
      aria-label="Describe your idea"
      aria-busy={!ready}
    >
      {!compact && (
        <div className="step-label">
          <span className="step-count">
            {step === "describe" ? "01" : "02"}
          </span>
          <span>
            {step === "describe"
              ? "Start with a hunch"
              : "A little more context"}
          </span>
          <span className="muted">{step === "describe" ? "1" : "2"} of 2</span>
        </div>
      )}
      {step === "describe" ? (
        <form onSubmit={describe}>
          <div className={compact ? "composer-field-head" : undefined}>
            <label htmlFor="idea" className="composer-label">
              {compact ? "What’s your idea?" : "Tell us what you have in mind."}
            </label>
            {compact && (
              <span className="muted char-count" id="idea-hint">
                {brief.idea.length}/3000
              </span>
            )}
          </div>
          <div className={compact ? "composer-input" : undefined}>
            <textarea
              id="idea"
              ref={ideaInput}
              disabled={!ready}
              value={brief.idea}
              onChange={(e) => update("idea", e.target.value)}
              maxLength={3000}
              placeholder={
                compact
                  ? "An app, a product, a service…\nWhat would you like to explore?"
                  : "I’m thinking about building…"
              }
              rows={compact ? 4 : 5}
              aria-invalid={Boolean(error)}
              aria-describedby={
                compact
                  ? `idea-hint${error ? " idea-error" : ""}`
                  : error
                  ? "idea-error"
                  : undefined
              }
              autoFocus={!compact}
            />
            {compact && (
              <div className="composer-action">
                <Button
                  type="submit"
                  className="composer-send"
                  aria-label="Explore my idea"
                  disabled={!ready}
                >
                  <ArrowUp size={18} />
                </Button>
              </div>
            )}
          </div>
          {!compact && (
            <div className="composer-bottom">
              <span className="muted char-count">{brief.idea.length}/3000</span>
            </div>
          )}
          {!compact && (
            <>
              <fieldset className="category-options">
                <legend>What kind of idea is it?</legend>
                {(
                  [
                    ["software", "Software or app"],
                    ["physical", "Physical product"],
                    ["service", "A service or place"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    className={
                      brief.category === value
                        ? "category-option selected"
                        : "category-option"
                    }
                    key={value}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={value}
                      checked={brief.category === value}
                      onChange={() => update("category", value)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <div className="field-grid">
                <label>
                  Who is it for? <span className="muted">(optional)</span>
                  <input
                    value={brief.audience}
                    maxLength={300}
                    onChange={(e) => update("audience", e.target.value)}
                    placeholder="e.g. Students living away from home"
                  />
                </label>
                <label>
                  Where? <span className="muted">(optional)</span>
                  <input
                    value={brief.location}
                    maxLength={150}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="e.g. Bengaluru, or anywhere"
                  />
                </label>
              </div>
            </>
          )}
          {error && (
            <p className="error-message" role="alert" id="idea-error">
              {error}
            </p>
          )}
          {!compact && (
            <div className="composer-action">
              <Button type="submit">
                Explore my idea <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </form>
      ) : (
        <form onSubmit={submit}>
          <h2>Let’s make the search useful.</h2>
          <p className="muted">
            Two quick questions. It’s okay to be figuring things out.
          </p>
          <blockquote className="idea-quote">{brief.idea}</blockquote>
          {clarify(brief).map((q) => (
            <label className="clarify-field" key={q.id}>
              {q.label}
              <span className="muted field-hint">{q.hint}</span>
              <input
                value={brief.answers[q.id] || ""}
                maxLength={500}
                onChange={(e) =>
                  update("answers", {
                    ...brief.answers,
                    [q.id]: e.target.value,
                  })
                }
              />
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  update("answers", {
                    ...brief.answers,
                    [q.id]: "Not sure yet",
                  })
                }
              >
                I’m not sure yet
              </button>
            </label>
          ))}
          <FinancialAssumptions
            value={brief.answers.finance || ""}
            onChange={(value) =>
              update("answers", { ...brief.answers, finance: value })
            }
          />
          <p className="privacy-note">
            <Globe2 size={15} /> We’ll search the web, check alternatives, and
            save a cited report. Your description is sent to our research
            providers.
          </p>
          {error && (
            <p className="error-message" role="alert">
              {error} <a href="/sample">See a sample report</a>
            </p>
          )}
          <div className="composer-action">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep("describe")}
            >
              Back
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle size={16} className="spinner" />
                  Starting research…
                </>
              ) : (
                <>
                  {signedIn ? "Start research" : "Sign in to research"}
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        </form>
      )}
      {compact && (
        <div className="example-row">
          <p className="example-prompt">Not sure where to start? Try these</p>
          <div className="example-pills">
            {examples.map((example) => {
              return (
                <button
                  type="button"
                  className="example-chip"
                  key={example.label}
                  disabled={!ready}
                  onClick={() => {
                    setBrief({
                      ...initial,
                      idea: example.idea,
                      category: example.category,
                    });
                    setError("");
                    setRequestId(null);
                    ideaInput.current?.focus();
                  }}
                >
                  <span
                    className="example-dot"
                    data-tone={example.tone}
                    aria-hidden="true"
                  />
                  {example.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
