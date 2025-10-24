/*
  Warnings:

  - You are about to drop the `GlobalBannerSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductBanner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductBannerAnalytics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "ProductBanner_productId_idx";

-- DropIndex
DROP INDEX "ProductBanner_productId_key";

-- DropIndex
DROP INDEX "ProductBannerAnalytics_shopDomain_idx";

-- DropIndex
DROP INDEX "ProductBannerAnalytics_timestamp_idx";

-- DropIndex
DROP INDEX "ProductBannerAnalytics_productBannerId_eventType_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GlobalBannerSettings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductBanner";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductBannerAnalytics";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ProductBannerSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bannerHeight" TEXT NOT NULL DEFAULT '130',
    "bannerImageHeight" TEXT NOT NULL DEFAULT '80',
    "bannerTitleFontSize" TEXT NOT NULL DEFAULT '15',
    "bannerTitleColor" TEXT NOT NULL DEFAULT '111827',
    "bannerPriceFontSize" TEXT NOT NULL DEFAULT '14',
    "bannerPriceColor" TEXT NOT NULL DEFAULT '6b7280',
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "button1TextColor" TEXT NOT NULL DEFAULT 'ffffff',
    "button1BackgroundColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "button1BorderColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "button2TextColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "button2BackgroundColor" TEXT NOT NULL DEFAULT 'ffffff',
    "button2BorderColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "hurryUpBannerHeight" TEXT NOT NULL DEFAULT '30',
    "hurryUpBannerBackgroundColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "hurryUpTextColor" TEXT NOT NULL DEFAULT 'ffffff',
    "hurryUpFontSize" TEXT NOT NULL DEFAULT '14',
    "mobileBannerHeight" TEXT NOT NULL DEFAULT '90',
    "mobileBannerBorderRadius" TEXT NOT NULL DEFAULT '8',
    "mobileBannerMargin" TEXT NOT NULL DEFAULT '10',
    "mobileProductHeight" TEXT NOT NULL DEFAULT '60',
    "mobileProductPadding" TEXT NOT NULL DEFAULT '12px 16px',
    "mobileTitleFontSize" TEXT NOT NULL DEFAULT '16',
    "mobileTitleColor" TEXT NOT NULL DEFAULT '111827',
    "mobilePriceFontSize" TEXT NOT NULL DEFAULT '14',
    "mobilePriceColor" TEXT NOT NULL DEFAULT '6b7280',
    "mobileButtonHeight" TEXT NOT NULL DEFAULT '40',
    "mobileButtonPadding" TEXT NOT NULL DEFAULT '12px 20px',
    "mobileButtonFontSize" TEXT NOT NULL DEFAULT '16',
    "mobileButtonBorderRadius" TEXT NOT NULL DEFAULT '6',
    "mobileButtonTextColor" TEXT NOT NULL DEFAULT 'ffffff',
    "mobileButtonBackgroundColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "mobileHurryUpHeight" TEXT NOT NULL DEFAULT '30',
    "mobileHurryUpFontSize" TEXT NOT NULL DEFAULT '14',
    "mobileHurryUpBackgroundColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "mobileHurryUpTextColor" TEXT NOT NULL DEFAULT 'ffffff',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "description" TEXT,
    "featuredImage" TEXT,
    "optimizedImage" TEXT,
    "imageAltTag" TEXT,
    "originalImageSize" INTEGER,
    "optimizedImageSize" INTEGER,
    "price" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "vendor" TEXT,
    "productType" TEXT,
    "tags" TEXT,
    "variantId" TEXT,
    "variants" TEXT,
    "inventoryQuantity" INTEGER,
    "inventoryTracked" BOOLEAN NOT NULL DEFAULT true,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("createdAt", "currencyCode", "description", "featuredImage", "handle", "id", "imageAltTag", "optimizedImage", "optimizedImageSize", "originalImageSize", "price", "productType", "shopifyId", "status", "tags", "title", "updatedAt", "variantId", "variants", "vendor") SELECT "createdAt", "currencyCode", "description", "featuredImage", "handle", "id", "imageAltTag", "optimizedImage", "optimizedImageSize", "originalImageSize", "price", "productType", "shopifyId", "status", "tags", "title", "updatedAt", "variantId", "variants", "vendor" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_shopifyId_key" ON "Product"("shopifyId");
CREATE UNIQUE INDEX "Product_handle_key" ON "Product"("handle");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
