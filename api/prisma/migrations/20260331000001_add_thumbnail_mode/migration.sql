-- CreateEnum
CREATE TYPE "ThumbnailMode" AS ENUM ('BOTH', 'LIGHT', 'DARK');

-- AlterTable
ALTER TABLE "Image" ADD COLUMN "thumbnailMode" "ThumbnailMode" NOT NULL DEFAULT 'BOTH';
