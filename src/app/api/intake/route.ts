import { z } from 'zod';
import { requireOwner, sameOrigin, apiError } from '@/server/auth';
import { intakeEnabled, intakeTurn, savedIntake } from '@/server/intake';
import { IntakeRequestSchema } from '@/core/intake';
export const maxDuration = 300;
export async function POST(request: Request) {
  let claimed = false;
  try {
    sameOrigin(request);
    const owner = await requireOwner();
    if (!intakeEnabled()) return Response.json({
      error: 'The AI conversation is not available yet. You can keep your draft or review with what you have.',
      safeToRetry: true
    }, {
      status: 503
    });
    const text = await request.text();
    if (text.length > 20000) return Response.json({
      error: 'This conversation is too long. Review with what you have.',
      safeToRetry: true
    }, {
      status: 413
    });
    const parsed = IntakeRequestSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return Response.json({
      error: 'Check your idea and answer lengths.',
      safeToRetry: true
    }, {
      status: 400
    });
    claimed = true;
    const reply = await intakeTurn(owner, parsed.data);
    return Response.json({
      reply
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    if (['INTAKE_BUDGET_EXHAUSTED', 'INTAKE_TOO_LONG'].includes(code)) return Response.json({
      error: code === 'INTAKE_TOO_LONG' ? 'This conversation is too long. Review with what you have.' : 'The AI conversation allowance is used up. You can review your saved brief.',
      safeToRetry: true
    }, {
      status: 429
    });
    if (claimed) return Response.json({
      error: 'A provider check is needed before another request.',
      safeToRetry: false
    }, {
      status: 409
    });
    const response = apiError(e);
    const data = await response.json();
    return Response.json({
      ...data,
      safeToRetry: true
    }, {
      status: response.status
    });
  }
}
export async function GET(request: Request) {
  try {
    const owner = await requireOwner();
    if (!intakeEnabled()) return Response.json({
      error: 'AI conversation unavailable.'
    }, {
      status: 503
    });
    const params = new URL(request.url).searchParams,
      id = z.string().uuid().parse(params.get('id')),
      turn = z.coerce.number().int().min(0).max(2).parse(params.get('turn'));
    const saved = await savedIntake(id, owner, turn);
    return Response.json({
      reply: saved?.state === 'complete' ? saved.result : null
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return apiError(e);
  }
}
