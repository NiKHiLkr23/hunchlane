import { it, expect } from 'vitest';
import { parseDraft, newDraft } from '@/core/idea-draft';
import { sampleReport } from '@/core/sample';
it('restores legacy briefs without inventing a completed review', () => {
  const old = sampleReport.brief;
  expect(parseDraft(null, JSON.stringify(old))).toMatchObject({
    brief: old,
    step: 'describe',
    version: 2
  });
});
it('restores the current step, user answers and uncertain request without replaying it', () => {
  const draft = {
    ...newDraft(),
    brief: sampleReport.brief,
    step: 'review',
    pending: 'research',
    requestId: '00000000-0000-4000-8000-000000000004'
  };
  expect(parseDraft(JSON.stringify(draft), null)).toEqual(draft);
});
it('keeps incomplete opening text and ignores malformed/unknown draft versions', () => {
  const draft = {
    ...newDraft(),
    buffer: 'A hunch'
  };
  expect(parseDraft(JSON.stringify(draft), null)?.buffer).toBe('A hunch');
  expect(parseDraft('{bad', null)).toBeNull();
  expect(parseDraft(JSON.stringify({
    ...draft,
    version: 9
  }), null)).toBeNull();
  expect(parseDraft('{bad', JSON.stringify(sampleReport.brief))?.brief).toEqual(sampleReport.brief);
});
