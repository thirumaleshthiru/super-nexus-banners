import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "app/db.server";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const staticBanners = await (prisma as any).staticBanner.findMany({
      where: { isActive: true },
      orderBy: [
        { priority: "asc" },
        { createdAt: "desc" }
      ],
      include: {
        slides: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!staticBanners || staticBanners.length === 0) {
      return json({ staticBanners: [] });
    }

    const result = json({
      staticBanners: await Promise.all(staticBanners.map(async (staticBanner: any) => {
        // Parse messages array robustly
        let parsedMessages: string[] = [];
        const messagesRaw: any = (staticBanner as any).messages ?? "[]";
        
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
        const slides = (staticBanner as any).slides || [];
        const hasSlides = slides.length > 0;

        return {
          id: staticBanner.id,
          
          // Banner Layout & Styling - ONLY admin values, no fallbacks
          bannerWidth: (staticBanner as any).bannerWidth,
          customWidth: (staticBanner as any).customWidth,
          bannerHeight: (staticBanner as any).bannerHeight,
          customHeight: (staticBanner as any).customHeight,
          bannerPadding: (staticBanner as any).bannerPadding,
          bannerLeftMargin: (staticBanner as any).bannerLeftMargin,
          bannerRightMargin: (staticBanner as any).bannerRightMargin,
          bannerTopMargin: (staticBanner as any).bannerTopMargin,
          bannerBottomMargin: (staticBanner as any).bannerBottomMargin,
          bannerBorderRadius: (staticBanner as any).bannerBorderRadius,
          priority: (staticBanner as any).priority,
          
          // Slides (new system) - takes precedence
          hasSlides,
          slides: slides.map((slide: any) => {
            return {
              id: slide.id,
              order: slide.order,
              message: slide.message,
              isTimer: slide.isTimer,
              startTime: slide.startTime,
              endTime: slide.endTime,
              hasCoupon: slide.hasCoupon,
              couponCode: slide.couponCode,
            };
          }),
          
          // Legacy Message Carousel System - ONLY admin values
          areMessagesCarousel: (staticBanner as any).areMessagesCarousel,
          messages: parsedMessages,
          messageFontSize: (staticBanner as any).messageFontSize,
          messagePosition: (staticBanner as any).messagePosition,
          messageColor: (staticBanner as any).messageColor,
          messagePadding: (staticBanner as any).messagePadding,
          
          // Legacy Timer System - ONLY admin values
          isTimer: (staticBanner as any).isTimer,
          startTime: (staticBanner as any).startTime,
          endTime: (staticBanner as any).endTime,
          timerBackgroundColor: (staticBanner as any).timerBackgroundColor,
          timerBorderColor: (staticBanner as any).timerBorderColor,
          timerPadding: (staticBanner as any).timerPadding,
          timerTextColor: (staticBanner as any).timerTextColor,
          timerFontSize: (staticBanner as any).timerFontSize,
          
          // Legacy Coupon System - ONLY admin values
          hasCoupon: (staticBanner as any).hasCoupon,
          couponCode: (staticBanner as any).couponCode,
          couponBackgroundColor: (staticBanner as any).couponBackgroundColor,
          couponBorderColor: (staticBanner as any).couponBorderColor,
          couponTextColor: (staticBanner as any).couponTextColor,
          couponFontSize: (staticBanner as any).couponFontSize,
          couponPadding: (staticBanner as any).couponPadding,
          
          // Background - ONLY admin values
          bgColor: (staticBanner as any).bgColor,
          
          // Metadata
          createdAt: staticBanner.createdAt.toISOString(),
          updatedAt: staticBanner.updatedAt.toISOString()
        };
      }))
    });
    
    return result;
  } catch (err) {
    console.error("Error fetching static banners:", err);
    return json({ error: "Internal server error", staticBanners: [] }, { status: 500 });
  }
};
