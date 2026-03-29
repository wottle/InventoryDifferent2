-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE', 'FOR_PARTS');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE', 'EXTREMELY_RARE');

-- AlterTable
ALTER TABLE "Device" ADD COLUMN "condition" "Condition",
ADD COLUMN "rarity" "Rarity";
