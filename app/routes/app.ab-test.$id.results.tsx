import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  InlineStack,
  Button,
  DataTable,
  EmptyState,
  Badge,
  InlineGrid,
  ProgressBar,
  Banner,
} from "@shopify/polaris"
import { TitleBar } from "@shopify/app-bridge-react"
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { useLoaderData, useSubmit, useNavigate } from "@remix-run/react"
import { useCallback } from "react"
import prisma from "app/db.server"
import { authenticate } from "../shopify.server"

// Loader
export async function loader({ request, params }: LoaderFunctionArgs) {
  const auth = await authenticate.admin(request)
  if (auth instanceof Response) {
    return auth
  }

  const testId = params.id

  try {
    // Fetch test with variants
    const test = await (prisma as any).productBannerTest.findUnique({
      where: { id: testId },
      include: {
        variants: true,
      }
    })

    if (!test) {
      throw new Error("Test not found")
    }

    // Fetch product info
    const product = await prisma.product.findUnique({
      where: { id: test.productId },
      select: {
        id: true,
        title: true,
        handle: true,
        featuredImage: true,
      }
    })

    // Fetch analytics for each variant
    const analyticsData = await Promise.all(
      test.variants.map(async (variant: any) => {
        const analytics = await (prisma as any).productBannerAnalytics.findMany({
          where: {
            testVariantId: variant.id,
            productHandle: test.productHandle,
          }
        })

        const views = analytics.filter((a: any) => a.eventType === 'banner_view').length
        const clicks = analytics.filter((a: any) => 
          a.eventType === 'add_to_cart_click' || a.eventType === 'buy_now_click'
        ).length
        const addToCarts = analytics.filter((a: any) => a.eventType === 'add_to_cart_success').length
        const buyNows = analytics.filter((a: any) => a.eventType === 'buy_now_success').length
        const conversions = addToCarts + buyNows
        const conversionRate = views > 0 ? (conversions / views * 100).toFixed(2) : "0.00"

        return {
          variantId: variant.id,
          views,
          clicks,
          addToCarts,
          buyNows,
          conversions,
          conversionRate: parseFloat(conversionRate)
        }
      })
    )

    // Update variant stats in database
    await Promise.all(
      test.variants.map(async (variant: any, index: number) => {
        const stats = analyticsData[index]
        await (prisma as any).productBannerVariant.update({
          where: { id: variant.id },
          data: {
            views: stats.views,
            clicks: stats.clicks,
            addToCarts: stats.addToCarts,
            buyNows: stats.buyNows,
            conversions: stats.conversions,
            conversionRate: stats.conversionRate,
          }
        })
      })
    )

    // Refresh test data with updated stats
    const updatedTest = await (prisma as any).productBannerTest.findUnique({
      where: { id: testId },
      include: {
        variants: true,
      }
    })

    // Determine if we have a statistical winner
    const hasEnoughData = updatedTest.variants.every(
      (v: any) => v.views >= updatedTest.minSampleSize
    )

    let winnerData = null
    if (hasEnoughData && !updatedTest.winnerVariantId) {
      // Find best performing variant based on goal metric
      const sortedVariants = [...updatedTest.variants].sort((a: any, b: any) => {
        if (updatedTest.goalMetric === 'conversion_rate') {
          return b.conversionRate - a.conversionRate
        } else if (updatedTest.goalMetric === 'clicks') {
          return b.clicks - a.clicks
        } else if (updatedTest.goalMetric === 'add_to_cart') {
          return b.addToCarts - a.addToCarts
        }
        return 0
      })

      winnerData = sortedVariants[0]

      // Auto-select winner if enabled
      if (updatedTest.autoSelectWinner) {
        await (prisma as any).productBannerTest.update({
          where: { id: testId },
          data: {
            winnerVariantId: winnerData.id,
            status: 'completed',
            endDate: new Date()
          }
        })
      }
    }

    return json({ 
      test: updatedTest, 
      product, 
      hasEnoughData,
      winnerData
    })
  } catch (error) {
    console.error("Error loading test results:", error)
    throw error
  }
}

// Action
export async function action({ request, params }: ActionFunctionArgs) {
  const auth = await authenticate.admin(request)
  if (auth instanceof Response) {
    return auth
  }

  const testId = params.id
  const formData = await request.formData()
  const action = formData.get("action")

  try {
    if (action === "start") {
      await (prisma as any).productBannerTest.update({
        where: { id: testId },
        data: {
          status: "running",
          startDate: new Date()
        }
      })
    } else if (action === "pause") {
      await (prisma as any).productBannerTest.update({
        where: { id: testId },
        data: { status: "paused" }
      })
    } else if (action === "complete") {
      const winnerVariantId = formData.get("winnerVariantId") as string
      await (prisma as any).productBannerTest.update({
        where: { id: testId },
        data: {
          status: "completed",
          endDate: new Date(),
          winnerVariantId: winnerVariantId || undefined
        }
      })
    } else if (action === "delete") {
      await (prisma as any).productBannerTest.delete({
        where: { id: testId }
      })
      return redirect("/app/ab-tests")
    }

    return json({ success: true })
  } catch (error) {
    console.error("Error updating test:", error)
    return json({ success: false, error: String(error) }, { status: 500 })
  }
}

// Helper functions
function getStatusBadge(status: string) {
  switch (status) {
    case "running":
      return <Badge tone="success">Running</Badge>
    case "paused":
      return <Badge tone="attention">Paused</Badge>
    case "completed":
      return <Badge tone="info">Completed</Badge>
    case "draft":
      return <Badge>Draft</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

function formatDate(date: string | null) {
  if (!date) return "Not started"
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Component
export default function ABTestResults() {
  const { test, product, hasEnoughData, winnerData } = useLoaderData<typeof loader>()
  const submit = useSubmit()
  const navigate = useNavigate()

  const handleAction = useCallback((action: string, winnerVariantId?: string) => {
    const formData = new FormData()
    formData.append("action", action)
    if (winnerVariantId) {
      formData.append("winnerVariantId", winnerVariantId)
    }
    submit(formData, { method: "post" })
  }, [submit])

  // Find current winner
  const currentWinner = test.variants.find((v: any) => v.id === test.winnerVariantId)
  const bestVariant = [...test.variants].sort((a: any, b: any) => {
    if (test.goalMetric === 'conversion_rate') {
      return b.conversionRate - a.conversionRate
    } else if (test.goalMetric === 'clicks') {
      return b.clicks - a.clicks
    } else if (test.goalMetric === 'add_to_cart') {
      return b.addToCarts - a.addToCarts
    }
    return 0
  })[0]

  // Calculate total stats
  const totalViews = test.variants.reduce((sum: number, v: any) => sum + v.views, 0)
  const totalClicks = test.variants.reduce((sum: number, v: any) => sum + v.clicks, 0)
  const totalConversions = test.variants.reduce((sum: number, v: any) => sum + v.conversions, 0)

  // Progress towards minimum sample size
  const maxViews = Math.max(...test.variants.map((v: any) => v.views))
  const progress = Math.min((maxViews / test.minSampleSize) * 100, 100)

  return (
    <Page
      fullWidth
      backAction={{ content: "A/B Tests", url: "/app/ab-tests" }}
    >
      <TitleBar title={test.name} />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Test Overview */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <BlockStack gap="200">
                    <InlineStack gap="300" blockAlign="center">
                      {product?.featuredImage && (
                        <div style={{ 
                          width: "60px", 
                          height: "60px", 
                          borderRadius: "8px", 
                          overflow: "hidden",
                          background: "#f3f4f6",
                          border: "1px solid #e5e7eb"
                        }}>
                          <img 
                            src={product.featuredImage} 
                            alt={product.title}
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              objectFit: "cover" 
                            }}
                          />
                        </div>
                      )}
                      <BlockStack gap="100">
                        <Text as="h2" variant="headingLg">
                          {test.name}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {product?.title} • {test.variants.length} variants
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    <InlineStack gap="300">
                      {getStatusBadge(test.status)}
                      {currentWinner && (
                        <Badge tone="success">{`Winner: ${currentWinner.name}`}</Badge>
                      )}
                    </InlineStack>
                  </BlockStack>

                  <InlineStack gap="200">
                    {test.status === "draft" && (
                      <Button
                        variant="primary"
                        onClick={() => handleAction("start")}
                      >
                        Start Test
                      </Button>
                    )}
                    {test.status === "running" && (
                      <>
                        <Button onClick={() => handleAction("pause")}>
                          Pause Test
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleAction("complete", bestVariant.id)}
                        >
                          Complete Test
                        </Button>
                      </>
                    )}
                    {test.status === "paused" && (
                      <>
                        <Button onClick={() => handleAction("start")}>
                          Resume Test
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleAction("complete", bestVariant.id)}
                        >
                          Complete Test
                        </Button>
                      </>
                    )}
                    <Button
                      tone="critical"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this test?")) {
                          handleAction("delete")
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </InlineStack>
                </InlineStack>

                <InlineGrid columns={4} gap="400">
                  <div>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        Started
                      </Text>
                      <Text as="p" variant="bodyMd">
                        {formatDate(test.startDate)}
                      </Text>
                    </BlockStack>
                  </div>
                  <div>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        Goal Metric
                      </Text>
                      <Text as="p" variant="bodyMd">
                        {test.goalMetric === 'conversion_rate' ? 'Conversion Rate' :
                         test.goalMetric === 'clicks' ? 'Total Clicks' :
                         test.goalMetric === 'add_to_cart' ? 'Add to Cart' : test.goalMetric}
                      </Text>
                    </BlockStack>
                  </div>
                  <div>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        Min Sample Size
                      </Text>
                      <Text as="p" variant="bodyMd">
                        {test.minSampleSize} views
                      </Text>
                    </BlockStack>
                  </div>
                  <div>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        Confidence Level
                      </Text>
                      <Text as="p" variant="bodyMd">
                        {test.confidenceLevel}%
                      </Text>
                    </BlockStack>
                  </div>
                </InlineGrid>
              </BlockStack>
            </Card>

            {/* Draft Status Banner */}
            {test.status === "draft" && (
              <Banner tone="warning" title="Test Not Started">
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    This test is in <strong>Draft</strong> status and will not show variants to visitors until you start it.
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Click the <strong>"Start Test"</strong> button above to begin the A/B test. Once started, visitors will see different variants based on the traffic split you configured.
                  </Text>
                </BlockStack>
              </Banner>
            )}

            {/* Progress Indicator */}
            {test.status === "running" && !hasEnoughData && (
              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Test Progress
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {maxViews} / {test.minSampleSize} views
                    </Text>
                  </InlineStack>
                  <ProgressBar progress={progress} size="small" />
                  <Text as="p" variant="bodySm" tone="subdued">
                    Collecting data to reach statistical significance...
                  </Text>
                </BlockStack>
              </Card>
            )}

            {/* Winner Announcement */}
            {hasEnoughData && winnerData && !currentWinner && (
              <Banner tone="success">
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    We have a winner! 🎉
                  </Text>
                  <Text as="p" variant="bodySm">
                    {winnerData.name} is performing best with {winnerData.conversionRate}% conversion rate.
                    The test has reached statistical significance.
                  </Text>
                  {test.autoSelectWinner && (
                    <Text as="p" variant="bodySm" tone="subdued">
                      Winner was automatically selected based on your test settings.
                    </Text>
                  )}
                </BlockStack>
              </Banner>
            )}

            {/* Overall Stats */}
            <InlineGrid columns={3} gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Total Views
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {totalViews.toLocaleString()}
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Total Clicks
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {totalClicks.toLocaleString()}
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Total Conversions
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {totalConversions.toLocaleString()}
                  </Text>
                </BlockStack>
              </Card>
            </InlineGrid>

            {/* Variant Comparison */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Variant Performance
                </Text>
                
                {test.variants.map((variant: any) => {
                  const isWinner = variant.id === test.winnerVariantId
                  const isBest = variant.id === bestVariant?.id
                  
                  return (
                    <Card key={variant.id} background={isWinner ? "bg-surface-success" : undefined}>
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <InlineStack gap="200" blockAlign="center">
                            <Text as="p" variant="headingMd">
                              {variant.name}
                            </Text>
                            {variant.isControl && <Badge>Control</Badge>}
                            {isWinner && <Badge tone="success">Winner 🏆</Badge>}
                            {!isWinner && isBest && hasEnoughData && <Badge tone="attention">Best Performer</Badge>}
                          </InlineStack>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {variant.trafficWeight.toFixed(1)}% traffic
                          </Text>
                        </InlineStack>

                        <InlineGrid columns={5} gap="400">
                          <div>
                            <BlockStack gap="100">
                              <Text as="p" variant="headingLg">
                                {variant.views.toLocaleString()}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Views
                              </Text>
                            </BlockStack>
                          </div>
                          <div>
                            <BlockStack gap="100">
                              <Text as="p" variant="headingLg">
                                {variant.clicks.toLocaleString()}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Clicks
                              </Text>
                            </BlockStack>
                          </div>
                          <div>
                            <BlockStack gap="100">
                              <Text as="p" variant="headingLg">
                                {variant.conversions.toLocaleString()}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Conversions
                              </Text>
                            </BlockStack>
                          </div>
                          <div>
                            <BlockStack gap="100">
                              <Text as="p" variant="headingLg" fontWeight="bold">
                                {variant.conversionRate.toFixed(2)}%
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Conversion Rate
                              </Text>
                            </BlockStack>
                          </div>
                          <div>
                            {!isWinner && test.status !== "completed" && hasEnoughData && (
                              <Button
                                size="slim"
                                onClick={() => handleAction("complete", variant.id)}
                              >
                                Select as Winner
                              </Button>
                            )}
                          </div>
                        </InlineGrid>
                      </BlockStack>
                    </Card>
                  )
                })}
              </BlockStack>
            </Card>

            {/* Test Notes */}
            {test.notes && (
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Notes
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {test.notes}
                  </Text>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}

