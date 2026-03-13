-- CreateTable
CREATE TABLE "ValueSnapshot" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "estimatedValue" DECIMAL(10,2),
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValueSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ValueSnapshot_deviceId_idx" ON "ValueSnapshot"("deviceId");

-- AddForeignKey
ALTER TABLE "ValueSnapshot" ADD CONSTRAINT "ValueSnapshot_deviceId_fkey"
    FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
