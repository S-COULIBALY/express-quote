CREATE TABLE business_rules (
    id SERIAL PRIMARY KEY,
    activity_type VARCHAR(50) NOT NULL,
    rules JSONB NOT NULL,
    version INTEGER NOT NULL,
    valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_rules_activity_type ON business_rules(activity_type);
CREATE INDEX idx_business_rules_valid_dates ON business_rules(valid_from, valid_to);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_rules_updated_at
    BEFORE UPDATE ON business_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 