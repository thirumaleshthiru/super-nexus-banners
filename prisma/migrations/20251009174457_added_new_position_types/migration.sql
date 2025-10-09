-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Banner" (
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
    "position" TEXT NOT NULL DEFAULT 'static',
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
    "productFontSize" TEXT NOT NULL DEFAULT '14',
    "actionType" TEXT NOT NULL DEFAULT 'view_product',
    "actionButtonText" TEXT,
    "actionButtonTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "actionButtonBackgroundColor" TEXT NOT NULL DEFAULT '#1a1a1a',
    "actionButtonBorderRadius" TEXT NOT NULL DEFAULT '6',
    "actionButtonPadding" TEXT NOT NULL DEFAULT '8',
    "responsiveDetails" TEXT NOT NULL DEFAULT 'row',
    "responsiveFonts" TEXT NOT NULL DEFAULT 'auto',
    "closeIconColor" TEXT NOT NULL DEFAULT '#1a1a1a',
    "closeIconPosition" TEXT NOT NULL DEFAULT 'right',
    "closeIconSize" TEXT NOT NULL DEFAULT '16',
    "bgColor" TEXT NOT NULL DEFAULT '#f7f7f7',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Banner_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Banner" ("actionButtonBackgroundColor", "actionButtonBorderRadius", "actionButtonPadding", "actionButtonText", "actionButtonTextColor", "actionType", "areMessagesCarousel", "bannerBorderRadius", "bannerBottomMargin", "bannerHeight", "bannerLeftMargin", "bannerPadding", "bannerRightMargin", "bannerTopMargin", "bannerWidth", "bgColor", "closeIconColor", "closeIconPosition", "closeIconSize", "createdAt", "customHeight", "customWidth", "endTime", "hasProduct", "id", "isActive", "isTimer", "messageColor", "messageFontSize", "messagePadding", "messagePosition", "messages", "priority", "productFontSize", "productId", "productImage", "productTitle", "responsiveDetails", "responsiveFonts", "startTime", "timerBackgroundColor", "timerBorderColor", "timerFontSize", "timerPadding", "timerTextColor", "updatedAt") SELECT "actionButtonBackgroundColor", "actionButtonBorderRadius", "actionButtonPadding", "actionButtonText", "actionButtonTextColor", "actionType", "areMessagesCarousel", "bannerBorderRadius", "bannerBottomMargin", "bannerHeight", "bannerLeftMargin", "bannerPadding", "bannerRightMargin", "bannerTopMargin", "bannerWidth", "bgColor", "closeIconColor", "closeIconPosition", "closeIconSize", "createdAt", "customHeight", "customWidth", "endTime", "hasProduct", "id", "isActive", "isTimer", "messageColor", "messageFontSize", "messagePadding", "messagePosition", "messages", "priority", "productFontSize", "productId", "productImage", "productTitle", "responsiveDetails", "responsiveFonts", "startTime", "timerBackgroundColor", "timerBorderColor", "timerFontSize", "timerPadding", "timerTextColor", "updatedAt" FROM "Banner";
DROP TABLE "Banner";
ALTER TABLE "new_Banner" RENAME TO "Banner";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
