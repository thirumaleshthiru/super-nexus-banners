/*
  Warnings:

  - A unique constraint covering the columns `[handle]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "FomoPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerCountry" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productHandle" TEXT NOT NULL,
    "productImage" TEXT,
    "purchaseTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shopDomain" TEXT NOT NULL,
    "isDisplayed" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER,
    CONSTRAINT "FomoPurchase_productHandle_fkey" FOREIGN KEY ("productHandle") REFERENCES "Product" ("handle") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FomoPurchase_orderId_key" ON "FomoPurchase"("orderId");

-- CreateIndex
CREATE INDEX "FomoPurchase_shopDomain_isDisplayed_idx" ON "FomoPurchase"("shopDomain", "isDisplayed");

-- CreateIndex
CREATE INDEX "FomoPurchase_purchaseTime_idx" ON "FomoPurchase"("purchaseTime");

-- CreateIndex
CREATE INDEX "FomoPurchase_displayOrder_idx" ON "FomoPurchase"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Product_handle_key" ON "Product"("handle");
