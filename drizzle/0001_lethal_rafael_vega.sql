ALTER TABLE "budgets" ADD COLUMN "credit_limit_milli" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "credit_allocated_milli" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_operations" ADD COLUMN "credit_milli" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "provider" text DEFAULT 'openai' NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "credit_reservation_milli" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "credit_actual_milli" integer DEFAULT 0 NOT NULL;