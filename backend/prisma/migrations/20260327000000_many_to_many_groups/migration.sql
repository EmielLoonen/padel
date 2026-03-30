-- Migration: Many-to-many groups (UserGroup junction table)
-- Replaces single groupId/isAdmin/canCreateSessions/rating on User with UserGroup rows

-- 1. Create user_groups junction table
CREATE TABLE user_groups (
  id                  TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id             TEXT        NOT NULL,
  group_id            TEXT        NOT NULL,
  role                TEXT        NOT NULL DEFAULT 'member',
  can_create_sessions BOOLEAN     NOT NULL DEFAULT false,
  rating              DECIMAL(5,2),
  rating_updated_at   TIMESTAMPTZ,
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_groups_user_id_fkey  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT user_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  CONSTRAINT user_groups_user_id_group_id_key UNIQUE (user_id, group_id)
);
CREATE INDEX user_groups_user_id_idx  ON user_groups(user_id);
CREATE INDEX user_groups_group_id_idx ON user_groups(group_id);

-- 2. Migrate existing user memberships from users.group_id
INSERT INTO user_groups (id, user_id, group_id, role, can_create_sessions, rating, rating_updated_at)
SELECT
  gen_random_uuid()::text,
  u.id,
  u.group_id,
  CASE WHEN u.is_admin THEN 'admin' ELSE 'member' END,
  u.can_create_sessions,
  u.rating,
  u.rating_updated_at
FROM users u
WHERE u.group_id IS NOT NULL;

-- 3. Add group_id to rating_history (nullable, back-filled from set→court→session)
ALTER TABLE rating_history ADD COLUMN group_id TEXT;
CREATE INDEX rating_history_group_id_idx ON rating_history(group_id);

UPDATE rating_history rh
SET group_id = s.group_id
FROM sets st
JOIN courts c ON c.id = st.court_id
JOIN sessions s ON s.id = c.session_id
WHERE rh.set_id = st.id;

-- 4. Add group_id to match_ratings (nullable, back-filled from set→court→session)
ALTER TABLE match_ratings ADD COLUMN group_id TEXT;
CREATE INDEX match_ratings_group_id_idx ON match_ratings(group_id);

UPDATE match_ratings mr
SET group_id = s.group_id
FROM sets st
JOIN courts c ON c.id = st.court_id
JOIN sessions s ON s.id = c.session_id
WHERE mr.set_id = st.id;

-- 5. Remove migrated columns from users
ALTER TABLE users DROP COLUMN IF EXISTS group_id;
ALTER TABLE users DROP COLUMN IF EXISTS is_admin;
ALTER TABLE users DROP COLUMN IF EXISTS can_create_sessions;
ALTER TABLE users DROP COLUMN IF EXISTS rating;
ALTER TABLE users DROP COLUMN IF EXISTS rating_updated_at;
