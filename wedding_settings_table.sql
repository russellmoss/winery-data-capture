-- Create wedding feature settings table
CREATE TABLE IF NOT EXISTS wedding_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default wedding settings
INSERT INTO wedding_settings (setting_key, setting_value, description) VALUES
  ('show_wedding_metrics', true, 'Show wedding-related metrics in reports'),
  ('show_wedding_capture_rate', true, 'Show "Company Data Capture Rate Less Weddings" metric'),
  ('show_wedding_lead_profiles', true, 'Show "Wedding Lead Profiles" count'),
  ('show_wedding_subscription_rate', true, 'Show "Company Subscription Rate (No Weddings)" metric')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wedding_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER wedding_settings_updated_at
  BEFORE UPDATE ON wedding_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_wedding_settings_updated_at();
