ALTER TABLE "provider_operations" ADD COLUMN "failure_history" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "retry_dispatch_id" text;
--> statement-breakpoint
UPDATE "provider_operations" SET "failure_history" = result->'failures' WHERE jsonb_typeof(result->'failures') = 'array';
