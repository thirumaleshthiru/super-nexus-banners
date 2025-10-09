-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FomoPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerCountry" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productHandle" TEXT,
    "productImage" TEXT,
    "purchaseTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shopDomain" TEXT NOT NULL,
    "isDisplayed" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER,
    CONSTRAINT "FomoPurchase_productHandle_fkey" FOREIGN KEY ("productHandle") REFERENCES "Product" ("handle") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FomoPurchase" ("customerCountry", "customerName", "displayOrder", "id", "isDisplayed", "orderId", "productHandle", "productImage", "productTitle", "purchaseTime", "shopDomain") SELECT "customerCountry", "customerName", "displayOrder", "id", "isDisplayed", "orderId", "productHandle", "productImage", "productTitle", "purchaseTime", "shopDomain" FROM "FomoPurchase";
DROP TABLE "FomoPurchase";
ALTER TABLE "new_FomoPurchase" RENAME TO "FomoPurchase";
CREATE UNIQUE INDEX "FomoPurchase_orderId_key" ON "FomoPurchase"("orderId");
CREATE INDEX "FomoPurchase_shopDomain_isDisplayed_idx" ON "FomoPurchase"("shopDomain", "isDisplayed");
CREATE INDEX "FomoPurchase_purchaseTime_idx" ON "FomoPurchase"("purchaseTime");
CREATE INDEX "FomoPurchase_displayOrder_idx" ON "FomoPurchase"("displayOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
