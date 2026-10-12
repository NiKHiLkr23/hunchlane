"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, ArrowRight, LoaderCircle, CircleHelp } from "lucide-react";
import { IdeaBriefSchema, type IdeaBrief, type RunState } from "@/core/types";
import {
  awaitingAnswers,
  inferCategory,
  type AgentMessage,
  type AgentMessageInput,
} from "@/core/agent";
import { newDraft } from "@/core/idea-draft";
import {
  readIdeaDraft,
  readFreshDraft,
  saveIdeaDraft,
  clearIdeaDraft,
  clearFreshDraft,
} from "@/lib/idea-draft";
import { ReportExport } from "./report-export";
import { ReportView } from "./report-view";
import { AgentQuestionCard } from "./agent-question-card";
import "@/app/new/conversation.css";

type StartIntent = {
  id: string;
  brief: IdeaBrief;
  owner: string | null;
  createdAt: number;
};
const INTENT_KEY = "hunchlane.agent.start.v1";
export function AgentConversation({
  initial,
  ownerId = null,
  signedIn = false,
  authConfigured = false,
  fresh = false,
  continueIntent,
  preview = false,
  scenario = "running",
}: {
  initial?: RunState;
  ownerId?: string | null;
  signedIn?: boolean;
  authConfigured?: boolean;
  fresh?: boolean;
  continueIntent?: string;
  preview?: boolean;
  scenario?: string;
}) {
  const [run, setRun] = useState(initial),
    [buffer, setBuffer] = useState(""),
    [loaded, setLoaded] = useState(Boolean(initial)),
    [started, setStarted] = useState(Boolean(initial)),
    [headingDismissed, setHeadingDismissed] = useState(Boolean(initial)),
    [optimisticMessage, setOptimisticMessage] = useState<AgentMessage | null>(
      null
    ),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const router = useRouter(),
    input = useRef<HTMLTextAreaElement>(null),
    composerDock = useRef<HTMLDivElement>(null),
    composerOrigin = useRef<number | null>(null),
    scrollArea = useRef<HTMLDivElement>(null),
    followLatest = useRef(true),
    userScrolling = useRef(false),
    guard = useRef(false),
    openingStarted = useRef<string | null>(null),
    runRef = useRef(initial),
    bufferRef = useRef(""),
    briefRef = useRef(newDraft().brief),
    pending = useRef<AgentMessageInput | null>(null),
    authorizedStart = useRef<string | null>(null);
  const intentKey = preview ? "hunchlane.preview.agent.start.v1" : INTENT_KEY;
  const pendingKey = `hunchlane.${preview ? "preview." : ""}agent.message.${
    initial?.id || "new"
  }`;
  const bufferKey = useCallback(
    (id = "new") =>
      `hunchlane.${preview ? "preview." : ""}agent.buffer.${
        ownerId || "guest"
      }.${id}`,
    [preview, ownerId]
  );
  const change = useCallback(
    (text: string) => {
      if (text.trim()) setHeadingDismissed(true);
      bufferRef.current = text;
      setBuffer(text);
      try {
        sessionStorage.setItem(bufferKey(runRef.current?.id), text);
      } catch {
        /* Server-saved work continues when device storage is unavailable. */
      }
    },
    [bufferKey]
  );
  useEffect(() => {
    if (!run) return;
    try {
      const text = sessionStorage.getItem(bufferKey(run.id));
      if (text) {
        bufferRef.current = text;
        setBuffer(text);
      }
    } catch {
      /* Preserve server-saved conversation. */
    }
  }, [run?.id, bufferKey]);
  const acceptRun = useCallback((next: RunState) => {
    const current = runRef.current;
    if (current) {
      // Messages and activity are append-only. A late read must not undo an
      // acknowledged answer, progress, or report already shown in this tab.
      const messages = new Set(
        next.agent?.conversation.messages.map((message) => message.id)
      );
      const activity = new Set(
        next.agent?.conversation.activity.map((entry) => entry.id)
      );
      if (
        next.id !== current.id ||
        (current.report && !next.report) ||
        (["complete", "failed"].includes(current.status) &&
          next.status !== current.status) ||
        (current.agent &&
          (!next.agent ||
            next.agent.revision < current.agent.revision ||
            current.agent.conversation.messages.some(
              (message) => !messages.has(message.id)
            ) ||
            current.agent.conversation.activity.some(
              (entry) => !activity.has(entry.id)
            )))
      )
        return;
    }
    runRef.current = next;
    setRun(next);
    setOptimisticMessage((message) =>
      next.agent?.conversation.messages.some(
        (saved) => saved.id === message?.id
      )
        ? null
        : message
    );
  }, []);
  useLayoutEffect(() => {
    const dock = composerDock.current,
      origin = composerOrigin.current;
    composerOrigin.current = null;
    if (!started || !dock || origin === null) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;
    const animation = dock.animate(
      [
        {
          transform: `translateY(${
            origin - dock.getBoundingClientRect().top
          }px)`,
        },
        { transform: "translateY(0)" },
      ],
      { duration: 380, easing: "cubic-bezier(.22,1,.36,1)" }
    );
    const stop = () => {
      if (reducedMotion.matches) animation.cancel();
    };
    reducedMotion.addEventListener("change", stop);
    return () => {
      animation.cancel();
      reducedMotion.removeEventListener("change", stop);
    };
  }, [started]);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      // Mobile keyboards can shrink the visible viewport without changing 100dvh.
      if (viewport.scale === 1)
        document.body.style.setProperty(
          "--agent-viewport-height",
          `${viewport.height}px`
        );
      else document.body.style.removeProperty("--agent-viewport-height");
    };
    update();
    viewport.addEventListener("resize", update);
    return () => {
      viewport.removeEventListener("resize", update);
      document.body.style.removeProperty("--agent-viewport-height");
    };
  }, []);
  const timelineSize =
    (run?.agent?.conversation.messages.length || 0) +
    (run?.agent?.conversation.activity.length || 0) +
    Number(Boolean(optimisticMessage));
  useEffect(() => {
    const area = scrollArea.current;
    if (area && followLatest.current) {
      userScrolling.current = false;
      area.scrollTop = area.scrollHeight;
    }
  }, [run?.id, timelineSize]);
  useEffect(() => {
    const area = scrollArea.current;
    if (!area) return;
    const observer = new ResizeObserver(() => {
      if (followLatest.current) area.scrollTop = area.scrollHeight;
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, []);
  const sendOpening = useCallback(
    async (intent: StartIntent) => {
      if (guard.current) return;
      guard.current = true;
      if (openingStarted.current !== intent.id) {
        openingStarted.current = intent.id;
        composerOrigin.current =
          composerDock.current?.getBoundingClientRect().top ?? null;
        // Clear the submitted idea once. Retries leave newly typed context alone.
        if (bufferRef.current.trim() === intent.brief.idea) change("");
      }
      setStarted(true);
      setHeadingDismissed(true);
      setOptimisticMessage({
        id: "opening",
        role: "user",
        text: intent.brief.idea,
        createdAt: new Date(intent.createdAt).toISOString(),
      });
      setBusy(true);
      setNotice("");
      try {
        const response = await fetch(
          preview ? "/dev/agent-preview/api" : "/api/runs",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: intent.id,
              brief: intent.brief,
              mode: "autonomous",
              ownerId: intent.owner || undefined,
              scenario,
            }),
            signal: AbortSignal.timeout(20000),
          }
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Your idea could not be submitted.");
        if (data.id !== intent.id)
          throw new Error("Your submission could not be confirmed.");
        const savedDraft = readIdeaDraft(preview);
        if (
          savedDraft?.requestId === intent.id &&
          JSON.stringify(savedDraft.brief) === JSON.stringify(intent.brief)
        )
          clearIdeaDraft(intent.id, preview);
        try {
          sessionStorage.removeItem(intentKey);
          // Carry text typed during submission into the saved conversation.
          sessionStorage.setItem(bufferKey(intent.id), bufferRef.current);
        } catch {
          /* A saved server run does not depend on device storage. */
        }
        if (preview) {
          acceptRun(data.run);
        } else router.replace(`/research/${intent.id}`);
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "The connection is unavailable. I’ll check your saved submission automatically."
        );
      } finally {
        guard.current = false;
        setBusy(false);
      }
    },
    [preview, scenario, intentKey, router, acceptRun, change, bufferKey]
  );

  useEffect(() => {
    if (initial) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(pendingKey) || "null");
        if (saved?.owner === ownerId && saved?.message) {
          pending.current = saved.message;
          setOptimisticMessage({
            ...saved.message,
            role: "user",
            createdAt: saved.createdAt || new Date().toISOString(),
          });
        }
      } catch {
        /* Corrupt local input never authorizes a request. */
      }
      return;
    }
    const draft = fresh ? readFreshDraft() : readIdeaDraft(preview);
    if (draft && !fresh) briefRef.current = draft.brief;
    try {
      const text = sessionStorage.getItem(
        `hunchlane.${preview ? "preview." : ""}agent.buffer.${
          ownerId || "guest"
        }.new`
      );
      change(text ?? (draft && !fresh ? draft.buffer || draft.brief.idea : ""));
    } catch {
      if (draft && !fresh) change(draft.buffer || draft.brief.idea);
    }
    setLoaded(true);
    // Only the exact submitted intent returning through authentication can auto-start.
    if (!continueIntent || (!signedIn && !preview)) return;
    try {
      const intent = JSON.parse(
        sessionStorage.getItem(intentKey) || "null"
      ) as StartIntent | null;
      if (
        intent &&
        intent.id === continueIntent &&
        Date.now() - intent.createdAt < 30 * 60_000 &&
        (!intent.owner || intent.owner === ownerId) &&
        IdeaBriefSchema.safeParse(intent.brief).success
      ) {
        intent.owner = ownerId;
        authorizedStart.current = intent.id;
        sessionStorage.setItem(intentKey, JSON.stringify(intent));
        void sendOpening(intent);
      }
    } catch {
      setNotice(
        "Your submitted idea could not be restored. Your saved draft is still available."
      );
    }
  }, [
    initial,
    fresh,
    preview,
    signedIn,
    continueIntent,
    intentKey,
    ownerId,
    pendingKey,
    sendOpening,
  ]);

  useEffect(() => {
    if (run || (!signedIn && !preview)) return;
    const timer = setInterval(() => {
      try {
        const intent = JSON.parse(
          sessionStorage.getItem(intentKey) || "null"
        ) as StartIntent | null;
        if (
          intent &&
          authorizedStart.current === intent.id &&
          intent.owner === ownerId &&
          Date.now() - intent.createdAt < 30 * 60_000
        )
          void sendOpening(intent);
      } catch {
        /* Keep unsaved input visible. */
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [run, signedIn, preview, intentKey, ownerId, sendOpening]);

  const settlePending = useCallback(
    (message: AgentMessageInput) => {
      if (pending.current?.id !== message.id) return false;
      pending.current = null;
      try {
        sessionStorage.removeItem(pendingKey);
      } catch {
        // An acknowledged identity is safe to read back again after reload.
      }
      return true;
    },
    [pendingKey]
  );

  const deliverMessage = useCallback(
    async (message: AgentMessageInput, runId: string) => {
      if (
        guard.current ||
        pending.current?.id !== message.id ||
        runRef.current?.id !== runId
      )
        return;
      // Immediate delivery and reconnects share one in-flight request.
      guard.current = true;
      setBusy(true);
      try {
        const response = await fetch(
          preview ? "/dev/agent-preview/api" : `/api/runs/${runId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(preview ? { ...message, runId } : message),
            signal: AbortSignal.timeout(15000),
          }
        );
        if (response.ok) {
          acceptRun(await response.json());
          if (settlePending(message)) setNotice("");
        } else if (response.status >= 400 && response.status < 500) {
          const data = await response.json();
          if (settlePending(message)) {
            setNotice(data.error || "The message could not be saved.");
            setOptimisticMessage((current) =>
              current?.id === message.id ? null : current
            );
            if (!bufferRef.current) change(message.text);
          }
        }
      } catch {
        if (pending.current?.id === message.id)
          setNotice(
            "Your message is saved in this tab and will send when the connection returns."
          );
      } finally {
        guard.current = false;
        setBusy(false);
      }
    },
    [preview, acceptRun, settlePending, change]
  );

  const hasPendingMessage = Boolean(pending.current);
  useEffect(() => {
    if (!run) return;
    if (["complete", "failed"].includes(run.status) && !pending.current) return;
    let active = true,
      timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await fetch(
          preview
            ? `/dev/agent-preview/api?id=${run!.id}`
            : `/api/runs/${run!.id}`,
          { cache: "no-store", signal: AbortSignal.timeout(15000) }
        );
        if (!response.ok) throw new Error();
        const next = (await response.json()) as RunState;
        if (!active) return;
        acceptRun(next);
        setNotice("");
        if (pending.current) {
          const message = pending.current;
          if (
            next.agent?.conversation.messages.some((m) => m.id === message.id)
          ) {
            settlePending(message);
          } else {
            await deliverMessage(message, next.id);
          }
        }
        if (
          runRef.current &&
          ["complete", "failed"].includes(runRef.current.status) &&
          !pending.current
        )
          return;
      } catch {
        if (active)
          setNotice(
            "Updates are reconnecting. Your idea and conversation are saved."
          );
      }
      if (active) timer = setTimeout(poll, 3000);
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    run?.id,
    run?.status,
    hasPendingMessage,
    preview,
    ownerId,
    acceptRun,
    settlePending,
    deliverMessage,
  ]);

  async function opening() {
    const parsed = IdeaBriefSchema.safeParse({
      ...briefRef.current,
      idea: buffer.trim(),
      category: inferCategory(buffer),
    });
    if (!parsed.success) {
      return;
    }
    if (!signedIn && !preview && !authConfigured) {
      setNotice("Sign-in is being connected. Your idea is still here.");
      return;
    }
    let intent: StartIntent = {
      id: crypto.randomUUID(),
      brief: parsed.data,
      owner: ownerId,
      createdAt: Date.now(),
    };
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(intentKey) || "null"
      ) as StartIntent | null;
      if (
        saved &&
        saved.owner === ownerId &&
        Date.now() - saved.createdAt < 30 * 60_000
      )
        intent = saved;
      sessionStorage.setItem(intentKey, JSON.stringify(intent));
      saveIdeaDraft(
        {
          ...newDraft(),
          brief: parsed.data,
          buffer: parsed.data.idea,
          requestId: intent.id,
        },
        preview
      );
      if (fresh) clearFreshDraft();
    } catch {
      setNotice(
        "This browser could not save the submission identity. Allow session storage before starting research."
      );
      return;
    }
    if (!signedIn && !preview) {
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent(`/new?start=${intent.id}`)}`
      );
      return;
    }
    authorizedStart.current = intent.id;
    await sendOpening(intent);
  }
  function submitMessage(
    text = buffer.trim(),
    chosenQuestion: AgentMessageInput["questionId"] = undefined,
    useJudgment = false,
    autoAnswerAll = false
  ) {
    if (!text || pending.current || guard.current || !run || run.report) return;
    const message: AgentMessageInput = {
      id: crypto.randomUUID(),
      text,
      ...(chosenQuestion ? { questionId: chosenQuestion } : {}),
      useJudgment,
      ...(autoAnswerAll ? { autoAnswerAll: true } : {}),
    };
    const createdAt = new Date().toISOString();
    try {
      sessionStorage.setItem(
        pendingKey,
        JSON.stringify({ owner: ownerId, message, createdAt })
      );
    } catch {
      setNotice(
        "This browser could not save your message for delivery. Your input is still here."
      );
      return;
    }
    pending.current = message;
    setOptimisticMessage({
      ...message,
      role: "user",
      createdAt,
      followUp: Boolean(
        run.agent?.lockedRevision !== null &&
          run.agent?.lockedRevision !== undefined
      ),
    });
    followLatest.current = true;
    change("");
    setNotice("");
    // Delivery retries reuse this identity. Polling research state never triggers paid work.
    void deliverMessage(message, run.id);
  }
  const terminal = run?.status === "complete" || run?.status === "failed";
  const questions =
    run?.agent?.conversation.questions.filter((q) => !q.answer) || [];
  const waiting = Boolean(
    !terminal && run?.agent && awaitingAnswers(run.agent.conversation)
  );
  const currentQuestion = waiting ? questions[0] : undefined;
  const canSend =
    !run?.report &&
    Boolean(buffer.trim()) &&
    (Boolean(run) ||
      IdeaBriefSchema.safeParse({
        ...briefRef.current,
        idea: buffer,
        category: inferCategory(buffer),
      }).success);
  const activities = run?.agent?.conversation.activity || [];
  const latestActivityId = [...activities]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1)?.id;
  const savedMessages = run?.agent?.conversation.messages || [];
  const timeline = [
    ...savedMessages.map((message) => ({
      ...message,
      active: false,
      optimistic: false,
    })),
    ...activities.map((activity) => ({
      ...activity,
      id: `activity-${activity.id}`,
      role: "assistant" as const,
      followUp: false,
      optimistic: false,
      active: !terminal && !waiting && activity.id === latestActivityId,
    })),
    ...(optimisticMessage &&
    !savedMessages.some((message) => message.id === optimisticMessage.id)
      ? [{ ...optimisticMessage, active: false, optimistic: true }]
      : []),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <main
      id="main"
      className={`idea-chat agent-chat${
        !started && !run ? " agent-chat-intro" : ""
      }`}
    >
      <div
        ref={scrollArea}
        className="agent-scroll"
        role="region"
        aria-label="Conversation and report"
        tabIndex={0}
        onWheel={() => {
          userScrolling.current = true;
        }}
        onTouchMove={() => {
          userScrolling.current = true;
        }}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget)
            userScrolling.current = true;
        }}
        onKeyDown={(event) => {
          if (
            [
              "ArrowUp",
              "ArrowDown",
              "PageUp",
              "PageDown",
              "Home",
              "End",
              " ",
            ].includes(event.key)
          )
            userScrolling.current = true;
        }}
        onScroll={(event) => {
          const area = event.currentTarget;
          if (userScrolling.current)
            followLatest.current =
              area.scrollHeight - area.scrollTop - area.clientHeight < 80;
        }}
      >
        <div className="agent-content page-container">
          <div
            className={`agent-intro-heading${
              headingDismissed || started || run
                ? " agent-intro-heading-hidden"
                : ""
            }`}
            aria-hidden={headingDismissed || started || Boolean(run)}
            inert={headingDismissed || started || Boolean(run)}
          >
            <div className="chat-heading">
              <span className="chat-kicker">FOLLOW YOUR HUNCH</span>
              <h1>What’s your hunch?</h1>
              <p>
                An app, a product, a service. Start with whatever is on your
                mind.
              </p>
            </div>
          </div>
          {!loaded ? (
            <p role="status">Opening your idea…</p>
          ) : (
            <>
              {(run?.agent || optimisticMessage) && (
                <section className="chat-thread" aria-label="Idea conversation">
                  {timeline.map((message) => (
                    <div
                      key={message.id}
                      className={`chat-message chat-${message.role}`}
                    >
                      <div>
                        <p
                          className={
                            message.active ? "chat-activity" : undefined
                          }
                          role={message.active ? "status" : undefined}
                        >
                          {message.active && (
                            <LoaderCircle
                              size={15}
                              className="spinner"
                              aria-hidden="true"
                            />
                          )}
                          {message.text}
                        </p>
                        {message.optimistic && (
                          <small className="chat-subtle">Sending…</small>
                        )}
                        {message.followUp && (
                          <small className="chat-subtle">
                            Saved for a follow-up; the report keeps its original
                            scope.
                          </small>
                        )}
                      </div>
                    </div>
                  ))}
                  {waiting && (
                    <div className="agent-question-status" role="status">
                      <CircleHelp size={16} />
                      <span>Agent has questions for you</span>
                      <small>Waiting for answers</small>
                    </div>
                  )}
                  {run?.report && (
                    <section
                      className="agent-result"
                      aria-label="Final research result"
                    >
                      <span className="chat-kicker">YOUR RESEARCH REPORT</span>
                      <h2>{run.report.title}</h2>
                      <p>
                        {run.report.summary.text}{" "}
                        {run.report.summary.sourceIds.map((id) => {
                          const source = run.report!.sources.find(
                            (s) => s.id === id
                          );
                          return source ? (
                            <a
                              key={id}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              [{run.report!.sources.indexOf(source) + 1}]
                            </a>
                          ) : null;
                        })}
                      </p>
                      <ReportExport report={run.report} sample={preview} />
                      <details>
                        <summary>Read the full report</summary>
                        <ReportView
                          report={run.report}
                          runId={preview ? undefined : run.id}
                          sample={preview}
                          embedded
                        />
                      </details>
                      {!preview && (
                        <Link
                          className="chat-text-button"
                          href={`/reports/${run.id}`}
                        >
                          Open standalone report <ArrowRight size={14} />
                        </Link>
                      )}
                    </section>
                  )}
                </section>
              )}
            </>
          )}
          {notice && (
            <p className="agent-delivery-notice chat-subtle" role="status">
              {notice}
            </p>
          )}
        </div>
      </div>
      {loaded && (
        <div
          ref={composerDock}
          className={`agent-dock-presence${
            run?.report ? " agent-dock-closed" : ""
          }`}
          aria-hidden={Boolean(run?.report)}
          inert={Boolean(run?.report)}
        >
          <div className="agent-dock-clip">
            <div className="agent-composer-wrap">
              <div className="agent-composer-inner page-container">
                {currentQuestion ? (
                  <AgentQuestionCard
                    key={currentQuestion.id}
                    question={currentQuestion}
                    index={run!.agent!.conversation.questions.findIndex(
                      (q) => q.id === currentQuestion.id
                    )}
                    total={run!.agent!.conversation.questions.length}
                    busy={busy || Boolean(pending.current)}
                    onAnswer={(text) =>
                      submitMessage(
                        text,
                        currentQuestion.id as AgentMessageInput["questionId"]
                      )
                    }
                    onAutoAnswer={() =>
                      submitMessage("Use your judgment.", undefined, true, true)
                    }
                  />
                ) : (
                  <form
                    className="chat-composer"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (run) submitMessage();
                      else void opening();
                    }}
                  >
                    <label htmlFor="agent-input" className="sr-only">
                      {run
                        ? "Add context or a direction"
                        : "Tell us what you have in mind."}
                    </label>
                    <textarea
                      ref={input}
                      id="agent-input"
                      value={buffer}
                      onChange={(e) => change(e.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key !== "Enter" ||
                          event.shiftKey ||
                          event.nativeEvent.isComposing
                        )
                          return;
                        event.preventDefault();
                        if (!busy && !pending.current && canSend)
                          event.currentTarget.form?.requestSubmit();
                      }}
                      rows={3}
                      maxLength={run ? 500 : 3000}
                      placeholder={
                        run
                          ? terminal
                            ? "A direction for your next look…"
                            : "Add context or steer the research…"
                          : "I’m thinking about…"
                      }
                    />
                    <div className="chat-composer-bottom">
                      <span>
                        {run
                          ? terminal
                            ? "Saved as follow-up context."
                            : "Optional. The research continues."
                          : "A sentence is enough."}
                      </span>
                      <button
                        type="submit"
                        disabled={busy || Boolean(pending.current) || !canSend}
                        aria-label={run ? "Send message" : "Research my idea"}
                      >
                        {busy ? (
                          <LoaderCircle size={18} className="spinner" />
                        ) : (
                          <ArrowUp size={19} />
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
