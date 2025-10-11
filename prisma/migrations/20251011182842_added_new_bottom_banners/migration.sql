-- CreateTable
CREATE TABLE "BottomBanner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "bannerWidth" TEXT NOT NULL DEFAULT 'full',
    "customWidth" TEXT,
    "bannerHeight" TEXT NOT NULL DEFAULT 'auto',
    "customHeight" TEXT,
    "bannerPadding" TEXT NOT NULL DEFAULT '12',
    "bannerLeftMargin" TEXT NOT NULL DEFAULT '0',
    "bannerRightMargin" TEXT NOT NULL DEFAULT '0',
    "bannerTopMargin" TEXT NOT NULL DEFAULT '0',
    "bannerBottomMargin" TEXT NOT NULL DEFAULT '0',
    "bannerBorderRadius" TEXT NOT NULL DEFAULT '8',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "areMessagesCarousel" BOOLEAN NOT NULL DEFAULT false,
    "messages" TEXT NOT NULL,
    "messageFontSize" TEXT NOT NULL DEFAULT '16',
    "messagePosition" TEXT NOT NULL DEFAULT 'left',
    "messageColor" TEXT NOT NULL DEFAULT '#1a1a1a',
    "messagePadding" TEXT NOT NULL DEFAULT '8',
    "isTimer" BOOLEAN NOT NULL DEFAULT false,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "timerBackgroundColor" TEXT NOT NULL DEFAULT 'rgba(0,0,0,0.1)',
    "timerBorderColor" TEXT NOT NULL DEFAULT 'rgba(0,0,0,0.15)',
    "timerPadding" TEXT NOT NULL DEFAULT '6',
    "timerTextColor" TEXT NOT NULL DEFAULT '#1a1a1a',
    "timerFontSize" TEXT NOT NULL DEFAULT '14',
    "hasProduct" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT,
    "productTitle" TEXT,
    "productImage" TEXT,
    "showImage" BOOLEAN NOT NULL DEFAULT false,
    "priceOverride" TEXT,
    "couponCode" TEXT,
    "productFontSize" TEXT NOT NULL DEFAULT '14',
    "actionType" TEXT NOT NULL DEFAULT 'view_product',
    "actionButtonText" TEXT,
    "actionButtonTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "actionButtonBackgroundColor" TEXT NOT NULL DEFAULT '#1a1a1a',
    "actionButtonBorderRadius" TEXT NOT NULL DEFAULT '6',
    "actionButtonPadding" TEXT NOT NULL DEFAULT '8',
    "showAddToCartButton" BOOLEAN NOT NULL DEFAULT false,
    "showViewProductButton" BOOLEAN NOT NULL DEFAULT false,
    "addToCartButtonText" TEXT NOT NULL DEFAULT 'Add to Cart',
    "viewProductButtonText" TEXT NOT NULL DEFAULT 'View Product',
    "addToCartButtonTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "addToCartButtonBackgroundColor" TEXT NOT NULL DEFAULT '#007cba',
    "viewProductButtonTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "viewProductButtonBackgroundColor" TEXT NOT NULL DEFAULT '#1a1a1a',
    "bgColor" TEXT NOT NULL DEFAULT '#f7f7f7',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BottomBanner_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BottomBannerSlide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bottomBannerId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL,
    "isTimer" BOOLEAN NOT NULL DEFAULT false,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "hasProduct" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT,
    "productTitle" TEXT,
    "productImage" TEXT,
    "showImage" BOOLEAN NOT NULL DEFAULT false,
    "priceOverride" TEXT,
    "couponCode" TEXT,
    "productVariantId" TEXT,
    "actionType" TEXT NOT NULL DEFAULT 'view_product',
    "actionButtonText" TEXT,
    "showAddToCartButton" BOOLEAN NOT NULL DEFAULT false,
    "showViewProductButton" BOOLEAN NOT NULL DEFAULT false,
    "addToCartButtonText" TEXT NOT NULL DEFAULT 'Add to Cart',
    "viewProductButtonText" TEXT NOT NULL DEFAULT 'View Product',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BottomBannerSlide_bottomBannerId_fkey" FOREIGN KEY ("bottomBannerId") REFERENCES "BottomBanner" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BottomBannerSlide_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BottomBannerAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bottomBannerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "shopDomain" TEXT NOT NULL,
    "productId" TEXT,
    "messageIndex" INTEGER,
    CONSTRAINT "BottomBannerAnalytics_bottomBannerId_fkey" FOREIGN KEY ("bottomBannerId") REFERENCES "BottomBanner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BottomBannerSlide_bottomBannerId_order_idx" ON "BottomBannerSlide"("bottomBannerId", "order");

-- CreateIndex
CREATE INDEX "BottomBannerAnalytics_bottomBannerId_eventType_idx" ON "BottomBannerAnalytics"("bottomBannerId", "eventType");

-- CreateIndex
CREATE INDEX "BottomBannerAnalytics_timestamp_idx" ON "BottomBannerAnalytics"("timestamp");

-- CreateIndex
CREATE INDEX "BottomBannerAnalytics_shopDomain_idx" ON "BottomBannerAnalytics"("shopDomain");
