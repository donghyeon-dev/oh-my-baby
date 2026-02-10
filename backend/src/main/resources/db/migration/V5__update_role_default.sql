-- Update default role value for new users
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'FAMILY';
