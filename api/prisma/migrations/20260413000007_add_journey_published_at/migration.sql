-- Add publishedAt timestamp to ShowcaseJourney.
-- Nullable: null means never published. Set once on first publish, not reset on unpublish.

ALTER TABLE "ShowcaseJourney" ADD COLUMN "publishedAt" TIMESTAMP WITH TIME ZONE;

-- Back-fill any already-published journeys with their createdAt as a reasonable proxy.
UPDATE "ShowcaseJourney" SET "publishedAt" = "createdAt" WHERE "published" = true;
