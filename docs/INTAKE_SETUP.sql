-- Operator-authorized intake tables. Apply without resetting existing budgets.
-- Intake uses the existing shared research allowance; no separate pilot budget.
-- Separate journal from research runs, credits and provider_operations.
CREATE TABLE IF NOT EXISTS idea_intakes (
 id text PRIMARY KEY, owner_id text NOT NULL, next_turn integer NOT NULL DEFAULT 0 CHECK(next_turn BETWEEN 0 AND 3),
 reservation_cents integer NOT NULL DEFAULT 30, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS intake_operations (
 intake_id text NOT NULL REFERENCES idea_intakes(id), turn integer NOT NULL CHECK(turn BETWEEN 0 AND 2),
 request_hash text NOT NULL, state text NOT NULL CHECK(state IN ('creating','complete')),
 result jsonb, input_tokens integer, output_tokens integer, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(intake_id,turn)
);
