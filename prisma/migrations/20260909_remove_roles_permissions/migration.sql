-- Drop the per-role, per-module permission table (no longer used)
DROP TABLE IF EXISTS "role_permissions";

-- Drop the role column from users (all users now have full access)
ALTER TABLE "users" DROP COLUMN IF EXISTS "role";

-- Drop the now-unused enums
DROP TYPE IF EXISTS "Role";
DROP TYPE IF EXISTS "AccessLevel";