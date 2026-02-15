-- CreateEnum
CREATE TYPE "Status" AS ENUM ('AVAILABLE', 'FOR_SALE', 'PENDING_SALE', 'SOLD', 'DONATED');

-- CreateEnum
CREATE TYPE "FunctionalStatus" AS ENUM ('YES', 'PARTIAL', 'NO');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('COMPUTER', 'PERIPHERAL', 'ACCESSORY', 'OTHER');

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "additionalName" TEXT,
    "manufacturer" TEXT,
    "modelNumber" TEXT,
    "serialNumber" TEXT,
    "releaseYear" INTEGER,
    "location" TEXT,
    "info" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'AVAILABLE',
    "functionalStatus" "FunctionalStatus" NOT NULL DEFAULT 'YES',
    "lastPowerOnDate" TIMESTAMP(3),
    "hasOriginalBox" BOOLEAN NOT NULL DEFAULT false,
    "isAssetTagged" BOOLEAN NOT NULL DEFAULT false,
    "dateAcquired" TIMESTAMP(3),
    "whereAcquired" TEXT,
    "priceAcquired" DECIMAL(10,2),
    "estimatedValue" DECIMAL(10,2),
    "listPrice" DECIMAL(10,2),
    "soldPrice" DECIMAL(10,2),
    "soldDate" TIMESTAMP(3),
    "cpu" TEXT,
    "ram" TEXT,
    "graphics" TEXT,
    "storage" TEXT,
    "operatingSystem" TEXT,
    "isWifiEnabled" BOOLEAN,
    "isPramBatteryRemoved" BOOLEAN,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "externalUrl" TEXT,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "dateTaken" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caption" TEXT,
    "isShopImage" BOOLEAN NOT NULL DEFAULT false,
    "isThumbnail" BOOLEAN NOT NULL DEFAULT false,
    "isListingImage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTask" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "dateCompleted" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "MaintenanceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "additionalName" TEXT,
    "manufacturer" TEXT,
    "modelNumber" TEXT,
    "releaseYear" INTEGER,
    "estimatedValue" DECIMAL(10,2),
    "cpu" TEXT,
    "ram" TEXT,
    "graphics" TEXT,
    "storage" TEXT,
    "operatingSystem" TEXT,
    "externalUrl" TEXT,
    "isWifiEnabled" BOOLEAN,
    "isPramBatteryRemoved" BOOLEAN,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DeviceToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_DeviceToTag_AB_unique" ON "_DeviceToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_DeviceToTag_B_index" ON "_DeviceToTag"("B");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeviceToTag" ADD CONSTRAINT "_DeviceToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeviceToTag" ADD CONSTRAINT "_DeviceToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
