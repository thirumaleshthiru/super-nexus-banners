import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "app/db.server";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    // Helper function to get product handle by ID
    const getProductHandle = async (productId: string) => {
      if (!productId) return null;
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { handle: true }
      });
      return product?.handle || null;
    };

    const bottomBanners = await (prisma as any).bottomBanner.findMany({
      where: { isActive: true },
      orderBy: [
        { priority: "asc" },
        { createdAt: "desc" }
      ],
      include: {
        product: {
          select: {
            id: true,
            handle: true,
            title: true,
            price: true,
            currencyCode: true,
            variantId: true
          }
        },
        slides: {
          orderBy: { order: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                handle: true,
                title: true,
                price: true,
                currencyCode: true,
                variantId: true
              }
            }
          }
        }
      }
    });

    if (!bottomBanners || bottomBanners.length === 0) {
      return json({ bottomBanners: [] });
    }

    const result = json({
      bottomBanners: await Promise.all(bottomBanners.map(async (bottomBanner: any) => {
        // Parse messages array robustly
        let parsedMessages: string[] = [];
        const messagesRaw: any = (bottomBanner as any).messages ?? "[]";
        
        try {
          if (Array.isArray(messagesRaw)) {
            parsedMessages = messagesRaw as string[];
          } else if (typeof messagesRaw === "string") {
            const trimmed = messagesRaw.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
              const parsed = JSON.parse(trimmed);
              parsedMessages = Array.isArray(parsed) ? parsed : [];
            } else if (trimmed.length > 0) {
              parsedMessages = [messagesRaw];
            } else {
              parsedMessages = [];
            }
          } else {
            parsedMessages = [];
          }
        } catch {
          parsedMessages = typeof messagesRaw === "string" && messagesRaw.length > 0 ? [messagesRaw] : [];
        }

        // Process slides - prefer slides over legacy data
        const slides = (bottomBanner as any).slides || [];
        const hasSlides = slides.length > 0;

        return {
          id: bottomBanner.id,
          
          // Banner Layout & Styling - ONLY admin values, no fallbacks
          bannerWidth: (bottomBanner as any).bannerWidth,
          customWidth: (bottomBanner as any).customWidth,
          bannerHeight: (bottomBanner as any).bannerHeight,
          customHeight: (bottomBanner as any).customHeight,
          bannerPadding: (bottomBanner as any).bannerPadding,
          bannerLeftMargin: (bottomBanner as any).bannerLeftMargin,
          bannerRightMargin: (bottomBanner as any).bannerRightMargin,
          bannerTopMargin: (bottomBanner as any).bannerTopMargin,
          bannerBottomMargin: (bottomBanner as any).bannerBottomMargin,
          bannerBorderRadius: (bottomBanner as any).bannerBorderRadius,
          priority: (bottomBanner as any).priority,
          
          // Slides (new system) - takes precedence
          hasSlides,
          slides: await Promise.all(slides.map(async (slide: any) => {
            // Get product handle from relation or fallback to database lookup
            let productHandle = slide.product?.handle || null;
            if (!productHandle && slide.productId) {
              // Fallback: find product in bottomBanner's product relation
              const bottomBannerProduct = (bottomBanner as any).product;
              if (bottomBannerProduct && bottomBannerProduct.id === slide.productId) {
                productHandle = bottomBannerProduct.handle;
              } else {
                // Last resort: lookup from database
                productHandle = await getProductHandle(slide.productId);
              }
            }
            
            return {
              id: slide.id,
              order: slide.order,
              message: slide.message,
              isTimer: slide.isTimer,
              startTime: slide.startTime,
              endTime: slide.endTime,
              hasProduct: slide.hasProduct,
              productId: slide.productId,
              productTitle: slide.productTitle || slide.product?.title || null,
              productHandle: productHandle,
              productPrice: slide.product?.price || null,
              productCurrencyCode: slide.product?.currencyCode || "USD",
              productVariantId: slide.productVariantId,
              productImage: slide.productImage || slide.product?.featuredImage || null,
              showImage: slide.showImage,
              priceOverride: slide.priceOverride,
              couponCode: slide.couponCode,
              showAddToCartButton: slide.showAddToCartButton,
              showViewProductButton: slide.showViewProductButton,
              addToCartButtonText: slide.addToCartButtonText || "Add to Cart",
              viewProductButtonText: slide.viewProductButtonText || "View Product",
              product: slide.product, // Include full product object for fallback
            };
          })),
          
          // Legacy Message Carousel System - ONLY admin values
          areMessagesCarousel: (bottomBanner as any).areMessagesCarousel,
          messages: parsedMessages,
          messageFontSize: (bottomBanner as any).messageFontSize,
          messagePosition: (bottomBanner as any).messagePosition,
          messageColor: (bottomBanner as any).messageColor,
          messagePadding: (bottomBanner as any).messagePadding,
          
          // Legacy Timer System - ONLY admin values
          isTimer: (bottomBanner as any).isTimer,
          startTime: (bottomBanner as any).startTime,
          endTime: (bottomBanner as any).endTime,
          timerBackgroundColor: (bottomBanner as any).timerBackgroundColor,
          timerBorderColor: (bottomBanner as any).timerBorderColor,
          timerPadding: (bottomBanner as any).timerPadding,
          timerTextColor: (bottomBanner as any).timerTextColor,
          timerFontSize: (bottomBanner as any).timerFontSize,
          
          // Legacy Product Integration - ONLY admin values
          hasProduct: (bottomBanner as any).hasProduct,
          productId: (bottomBanner as any).productId,
          productTitle: (bottomBanner as any).productTitle,
          productImage: (bottomBanner as any).productImage,
          showImage: (bottomBanner as any).showImage,
          priceOverride: (bottomBanner as any).priceOverride,
          couponCode: (bottomBanner as any).couponCode,
          productFontSize: (bottomBanner as any).productFontSize,
          productHandle: (bottomBanner as any).product?.handle || (bottomBanner as any).productHandle,
          productPrice: (bottomBanner as any).product?.price,
          productCurrencyCode: (bottomBanner as any).product?.currencyCode,
          productVariantId: (bottomBanner as any).product?.variantId,
          actionType: (bottomBanner as any).actionType,
          actionButtonText: (bottomBanner as any).actionButtonText,
          actionButtonTextColor: (bottomBanner as any).actionButtonTextColor,
          actionButtonBackgroundColor: (bottomBanner as any).actionButtonBackgroundColor,
          actionButtonBorderRadius: (bottomBanner as any).actionButtonBorderRadius,
          actionButtonPadding: (bottomBanner as any).actionButtonPadding,
          
          // Button Configuration
          showAddToCartButton: (bottomBanner as any).showAddToCartButton,
          showViewProductButton: (bottomBanner as any).showViewProductButton,
          addToCartButtonText: (bottomBanner as any).addToCartButtonText,
          viewProductButtonText: (bottomBanner as any).viewProductButtonText,
          addToCartButtonTextColor: (bottomBanner as any).addToCartButtonTextColor,
          addToCartButtonBackgroundColor: (bottomBanner as any).addToCartButtonBackgroundColor,
          viewProductButtonTextColor: (bottomBanner as any).viewProductButtonTextColor,
          viewProductButtonBackgroundColor: (bottomBanner as any).viewProductButtonBackgroundColor,
          
          // Background - ONLY admin values
          bgColor: (bottomBanner as any).bgColor,
          
          // Metadata
          createdAt: bottomBanner.createdAt.toISOString(),
          updatedAt: bottomBanner.updatedAt.toISOString()
        };
      }))
    });
    
    return result;
  } catch (err) {
    console.error("Error fetching bottom banners:", err);
    return json({ error: "Internal server error", bottomBanners: [] }, { status: 500 });
  }
};
