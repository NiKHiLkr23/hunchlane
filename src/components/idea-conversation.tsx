'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUp, ArrowRight, Check, LoaderCircle, PencilLine, LockKeyhole } from 'lucide-react';
import { Button } from './ui/button';
import { LaneMark } from './brand';
import { IdeaBriefSchema } from '@/core/types';
import { IntakeReplySchema, newDraft, type IdeaDraft } from '@/core/idea-draft';
import { readIdeaDraft, saveIdeaDraft, clearIdeaDraft, readFreshDraft, saveFreshDraft, clearFreshDraft } from '@/lib/idea-draft';
import '@/app/new/conversation.css';
function withAcceptedAnswers(draft: IdeaDraft): IdeaDraft {
  const answers = {
    ...draft.brief.answers
  };
  draft.messages.filter(m => m.role === 'user').slice(1).forEach((message, index) => {
    answers[`context${index}`] = message.text.slice(0, 500);
  });
  return {
    ...draft,
    brief: {
      ...draft.brief,
      answers
    }
  };
}
const categories = [['software', 'Software or app'], ['physical', 'Physical product'], ['service', 'A service or place']] as const;
export function IdeaConversation({
  signedIn = false,
  authConfigured = false,
  fresh = false,
  preview = false
}: {
  signedIn?: boolean;
  authConfigured?: boolean;
  fresh?: boolean;
  preview?: boolean;
}) {
  const router = useRouter(),
    [draft, setDraft] = useState<IdeaDraft>(newDraft),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false),
    [editing, setEditing] = useState(false),
    [checking, setChecking] = useState(false);
  const guard = useRef(false),
    input = useRef<HTMLTextAreaElement>(null),
    anchor = useRef<HTMLDivElement>(null),
    reviewHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const old = fresh ? readFreshDraft() : readIdeaDraft(preview);
    setDraft(old ? old.step === 'describe' && !old.buffer ? {...old,buffer:old.brief.idea} : old : newDraft());
    setSaved(Boolean(old));
    setLoaded(true);
  }, [fresh,preview]);
  useEffect(() => {
    if (loaded && !busy) {
      if (draft.step === "review" && !editing) reviewHeading.current?.focus();
      else input.current?.focus();
    }
  }, [loaded, busy, draft.step, draft.turn, editing]);
  function persist(next: IdeaDraft) {
    setDraft(next);
    const ok = saveIdeaDraft(next,preview);
    setSaved(ok);
    if (!ok) setError('This browser could not save your draft. Keep this tab open and allow local storage before continuing.');
    return ok;
  }
  function buffer(text: string) {
    const next = {
      ...draft,
      buffer: text,
      ...(draft.step === "describe" ? {brief: {...draft.brief, idea: text}} : {})
    };
    setError('');
    if (fresh && draft.step === 'describe') {
      setDraft(next);
      const ok = saveFreshDraft(next);
      setSaved(ok);
      if (!ok) setError('This browser could not save your draft. Keep this tab open.');
      return;
    }
    persist(next);
  }
  function opening() {
    const parsed = IdeaBriefSchema.safeParse({
      ...draft.brief,
      idea: draft.buffer
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      input.current?.focus();
      return;
    }
    const next = {
      ...newDraft(),
      brief: parsed.data,
      step: 'context' as const,
      messages: [{
        role: 'user' as const,
        text: parsed.data.idea
      }]
    };
    if (persist(next) && fresh) {
      clearFreshDraft();
      router.replace('/new');
    }
    setEditing(false);
  }
  function signIn() {
    if (!authConfigured) {
      setError('Sign-in is being connected. Your draft stays on this device.');
      return;
    }
    router.push('/sign-in?redirect_url=%2Fnew');
  }
  async function ask(answer?: string) {
    if (guard.current || draft.pending) return;
    const text = answer ?? draft.buffer.trim();
    if (draft.reply && !text) {
      setError('Choose a suggestion or write your own answer.');
      input.current?.focus();
      return;
    }
    if (!signedIn && !preview) {
      signIn();
      return;
    }
    const id = draft.intakeId || crypto.randomUUID(),
      messages = text ? [...draft.messages, {
        role: 'user' as const,
        text
      }] : draft.messages;
    const next = {
      ...draft,
      intakeId: id,
      messages,
      buffer: '',
      pending: 'intake' as const
    };
    if (!persist(next)) return;
    guard.current = true;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(preview ? '/dev/idea-preview/intake' : '/api/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          turn: draft.turn,
          brief: draft.brief,
          messages
        }),
        signal: AbortSignal.timeout(55000)
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.safeToRetry) {
          persist({
            ...next,
            pending: null,
            messages: draft.messages,
            buffer: text
          });
          setError(data.error);
          return;
        }
        throw Error(data.error || 'The response is uncertain.');
      }
      const reply = IntakeReplySchema.parse(data.reply);
      const done = reply.ready || draft.turn === 2;
      persist(withAcceptedAnswers({
        ...next,
        pending: null,
        turn: draft.turn + 1,
        reply,
        messages: [...messages, {
          role: 'assistant',
          text: reply.message + (reply.question ? '\n' + reply.question : '')
        }],
        step: done ? 'review' : 'context'
      }));
    } catch {
      setError('We couldn’t confirm the reply. Your conversation is saved. Check the saved response before continuing; we won’t send it again.');
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  async function recover() {
    if (guard.current || draft.pending !== 'intake' || !draft.intakeId) return;
    guard.current = true;
    setBusy(true);
    setChecking(true);
    try {
      const response = await fetch(`${preview ? '/dev/idea-preview/intake' : '/api/intake'}?id=${draft.intakeId}&turn=${draft.turn}`, {
          cache: 'no-store'
        }),
        data = await response.json();
      if (!response.ok || !data.reply) throw Error();
      const reply = IntakeReplySchema.parse(data.reply);
      persist(withAcceptedAnswers({
        ...draft,
        pending: null,
        turn: draft.turn + 1,
        reply,
        messages: [...draft.messages, {
          role: 'assistant',
          text: reply.message + (reply.question ? '\n' + reply.question : '')
        }],
        step: reply.ready || draft.turn === 2 ? 'review' : 'context'
      }));
      setError('');
    } catch {
      setError('No completed reply is available yet. A provider check is needed before another request.');
    } finally {
      guard.current = false;
      setBusy(false);
      setChecking(false);
    }
  }
  async function start() {
    if (guard.current || draft.pending) return;
    if (!signedIn && !preview) {
      signIn();
      return;
    }
    const parsed = IdeaBriefSchema.safeParse(draft.brief);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    const id = draft.requestId || crypto.randomUUID(),
      next = {
        ...draft,
        requestId: id,
        pending: 'research' as const
      };
    if (!persist(next)) return;
    guard.current = true;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(preview ? '/dev/idea-preview/research' : '/api/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          brief: parsed.data
        }),
        signal: AbortSignal.timeout(20000)
      });
      const data = await response.json();
      if (!response.ok && response.status < 500) {
        persist({
          ...next,
          pending: null
        });
        setError(data.error || 'Research could not start.');
        return;
      }
      if (!response.ok || data.id !== id) throw Error();
      clearIdeaDraft(id,preview);
      router.push(`/research/${id}`);
    } catch {
      setError('We couldn’t confirm whether research started. Check its saved progress before trying again.');
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  function review() {
    if (draft.pending || busy) return;
    const text = draft.buffer.trim();
    persist({
      ...draft,
      step: 'review',
      buffer: '',
      brief: {
        ...draft.brief,
        answers: {
          ...draft.brief.answers,
          ...(text ? {
            [`context${draft.turn}`]: text
          } : {})
        }
      }
    });
  }
  return <main id="main" className="idea-chat"><div className="chat-top"><Link href="/home">← Your idea desk</Link><span><LockKeyhole size={13} />Private idea</span></div>
  <div className={`chat-heading chat-heading-${draft.step}`}><span className="chat-kicker">A LITTLE CURIOSITY, A CLEARER DIRECTION</span><h1>{draft.step === 'describe' ? 'What’s your hunch?' : draft.step === 'review' ? 'A good place to begin.' : 'Let’s shape your idea.'}</h1><p>{draft.step === 'describe' ? 'An app, a product, a service. Start with whatever is on your mind.' : draft.step === 'review' ? 'Check the brief. Research begins only when you choose.' : 'One question at a time. Pick a starting point, or tell us in your own words.'}</p></div>
  {!loaded ? <p role="status">Opening your draft…</p> : <>
  {draft.step !== 'describe' && !editing && <section className="chat-thread" aria-label="Idea conversation">{draft.messages.map((message, i) => <div key={i} className={`chat-message chat-${message.role}`}>{message.role === 'assistant' && <LaneMark />}<p>{message.text}</p></div>)}
   {!draft.reply && !draft.pending && <div className="chat-message chat-assistant"><LaneMark /><div><p>Let’s start with the people this could help, then find what makes your idea useful.</p><p className="chat-subtle">AI suggestions are starting points to consider, not researched facts. When you begin, your idea and answers are shared with our AI provider.</p></div></div>}
   {busy && <p className="chat-activity" role="status"><LoaderCircle size={16} className="spinner" />{draft.pending === 'research' ? 'Saving your research request…' : checking ? 'Checking your saved reply…' : preview ? 'Preparing preview question…' : 'Requesting your next question…'}</p>}
   <div ref={anchor} />
  </section>}
  {draft.step === 'review' && !editing && <section className="chat-brief" aria-label="Research brief"><div className="chat-brief-heading"><h2 ref={reviewHeading} tabIndex={-1}>Your research brief</h2><button className="chat-text-button" disabled={!!draft.pending} onClick={() => {
            setEditing(true);
            buffer(draft.brief.idea);
          }}><PencilLine size={15} />Edit idea</button></div><p>{draft.brief.idea}</p><span className="chat-category">{categories.find(([key]) => key === draft.brief.category)?.[1]}</span>{draft.brief.audience && <p>For: {draft.brief.audience}</p>}{draft.brief.location && <p>Where: {draft.brief.location}</p>}<ul>{Object.entries(draft.brief.answers).filter(([key]) => key !== 'finance').map(([key, text]) => <li key={key}>{text}</li>)}</ul>{draft.brief.answers.finance && <p>Previously saved financial assumptions will be included.</p>}<p className="chat-subtle">We’ll look for alternatives, check sources, and find a small experiment. Your brief is sent to the research providers. Suggestions from this conversation have not been verified.</p><Button disabled={busy || !!draft.pending} onClick={start}>{busy ? 'Starting…' : signedIn || preview ? 'Start research' : 'Sign in to research'}<ArrowRight size={16} /></Button></section>}
  {(draft.step === 'describe' || editing || draft.step === 'context') && !draft.pending && <div className="chat-input-area">
   {draft.step === 'context' && draft.reply && <div className="chat-suggestions" aria-label="Suggested starting points">{draft.reply.suggestions.map(text => <button key={text} disabled={busy} onClick={() => ask(text)}>{text}</button>)}<button disabled={busy} onClick={() => ask('I’m not sure yet')}>I’m not sure yet</button></div>}
   <form onSubmit={e => {
          e.preventDefault();
          if (draft.step === 'describe') opening();else if (editing) {
            const parsed = IdeaBriefSchema.safeParse({
              ...draft.brief,
              idea: draft.buffer
            });
            if (!parsed.success) {
              setError(parsed.error.issues[0].message);
              return;
            }
            persist({
              ...draft,
              brief: parsed.data,
              buffer: ''
            });
            setEditing(false);
          } else ask();
        }} className="chat-composer">
    <label htmlFor="chat-input" className="sr-only">{draft.step === 'describe' || editing ? 'Tell us what you have in mind.' : 'Your answer'}</label><textarea id="chat-input" ref={input} value={draft.buffer} onChange={e => buffer(e.target.value)} maxLength={draft.step === 'describe' || editing ? 3000 : 500} rows={3} placeholder={draft.step === 'describe' ? 'I’m thinking about…' : editing ? 'Your idea…' : draft.reply ? 'Write your own answer…' : 'Add anything you already know (optional)…'} aria-invalid={!!error} aria-describedby={error ? 'chat-error' : draft.reply ? 'chat-question chat-input-hint' : 'chat-input-hint'} />
    <div className="chat-composer-bottom"><span id="chat-input-hint">{draft.step === 'describe' ? 'A sentence is enough.' : editing ? 'Your own words stay in the brief.' : 'Numbers are optional. Uncertainty is welcome.'}</span><button aria-label={draft.step === 'describe' ? 'Explore my idea' : editing ? 'Save idea' : draft.reply ? 'Send answer' : 'Begin conversation'} disabled={busy} type="submit"><ArrowUp size={19} /></button></div>
   </form>
   {draft.step === 'context' && !draft.reply && <fieldset className="chat-categories"><legend>Closest to your idea</legend>{categories.map(([key, label]) => <label key={key}><input type="radio" name="category" checked={draft.brief.category === key} onChange={() => persist({
              ...draft,
              brief: {
                ...draft.brief,
                category: key
              }
            })} />{label}</label>)}</fieldset>}
   {draft.step === 'context' && <button className="chat-text-button chat-review-link" disabled={busy} onClick={review}>Review with what I have <ArrowRight size={14} /></button>}
   {editing && <button className="chat-text-button" onClick={() => {
          setEditing(false);
          buffer('');
        }}>Cancel edit</button>}
  </div>}
  <p id="chat-question" className="sr-only" aria-live="polite">{draft.reply?.question}</p>
  {error && <p id="chat-error" className="chat-error" role="alert">{error}</p>}
  {draft.pending === 'intake' && !busy && <div className="chat-recovery"><p>A reply is unconfirmed. Nothing will be resent automatically.</p><Button variant="secondary" onClick={recover}>Check saved reply</Button><Link href="/home">Return to your idea desk</Link></div>}
  {draft.pending === 'research' && !busy && <div className="chat-recovery"><Link className="chat-text-button" href={`/research/${draft.requestId}`}>Check research progress <ArrowRight size={15} /></Link></div>}
  <p className="chat-save-note">{saved ? <><Check size={13} />{fresh && draft.step === 'describe' ? 'Saved in this tab · your earlier draft is kept' : 'Saved on this device'}</> : 'Not saved yet · research never starts automatically'}</p>
  </>}
 </main>;
}
