-- Complete GoPcrg Database Schema
-- Run this in your Supabase SQL Editor

-- ================================================
-- USERS TABLE
-- ================================================
-- First, check if role column exists in users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Update existing users to have 'user' role if NULL
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Make the first user an admin (update this email to your actual admin email)
-- UPDATE users SET role = 'admin' WHERE email = 'admin@gopcrg.com';

-- ================================================
-- SITE SETTINGS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL DEFAULT 'GoPcrg',
  site_icon_url TEXT,
  support_whatsapp TEXT,
  support_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings (only if table is empty)
INSERT INTO site_settings (site_name, support_whatsapp, support_email)
SELECT 'GoPcrg', '+1234567890', 'support@gopcrg.com'
WHERE NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1);

-- Enable RLS on site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Only admins can update site settings" ON site_settings;

-- Everyone can read settings
CREATE POLICY "Anyone can read site settings"
  ON site_settings
  FOR SELECT
  USING (true);

-- Only admin role can update settings
CREATE POLICY "Only admins can update site settings"
  ON site_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ================================================
-- TRIGGERS
-- ================================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on site_settings
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- VERIFICATION QUERIES
-- ================================================
-- Run these to verify everything is set up correctly:

-- Check site_settings
-- SELECT * FROM site_settings;

-- Check users with roles
-- SELECT id, email, full_name, role FROM users;

-- Check if current user is admin
-- SELECT role FROM users WHERE id = auth.uid();
