-- AlterTable
ALTER TABLE "ProductBannerAnalytics" ADD COLUMN "testVariantId" TEXT;

-- CreateTable
CREATE TABLE "ProductBannerTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productHandle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "goalMetric" TEXT NOT NULL DEFAULT 'conversion_rate',
    "minSampleSize" INTEGER NOT NULL DEFAULT 100,
    "confidenceLevel" REAL NOT NULL DEFAULT 95.0,
    "trafficAllocation" REAL NOT NULL DEFAULT 100.0,
    "winnerVariantId" TEXT,
    "autoSelectWinner" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductBannerVariant" (
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

-- CreateIndex
CREATE INDEX "ProductBannerTest_productId_idx" ON "ProductBannerTest"("productId");

-- CreateIndex
CREATE INDEX "ProductBannerTest_productHandle_idx" ON "ProductBannerTest"("productHandle");

-- CreateIndex
CREATE INDEX "ProductBannerTest_status_idx" ON "ProductBannerTest"("status");

-- CreateIndex
CREATE INDEX "ProductBannerVariant_testId_idx" ON "ProductBannerVariant"("testId");

-- CreateIndex
CREATE INDEX "ProductBannerVariant_isControl_idx" ON "ProductBannerVariant"("isControl");

-- CreateIndex
CREATE INDEX "ProductBannerAnalytics_testVariantId_idx" ON "ProductBannerAnalytics"("testVariantId");
