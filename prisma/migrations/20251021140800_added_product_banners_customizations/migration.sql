-- CreateTable
CREATE TABLE "ProductBanner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT,
    "productImage" TEXT,
    "productTitleColor" TEXT NOT NULL DEFAULT '#111827',
    "productImageSize" TEXT NOT NULL DEFAULT '90',
    "bannerBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "button1Background" TEXT NOT NULL DEFAULT '#000000',
    "button1Border" TEXT NOT NULL DEFAULT '#000000',
    "button1TextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "button1Text" TEXT NOT NULL DEFAULT 'Add to Cart',
    "button2Background" TEXT NOT NULL DEFAULT '#ffffff',
    "button2Border" TEXT NOT NULL DEFAULT '#000000',
    "button2TextColor" TEXT NOT NULL DEFAULT '#000000',
    "button2Text" TEXT NOT NULL DEFAULT 'Buy Now',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductBanner_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductBannerAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productBannerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "shopDomain" TEXT NOT NULL,
    CONSTRAINT "ProductBannerAnalytics_productBannerId_fkey" FOREIGN KEY ("productBannerId") REFERENCES "ProductBanner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductBanner_productId_key" ON "ProductBanner"("productId");

-- CreateIndex
CREATE INDEX "ProductBannerAnalytics_productBannerId_eventType_idx" ON "ProductBannerAnalytics"("productBannerId", "eventType");

-- CreateIndex
CREATE INDEX "ProductBannerAnalytics_timestamp_idx" ON "ProductBannerAnalytics"("timestamp");

-- CreateIndex
CREATE INDEX "ProductBannerAnalytics_shopDomain_idx" ON "ProductBannerAnalytics"("shopDomain");
