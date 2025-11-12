-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductBannerSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bannerHeight" TEXT NOT NULL DEFAULT '130',
    "bannerImageHeight" TEXT NOT NULL DEFAULT '80',
    "bannerPadding" TEXT NOT NULL DEFAULT '10',
    "bannerTitleFontSize" TEXT NOT NULL DEFAULT '15',
    "bannerTitleColor" TEXT NOT NULL DEFAULT '111827',
    "bannerPriceFontSize" TEXT NOT NULL DEFAULT '14',
    "bannerPriceColor" TEXT NOT NULL DEFAULT '6b7280',
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "button1TextColor" TEXT NOT NULL DEFAULT 'ffffff',
    "button1BackgroundColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "button1BorderColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "button2TextColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "button2BackgroundColor" TEXT NOT NULL DEFAULT 'ffffff',
    "button2BorderColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "hurryUpBannerHeight" TEXT NOT NULL DEFAULT '30',
    "hurryUpBannerBackgroundColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "hurryUpTextColor" TEXT NOT NULL DEFAULT 'ffffff',
    "hurryUpFontSize" TEXT NOT NULL DEFAULT '14',
    "mobileBannerHeight" TEXT NOT NULL DEFAULT '90',
    "mobileBannerBorderRadius" TEXT NOT NULL DEFAULT '8',
    "mobileBannerMargin" TEXT NOT NULL DEFAULT '10',
    "mobileProductHeight" TEXT NOT NULL DEFAULT '60',
    "mobileProductPadding" TEXT NOT NULL DEFAULT '12px 16px',
    "mobileTitleFontSize" TEXT NOT NULL DEFAULT '16',
    "mobileTitleColor" TEXT NOT NULL DEFAULT '111827',
    "mobilePriceFontSize" TEXT NOT NULL DEFAULT '14',
    "mobilePriceColor" TEXT NOT NULL DEFAULT '6b7280',
    "mobileButtonHeight" TEXT NOT NULL DEFAULT '40',
    "mobileButtonPadding" TEXT NOT NULL DEFAULT '12px 20px',
    "mobileButtonFontSize" TEXT NOT NULL DEFAULT '16',
    "mobileButtonBorderRadius" TEXT NOT NULL DEFAULT '6',
    "mobileButtonTextColor" TEXT NOT NULL DEFAULT 'ffffff',
    "mobileButtonBackgroundColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "mobileHurryUpHeight" TEXT NOT NULL DEFAULT '30',
    "mobileHurryUpFontSize" TEXT NOT NULL DEFAULT '14',
    "mobileHurryUpBackgroundColor" TEXT NOT NULL DEFAULT 'FF6B6B',
    "mobileHurryUpTextColor" TEXT NOT NULL DEFAULT 'ffffff',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProductBannerSettings" ("bannerHeight", "bannerImageHeight", "bannerPriceColor", "bannerPriceFontSize", "bannerTitleColor", "bannerTitleFontSize", "button1BackgroundColor", "button1BorderColor", "button1TextColor", "button2BackgroundColor", "button2BorderColor", "button2TextColor", "createdAt", "hurryUpBannerBackgroundColor", "hurryUpBannerHeight", "hurryUpFontSize", "hurryUpTextColor", "id", "mobileBannerBorderRadius", "mobileBannerHeight", "mobileBannerMargin", "mobileButtonBackgroundColor", "mobileButtonBorderRadius", "mobileButtonFontSize", "mobileButtonHeight", "mobileButtonPadding", "mobileButtonTextColor", "mobileHurryUpBackgroundColor", "mobileHurryUpFontSize", "mobileHurryUpHeight", "mobileHurryUpTextColor", "mobilePriceColor", "mobilePriceFontSize", "mobileProductHeight", "mobileProductPadding", "mobileTitleColor", "mobileTitleFontSize", "showPrice", "updatedAt") SELECT "bannerHeight", "bannerImageHeight", "bannerPriceColor", "bannerPriceFontSize", "bannerTitleColor", "bannerTitleFontSize", "button1BackgroundColor", "button1BorderColor", "button1TextColor", "button2BackgroundColor", "button2BorderColor", "button2TextColor", "createdAt", "hurryUpBannerBackgroundColor", "hurryUpBannerHeight", "hurryUpFontSize", "hurryUpTextColor", "id", "mobileBannerBorderRadius", "mobileBannerHeight", "mobileBannerMargin", "mobileButtonBackgroundColor", "mobileButtonBorderRadius", "mobileButtonFontSize", "mobileButtonHeight", "mobileButtonPadding", "mobileButtonTextColor", "mobileHurryUpBackgroundColor", "mobileHurryUpFontSize", "mobileHurryUpHeight", "mobileHurryUpTextColor", "mobilePriceColor", "mobilePriceFontSize", "mobileProductHeight", "mobileProductPadding", "mobileTitleColor", "mobileTitleFontSize", "showPrice", "updatedAt" FROM "ProductBannerSettings";
DROP TABLE "ProductBannerSettings";
ALTER TABLE "new_ProductBannerSettings" RENAME TO "ProductBannerSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
