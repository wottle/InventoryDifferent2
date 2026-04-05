-- AddColumn: timeline event translations (de, fr)
ALTER TABLE "TimelineEvent" ADD COLUMN "titleDe" TEXT;
ALTER TABLE "TimelineEvent" ADD COLUMN "descriptionDe" TEXT;
ALTER TABLE "TimelineEvent" ADD COLUMN "titleFr" TEXT;
ALTER TABLE "TimelineEvent" ADD COLUMN "descriptionFr" TEXT;
