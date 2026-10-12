-- Existing full reports, including failures, count toward the two-report allowance.
CREATE OR REPLACE FUNCTION enforce_run_account_allowance() RETURNS trigger
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
      WHERE owner_id = NEW.owner_id AND kind = NEW.kind AND id <> NEW.id) >= (CASE WHEN NEW.kind = 'full' THEN 2 ELSE 5 END) THEN
    RAISE EXCEPTION 'ACCOUNT_QUOTA_EXHAUSTED';
  END IF;
  RETURN NEW;
END;
$$;
