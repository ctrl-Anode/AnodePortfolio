-- The credential is now an uploaded certificate file (PDF/image) stored on
-- Cloudflare R2 rather than a hand-typed link. Its public URL can exceed the
-- old VARCHAR(500) cap, and MySQL was silently truncating longer values, which
-- is exactly what produced "corrupted" credential links on the live site.
-- Widen the column to TEXT so nothing is ever truncated.
ALTER TABLE `certificates` MODIFY `credentialUrl` TEXT NULL;
