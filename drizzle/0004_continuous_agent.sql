ALTER TABLE runs ADD COLUMN submission_hash text;
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN mode text NOT NULL DEFAULT 'legacy';
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN conversation jsonb;
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN brief_revision integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN locked_revision integer;
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN final_brief jsonb;
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN agent_cursor text NOT NULL DEFAULT 'queued';
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN deadline_at timestamptz;
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now();
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN recovery text NOT NULL DEFAULT 'working';
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN lease_token text;
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN lease_until timestamptz;
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN wake_sequence integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN recovery_attempts integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN operation_budget_cents integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE runs ADD COLUMN operation_budget_credits integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE provider_operations ADD COLUMN brief_revision integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE provider_operations ADD COLUMN attempts integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE provider_operations ADD COLUMN raw_receipt jsonb;
--> statement-breakpoint
ALTER TABLE provider_operations ADD COLUMN accounted boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE provider_operations ADD COLUMN ceiling_cents integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE provider_operations ADD COLUMN ceiling_credits integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE provider_operations ADD COLUMN error_class text;
--> statement-breakpoint
ALTER TABLE provider_operations ADD COLUMN retry_after_seconds integer NOT NULL DEFAULT 0;
--> statement-breakpoint
UPDATE provider_operations SET accounted=true WHERE state='complete';
--> statement-breakpoint
CREATE TABLE agent_outbox (
 id text PRIMARY KEY, run_id text NOT NULL REFERENCES runs(id), owner_id text NOT NULL,
 available_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX agent_outbox_pending ON agent_outbox(available_at) WHERE sent_at IS NULL;
--> statement-breakpoint
CREATE INDEX agent_recovery_due ON runs(next_attempt_at) WHERE mode='autonomous' AND status IN ('queued','running');
