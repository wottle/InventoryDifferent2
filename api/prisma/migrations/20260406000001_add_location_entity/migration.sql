-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- AlterTable: add locationId FK column
ALTER TABLE "Device" ADD COLUMN "locationId" INTEGER;

-- Migrate existing free-text location strings to Location entities
INSERT INTO "Location" ("name")
SELECT DISTINCT location FROM "Device"
WHERE location IS NOT NULL AND location != ''
ON CONFLICT ("name") DO NOTHING;

-- Back-fill Device.locationId FK from existing location strings
UPDATE "Device"
SET "locationId" = (SELECT id FROM "Location" WHERE "Location"."name" = "Device"."location")
WHERE "Device"."location" IS NOT NULL AND "Device"."location" != '';

-- Drop old text column
ALTER TABLE "Device" DROP COLUMN "location";

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
