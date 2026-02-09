-- Migration: Fix enrollment slots trigger
-- Issue: SECURITY DEFINER was missing, causing RLS to block slot updates
-- Date: 2026-02-09

-- Drop and recreate the trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_plan_slots()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE plans
    SET available_slots = available_slots - 1
    WHERE id = NEW.plan_id AND available_slots > 0;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No available slots for this plan';
    END IF;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status = 'CANCELLED') THEN
    UPDATE plans
    SET available_slots = available_slots + 1
    WHERE id = COALESCE(NEW.plan_id, OLD.plan_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger with BEFORE instead of AFTER
DROP TRIGGER IF EXISTS manage_plan_slots ON enrollments;
CREATE TRIGGER manage_plan_slots
  BEFORE INSERT OR DELETE OR UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_plan_slots();
