-- CreateTable
CREATE TABLE "DeviceLink" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceLink_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeviceLink" ADD CONSTRAINT "DeviceLink_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing externalUrl data with domain-inferred labels
INSERT INTO "DeviceLink" ("deviceId", "label", "url", "createdAt")
SELECT id,
  CASE
    WHEN "externalUrl" ILIKE '%everymac.com%'              THEN 'EveryMac'
    WHEN "externalUrl" ILIKE '%mactracker%'                THEN 'MacTracker'
    WHEN "externalUrl" ILIKE '%macintoshgarden.org%'       THEN 'Macintosh Garden'
    WHEN "externalUrl" ILIKE '%macintoshrepository.org%'   THEN 'Macintosh Repository'
    WHEN "externalUrl" ILIKE '%68kmla.org%'                THEN '68kMLA Thread'
    WHEN "externalUrl" ILIKE '%amiga.org%'                 THEN 'Amiga.org'
    WHEN "externalUrl" ILIKE '%wikipedia.org%'             THEN 'Wikipedia'
    WHEN "externalUrl" ILIKE '%ebay.com%'                  THEN 'eBay Listing'
    WHEN "externalUrl" ILIKE '%youtube.com%'               THEN 'YouTube'
    ELSE 'External Link'
  END,
  "externalUrl",
  NOW()
FROM "Device"
WHERE "externalUrl" IS NOT NULL AND "externalUrl" != '';
