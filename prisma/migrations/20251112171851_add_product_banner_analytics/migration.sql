-- CreateTable
CREATE TABLE "ProductBannerAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "productHandle" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "variantId" TEXT,
    "quantity" INTEGER,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ProductBannerAnalytics_productId_idx" ON "ProductBannerAnalytics"("productId");

-- CreateIndex
CREATE INDEX "ProductBannerAnalytics_productHandle_idx" ON "ProductBannerAnalytics"("productHandle");

-- CreateIndex
CREATE INDEX "ProductBannerAnalytics_eventType_idx" ON "ProductBannerAnalytics"("eventType");

-- CreateIndex
CREATE INDEX "ProductBannerAnalytics_timestamp_idx" ON "ProductBannerAnalytics"("timestamp");

-- CreateIndex
CREATE INDEX "ProductBannerAnalytics_sessionId_idx" ON "ProductBannerAnalytics"("sessionId");
