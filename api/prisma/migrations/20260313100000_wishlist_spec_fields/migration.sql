-- AlterTable: add spec fields to WishlistItem
ALTER TABLE "WishlistItem"
    ADD COLUMN "additionalName"       TEXT,
    ADD COLUMN "cpu"                  TEXT,
    ADD COLUMN "ram"                  TEXT,
    ADD COLUMN "graphics"             TEXT,
    ADD COLUMN "storage"              TEXT,
    ADD COLUMN "operatingSystem"      TEXT,
    ADD COLUMN "externalUrl"          TEXT,
    ADD COLUMN "isWifiEnabled"        BOOLEAN,
    ADD COLUMN "isPramBatteryRemoved" BOOLEAN;
