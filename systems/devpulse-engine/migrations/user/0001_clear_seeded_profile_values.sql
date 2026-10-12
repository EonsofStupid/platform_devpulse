-- The deleted debug seed and the old profile creator wrote values the user
-- never chose: a hardware profile ('32g_engineer'), an expertise level, and a
-- placeholder name. Clear them. The hardware preset is chosen by the user
-- (plan 0001 A4b); skill level is inferred, never asked (plan 0004 C).
UPDATE profiles SET hardware_profile = NULL WHERE hardware_profile = '32g_engineer';
UPDATE profiles SET expertise_level = NULL;
UPDATE profiles SET display_name = NULL WHERE display_name = 'Developer';
