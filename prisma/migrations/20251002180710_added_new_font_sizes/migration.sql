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
    "position" TEXT NOT NULL DEFAULT 'fixed',
    "zIndex" TEXT NOT NULL DEFAULT '9999',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "areMessagesCarousel" BOOLEAN NOT NULL DEFAULT false,
    "messages" TEXT NOT NULL,
    "messageFontSize" TEXT NOT NULL DEFAULT '16',
    "messagePosition" TEXT NOT NULL DEFAULT 'left',
    "messageColor" TEXT NOT NULL DEFAULT '#ffffff',
    "messagePadding" TEXT NOT NULL DEFAULT '8',
    "isTimer" BOOLEAN NOT NULL DEFAULT false,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "timerBackgroundColor" TEXT NOT NULL DEFAULT 'rgba(255,255,255,0.2)',
    "timerBorderColor" TEXT NOT NULL DEFAULT 'rgba(255,255,255,0.3)',
    "timerPadding" TEXT NOT NULL DEFAULT '6',
    "timerTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "timerFontSize" TEXT NOT NULL DEFAULT '14',
    "hasProduct" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT,
    "productTitle" TEXT,
    "productImage" TEXT,
    "productFontSize" TEXT NOT NULL DEFAULT '14',
    "actionType" TEXT NOT NULL DEFAULT 'view_product',
    "actionButtonText" TEXT,
    "actionButtonTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "actionButtonBackgroundColor" TEXT NOT NULL DEFAULT '#007cba',
    "actionButtonBorderRadius" TEXT NOT NULL DEFAULT '4',
    "actionButtonPadding" TEXT NOT NULL DEFAULT '8',
    "responsiveDetails" TEXT NOT NULL DEFAULT 'row',
    "responsiveFonts" TEXT NOT NULL DEFAULT 'auto',
    "closeIconColor" TEXT NOT NULL DEFAULT '#ffffff',
    "closeIconPosition" TEXT NOT NULL DEFAULT 'right',
    "closeIconSize" TEXT NOT NULL DEFAULT '16',
    "bgColor" TEXT NOT NULL DEFAULT '#ff0000',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Banner_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Banner" ("actionButtonBackgroundColor", "actionButtonBorderRadius", "actionButtonPadding", "actionButtonText", "actionButtonTextColor", "actionType", "areMessagesCarousel", "bannerBorderRadius", "bannerBottomMargin", "bannerHeight", "bannerLeftMargin", "bannerPadding", "bannerRightMargin", "bannerTopMargin", "bannerWidth", "bgColor", "closeIconColor", "closeIconPosition", "closeIconSize", "createdAt", "customHeight", "customWidth", "endTime", "hasProduct", "id", "isActive", "isTimer", "messageColor", "messageFontSize", "messagePadding", "messagePosition", "messages", "position", "priority", "productId", "productImage", "productTitle", "responsiveDetails", "responsiveFonts", "startTime", "timerBackgroundColor", "timerBorderColor", "timerPadding", "timerTextColor", "updatedAt", "zIndex") SELECT "actionButtonBackgroundColor", "actionButtonBorderRadius", "actionButtonPadding", "actionButtonText", "actionButtonTextColor", "actionType", "areMessagesCarousel", "bannerBorderRadius", "bannerBottomMargin", "bannerHeight", "bannerLeftMargin", "bannerPadding", "bannerRightMargin", "bannerTopMargin", "bannerWidth", "bgColor", "closeIconColor", "closeIconPosition", "closeIconSize", "createdAt", "customHeight", "customWidth", "endTime", "hasProduct", "id", "isActive", "isTimer", "messageColor", "messageFontSize", "messagePadding", "messagePosition", "messages", "position", "priority", "productId", "productImage", "productTitle", "responsiveDetails", "responsiveFonts", "startTime", "timerBackgroundColor", "timerBorderColor", "timerPadding", "timerTextColor", "updatedAt", "zIndex" FROM "Banner";
DROP TABLE "Banner";
ALTER TABLE "new_Banner" RENAME TO "Banner";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
