-- First run (plan 0001, slice 1): progress and the projects folder live on
-- the profile row. `onboarding_complete` already exists.
ALTER TABLE profiles ADD COLUMN onboarding_stage TEXT;
ALTER TABLE profiles ADD COLUMN onboarding_later_at INTEGER;
ALTER TABLE profiles ADD COLUMN projects_root TEXT;
