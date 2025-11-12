import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "app/db.server";

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const {
      productId,
      productHandle,
      eventType,
      sessionId,
      variantId,
      quantity,
      metadata
    } = body;

    // Validate required fields
    if (!productHandle || !eventType) {
      return json({ 
        error: "Missing required fields: productHandle, eventType" 
      }, { status: 400 });
    }

    // Get user agent and device type
    const userAgent = request.headers.get("user-agent") || undefined;
    const deviceType = getDeviceType(userAgent);

    // Store analytics event
    await (prisma as any).productBannerAnalytics.create({
      data: {
        productId: productId || productHandle,
        productHandle,
        eventType,
        sessionId: sessionId || undefined,
        userAgent,
        deviceType,
        variantId: variantId || undefined,
        quantity: quantity || undefined,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });

    return json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Analytics error:", error);
    return json({ 
      error: "Failed to record analytics event",
      details: String(error)
    }, { status: 500 });
  }
};

// Helper function to determine device type from user agent
function getDeviceType(userAgent: string | undefined): string {
  if (!userAgent) return "unknown";
  
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec/i.test(ua)) {
    return "mobile";
  }
  
  return "desktop";
}

