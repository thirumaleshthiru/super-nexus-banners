import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "app/db.server";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const productHandle = url.searchParams.get('handle');

    if (!productHandle) {
      return json({ 
        error: "Product handle is required",
        product: null 
      }, { status: 400 });
    }

    // Fetch product from database
    const product = await prisma.product.findUnique({
      where: { handle: productHandle },
      select: {
        id: true,
        shopifyId: true,
        handle: true,
        title: true,
        price: true,
        currencyCode: true,
        featuredImage: true,
        variantId: true,
        variants: true,
        description: true,
        inventoryQuantity: true,
        inventoryTracked: true,
        lowStockThreshold: true
      }
    });

    if (!product) {
      return json({ 
        error: "Product not found",
        product: null 
      }, { status: 404 });
    }

    // Parse variants if it's a JSON string
    let parsedVariants = [];
    try {
      if (typeof product.variants === 'string') {
        parsedVariants = JSON.parse(product.variants);
      } else if (Array.isArray(product.variants)) {
        parsedVariants = product.variants;
      }
    } catch (e) {
      console.error("Error parsing variants:", e);
    }

    // Check if we should show low stock banner (inventory <= 15)
    const shouldShowLowStock = product.inventoryTracked && 
      product.inventoryQuantity !== null && 
      product.inventoryQuantity <= 15;

    // Fetch banner customization settings
    let bannerSettings = await (prisma as any).productBannerSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // If no settings exist, return null - liquid file will use its own defaults
    if (!bannerSettings) {
      return json({
        product: {
          id: product.id,
          shopifyId: product.shopifyId,
          handle: product.handle,
          title: product.title,
          price: product.price,
          currencyCode: product.currencyCode || "USD",
          featuredImage: product.featuredImage,
          variantId: product.variantId,
          variants: parsedVariants,
          description: product.description,
          inventoryQuantity: product.inventoryQuantity,
          inventoryTracked: product.inventoryTracked,
          shouldShowLowStock: shouldShowLowStock
        },
        settings: null
      });
    }

    return json({
      product: {
        id: product.id,
        shopifyId: product.shopifyId,
        handle: product.handle,
        title: product.title,
        price: product.price,
        currencyCode: product.currencyCode || "USD",
        featuredImage: product.featuredImage,
        variantId: product.variantId,
        variants: parsedVariants,
        description: product.description,
        inventoryQuantity: product.inventoryQuantity,
        inventoryTracked: product.inventoryTracked,
        shouldShowLowStock: shouldShowLowStock
      },
      settings: bannerSettings ? {
        // Send ACTUAL database values - no fallbacks
        bannerHeight: bannerSettings.bannerHeight,
        bannerImageHeight: bannerSettings.bannerImageHeight,
        bannerTitleFontSize: bannerSettings.bannerTitleFontSize,
        bannerTitleColor: bannerSettings.bannerTitleColor,
        bannerPriceFontSize: bannerSettings.bannerPriceFontSize,
        bannerPriceColor: bannerSettings.bannerPriceColor,
        showPrice: bannerSettings.showPrice,
        button1TextColor: bannerSettings.button1TextColor,
        button1BackgroundColor: bannerSettings.button1BackgroundColor,
        button1BorderColor: bannerSettings.button1BorderColor,
        button2TextColor: bannerSettings.button2TextColor,
        button2BackgroundColor: bannerSettings.button2BackgroundColor,
        button2BorderColor: bannerSettings.button2BorderColor,
        hurryUpBannerHeight: bannerSettings.hurryUpBannerHeight,
        hurryUpBannerBackgroundColor: bannerSettings.hurryUpBannerBackgroundColor,
        hurryUpTextColor: bannerSettings.hurryUpTextColor,
        hurryUpFontSize: bannerSettings.hurryUpFontSize,
        mobileBannerHeight: bannerSettings.mobileBannerHeight,
        mobileBannerBorderRadius: bannerSettings.mobileBannerBorderRadius,
        mobileBannerMargin: bannerSettings.mobileBannerMargin,
        mobileProductHeight: bannerSettings.mobileProductHeight,
        mobileProductPadding: bannerSettings.mobileProductPadding,
        mobileTitleFontSize: bannerSettings.mobileTitleFontSize,
        mobileTitleColor: bannerSettings.mobileTitleColor,
        mobilePriceFontSize: bannerSettings.mobilePriceFontSize,
        mobilePriceColor: bannerSettings.mobilePriceColor,
        mobileButtonHeight: bannerSettings.mobileButtonHeight,
        mobileButtonPadding: bannerSettings.mobileButtonPadding,
        mobileButtonFontSize: bannerSettings.mobileButtonFontSize,
        mobileButtonBorderRadius: bannerSettings.mobileButtonBorderRadius,
        mobileButtonTextColor: bannerSettings.mobileButtonTextColor,
        mobileButtonBackgroundColor: bannerSettings.mobileButtonBackgroundColor,
        mobileHurryUpHeight: bannerSettings.mobileHurryUpHeight,
        mobileHurryUpFontSize: bannerSettings.mobileHurryUpFontSize,
        mobileHurryUpBackgroundColor: bannerSettings.mobileHurryUpBackgroundColor,
        mobileHurryUpTextColor: bannerSettings.mobileHurryUpTextColor,
      } : null
    });
  } catch (err) {
    console.error("Error fetching product banner data:", err);
    return json({ 
      error: "Internal server error", 
      product: null 
    }, { status: 500 });
  }
};