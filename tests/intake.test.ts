import { beforeAll, beforeEach, afterAll, it, expect, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
const harness = vi.hoisted(() => ({
  query: null as null | ((sql: string, args: unknown[]) => Promise<unknown[]>),
  create: vi.fn()
}));
vi.mock('@neondatabase/serverless', () => ({
  neon: () => async (strings: TemplateStringsArray, ...args: unknown[]) => harness.query!(strings.reduce((s, part, i) => s + part + (i < args.length ? `$${i + 1}` : ''), ''), args)
}));
vi.mock('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: harness.create
      }
    };
  }
}));
vi.mock('neatlogs', () => ({
  wrapOpenAI: (client: unknown) => client
}));
vi.mock('@/server/telemetry', () => ({
  observed: async (_id: string, _phase: string, fn: () => Promise<unknown>) => fn()
}));
import { intakeTurn, savedIntake, intakeEnabled } from '@/server/intake';
import { sampleReport } from '@/core/sample';
let engine: PGlite;
const input = {
  id: '00000000-0000-4000-8000-000000000001',
  turn: 0,
  brief: sampleReport.brief,
  messages: [{
    role: 'user' as const,
    text: sampleReport.brief.idea
  }]
};
beforeAll(async () => {
  process.env.DATABASE_URL = 'postgres://test';
  engine = new PGlite();
  harness.query = async (sql, args) => (await engine.query(sql, args)).rows;
  await engine.exec('CREATE TABLE budgets(id text PRIMARY KEY,limit_cents integer NOT NULL,allocated_cents integer NOT NULL DEFAULT 0);');
  await engine.exec(await readFile(new URL('../docs/INTAKE_SETUP.sql', import.meta.url), 'utf8'));
}, 30000);
beforeEach(async () => {
  await engine.exec("TRUNCATE intake_operations,idea_intakes;UPDATE budgets SET limit_cents=30,allocated_cents=0;");
  harness.create.mockReset().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          message: 'Let’s explore the audience.',
          question: 'Who is it for?',
          suggestions: ['Students'],
          ready: false
        })
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 40
    }
  });
});
afterAll(() => engine.close());
it('starts disabled and refuses unfunded intake without a provider request', async () => {
  expect(intakeEnabled()).toBe(false);
  await engine.exec('UPDATE budgets SET limit_cents=0');
  await expect(intakeTurn('alice', input)).rejects.toThrow('INTAKE_BUDGET_EXHAUSTED');
  expect(harness.create).not.toHaveBeenCalled();
});
it('reserves once, recovers the same reply, and keeps it private', async () => {
  const reply = await intakeTurn('alice', input);
  expect(await intakeTurn('alice', input)).toEqual(reply);
  expect(harness.create).toHaveBeenCalledTimes(1);
  expect(await savedIntake(input.id, 'bob', 0)).toBeUndefined();
  expect((await engine.query('SELECT allocated_cents FROM budgets')).rows[0]).toMatchObject({
    allocated_cents: 30
  });
  await expect(intakeTurn('alice', {
    ...input,
    messages: [{
      role: 'user',
      text: 'Changed idea'
    }]
  })).rejects.toThrow('INTAKE_CONFLICT');
});
it('bounds the funded pilot under concurrent sessions and preserves the journal', async () => {
  const results = await Promise.allSettled([intakeTurn('alice', input), intakeTurn('bob', {
    ...input,
    id: '00000000-0000-4000-8000-000000000002'
  })]);
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(harness.create).toHaveBeenCalledTimes(1);
  expect((await engine.query('SELECT * FROM intake_operations')).rows).toHaveLength(1);
});
it('never replays an uncertain charge or advances beyond it', async () => {
  harness.create.mockRejectedValue(Error('Timeout'));
  await expect(intakeTurn('alice', input)).rejects.toThrow('Timeout');
  await expect(intakeTurn('alice', input)).rejects.toThrow('RECONCILIATION_REQUIRED');
  await expect(intakeTurn('alice', {
    ...input,
    turn: 1
  })).rejects.toThrow('RECONCILIATION_REQUIRED');
  expect(harness.create).toHaveBeenCalledTimes(1);
  expect(await savedIntake(input.id, 'alice', 0)).toMatchObject({
    state: 'creating'
  });
});
it('finishes after three calls and cannot allocate another turn', async () => {
  for (let turn = 0; turn < 3; turn++) {
    const result = await intakeTurn('alice', {
      ...input,
      turn
    });
    expect(result.ready).toBe(turn === 2);
  }
  await expect(intakeTurn('alice', {
    ...input,
    turn: 3
  })).rejects.toThrow('RECONCILIATION_REQUIRED');
  expect(harness.create).toHaveBeenCalledTimes(3);
});
it('rejects oversize provider input before reserving or calling', async () => {
  await expect(intakeTurn('alice', {
    ...input,
    messages: [{
      role: 'user',
      text: '界'.repeat(6000)
    }]
  })).rejects.toThrow('INTAKE_TOO_LONG');
  expect(harness.create).not.toHaveBeenCalled();
  expect((await engine.query('SELECT allocated_cents FROM budgets')).rows[0]).toMatchObject({
    allocated_cents: 0
  });
});
it('stops empty owners and a conversation already ready for review', async () => {
  await expect(savedIntake(input.id, '', 0)).rejects.toThrow('UNAUTHENTICATED');
  harness.create.mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          message: 'Ready to review.',
          question: '',
          suggestions: [],
          ready: true
        })
      },
      finish_reason: 'stop'
    }]
  });
  await intakeTurn('alice', input);
  await expect(intakeTurn('alice', {
    ...input,
    turn: 1
  })).rejects.toThrow('RECONCILIATION_REQUIRED');
  expect(harness.create).toHaveBeenCalledTimes(1);
});
