-- Backfill any NULL emails so we can set NOT NULL (required for new submissions)
UPDATE "makers" SET "email" = '' WHERE "email" IS NULL;
ALTER TABLE "makers" ALTER COLUMN "email" SET NOT NULL;
