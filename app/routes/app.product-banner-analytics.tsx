import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Select,
  DataTable,
  EmptyState,
  Badge,
  InlineGrid,
} from "@shopify/polaris"
import { TitleBar } from "@shopify/app-bridge-react"
import type { LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react"
import { useState, useCallback } from "react"
import prisma from "app/db.server"
import { authenticate } from "../shopify.server"

// Helper function to format event types for display
function formatEventType(eventType: string): string {
  const eventTypeMap: Record<string, string> = {
    'banner_view': 'Banner View',
    'banner_close': 'Banner Closed',
    'add_to_cart_click': 'Add to Cart Clicked',
    'add_to_cart_attempt': 'Add to Cart Attempt',
    'add_to_cart_success': 'Added to Cart',
    'add_to_cart_failed': 'Add to Cart Failed',
    'buy_now_click': 'Buy Now Clicked',
    'buy_now_success': 'Buy Now Success',
    'buy_now_failed': 'Buy Now Failed',
    'variant_selector_open': 'Variant Selector Opened',
  }
  
  return eventTypeMap[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Types
interface AnalyticsData {
  totalViews: number
  totalClicks: number
  totalAddToCart: number
  totalBuyNow: number
  conversionRate: number
  topProducts: Array<{
    handle: string
    title: string
    views: number
    clicks: number
    conversions: number
  }>
  eventTimeline: Array<{
    date: string
    views: number
    clicks: number
    conversions: number
  }>
  deviceBreakdown: {
    mobile: number
    desktop: number
    tablet: number
    unknown: number
  }
  recentEvents: Array<{
    id: string
    eventType: string
    productHandle: string
    timestamp: string
    deviceType: string
  }>
}

// Loader
export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await authenticate.admin(request)
  if (auth instanceof Response) {
    return auth
  }

  const url = new URL(request.url)
  const dateRange = url.searchParams.get("dateRange") || "7"
  const productFilter = url.searchParams.get("product") || "all"

  try {
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))

    // Build where clause
    let whereClause: any = {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    }

    if (productFilter !== "all") {
      whereClause.productHandle = productFilter
    }

    // Fetch all analytics events
    const events = await (prisma as any).productBannerAnalytics.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' }
    })

    // Fetch products for filter dropdown
    const products = await prisma.product.findMany({
      select: {
        handle: true,
        title: true
      },
      orderBy: { title: 'asc' }
    })

    // Calculate metrics
    const totalViews = events.filter((e: any) => e.eventType === 'banner_view').length
    const totalClicks = events.filter((e: any) => 
      e.eventType === 'add_to_cart_click' || e.eventType === 'buy_now_click'
    ).length
    const totalAddToCart = events.filter((e: any) => 
      e.eventType === 'add_to_cart_success'
    ).length
    const totalBuyNow = events.filter((e: any) => 
      e.eventType === 'buy_now_success'
    ).length

    const conversionRate = totalViews > 0 
      ? ((totalAddToCart + totalBuyNow) / totalViews * 100).toFixed(2)
      : "0.00"

    // Device breakdown
    const deviceBreakdown = {
      mobile: events.filter((e: any) => e.deviceType === 'mobile').length,
      desktop: events.filter((e: any) => e.deviceType === 'desktop').length,
      tablet: events.filter((e: any) => e.deviceType === 'tablet').length,
      unknown: events.filter((e: any) => !e.deviceType || e.deviceType === 'unknown').length,
    }

    // Top products
    const productStats = new Map()
    events.forEach((event: any) => {
      const handle = event.productHandle
      if (!productStats.has(handle)) {
        productStats.set(handle, {
          handle,
          views: 0,
          clicks: 0,
          conversions: 0
        })
      }
      const stats = productStats.get(handle)
      if (event.eventType === 'banner_view') stats.views++
      if (event.eventType === 'add_to_cart_click' || event.eventType === 'buy_now_click') stats.clicks++
      if (event.eventType === 'add_to_cart_success' || event.eventType === 'buy_now_success') stats.conversions++
    })

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // Add product titles
    for (const product of topProducts) {
      const productData = products.find(p => p.handle === product.handle)
      product.title = productData?.title || product.handle
    }

    // Event timeline (daily)
    const timelineMap = new Map()
    events.forEach((event: any) => {
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      if (!timelineMap.has(date)) {
        timelineMap.set(date, { date, views: 0, clicks: 0, conversions: 0 })
      }
      const stats = timelineMap.get(date)
      if (event.eventType === 'banner_view') stats.views++
      if (event.eventType === 'add_to_cart_click' || event.eventType === 'buy_now_click') stats.clicks++
      if (event.eventType === 'add_to_cart_success' || event.eventType === 'buy_now_success') stats.conversions++
    })

    const eventTimeline = Array.from(timelineMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    )

    // Recent events (last 50)
    const recentEvents = events.slice(0, 50).map((e: any) => ({
      id: e.id,
      eventType: e.eventType,
      productHandle: e.productHandle,
      timestamp: new Date(e.timestamp).toLocaleString(),
      deviceType: e.deviceType || 'unknown'
    }))

    const analyticsData: AnalyticsData = {
      totalViews,
      totalClicks,
      totalAddToCart,
      totalBuyNow,
      conversionRate: parseFloat(conversionRate),
      topProducts,
      eventTimeline,
      deviceBreakdown,
      recentEvents
    }

    return json({ 
      analytics: analyticsData,
      products,
      dateRange,
      productFilter
    })
  } catch (error) {
    console.error("Analytics loader error:", error)
    return json({ 
      analytics: null,
      products: [],
      dateRange,
      productFilter,
      error: String(error)
    })
  }
}

// UI Component
export default function ProductBannerAnalyticsPage() {
  const { analytics, products, dateRange, productFilter } = useLoaderData<typeof loader>()
  const submit = useSubmit()
  const navigation = useNavigation()
  const isLoading = navigation.state === "loading"

  const [selectedDateRange, setSelectedDateRange] = useState(dateRange)
  const [selectedProduct, setSelectedProduct] = useState(productFilter)

  const handleDateRangeChange = useCallback((value: string) => {
    setSelectedDateRange(value)
    const params = new URLSearchParams()
    params.set("dateRange", value)
    params.set("product", selectedProduct)
    submit(params, { replace: true })
  }, [selectedProduct, submit])

  const handleProductChange = useCallback((value: string) => {
    setSelectedProduct(value)
    const params = new URLSearchParams()
    params.set("dateRange", selectedDateRange)
    params.set("product", value)
    submit(params, { replace: true })
  }, [selectedDateRange, submit])

  const handleExport = useCallback(() => {
    if (!analytics) return
    
    // Create CSV content
    const csvRows = [
      ['Event Type', 'Product Handle', 'Timestamp', 'Device Type'],
      ...analytics.recentEvents.map((e: any) => [
        formatEventType(e.eventType),
        e.productHandle,
        e.timestamp,
        e.deviceType
      ])
    ]
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `product-banner-analytics-${new Date().toISOString()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }, [analytics])

  if (!analytics) {
    return (
      <Page>
        <TitleBar title="Product Banner Analytics" />
        <Layout>
          <Layout.Section>
            <EmptyState
              heading="No analytics data available"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <Text as="p" variant="bodyMd">
                Analytics data will appear here once customers interact with your product banners.
              </Text>
            </EmptyState>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  // Prepare event rows for DataTable
  const eventRows = analytics.recentEvents.map((event: any) => [
    <Badge tone={
      event.eventType.includes('success') ? 'success' :
      event.eventType.includes('failed') ? 'critical' :
      event.eventType.includes('view') ? 'info' : 'attention'
    }>
      {formatEventType(event.eventType)}
    </Badge>,
    <Text as="span" variant="bodySm">
      {event.productHandle}
    </Text>,
    <Text as="span" variant="bodySm">
      {event.timestamp}
    </Text>,
    <Badge tone="info">{event.deviceType}</Badge>,
  ])

  return (
    <Page fullWidth>
      <TitleBar title="Product Banner Analytics" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Header with Filters */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">
                    Performance Overview
                  </Text>
                  <Button onClick={handleExport}>
                    Export CSV
                  </Button>
                </InlineStack>

                <InlineStack gap="300">
                  <Select
                    label="Date Range"
                    options={[
                      { label: 'Last 24 Hours', value: '1' },
                      { label: 'Last 7 Days', value: '7' },
                      { label: 'Last 30 Days', value: '30' },
                      { label: 'Last 90 Days', value: '90' },
                    ]}
                    value={selectedDateRange}
                    onChange={handleDateRangeChange}
                    disabled={isLoading}
                  />

                  <Select
                    label="Product"
                    options={[
                      { label: 'All Products', value: 'all' },
                      ...products.map((p: {title: string, handle: string}) => ({
                        label: p.title,
                        value: p.handle
                      }))
                    ]}
                    value={selectedProduct}
                    onChange={handleProductChange}
                    disabled={isLoading}
                  />
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Key Metrics */}
            <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Total Views
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {analytics.totalViews.toLocaleString()}
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Total Clicks
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {analytics.totalClicks.toLocaleString()}
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Conversions
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {(analytics.totalAddToCart + analytics.totalBuyNow).toLocaleString()}
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Conversion Rate
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {analytics.conversionRate}%
                  </Text>
                </BlockStack>
              </Card>
            </InlineGrid>

            {/* Device Breakdown */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Device Breakdown
                </Text>
                <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
                  <div>
                    <BlockStack gap="100">
                      <Text as="p" variant="headingLg">
                        {analytics.deviceBreakdown.desktop}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Desktop
                      </Text>
                    </BlockStack>
                  </div>
                  <div>
                    <BlockStack gap="100">
                      <Text as="p" variant="headingLg">
                        {analytics.deviceBreakdown.mobile}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Mobile
                      </Text>
                    </BlockStack>
                  </div>
                  <div>
                    <BlockStack gap="100">
                      <Text as="p" variant="headingLg">
                        {analytics.deviceBreakdown.tablet}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Tablet
                      </Text>
                    </BlockStack>
                  </div>
                  <div>
                    <BlockStack gap="100">
                      <Text as="p" variant="headingLg">
                        {analytics.deviceBreakdown.unknown}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Unknown
                      </Text>
                    </BlockStack>
                  </div>
                </InlineGrid>
              </BlockStack>
            </Card>

            {/* Top Products */}
            {analytics.topProducts.length > 0 && (
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Top Performing Products
                  </Text>
                  <DataTable
                    columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
                    headings={['Product', 'Views', 'Clicks', 'Conversions']}
                    rows={analytics.topProducts.map((p: any) => [
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {p.title}
                      </Text>,
                      p.views,
                      p.clicks,
                      p.conversions,
                    ])}
                    hoverable
                  />
                </BlockStack>
              </Card>
            )}

            {/* Recent Events */}
            {analytics.recentEvents.length > 0 && (
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Recent Events (Last 50)
                  </Text>
                  <div style={{ overflow: "auto" }}>
                    <DataTable
                      columnContentTypes={['text', 'text', 'text', 'text']}
                      headings={['Event Type', 'Product', 'Timestamp', 'Device']}
                      rows={eventRows}
                      hoverable
                      increasedTableDensity
                    />
                  </div>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}

