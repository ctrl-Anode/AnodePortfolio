-- Skills are ordered alphabetically (category, then name) on read, so the
-- manual sort order is no longer needed; `keywords` was never consumed by the app.
ALTER TABLE `skills` DROP COLUMN `keywords`;
ALTER TABLE `skills` DROP COLUMN `sortOrder`;
