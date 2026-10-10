import { z } from 'zod';
import { IdeaBriefSchema, type IdeaBrief } from './types';
export const DRAFT_KEY = 'hunchlane.idea-draft.v2';
export const LEGACY_DRAFT_KEY = 'hunchlane.idea-draft.v1';
export const emptyBrief: IdeaBrief = {
  idea: '',
  category: 'software',
  audience: '',
  location: '',
  answers: {}
};
export const IntakeReplySchema = z.object({
  message: z.string().min(1).max(700),
  question: z.string().max(180),
  suggestions: z.array(z.string().min(1).max(150)).max(3),
  ready: z.boolean()
});
export type IntakeReply = z.infer<typeof IntakeReplySchema>;
export const DraftSchema = z.object({
  version: z.literal(2),
  brief: IdeaBriefSchema.extend({
    idea: z.string().max(3000)
  }),
  step: z.enum(['describe', 'context', 'review']),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    text: z.string().max(3000)
  })).max(10).default([]),
  reply: IntakeReplySchema.nullable().default(null),
  intakeId: z.string().uuid().nullable().default(null),
  turn: z.number().int().min(0).max(3).default(0),
  pending: z.enum(['intake', 'research']).nullable().default(null),
  requestId: z.string().uuid().nullable().default(null),
  buffer: z.string().max(3000).default('')
});
export type IdeaDraft = z.infer<typeof DraftSchema>;
export function newDraft(): IdeaDraft {
  return DraftSchema.parse({
    version: 2,
    brief: emptyBrief,
    step: 'describe'
  });
}
export function parseDraft(current: string | null, legacy: string | null): IdeaDraft | null {
  try {
    if (current) {
      const parsed = DraftSchema.safeParse(JSON.parse(current));
      if (parsed.success) return parsed.data;
    }
  } catch {}
  try {
    if (legacy) {
      const parsed = IdeaBriefSchema.safeParse(JSON.parse(legacy));
      if (parsed.success) return {
        ...newDraft(),
        brief: parsed.data
      };
    }
  } catch {}
  return null;
}
