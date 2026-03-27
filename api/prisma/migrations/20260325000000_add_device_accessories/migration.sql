-- CreateTable
CREATE TABLE "DeviceAccessory" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceAccessory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceAccessory_deviceId_name_key" ON "DeviceAccessory"("deviceId", "name");

-- AddForeignKey
ALTER TABLE "DeviceAccessory" ADD CONSTRAINT "DeviceAccessory_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing hasOriginalBox data
INSERT INTO "DeviceAccessory" ("deviceId", "name", "createdAt")
SELECT id, 'Original Box', NOW()
FROM "Device"
WHERE "hasOriginalBox" = true;
