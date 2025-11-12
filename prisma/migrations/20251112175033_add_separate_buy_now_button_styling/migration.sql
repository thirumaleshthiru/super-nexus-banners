-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductBannerVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trafficWeight" REAL NOT NULL DEFAULT 50.0,
    "isControl" BOOLEAN NOT NULL DEFAULT false,
    "bannerHeight" TEXT NOT NULL DEFAULT '80',
    "bannerImageHeight" TEXT NOT NULL DEFAULT '80',
    "bannerBackgroundColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "bannerTextColor" TEXT NOT NULL DEFAULT 'ffffff',
    "bannerPriceColor" TEXT NOT NULL DEFAULT 'ffffff',
    "bannerBorderRadius" TEXT NOT NULL DEFAULT '12',
    "bannerPadding" TEXT NOT NULL DEFAULT '10',
    "buttonText" TEXT NOT NULL DEFAULT 'Add to Cart',
    "buttonBackgroundColor" TEXT NOT NULL DEFAULT 'ffffff',
    "buttonTextColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "buttonBorderRadius" TEXT NOT NULL DEFAULT '6',
    "buttonFontSize" TEXT NOT NULL DEFAULT '16',
    "buttonHeight" TEXT NOT NULL DEFAULT '45',
    "buyNowButtonText" TEXT NOT NULL DEFAULT 'Buy Now',
    "buyNowButtonBackgroundColor" TEXT NOT NULL DEFAULT 'ffffff',
    "buyNowButtonTextColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "buyNowButtonBorderRadius" TEXT NOT NULL DEFAULT '6',
    "buyNowButtonFontSize" TEXT NOT NULL DEFAULT '16',
    "buyNowButtonHeight" TEXT NOT NULL DEFAULT '45',
    "hurryUpText" TEXT NOT NULL DEFAULT 'Hurry Up! Limited Stock',
    "hurryUpBackgroundColor" TEXT NOT NULL DEFAULT 'ffffff',
    "hurryUpTextColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "hurryUpFontSize" TEXT NOT NULL DEFAULT '14',
    "hurryUpHeight" TEXT NOT NULL DEFAULT '35',
    "pricePosition" TEXT NOT NULL DEFAULT 'top-right',
    "priceFontSize" TEXT NOT NULL DEFAULT '18',
    "isShowPrice" BOOLEAN NOT NULL DEFAULT true,
    "isShowAddToCartButton" BOOLEAN NOT NULL DEFAULT true,
    "isShowBuyNowButton" BOOLEAN NOT NULL DEFAULT true,
    "isShowHurryUpBanner" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "addToCarts" INTEGER NOT NULL DEFAULT 0,
    "buyNows" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductBannerVariant_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ProductBannerTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductBannerVariant" ("addToCarts", "bannerBackgroundColor", "bannerBorderRadius", "bannerHeight", "bannerImageHeight", "bannerPadding", "bannerPriceColor", "bannerTextColor", "buttonBackgroundColor", "buttonBorderRadius", "buttonFontSize", "buttonHeight", "buttonText", "buttonTextColor", "buyNows", "clicks", "conversionRate", "conversions", "createdAt", "hurryUpBackgroundColor", "hurryUpFontSize", "hurryUpHeight", "hurryUpText", "hurryUpTextColor", "id", "isControl", "isShowAddToCartButton", "isShowBuyNowButton", "isShowHurryUpBanner", "isShowPrice", "name", "priceFontSize", "pricePosition", "testId", "trafficWeight", "updatedAt", "views") SELECT "addToCarts", "bannerBackgroundColor", "bannerBorderRadius", "bannerHeight", "bannerImageHeight", "bannerPadding", "bannerPriceColor", "bannerTextColor", "buttonBackgroundColor", "buttonBorderRadius", "buttonFontSize", "buttonHeight", "buttonText", "buttonTextColor", "buyNows", "clicks", "conversionRate", "conversions", "createdAt", "hurryUpBackgroundColor", "hurryUpFontSize", "hurryUpHeight", "hurryUpText", "hurryUpTextColor", "id", "isControl", "isShowAddToCartButton", "isShowBuyNowButton", "isShowHurryUpBanner", "isShowPrice", "name", "priceFontSize", "pricePosition", "testId", "trafficWeight", "updatedAt", "views" FROM "ProductBannerVariant";
DROP TABLE "ProductBannerVariant";
ALTER TABLE "new_ProductBannerVariant" RENAME TO "ProductBannerVariant";
CREATE INDEX "ProductBannerVariant_testId_idx" ON "ProductBannerVariant"("testId");
CREATE INDEX "ProductBannerVariant_isControl_idx" ON "ProductBannerVariant"("isControl");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
