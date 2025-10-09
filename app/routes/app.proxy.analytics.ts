import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "app/db.server";

// App Proxy endpoint: /apps/banners-1/analytics -> /app/proxy/analytics
// Accepts JSON: { bannerId, eventType, sessionId?, shopDomain, productId?, messageIndex? }
export const action: ActionFunction = async ({ request }) => {
  try {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return json({ error: "Invalid content type" }, { status: 400 });
    }

    const payload = await request.json();

    const bannerId = String(payload.bannerId || "").trim();
    const eventType = String(payload.eventType || "").trim();
    const shopDomain = String(payload.shopDomain || "").trim();

    if (!bannerId || !eventType || !shopDomain) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Optional fields
    const sessionId = payload.sessionId ? String(payload.sessionId) : null;
    const productId = payload.productId ? String(payload.productId) : null;
    const messageIndex =
      typeof payload.messageIndex === "number" ? payload.messageIndex : null;

    // Persist
    await prisma.bannerAnalytics.create({
      data: {
        bannerId,
        eventType,
        sessionId,
        shopDomain,
        productId,
        messageIndex,
      },
    });

    // Respond quickly; no body needed
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Analytics proxy error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};


