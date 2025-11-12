-- CreateTable
CREATE TABLE "ProductBannerCustomization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "isShowPrice" BOOLEAN NOT NULL DEFAULT true,
    "isShowAddToCartButton" BOOLEAN NOT NULL DEFAULT true,
    "isShowBuyNowButton" BOOLEAN NOT NULL DEFAULT true,
    "isShowHurryUpBanner" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductBannerCustomization_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductBannerCustomization_productId_key" ON "ProductBannerCustomization"("productId");

-- CreateIndex
CREATE INDEX "ProductBannerCustomization_productId_idx" ON "ProductBannerCustomization"("productId");
