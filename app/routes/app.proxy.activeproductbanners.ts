import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "app/db.server";

// Helper function to select variant based on traffic weights
function selectVariant(variants: any[], sessionId: string): any {
  // Use session ID to deterministically select the same variant for the same user
  const hash = sessionId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const randomValue = Math.abs(hash % 100);
  
  let cumulativeWeight = 0;
  for (const variant of variants) {
    cumulativeWeight += variant.trafficWeight;
    if (randomValue < cumulativeWeight) {
      return variant;
    }
  }
  
  return variants[0]; // Fallback to first variant
}

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const productHandle = url.searchParams.get('handle');
    const sessionId = url.searchParams.get('sessionId') || `session_${Date.now()}_${Math.random()}`;

    if (!productHandle) {
      return json({ 
        error: "Product handle is required",
        product: null 
      }, { status: 400 });
    }

    // Fetch product from database with customization
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
        lowStockThreshold: true,
        productBannerCustomization: true
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

    // Check for active A/B test for this product
    const activeTest = await (prisma as any).productBannerTest.findFirst({
      where: {
        productHandle: productHandle,
        status: 'running'
      },
      include: {
        variants: true
      }
    });

    let selectedVariant = null;
    let abTestData = null;

    if (activeTest && activeTest.variants.length > 0) {
      // Select variant based on session ID
      selectedVariant = selectVariant(activeTest.variants, sessionId);
      
      abTestData = {
        testId: activeTest.id,
        testName: activeTest.name,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
        isControl: selectedVariant.isControl
      };

      // Override banner settings with variant settings - COMPLETE mapping
      bannerSettings = {
        // Banner dimensions and colors
        bannerHeight: selectedVariant.bannerHeight,
        bannerImageHeight: selectedVariant.bannerImageHeight,
        bannerPadding: selectedVariant.bannerPadding,
        bannerBorderRadius: selectedVariant.bannerBorderRadius,
        bannerBackgroundColor: selectedVariant.bannerBackgroundColor,
        
        // Text and price styling
        bannerTitleFontSize: bannerSettings?.bannerTitleFontSize || "18",
        bannerTitleColor: selectedVariant.bannerTextColor,
        bannerPriceFontSize: selectedVariant.priceFontSize,
        bannerPriceColor: selectedVariant.bannerPriceColor,
        showPrice: selectedVariant.isShowPrice,
        
        // Button 1 (Add to Cart) styling
        button1Text: selectedVariant.buttonText,
        button1TextColor: selectedVariant.buttonTextColor,
        button1BackgroundColor: selectedVariant.buttonBackgroundColor,
        button1BorderColor: selectedVariant.buttonBackgroundColor,
        button1Height: selectedVariant.buttonHeight,
        button1FontSize: selectedVariant.buttonFontSize,
        button1BorderRadius: selectedVariant.buttonBorderRadius,
        
        // Button 2 (Buy Now) styling - separate from Add to Cart
        button2Text: selectedVariant.buyNowButtonText,
        button2TextColor: selectedVariant.buyNowButtonTextColor,
        button2BackgroundColor: selectedVariant.buyNowButtonBackgroundColor,
        button2BorderColor: selectedVariant.buyNowButtonBackgroundColor,
        button2Height: selectedVariant.buyNowButtonHeight,
        button2FontSize: selectedVariant.buyNowButtonFontSize,
        button2BorderRadius: selectedVariant.buyNowButtonBorderRadius,
        
        // Hurry Up banner styling
        hurryUpText: selectedVariant.hurryUpText,
        hurryUpBannerHeight: selectedVariant.hurryUpHeight,
        hurryUpBannerBackgroundColor: selectedVariant.hurryUpBackgroundColor,
        hurryUpTextColor: selectedVariant.hurryUpTextColor,
        hurryUpFontSize: selectedVariant.hurryUpFontSize,
        
        // Keep mobile settings from global settings
        mobileBannerHeight: bannerSettings?.mobileBannerHeight || "80",
        mobileBannerBorderRadius: bannerSettings?.mobileBannerBorderRadius || "12",
        mobileBannerMargin: bannerSettings?.mobileBannerMargin || "10px",
        mobileProductHeight: bannerSettings?.mobileProductHeight || "80",
        mobileProductPadding: bannerSettings?.mobileProductPadding || "10",
        mobileTitleFontSize: bannerSettings?.mobileTitleFontSize || "14",
        mobileTitleColor: bannerSettings?.mobileTitleColor || "1f2937",
        mobilePriceFontSize: bannerSettings?.mobilePriceFontSize || "14",
        mobilePriceColor: bannerSettings?.mobilePriceColor || "6b7280",
        mobileButtonHeight: bannerSettings?.mobileButtonHeight || "40",
        mobileButtonPadding: bannerSettings?.mobileButtonPadding || "12px 20px",
        mobileButtonFontSize: bannerSettings?.mobileButtonFontSize || "16",
        mobileButtonBorderRadius: bannerSettings?.mobileButtonBorderRadius || "6",
        mobileButtonTextColor: bannerSettings?.mobileButtonTextColor || "ffffff",
        mobileButtonBackgroundColor: bannerSettings?.mobileButtonBackgroundColor || "FF6B6B",
        mobileHurryUpHeight: bannerSettings?.mobileHurryUpHeight || "30",
        mobileHurryUpFontSize: bannerSettings?.mobileHurryUpFontSize || "14",
        mobileHurryUpBackgroundColor: bannerSettings?.mobileHurryUpBackgroundColor || "FF6B6B",
        mobileHurryUpTextColor: bannerSettings?.mobileHurryUpTextColor || "ffffff",
      };

      // Override customization with variant settings
      const customization = {
        isShowPrice: selectedVariant.isShowPrice,
        isShowAddToCartButton: selectedVariant.isShowAddToCartButton,
        isShowBuyNowButton: selectedVariant.isShowBuyNowButton,
        isShowHurryUpBanner: selectedVariant.isShowHurryUpBanner,
      };
    }

    // Get product customization if exists (only if no A/B test is active)
    const customization = activeTest ? {
      isShowPrice: selectedVariant.isShowPrice,
      isShowAddToCartButton: selectedVariant.isShowAddToCartButton,
      isShowBuyNowButton: selectedVariant.isShowBuyNowButton,
      isShowHurryUpBanner: selectedVariant.isShowHurryUpBanner,
    } : product.productBannerCustomization

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
        settings: null,
        customization: customization ? {
          isShowPrice: customization.isShowPrice,
          isShowAddToCartButton: customization.isShowAddToCartButton,
          isShowBuyNowButton: customization.isShowBuyNowButton,
          isShowHurryUpBanner: customization.isShowHurryUpBanner,
        } : null,
        abTest: abTestData
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
        bannerPadding: bannerSettings.bannerPadding,
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
      } : null,
      customization: customization ? {
        isShowPrice: customization.isShowPrice,
        isShowAddToCartButton: customization.isShowAddToCartButton,
        isShowBuyNowButton: customization.isShowBuyNowButton,
        isShowHurryUpBanner: customization.isShowHurryUpBanner,
      } : null,
      abTest: abTestData
    });
  } catch (err) {
    console.error("Error fetching product banner data:", err);
    return json({ 
      error: "Internal server error", 
      product: null 
    }, { status: 500 });
  }
};