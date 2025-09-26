DROP FUNCTION IF EXISTS update_timestamp_column() CASCADE;
CREATE OR REPLACE FUNCTION update_timestamp_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
