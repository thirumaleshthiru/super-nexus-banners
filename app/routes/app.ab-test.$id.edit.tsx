import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  InlineStack,
  Button,
  TextField,
  Select,
  Checkbox,
  Banner,
  Divider,
  InlineGrid,
} from "@shopify/polaris"
import { TitleBar } from "@shopify/app-bridge-react"
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { useLoaderData, useSubmit, useNavigate, useNavigation } from "@remix-run/react"
import { useState, useCallback, useEffect } from "react"
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

    // Fetch product
    const product = await prisma.product.findUnique({
      where: { id: test.productId },
      select: {
        id: true,
        title: true,
        handle: true,
        featuredImage: true,
      }
    })

    // Fetch all products for product selector
    const products = await prisma.product.findMany({
      select: {
        id: true,
        handle: true,
        title: true,
        featuredImage: true,
        price: true,
      },
      orderBy: { title: 'asc' }
    })

    return json({ test, product, products })
  } catch (error) {
    console.error("Error loading test:", error)
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
    if (action === "update") {
      const testData = JSON.parse(formData.get("testData") as string)
      const variantsData = JSON.parse(formData.get("variantsData") as string)

      // Update test
      await (prisma as any).productBannerTest.update({
        where: { id: testId },
        data: {
          name: testData.name,
          goalMetric: testData.goalMetric,
          minSampleSize: parseInt(testData.minSampleSize),
          confidenceLevel: parseFloat(testData.confidenceLevel),
          trafficAllocation: parseFloat(testData.trafficAllocation),
          autoSelectWinner: testData.autoSelectWinner,
          notes: testData.notes,
        }
      })

      // Update variants
      for (const variantData of variantsData) {
        if (variantData.id) {
          // Update existing variant
          await (prisma as any).productBannerVariant.update({
            where: { id: variantData.id },
            data: {
              name: variantData.name,
              trafficWeight: variantData.trafficWeight,
              bannerHeight: variantData.bannerHeight,
              bannerImageHeight: variantData.bannerImageHeight,
              bannerBackgroundColor: variantData.bannerBackgroundColor,
              bannerTextColor: variantData.bannerTextColor,
              bannerPriceColor: variantData.bannerPriceColor,
              bannerBorderRadius: variantData.bannerBorderRadius,
              bannerPadding: variantData.bannerPadding,
              buttonText: variantData.buttonText,
              buttonBackgroundColor: variantData.buttonBackgroundColor,
              buttonTextColor: variantData.buttonTextColor,
              buttonBorderRadius: variantData.buttonBorderRadius,
              buttonFontSize: variantData.buttonFontSize,
              buttonHeight: variantData.buttonHeight,
              buyNowButtonText: variantData.buyNowButtonText,
              buyNowButtonBackgroundColor: variantData.buyNowButtonBackgroundColor,
              buyNowButtonTextColor: variantData.buyNowButtonTextColor,
              buyNowButtonBorderRadius: variantData.buyNowButtonBorderRadius,
              buyNowButtonFontSize: variantData.buyNowButtonFontSize,
              buyNowButtonHeight: variantData.buyNowButtonHeight,
              hurryUpText: variantData.hurryUpText,
              hurryUpBackgroundColor: variantData.hurryUpBackgroundColor,
              hurryUpTextColor: variantData.hurryUpTextColor,
              hurryUpFontSize: variantData.hurryUpFontSize,
              hurryUpHeight: variantData.hurryUpHeight,
              pricePosition: variantData.pricePosition,
              priceFontSize: variantData.priceFontSize,
              isShowPrice: variantData.isShowPrice,
              isShowAddToCartButton: variantData.isShowAddToCartButton,
              isShowBuyNowButton: variantData.isShowBuyNowButton,
              isShowHurryUpBanner: variantData.isShowHurryUpBanner,
            }
          })
        }
      }

      return redirect(`/app/ab-test/${testId}/results`)
    }

    return json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating test:", error)
    return json({ success: false, error: String(error) }, { status: 500 })
  }
}

// Component
export default function EditABTest() {
  const { test, product, products } = useLoaderData<typeof loader>()
  const submit = useSubmit()
  const navigate = useNavigate()
  const navigation = useNavigation()
  const isLoading = navigation.state === "submitting"

  // Test settings
  const [testName, setTestName] = useState(test.name)
  const [goalMetric, setGoalMetric] = useState(test.goalMetric)
  const [minSampleSize, setMinSampleSize] = useState(String(test.minSampleSize))
  const [confidenceLevel, setConfidenceLevel] = useState(String(test.confidenceLevel))
  const [trafficAllocation, setTrafficAllocation] = useState(String(test.trafficAllocation))
  const [autoSelectWinner, setAutoSelectWinner] = useState(test.autoSelectWinner)
  const [notes, setNotes] = useState(test.notes || "")

  // Variants state
  const [variants, setVariants] = useState<any[]>(test.variants)
  const [activeVariantIndex, setActiveVariantIndex] = useState(0)

  const handleVariantChange = useCallback((field: string, value: any) => {
    const newVariants = [...variants]
    newVariants[activeVariantIndex] = {
      ...newVariants[activeVariantIndex],
      [field]: value
    }
    setVariants(newVariants)
  }, [variants, activeVariantIndex])

  const handleSubmit = useCallback(() => {
    if (!testName) {
      alert("Please fill in test name")
      return
    }

    const testData = {
      name: testName,
      goalMetric,
      minSampleSize,
      confidenceLevel,
      trafficAllocation,
      autoSelectWinner,
      notes,
    }

    const formData = new FormData()
    formData.append("action", "update")
    formData.append("testData", JSON.stringify(testData))
    formData.append("variantsData", JSON.stringify(variants))

    submit(formData, { method: "post" })
  }, [testName, goalMetric, minSampleSize, confidenceLevel, trafficAllocation, autoSelectWinner, notes, variants, submit])

  const activeVariant = variants[activeVariantIndex]

  // Disable editing if test is completed
  const isCompleted = test.status === "completed"

  return (
    <Page
      fullWidth
      backAction={{ content: "Test Results", url: `/app/ab-test/${test.id}/results` }}
    >
      <TitleBar title={`Edit: ${test.name}`} />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {isCompleted && (
              <Banner tone="warning">
                <Text as="p" variant="bodyMd">
                  This test is completed. Changes to variants will not affect the completed test results.
                </Text>
              </Banner>
            )}

            {test.status === "running" && (
              <Banner tone="info">
                <Text as="p" variant="bodyMd">
                  This test is currently running. Changes to variant settings will apply immediately to new visitors.
                </Text>
              </Banner>
            )}

            {/* Test Info */}
            <Card>
              <BlockStack gap="300">
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
                    <Text as="p" variant="headingMd">
                      Product: {product?.title}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {product?.handle}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Test Configuration */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Test Configuration
                </Text>

                <TextField
                  label="Test Name"
                  value={testName}
                  onChange={setTestName}
                  placeholder="e.g., Red vs Blue Button Test"
                  autoComplete="off"
                />

                <Select
                  label="Goal Metric"
                  options={[
                    { label: 'Conversion Rate (Add to Cart + Buy Now)', value: 'conversion_rate' },
                    { label: 'Total Clicks', value: 'clicks' },
                    { label: 'Add to Cart Only', value: 'add_to_cart' },
                  ]}
                  value={goalMetric}
                  onChange={setGoalMetric}
                  helpText="The metric used to determine the winning variant"
                />

                <InlineGrid columns={2} gap="400">
                  <TextField
                    label="Minimum Sample Size"
                    type="number"
                    value={minSampleSize}
                    onChange={setMinSampleSize}
                    helpText="Minimum views before declaring a winner"
                    autoComplete="off"
                  />

                  <TextField
                    label="Confidence Level (%)"
                    type="number"
                    value={confidenceLevel}
                    onChange={setConfidenceLevel}
                    helpText="Statistical confidence required (usually 95%)"
                    autoComplete="off"
                  />
                </InlineGrid>

                <TextField
                  label="Traffic Allocation (%)"
                  type="number"
                  value={trafficAllocation}
                  onChange={setTrafficAllocation}
                  helpText="Percentage of visitors to include in test"
                  autoComplete="off"
                />

                <Checkbox
                  label="Automatically select winner when confidence level is reached"
                  checked={autoSelectWinner}
                  onChange={setAutoSelectWinner}
                />

                <TextField
                  label="Notes (Optional)"
                  value={notes}
                  onChange={setNotes}
                  multiline={3}
                  placeholder="Add any notes about this test..."
                  autoComplete="off"
                />
              </BlockStack>
            </Card>

            {/* Variants Management */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">
                    Variants ({variants.length})
                  </Text>
                </InlineStack>

                <Banner>
                  <Text as="p" variant="bodySm">
                    Traffic split: {(100 / variants.length).toFixed(1)}% each variant
                  </Text>
                </Banner>

                {/* Variant Tabs */}
                <InlineStack gap="200">
                  {variants.map((variant: any, index: number) => (
                    <Button
                      key={variant.id}
                      pressed={activeVariantIndex === index}
                      onClick={() => setActiveVariantIndex(index)}
                    >
                      {variant.name}
                      {variant.isControl && " ⭐"}
                    </Button>
                  ))}
                </InlineStack>

                <Divider />

                {/* Active Variant Settings */}
                <BlockStack gap="400">
                  <TextField
                    label="Variant Name"
                    value={activeVariant.name}
                    onChange={(value) => handleVariantChange('name', value)}
                    autoComplete="off"
                  />

                  <Text as="h3" variant="headingMd">
                    Banner Settings
                  </Text>

                  <InlineGrid columns={3} gap="400">
                    <TextField
                      label="Banner Height (px)"
                      value={activeVariant.bannerHeight}
                      onChange={(value) => handleVariantChange('bannerHeight', value)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Image Height (px)"
                      value={activeVariant.bannerImageHeight}
                      onChange={(value) => handleVariantChange('bannerImageHeight', value)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Border Radius (px)"
                      value={activeVariant.bannerBorderRadius}
                      onChange={(value) => handleVariantChange('bannerBorderRadius', value)}
                      autoComplete="off"
                    />
                  </InlineGrid>

                  <InlineGrid columns={3} gap="400">
                    <TextField
                      label="Background Color"
                      value={activeVariant.bannerBackgroundColor}
                      onChange={(value) => handleVariantChange('bannerBackgroundColor', value)}
                      prefix="#"
                      autoComplete="off"
                    />
                    <TextField
                      label="Text Color"
                      value={activeVariant.bannerTextColor}
                      onChange={(value) => handleVariantChange('bannerTextColor', value)}
                      prefix="#"
                      autoComplete="off"
                    />
                    <TextField
                      label="Price Color"
                      value={activeVariant.bannerPriceColor}
                      onChange={(value) => handleVariantChange('bannerPriceColor', value)}
                      prefix="#"
                      autoComplete="off"
                    />
                  </InlineGrid>

                  <Text as="h3" variant="headingMd">
                    Add to Cart Button
                  </Text>

                  <InlineGrid columns={2} gap="400">
                    <TextField
                      label="Button Text"
                      value={activeVariant.buttonText}
                      onChange={(value) => handleVariantChange('buttonText', value)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Button Height (px)"
                      value={activeVariant.buttonHeight}
                      onChange={(value) => handleVariantChange('buttonHeight', value)}
                      autoComplete="off"
                    />
                  </InlineGrid>

                  <InlineGrid columns={3} gap="400">
                    <TextField
                      label="Button Background"
                      value={activeVariant.buttonBackgroundColor}
                      onChange={(value) => handleVariantChange('buttonBackgroundColor', value)}
                      prefix="#"
                      autoComplete="off"
                    />
                    <TextField
                      label="Button Text Color"
                      value={activeVariant.buttonTextColor}
                      onChange={(value) => handleVariantChange('buttonTextColor', value)}
                      prefix="#"
                      autoComplete="off"
                    />
                    <TextField
                      label="Button Border Radius"
                      value={activeVariant.buttonBorderRadius}
                      onChange={(value) => handleVariantChange('buttonBorderRadius', value)}
                      autoComplete="off"
                    />
                  </InlineGrid>

                  <Text as="h3" variant="headingMd">
                    Buy Now Button
                  </Text>

                  <InlineGrid columns={2} gap="400">
                    <TextField
                      label="Button Text"
                      value={activeVariant.buyNowButtonText}
                      onChange={(value) => handleVariantChange('buyNowButtonText', value)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Button Height (px)"
                      value={activeVariant.buyNowButtonHeight}
                      onChange={(value) => handleVariantChange('buyNowButtonHeight', value)}
                      autoComplete="off"
                    />
                  </InlineGrid>

                  <InlineGrid columns={3} gap="400">
                    <TextField
                      label="Button Background"
                      value={activeVariant.buyNowButtonBackgroundColor}
                      onChange={(value) => handleVariantChange('buyNowButtonBackgroundColor', value)}
                      prefix="#"
                      autoComplete="off"
                    />
                    <TextField
                      label="Button Text Color"
                      value={activeVariant.buyNowButtonTextColor}
                      onChange={(value) => handleVariantChange('buyNowButtonTextColor', value)}
                      prefix="#"
                      autoComplete="off"
                    />
                    <TextField
                      label="Button Border Radius"
                      value={activeVariant.buyNowButtonBorderRadius}
                      onChange={(value) => handleVariantChange('buyNowButtonBorderRadius', value)}
                      autoComplete="off"
                    />
                  </InlineGrid>

                  <Text as="h3" variant="headingMd">
                    Hurry Up Banner
                  </Text>

                  <TextField
                    label="Hurry Up Text"
                    value={activeVariant.hurryUpText}
                    onChange={(value) => handleVariantChange('hurryUpText', value)}
                    autoComplete="off"
                  />

                  <InlineGrid columns={3} gap="400">
                    <TextField
                      label="Background Color"
                      value={activeVariant.hurryUpBackgroundColor}
                      onChange={(value) => handleVariantChange('hurryUpBackgroundColor', value)}
                      prefix="#"
                      autoComplete="off"
                    />
                    <TextField
                      label="Text Color"
                      value={activeVariant.hurryUpTextColor}
                      onChange={(value) => handleVariantChange('hurryUpTextColor', value)}
                      prefix="#"
                      autoComplete="off"
                    />
                    <TextField
                      label="Height (px)"
                      value={activeVariant.hurryUpHeight}
                      onChange={(value) => handleVariantChange('hurryUpHeight', value)}
                      autoComplete="off"
                    />
                  </InlineGrid>

                  <Text as="h3" variant="headingMd">
                    Visibility Options
                  </Text>

                  <BlockStack gap="300">
                    <Checkbox
                      label="Show Price"
                      checked={activeVariant.isShowPrice}
                      onChange={(value) => handleVariantChange('isShowPrice', value)}
                    />
                    <Checkbox
                      label="Show Add to Cart Button"
                      checked={activeVariant.isShowAddToCartButton}
                      onChange={(value) => handleVariantChange('isShowAddToCartButton', value)}
                    />
                    <Checkbox
                      label="Show Buy Now Button"
                      checked={activeVariant.isShowBuyNowButton}
                      onChange={(value) => handleVariantChange('isShowBuyNowButton', value)}
                    />
                    <Checkbox
                      label="Show Hurry Up Banner"
                      checked={activeVariant.isShowHurryUpBanner}
                      onChange={(value) => handleVariantChange('isShowHurryUpBanner', value)}
                    />
                  </BlockStack>
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Action Buttons */}
            <Card>
              <InlineStack align="end" gap="300">
                <Button onClick={() => navigate(`/app/ab-test/${test.id}/results`)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={isLoading}
                >
                  Save Changes
                </Button>
              </InlineStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}

