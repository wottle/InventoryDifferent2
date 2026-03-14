-- CreateTable
CREATE TABLE "DevicePageView" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevicePageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DevicePageView_deviceId_viewedAt_idx" ON "DevicePageView"("deviceId", "viewedAt");

-- AddForeignKey
ALTER TABLE "DevicePageView" ADD CONSTRAINT "DevicePageView_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
