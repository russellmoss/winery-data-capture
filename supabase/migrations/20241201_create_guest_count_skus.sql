-- Create guest_count_skus table for storing configurable SKU settings
CREATE TABLE IF NOT EXISTS guest_count_skus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku_id VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on sku_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_guest_count_skus_sku_id ON guest_count_skus(sku_id);

-- Enable Row Level Security
ALTER TABLE guest_count_skus ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all SKUs
CREATE POLICY "Allow authenticated users to read guest count SKUs" ON guest_count_skus
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert SKUs
CREATE POLICY "Allow authenticated users to insert guest count SKUs" ON guest_count_skus
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update SKUs
CREATE POLICY "Allow authenticated users to update guest count SKUs" ON guest_count_skus
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete SKUs
CREATE POLICY "Allow authenticated users to delete guest count SKUs" ON guest_count_skus
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_guest_count_skus_updated_at 
    BEFORE UPDATE ON guest_count_skus 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
