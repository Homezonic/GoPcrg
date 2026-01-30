-- Add custom_scripts column to site_settings table
-- This column stores an array of custom JavaScript scripts that admins can add

-- Add the custom_scripts column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'site_settings'
        AND column_name = 'custom_scripts'
    ) THEN
        ALTER TABLE site_settings
        ADD COLUMN custom_scripts JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add a comment to the column
COMMENT ON COLUMN site_settings.custom_scripts IS 'Array of custom JavaScript scripts to inject into the app. Each script has: id, name, script, enabled, position (head|body)';
