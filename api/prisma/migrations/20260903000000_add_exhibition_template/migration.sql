-- CreateTable
CREATE TABLE "ExhibitionTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgName" TEXT,
    "logoPath" TEXT,
    "layout" TEXT NOT NULL DEFAULT 'A4_FULL',
    "accentColor" TEXT,
    "footerText" TEXT,
    "showQR" BOOLEAN NOT NULL DEFAULT true,
    "showManufacturer" BOOLEAN NOT NULL DEFAULT true,
    "showModel" BOOLEAN NOT NULL DEFAULT true,
    "showSerial" BOOLEAN NOT NULL DEFAULT true,
    "showYear" BOOLEAN NOT NULL DEFAULT true,
    "showCategory" BOOLEAN NOT NULL DEFAULT true,
    "showStatus" BOOLEAN NOT NULL DEFAULT false,
    "showCondition" BOOLEAN NOT NULL DEFAULT true,
    "showLocation" BOOLEAN NOT NULL DEFAULT false,
    "showDescription" BOOLEAN NOT NULL DEFAULT true,
    "showSpecs" BOOLEAN NOT NULL DEFAULT true,
    "showTags" BOOLEAN NOT NULL DEFAULT false,
    "showCustomFields" BOOLEAN NOT NULL DEFAULT false,
    "customHtml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExhibitionTemplate_pkey" PRIMARY KEY ("id")
);
