-- CreateTable
CREATE TABLE "GlobalBannerSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ProductBanner_productId_idx" ON "ProductBanner"("productId");
