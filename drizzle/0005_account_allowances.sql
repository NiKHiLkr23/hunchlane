-- Match ACCOUNT_ALLOWANCES in src/core/budget.ts. Existing runs keep their
-- reservations and count toward the five-per-kind allowance, including failures.
CREATE FUNCTION enforce_run_account_allowance() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.owner_id = OLD.owner_id AND NEW.kind = OLD.kind THEN
      RETURN NEW;
    END IF;
  END IF;
  -- Serialize admission for this owner and kind. The volatile trigger's count
  -- reads committed rows after acquiring the lock, including concurrent inserts.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.owner_id || ':' || NEW.kind, 0));
  IF (SELECT count(*) FROM runs
      WHERE owner_id = NEW.owner_id AND kind = NEW.kind AND id <> NEW.id) >= 5 THEN
    RAISE EXCEPTION 'ACCOUNT_QUOTA_EXHAUSTED';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER runs_account_allowance
BEFORE INSERT OR UPDATE OF owner_id, kind ON runs
FOR EACH ROW EXECUTE FUNCTION enforce_run_account_allowance();
--> statement-breakpoint
CREATE INDEX runs_owner_kind ON runs (owner_id, kind);
--> statement-breakpoint
DROP INDEX one_allowance_per_user_kind;
