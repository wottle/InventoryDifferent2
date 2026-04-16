-- Make ShowcaseChapter.description optional (nullable)
ALTER TABLE "ShowcaseChapter" ALTER COLUMN "description" DROP NOT NULL;
