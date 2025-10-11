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

    const banners = await prisma.banner.findMany({
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

    if (!banners || banners.length === 0) {
      return json({ banners: [] });
    }

    const result = json({
      banners: await Promise.all(banners.map(async banner => {
        // Parse messages array robustly
        let parsedMessages: string[] = [];
        const messagesRaw: any = (banner as any).messages ?? "[]";
        
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
        const slides = (banner as any).slides || [];
        const hasSlides = slides.length > 0;

        return {
          id: banner.id,
          
          // Banner Layout & Styling - ONLY admin values, no fallbacks
          bannerWidth: (banner as any).bannerWidth,
          customWidth: (banner as any).customWidth,
          bannerHeight: (banner as any).bannerHeight,
          customHeight: (banner as any).customHeight,
          bannerPadding: (banner as any).bannerPadding,
          bannerLeftMargin: (banner as any).bannerLeftMargin,
          bannerRightMargin: (banner as any).bannerRightMargin,
          bannerTopMargin: (banner as any).bannerTopMargin,
          bannerBottomMargin: (banner as any).bannerBottomMargin,
          bannerBorderRadius: (banner as any).bannerBorderRadius,
          position: (banner as any).position,
          priority: (banner as any).priority,
          
          // Slides (new system) - takes precedence
          hasSlides,
          slides: await Promise.all(slides.map(async (slide: any) => {
            // Get product handle from relation or fallback to database lookup
            let productHandle = slide.product?.handle || null;
            if (!productHandle && slide.productId) {
              // Fallback: find product in banner's product relation
              const bannerProduct = (banner as any).product;
              if (bannerProduct && bannerProduct.id === slide.productId) {
                productHandle = bannerProduct.handle;
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
              actionType: slide.actionType || "view_product",
              actionButtonText: slide.actionButtonText || "View Product",
            };
          })),
          
          // Legacy Message Carousel System - ONLY admin values
          areMessagesCarousel: (banner as any).areMessagesCarousel,
          messages: parsedMessages,
          messageFontSize: (banner as any).messageFontSize,
          messagePosition: (banner as any).messagePosition,
          messageColor: (banner as any).messageColor,
          messagePadding: (banner as any).messagePadding,
          
          // Legacy Timer System - ONLY admin values
          isTimer: (banner as any).isTimer,
          startTime: (banner as any).startTime,
          endTime: (banner as any).endTime,
          timerBackgroundColor: (banner as any).timerBackgroundColor,
          timerBorderColor: (banner as any).timerBorderColor,
          timerPadding: (banner as any).timerPadding,
          timerTextColor: (banner as any).timerTextColor,
          timerFontSize: (banner as any).timerFontSize,
          
          // Legacy Product Integration - ONLY admin values
          hasProduct: (banner as any).hasProduct,
          productId: (banner as any).productId,
          productTitle: (banner as any).productTitle,
          productImage: (banner as any).productImage,
          productFontSize: (banner as any).productFontSize,
          productHandle: (banner as any).product?.handle || (banner as any).productHandle,
          productPrice: (banner as any).product?.price,
          productCurrencyCode: (banner as any).product?.currencyCode,
          productVariantId: (banner as any).product?.variantId,
          actionType: (banner as any).actionType,
          actionButtonText: (banner as any).actionButtonText,
          actionButtonTextColor: (banner as any).actionButtonTextColor,
          actionButtonBackgroundColor: (banner as any).actionButtonBackgroundColor,
          actionButtonBorderRadius: (banner as any).actionButtonBorderRadius,
          actionButtonPadding: (banner as any).actionButtonPadding,
          
          // Responsive Design - ONLY admin values
          responsiveDetails: (banner as any).responsiveDetails,
          responsiveFonts: (banner as any).responsiveFonts,
          
          // Close Icon - ONLY admin values
          closeIconColor: (banner as any).closeIconColor,
          closeIconPosition: (banner as any).closeIconPosition,
          closeIconSize: (banner as any).closeIconSize,
          
          // Background - ONLY admin values
          bgColor: (banner as any).bgColor,
          
          // Metadata
          createdAt: banner.createdAt.toISOString(),
          updatedAt: banner.updatedAt.toISOString()
        };
      }))
    });
    
    return result;
  } catch (err) {
    console.error("Error fetching banners:", err);
    return json({ error: "Internal server error", banners: [] }, { status: 500 });
  }
};