-- =====================================================
-- GOPCRG Investment Platform - Complete Database Schema
-- =====================================================
-- Run this entire file in Supabase SQL Editor
-- Version: 2.0 (Updated to match actual codebase)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING POLICIES (Clean slate)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Only admins can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins see all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Anyone can view active plans" ON plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON plans;
DROP POLICY IF EXISTS "Admins manage plans" ON plans;
DROP POLICY IF EXISTS "Admins see all plans" ON plans;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can create enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins manage enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins see all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;
DROP POLICY IF EXISTS "Admins manage payments" ON payments;
DROP POLICY IF EXISTS "Admins see all payments" ON payments;
DROP POLICY IF EXISTS "Anyone can view active payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admins can manage payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admins manage payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admins see all payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Anyone can view settings" ON settings;
DROP POLICY IF EXISTS "Admins can update settings" ON settings;

-- =====================================================
-- SITE SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name TEXT DEFAULT 'GoPcrg',
  site_icon_url TEXT,
  support_email TEXT DEFAULT 'support@gopcrg.com',
  support_whatsapp TEXT,
  custom_scripts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO site_settings (site_name, support_email)
VALUES ('GoPcrg', 'support@gopcrg.com')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE site_settings IS 'Global site configuration and branding settings';
COMMENT ON COLUMN site_settings.custom_scripts IS 'Array of custom JavaScript scripts: [{id, name, script, enabled, position}]';

-- =====================================================
-- SETTINGS TABLE (maturity configuration)
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_maturity_weeks INTEGER DEFAULT 5,
  weekly_maturity_months INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (daily_maturity_weeks, weekly_maturity_months)
VALUES (5, 6)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE settings IS 'Maturity period settings for different frequencies';

-- =====================================================
-- USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User profiles and roles';
COMMENT ON COLUMN users.role IS 'User role: user or admin';

-- =====================================================
-- PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contribution_amount DECIMAL(10, 2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY')),
  total_slots INTEGER NOT NULL DEFAULT 1,
  available_slots INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_contribution CHECK (contribution_amount > 0),
  CONSTRAINT positive_slots CHECK (total_slots > 0 AND available_slots >= 0),
  CONSTRAINT available_slots_check CHECK (available_slots <= total_slots)
);

COMMENT ON TABLE plans IS 'Investment plans with contribution amounts and frequencies';

-- Sample plans
INSERT INTO plans (name, contribution_amount, frequency, total_slots, available_slots)
VALUES
  ('Daily Plan - ₦500', 500.00, 'DAILY', 10, 10),
  ('Daily Plan - ₦1000', 1000.00, 'DAILY', 10, 10),
  ('Weekly Plan - ₦3500', 3500.00, 'WEEKLY', 5, 5)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ENROLLMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY')),
  contribution_amount DECIMAL(10, 2) NOT NULL,
  multiplier DECIMAL(4, 2) NOT NULL DEFAULT 50.00,
  enrollment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  maturity_date TIMESTAMPTZ NOT NULL,
  payout_amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MATURED', 'PAID', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_contribution CHECK (contribution_amount > 0),
  CONSTRAINT positive_payout CHECK (payout_amount > 0)
);

CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_plan_id ON enrollments(plan_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

COMMENT ON TABLE enrollments IS 'User enrollments in investment plans';

-- =====================================================
-- PAYMENT METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  account_identifier TEXT NOT NULL,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE payment_methods IS 'Available payment methods for contributions';

-- Sample payment methods
INSERT INTO payment_methods (name, account_identifier, instructions)
VALUES
  ('Bank Transfer', '1234567890 - First Bank', 'Transfer to account and upload proof of payment'),
  ('Mobile Money', '+234 123 456 7890', 'Send payment and upload screenshot')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  proof_screenshot_url TEXT,
  payment_method_id UUID REFERENCES payment_methods(id),
  transaction_id TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  verified_by UUID REFERENCES users(id),
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_payments_enrollment_id ON payments(enrollment_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_verified_by ON payments(verified_by);
CREATE INDEX idx_payments_payment_method_id ON payments(payment_method_id);

COMMENT ON TABLE payments IS 'User contribution payments with proof of payment';

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- Create payment-proofs bucket (run this in SQL or create manually in Storage UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION (prevents infinite recursion)
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SITE SETTINGS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view site settings"
  ON site_settings FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Only admins can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (is_admin());

-- =====================================================
-- SETTINGS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view settings"
  ON settings FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can update settings"
  ON settings FOR ALL
  TO authenticated
  USING (is_admin());

-- =====================================================
-- USERS POLICIES
-- =====================================================
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins see all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (is_admin());

-- =====================================================
-- PLANS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view active plans"
  ON plans FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admins see all plans"
  ON plans FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins manage plans"
  ON plans FOR ALL
  TO authenticated
  USING (is_admin());

-- =====================================================
-- ENROLLMENTS POLICIES
-- =====================================================
CREATE POLICY "Users can view their own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins see all enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can create enrollments"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage enrollments"
  ON enrollments FOR ALL
  TO authenticated
  USING (is_admin());

-- =====================================================
-- PAYMENT METHODS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view active payment methods"
  ON payment_methods FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admins see all payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins manage payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (is_admin());

-- =====================================================
-- PAYMENTS POLICIES
-- =====================================================
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins see all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage payments"
  ON payments FOR ALL
  TO authenticated
  USING (is_admin());

-- =====================================================
-- STORAGE POLICIES
-- =====================================================
-- Users can upload to their own folder
CREATE POLICY "Users can upload own payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own files
CREATE POLICY "Users can view own proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all files
CREATE POLICY "Admins can view all proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND is_admin()
);

-- Admins can delete files
CREATE POLICY "Admins can delete proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND is_admin()
);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update plan slots on enrollment
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

DROP TRIGGER IF EXISTS manage_plan_slots ON enrollments;
CREATE TRIGGER manage_plan_slots
  BEFORE INSERT OR DELETE OR UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_plan_slots();

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Next steps:
-- 1. Disable email confirmation in Auth settings:
--    Authentication → Providers → Email → Toggle OFF "Confirm email"
--
-- 2. Set your environment variables:
--    VITE_SUPABASE_URL=your_supabase_url
--    VITE_SUPABASE_ANON_KEY=your_anon_key
--
-- 3. Create your first admin user:
--    - Sign up through the app
--    - Then run: UPDATE users SET role = 'admin' WHERE email = 'youremail@example.com';
--
-- 4. Configure site settings in the admin panel
-- =====================================================
