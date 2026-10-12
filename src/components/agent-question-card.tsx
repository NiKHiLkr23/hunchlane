"use client";

import { useEffect, useRef, useState } from "react";
import { CircleHelp, LoaderCircle, ArrowRight } from "lucide-react";
import type { AgentQuestion } from "@/core/agent";

export function AgentQuestionCard({ question, index, total, busy, onAnswer, onAutoAnswer }: {
  question: AgentQuestion;
  index: number;
  total: number;
  busy: boolean;
  onAnswer: (text: string) => void;
  onAutoAnswer: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [ownAnswer, setOwnAnswer] = useState(false);
  const title = useRef<HTMLLegendElement>(null);
  const customInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { title.current?.focus({preventScroll:true}); }, [question.id]);
  useEffect(() => {
    if (ownAnswer) customInput.current?.focus();
  }, [ownAnswer]);
  const answer = [...selected, ...(ownAnswer && custom.trim() ? [custom.trim()] : [])].join("; ");
  return (
    <form className="agent-question-card" onSubmit={event => {
      event.preventDefault();
      if (answer && answer.length <= 500 && !busy) onAnswer(answer);
    }}>
      <div className="agent-question-card-heading"><CircleHelp size={16} />Agent has questions for you</div>
      <div className="agent-question-card-body">
        <fieldset disabled={busy}>
          <legend ref={title} tabIndex={-1}>{question.text}</legend>
          <div className="agent-question-options">
            {question.suggestions.map(option => (
              <label className="agent-question-option" key={option}>
                <input type="checkbox" checked={selected.includes(option)} onChange={event => setSelected(current => event.target.checked ? [...current, option] : current.filter(value => value !== option))} />
                <span>{option}</span>
              </label>
            ))}
            <label className="agent-question-option">
              <input type="checkbox" checked={ownAnswer} onChange={event => setOwnAnswer(event.target.checked)} />
              <span>Something else</span>
            </label>
            {ownAnswer && <textarea ref={customInput} aria-label="Your own answer" value={custom} maxLength={500} rows={2} onChange={event => setCustom(event.target.value)} placeholder="Tell us in your own words…" />}
          </div>
        </fieldset>
        {answer.length > 500 && <p role="status" className="chat-subtle">Keep your combined answer within 500 characters.</p>}
        <div className="agent-question-card-footer">
          <span>Question {index + 1} of {total}</span>
          <div>
            <button type="button" className="agent-auto-answer" aria-label="Auto-answer remaining questions" disabled={busy} onClick={onAutoAnswer}>Auto-answer</button>
            <button type="submit" className="agent-question-next" disabled={busy || !answer || answer.length > 500}>
              {busy ? <LoaderCircle size={16} className="spinner" /> : <>Next <ArrowRight size={14} /></>}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
