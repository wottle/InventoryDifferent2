-- CreateTable
CREATE TABLE "ShowcaseJourney" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImagePath" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowcaseJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowcaseChapter" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShowcaseChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowcaseDevice" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "curatorNote" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShowcaseDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowcaseQuote" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShowcaseQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowcaseConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "siteTitle" TEXT NOT NULL DEFAULT 'The Collection',
    "tagline" TEXT NOT NULL DEFAULT '',
    "bioText" TEXT NOT NULL DEFAULT '',
    "heroImagePath" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#0058bc',
    "timelineCuratorNote" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ShowcaseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShowcaseJourney_slug_key" ON "ShowcaseJourney"("slug");

-- AddForeignKey
ALTER TABLE "ShowcaseChapter" ADD CONSTRAINT "ShowcaseChapter_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "ShowcaseJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowcaseDevice" ADD CONSTRAINT "ShowcaseDevice_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "ShowcaseChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowcaseDevice" ADD CONSTRAINT "ShowcaseDevice_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
