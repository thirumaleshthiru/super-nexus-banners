import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";

import { Page, Layout, Card, Text, BlockStack, InlineStack, Badge, DataTable, Select, TextField, Button, EmptyState } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useMemo, useState } from "react";

type RangeKey = "24h" | "7d" | "30d" | "90d";

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await authenticate.admin(request);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const range = (url.searchParams.get("range") as RangeKey) || "7d";
  const event = url.searchParams.get("event") || "all";
  const bannerId = url.searchParams.get("bannerId") || undefined;

  const now = new Date();
  const start = new Date(now);
  if (range === "24h") start.setDate(now.getDate() - 1);
  else if (range === "7d") start.setDate(now.getDate() - 7);
  else if (range === "30d") start.setDate(now.getDate() - 30);
  else if (range === "90d") start.setDate(now.getDate() - 90);

  const where: any = { timestamp: { gte: start } };
  if (event !== "all") where.eventType = event;
  if (bannerId) where.bannerId = bannerId;

  const [entries, countsByType, totalEvents, uniqueSessions, topBanners] = await Promise.all([
    prisma.bannerAnalytics.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 300,
    }),
    prisma.bannerAnalytics.groupBy({
      by: ["eventType"],
      where,
      _count: { eventType: true },
    }),
    prisma.bannerAnalytics.count({ where }),
    prisma.bannerAnalytics.groupBy({
      by: ["sessionId"],
      where: { ...where, sessionId: { not: null } },
      _count: { sessionId: true },
    }).then((rows) => rows.length),
    prisma.bannerAnalytics.groupBy({
      by: ["bannerId"],
      where,
      _count: { bannerId: true },
      orderBy: { _count: { bannerId: "desc" } },
      take: 10,
    }),
  ]);

  const counts: Record<string, number> = {};
  countsByType.forEach((c) => (counts[c.eventType] = c._count.eventType));

  // Build lookup maps for friendly names
  const bannerIds = Array.from(new Set(entries.map((e) => e.bannerId)));
  const productIds = Array.from(
    new Set(entries.map((e) => e.productId).filter((id): id is string => Boolean(id)))
  );

  const [bannerRows, productRows] = await Promise.all([
    prisma.banner.findMany({
      where: { id: { in: bannerIds } },
      select: { id: true, productTitle: true, messages: true },
    }),
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true },
    }),
  ]);

  const bannerIdToLabel: Record<string, string> = {};
  for (const b of bannerRows) {
    let firstMessage = "";
    try {
      const msgs = JSON.parse(b.messages || "[]");
      if (Array.isArray(msgs) && msgs.length > 0) firstMessage = String(msgs[0]).slice(0, 40);
    } catch {}
    const base = b.productTitle || firstMessage || b.id;
    bannerIdToLabel[b.id] = base;
  }

  const productIdToTitle: Record<string, string> = {};
  for (const p of productRows) productIdToTitle[p.id] = p.title;

  return json({
    range,
    event,
    bannerId: bannerId || "",
    counts,
    totalEvents,
    uniqueSessions,
    topBanners,
    banners: bannerRows.map((b) => ({ id: b.id, label: bannerIdToLabel[b.id] })),
    recent: entries.map((e) => ({
      id: e.id,
      ts: e.timestamp,
      bannerId: e.bannerId,
      bannerLabel: bannerIdToLabel[e.bannerId] || e.bannerId,
      eventType: e.eventType,
      productTitle: e.productId ? productIdToTitle[e.productId] || e.productId : null,
      sessionId: e.sessionId,
      messageIndex: e.messageIndex,
      shopDomain: e.shopDomain,
    })),
  });
}

export default function BannerAnalyticsPage() {
  const data = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  const [selectedRange, setSelectedRange] = useState<string>(data.range);
  const [selectedEvent, setSelectedEvent] = useState<string>(data.event);
  const [selectedBannerId, setSelectedBannerId] = useState<string>(data.bannerId);

  const rows = useMemo(() => {
    return data.recent.map((e: any) => [
      new Date(e.ts).toLocaleString(),
      e.eventType,
      e.bannerLabel,
      e.productTitle || "-",
      e.messageIndex != null ? String(e.messageIndex) : "-",
    ]);
  }, [data.recent]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set("range", selectedRange || "7d");
    params.set("event", selectedEvent || "all");
    if (selectedBannerId) params.set("bannerId", selectedBannerId);
    submit(params, { replace: true });
  };

  const clearFilters = () => {
    setSelectedRange("7d");
    setSelectedEvent("all");
    setSelectedBannerId("");
    const params = new URLSearchParams();
    params.set("range", "7d");
    params.set("event", "all");
    submit(params, { replace: true });
  };

  return (
    <Page>
      <TitleBar title="Banner Analytics" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">Overview</Text>
                  <Text as="span" tone="subdued">Last updated {new Date().toLocaleTimeString()}</Text>
                </InlineStack>
                <InlineStack gap="300" wrap>
                  <KPI title="Total events" value={data.totalEvents} />
                  <KPI title="Unique sessions" value={data.uniqueSessions} />
                  <KPI title="Views" value={data.counts["view"] || 0} />
                  <KPI title="Clicks" value={(data.counts["view_product"] || 0) + (data.counts["add_to_cart"] || 0)} />
                  <KPI title="Closes" value={data.counts["close"] || 0} />
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <InlineStack gap="300" wrap align="space-between">
                  <InlineStack gap="300" wrap>
                    <Select
                      label="Range"
                      labelHidden
                      options={[
                        { label: "Last 24h", value: "24h" },
                        { label: "Last 7d", value: "7d" },
                        { label: "Last 30d", value: "30d" },
                        { label: "Last 90d", value: "90d" },
                      ]}
                      value={selectedRange}
                      onChange={setSelectedRange}
                    />
                    <Select
                      label="Event"
                      labelHidden
                      options={[
                        { label: "All events", value: "all" },
                        { label: "Views", value: "view" },
                        { label: "View product", value: "view_product" },
                        { label: "Add to cart", value: "add_to_cart" },
                        { label: "Close", value: "close" },
                        { label: "Carousel click", value: "carousel_click" },
                        { label: "Slide click", value: "slide_click" },
                      ]}
                      value={selectedEvent}
                      onChange={setSelectedEvent}
                    />
                    <Select
                      label="Banner"
                      labelHidden
                      options={[
                        { label: "All banners", value: "" },
                        ...((data.banners as any[]) || []).map((b) => ({
                          label: b.label,
                          value: b.id,
                        })),
                      ]}
                      value={selectedBannerId}
                      onChange={setSelectedBannerId}
                    />
                  </InlineStack>
                  <InlineStack gap="200">
                    <Button onClick={clearFilters} disabled={isLoading}>
                      Clear
                    </Button>
                    <Button onClick={applyFilters} loading={isLoading} variant="primary">
                      Apply
                    </Button>
                  </InlineStack>
                </InlineStack>
                {rows.length > 0 ? (
                  <DataTable
                    columnContentTypes={["text", "text", "text", "text", "text"]}
                    headings={["Time", "Event", "Banner", "Product", "Slide"]}
                    rows={rows}
                    hoverable
                    increasedTableDensity
                  />
                ) : (
                  <EmptyState
                    heading="No analytics yet"
                    action={{ content: "Clear filters", onAction: clearFilters }}
                    image="https://cdn.shopify.com/shopifycloud/web/assets/v1/8e66d2e9b2b1b6a7.png"
                  >
                    <p>Try broadening your date range or removing filters to see recent events.</p>
                  </EmptyState>
                )}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">Top banners by events</Text>
                <InlineStack gap="300" wrap>
                  {data.topBanners.map((b: any) => (
                    <Badge key={b.bannerId} tone="attention">
                      {`${b.bannerId}: ${b._count.bannerId}`}
                    </Badge>
                  ))}
                </InlineStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function KPI({ title, value, tone }: { title: string; value: number; tone?: "success" | "info" | "critical" }) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text as="span" variant="bodySm" tone="subdued">{title}</Text>
        <Text as="span" variant="headingLg">{value}</Text>
        {tone && <Badge tone={tone}>KPI</Badge>}
      </BlockStack>
    </Card>
  );
}


