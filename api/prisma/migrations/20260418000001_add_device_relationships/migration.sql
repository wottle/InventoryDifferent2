-- CreateTable
CREATE TABLE "DeviceRelationship" (
    "id" SERIAL NOT NULL,
    "fromDeviceId" INTEGER NOT NULL,
    "toDeviceId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceRelationship_fromDeviceId_toDeviceId_type_key" ON "DeviceRelationship"("fromDeviceId", "toDeviceId", "type");

-- AddForeignKey
ALTER TABLE "DeviceRelationship" ADD CONSTRAINT "DeviceRelationship_fromDeviceId_fkey" FOREIGN KEY ("fromDeviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceRelationship" ADD CONSTRAINT "DeviceRelationship_toDeviceId_fkey" FOREIGN KEY ("toDeviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
