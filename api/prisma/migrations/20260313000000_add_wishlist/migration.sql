-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "modelNumber" TEXT,
    "releaseYear" INTEGER,
    "targetPrice" DECIMAL(10,2),
    "sourceUrl" TEXT,
    "sourceNotes" TEXT,
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "group" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" INTEGER,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
