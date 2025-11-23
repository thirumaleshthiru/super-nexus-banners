-- CreateTable
CREATE TABLE "ProductBannerTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'custom',
    "isPrebuilt" BOOLEAN NOT NULL DEFAULT false,
    "bannerHeight" TEXT NOT NULL DEFAULT '130',
    "bannerImageHeight" TEXT NOT NULL DEFAULT '80',
    "bannerPadding" TEXT NOT NULL DEFAULT '10',
    "bannerTitleFontSize" TEXT NOT NULL DEFAULT '15',
    "bannerTitleColor" TEXT NOT NULL DEFAULT '111827',
    "bannerPriceFontSize" TEXT NOT NULL DEFAULT '14',
    "bannerPriceColor" TEXT NOT NULL DEFAULT '6b7280',
    "bannerBackgroundColor" TEXT NOT NULL DEFAULT 'ffffff',
    "bannerBorderRadius" TEXT NOT NULL DEFAULT '12',
    "button1Text" TEXT NOT NULL DEFAULT 'Add to Cart',
    "button1TextColor" TEXT NOT NULL DEFAULT 'ffffff',
    "button1BackgroundColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "button1BorderColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "button1BorderRadius" TEXT NOT NULL DEFAULT '6',
    "button1FontSize" TEXT NOT NULL DEFAULT '16',
    "button1Height" TEXT NOT NULL DEFAULT '45',
    "button2Text" TEXT NOT NULL DEFAULT 'Buy Now',
    "button2TextColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "button2BackgroundColor" TEXT NOT NULL DEFAULT 'ffffff',
    "button2BorderColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "button2BorderRadius" TEXT NOT NULL DEFAULT '6',
    "button2FontSize" TEXT NOT NULL DEFAULT '16',
    "button2Height" TEXT NOT NULL DEFAULT '45',
    "hurryUpText" TEXT NOT NULL DEFAULT 'Hurry Up! Limited Stock',
    "hurryUpBannerHeight" TEXT NOT NULL DEFAULT '30',
    "hurryUpBannerBackgroundColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "hurryUpTextColor" TEXT NOT NULL DEFAULT 'ffffff',
    "hurryUpFontSize" TEXT NOT NULL DEFAULT '14',
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "isShowAddToCartButton" BOOLEAN NOT NULL DEFAULT true,
    "isShowBuyNowButton" BOOLEAN NOT NULL DEFAULT true,
    "isShowHurryUpBanner" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ProductBannerTemplate_category_idx" ON "ProductBannerTemplate"("category");

-- CreateIndex
CREATE INDEX "ProductBannerTemplate_isPrebuilt_idx" ON "ProductBannerTemplate"("isPrebuilt");

-- CreateIndex
CREATE INDEX "ProductBannerTemplate_usageCount_idx" ON "ProductBannerTemplate"("usageCount");
