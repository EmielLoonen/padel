-- Create groups table
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "groups_invite_code_key" ON "groups"("invite_code");

-- Add group_id and is_super_admin to users
ALTER TABLE "users" ADD COLUMN "group_id" TEXT;
ALTER TABLE "users" ADD COLUMN "is_super_admin" BOOLEAN NOT NULL DEFAULT false;

-- Add group_id to sessions
ALTER TABLE "sessions" ADD COLUMN "group_id" TEXT;

-- Create default group and migrate existing data
DO $$
DECLARE
    default_group_id TEXT := gen_random_uuid()::TEXT;
BEGIN
    -- Insert default group
    INSERT INTO "groups" ("id", "name", "invite_code", "created_at", "updated_at")
    VALUES (default_group_id, 'Default Group', 'DEFAULT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

    -- Assign all existing users to the default group
    UPDATE "users" SET "group_id" = default_group_id;

    -- Assign all existing sessions to the default group
    UPDATE "sessions" SET "group_id" = default_group_id;
END $$;

-- Add foreign key constraints
ALTER TABLE "users" ADD CONSTRAINT "users_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "users_group_id_idx" ON "users"("group_id");
CREATE INDEX "sessions_group_id_idx" ON "sessions"("group_id");
