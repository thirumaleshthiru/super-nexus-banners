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
  Link as PolarisLink,
} from "@shopify/polaris"
import { TitleBar } from "@shopify/app-bridge-react"
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { useLoaderData, useNavigate } from "@remix-run/react"
import prisma from "app/db.server"
import { authenticate } from "../shopify.server"

// Loader
export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await authenticate.admin(request)
  if (auth instanceof Response) {
    return auth
  }

  try {
    // Fetch all A/B tests with variants
    const tests = await (prisma as any).productBannerTest.findMany({
      include: {
        variants: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    // Fetch products for display
    const products = await prisma.product.findMany({
      select: {
        id: true,
        handle: true,
        title: true,
        featuredImage: true,
      }
    })

    // Create a map for quick product lookup
    const productMap = products.reduce((acc: any, p: any) => {
      acc[p.id] = p
      return acc
    }, {})

    return json({ tests, productMap })
  } catch (error) {
    console.error("Error fetching A/B tests:", error)
    return json({ tests: [], productMap: {} })
  }
}

// Action to handle status changes
export async function action({ request }: ActionFunctionArgs) {
  const auth = await authenticate.admin(request)
  if (auth instanceof Response) {
    return auth
  }

  const formData = await request.formData()
  const action = formData.get("action")
  const testId = formData.get("testId") as string

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
      await (prisma as any).productBannerTest.update({
        where: { id: testId },
        data: { 
          status: "completed",
          endDate: new Date()
        }
      })
    } else if (action === "delete") {
      await (prisma as any).productBannerTest.delete({
        where: { id: testId }
      })
    }

    return json({ success: true })
  } catch (error) {
    console.error("Error updating test:", error)
    return json({ success: false, error: String(error) }, { status: 500 })
  }
}

// Helper to get status badge
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

// Helper to format date
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
export default function ABTests() {
  const { tests, productMap } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  const rows = tests.map((test: any) => {
    const product = productMap[test.productId]
    const winnerVariant = test.variants.find((v: any) => v.id === test.winnerVariantId)
    
    return [
      <InlineStack gap="300" blockAlign="center">
        {product?.featuredImage && (
          <div style={{ 
            width: "40px", 
            height: "40px", 
            borderRadius: "6px", 
            overflow: "hidden",
            flexShrink: 0,
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
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            {test.name}
          </Text>
          <Text as="span" variant="bodySm" tone="subdued">
            {product?.title || test.productHandle}
          </Text>
        </BlockStack>
      </InlineStack>,
      getStatusBadge(test.status),
      <Text as="span" variant="bodySm">
        {test.variants.length} variants
      </Text>,
      <Text as="span" variant="bodySm">
        {test.goalMetric === 'conversion_rate' ? 'Conversion Rate' : 
         test.goalMetric === 'clicks' ? 'Clicks' :
         test.goalMetric === 'add_to_cart' ? 'Add to Cart' : test.goalMetric}
      </Text>,
      <Text as="span" variant="bodySm">
        {winnerVariant ? winnerVariant.name : '-'}
      </Text>,
      <Text as="span" variant="bodySm">
        {formatDate(test.startDate)}
      </Text>,
      <InlineStack gap="200">
        <Button
          size="slim"
          onClick={() => navigate(`/app/ab-test/${test.id}/results`)}
        >
          View Results
        </Button>
        <Button
          size="slim"
          onClick={() => navigate(`/app/ab-test/${test.id}/edit`)}
        >
          Edit
        </Button>
        <Button
          size="slim"
          tone="critical"
          onClick={() => {
            if (confirm(`Are you sure you want to delete "${test.name}"? This action cannot be undone.`)) {
              const formData = new FormData()
              formData.append("action", "delete")
              formData.append("testId", test.id)
              fetch(`/app/ab-tests`, {
                method: "POST",
                body: formData
              }).then(() => window.location.reload())
            }
          }}
        >
          Delete
        </Button>
      </InlineStack>
    ]
  })

  return (
    <Page fullWidth>
      <TitleBar title="A/B Testing" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <InlineStack align="space-between">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingLg">
                    Product Banner A/B Tests
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Test different banner designs to find what converts best
                  </Text>
                </BlockStack>
                <Button
                  variant="primary"
                  onClick={() => navigate("/app/ab-test/create")}
                >
                  Create A/B Test
                </Button>
              </InlineStack>
            </Card>

            {tests.length === 0 ? (
              <Card>
                <EmptyState
                  heading="No A/B tests yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text as="p" variant="bodyMd">
                    Create your first A/B test to start optimizing your product banners
                  </Text>
                  <div style={{ marginTop: "16px" }}>
                    <Button
                      variant="primary"
                      onClick={() => navigate("/app/ab-test/create")}
                    >
                      Create A/B Test
                    </Button>
                  </div>
                </EmptyState>
              </Card>
            ) : (
              <Card padding="0">
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Test Name', 'Status', 'Variants', 'Goal', 'Winner', 'Started', 'Actions']}
                  rows={rows}
                  hoverable
                />
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}

