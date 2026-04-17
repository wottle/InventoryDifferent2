-- Add optional editorial volumeNumber to ShowcaseJourney.
-- Null means "auto-computed from publishedAt ranking" at query time.

ALTER TABLE "ShowcaseJourney" ADD COLUMN "volumeNumber" INTEGER;
