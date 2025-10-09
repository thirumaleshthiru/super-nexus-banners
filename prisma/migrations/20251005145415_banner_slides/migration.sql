-- CreateTable
CREATE TABLE "BannerSlide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bannerId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL,
    "isTimer" BOOLEAN NOT NULL DEFAULT false,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "hasProduct" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT,
    "productTitle" TEXT,
    "productImage" TEXT,
    "actionType" TEXT NOT NULL DEFAULT 'view_product',
    "actionButtonText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BannerSlide_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BannerSlide_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BannerSlide_bannerId_order_idx" ON "BannerSlide"("bannerId", "order");
