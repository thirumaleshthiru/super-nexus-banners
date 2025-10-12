-- CreateTable
CREATE TABLE "StaticBanner" (
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
    "hasCoupon" BOOLEAN NOT NULL DEFAULT false,
    "couponCode" TEXT,
    "couponBackgroundColor" TEXT NOT NULL DEFAULT '#fef3c7',
    "couponBorderColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "couponTextColor" TEXT NOT NULL DEFAULT '#92400e',
    "couponFontSize" TEXT NOT NULL DEFAULT '14',
    "couponPadding" TEXT NOT NULL DEFAULT '8',
    "bgColor" TEXT NOT NULL DEFAULT '#f7f7f7',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StaticBannerSlide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staticBannerId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL,
    "isTimer" BOOLEAN NOT NULL DEFAULT false,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "hasCoupon" BOOLEAN NOT NULL DEFAULT false,
    "couponCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StaticBannerSlide_staticBannerId_fkey" FOREIGN KEY ("staticBannerId") REFERENCES "StaticBanner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaticBannerAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staticBannerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "shopDomain" TEXT NOT NULL,
    "messageIndex" INTEGER,
    CONSTRAINT "StaticBannerAnalytics_staticBannerId_fkey" FOREIGN KEY ("staticBannerId") REFERENCES "StaticBanner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StaticBannerSlide_staticBannerId_order_idx" ON "StaticBannerSlide"("staticBannerId", "order");

-- CreateIndex
CREATE INDEX "StaticBannerAnalytics_staticBannerId_eventType_idx" ON "StaticBannerAnalytics"("staticBannerId", "eventType");

-- CreateIndex
CREATE INDEX "StaticBannerAnalytics_timestamp_idx" ON "StaticBannerAnalytics"("timestamp");

-- CreateIndex
CREATE INDEX "StaticBannerAnalytics_shopDomain_idx" ON "StaticBannerAnalytics"("shopDomain");
