CREATE TABLE "budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"limit_cents" integer NOT NULL,
	"allocated_cents" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"encrypted" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_operations" (
	"run_id" text NOT NULL,
	"phase" text NOT NULL,
	"state" text NOT NULL,
	"response_id" text,
	"result" jsonb,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"kind" text NOT NULL,
	"brief" jsonb NOT NULL,
	"parent_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"stage" text DEFAULT 'queued' NOT NULL,
	"report" jsonb,
	"error" text,
	"dispatched" boolean DEFAULT false NOT NULL,
	"reservation_cents" integer NOT NULL,
	"actual_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shares" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_operations" ADD CONSTRAINT "provider_operations_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_operation_per_phase" ON "provider_operations" USING btree ("run_id","phase");--> statement-breakpoint
CREATE UNIQUE INDEX "one_allowance_per_user_kind" ON "runs" USING btree ("owner_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_run_per_user" ON "runs" USING btree ("owner_id") WHERE "runs"."status" in ('queued','running');--> statement-breakpoint
CREATE INDEX "runs_owner" ON "runs" USING btree ("owner_id");