-- AlterTable
ALTER TABLE "ExhibitionTemplate"
ADD COLUMN "showHistoricalNotes"    BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "showNotes"              BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "showMaintenanceHistory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "showStoreQR"            BOOLEAN NOT NULL DEFAULT false;
