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
import { useState, useCallback, useMemo } from "react"
import prisma from "app/db.server"
import { authenticate } from "../shopify.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await authenticate.admin(request)
  if (auth instanceof Response) return auth

  try {
    const products = await prisma.product.findMany({
      select: { id: true, handle: true, title: true },
      orderBy: { title: 'asc' }
    })

    return json({ products })
  } catch (error) {
    console.error("Error loading products:", error)
    return json({ products: [] })
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const auth = await authenticate.admin(request)
  if (auth instanceof Response) return auth

  const formData = await request.formData()
  const action = formData.get("action")

  if (action !== "create") {
    return json({ success: false, error: "Invalid action" }, { status: 400 })
  }

  try {
    const testData = JSON.parse(formData.get("testData") as string)
    const variantsData = JSON.parse(formData.get("variantsData") as string)

    const isRunning = testData.status === "running"
    const test = await (prisma as any).productBannerTest.create({
      data: {
        name: testData.name,
        productId: testData.productId,
        productHandle: testData.productHandle,
        status: testData.status || "draft",
        startDate: isRunning ? new Date() : null,
        goalMetric: testData.goalMetric,
        minSampleSize: parseInt(testData.minSampleSize),
        confidenceLevel: parseFloat(testData.confidenceLevel),
        trafficAllocation: parseFloat(testData.trafficAllocation),
        autoSelectWinner: testData.autoSelectWinner,
        notes: testData.notes,
        variants: { create: variantsData }
      }
    })

    return redirect(`/app/ab-test/${test.id}/results`)
  } catch (error) {
    console.error("Error creating test:", error)
    return json({ success: false, error: String(error) }, { status: 500 })
  }
}

const VARIANT_PRESETS = {
  control: {
    bannerHeight: "80", bannerImageHeight: "80", bannerBackgroundColor: "FF6B6B",
    bannerTextColor: "ffffff", bannerPriceColor: "ffffff", bannerBorderRadius: "12",
    bannerPadding: "10", buttonText: "Add to Cart", buttonBackgroundColor: "ffffff",
    buttonTextColor: "FF6B6B", buttonBorderColor: "FF6B6B", buttonBorderRadius: "6",
    buttonFontSize: "16", buttonHeight: "45", buyNowButtonText: "Buy Now",
    buyNowButtonBackgroundColor: "FF6B6B", buyNowButtonTextColor: "ffffff",
    buyNowButtonBorderColor: "FF6B6B", buyNowButtonBorderRadius: "6",
    buyNowButtonFontSize: "16", buyNowButtonHeight: "45", hurryUpText: "⚡ Hurry! Limited Stock",
    hurryUpBackgroundColor: "ffffff", hurryUpTextColor: "FF6B6B", hurryUpFontSize: "14",
    hurryUpHeight: "35", pricePosition: "top-right", priceFontSize: "18",
    isShowPrice: true, isShowAddToCartButton: true, isShowBuyNowButton: true,
    isShowHurryUpBanner: true, trafficWeight: 50
  },
  variantB: {
    bannerHeight: "90", bannerImageHeight: "90", bannerBackgroundColor: "4F46E5",
    bannerTextColor: "ffffff", bannerPriceColor: "FCD34D", bannerBorderRadius: "8",
    bannerPadding: "12", buttonText: "🛒 Add to Cart", buttonBackgroundColor: "10B981",
    buttonTextColor: "ffffff", buttonBorderColor: "10B981", buttonBorderRadius: "8",
    buttonFontSize: "17", buttonHeight: "50", buyNowButtonText: "⚡ Buy Now",
    buyNowButtonBackgroundColor: "F59E0B", buyNowButtonTextColor: "000000",
    buyNowButtonBorderColor: "F59E0B", buyNowButtonBorderRadius: "8",
    buyNowButtonFontSize: "17", buyNowButtonHeight: "50", hurryUpText: "🔥 Only Few Left!",
    hurryUpBackgroundColor: "FCD34D", hurryUpTextColor: "1F2937", hurryUpFontSize: "15",
    hurryUpHeight: "38", pricePosition: "top-right", priceFontSize: "20",
    isShowPrice: true, isShowAddToCartButton: true, isShowBuyNowButton: true,
    isShowHurryUpBanner: true, trafficWeight: 50
  },
  variantC: {
    bannerHeight: "100", bannerImageHeight: "100", bannerBackgroundColor: "059669",
    bannerTextColor: "ffffff", bannerPriceColor: "FDE047", bannerBorderRadius: "16",
    bannerPadding: "15", buttonText: "Add Now", buttonBackgroundColor: "F59E0B",
    buttonTextColor: "000000", buttonBorderColor: "F59E0B", buttonBorderRadius: "12",
    buttonFontSize: "18", buttonHeight: "55", buyNowButtonText: "💳 Instant Checkout",
    buyNowButtonBackgroundColor: "DC2626", buyNowButtonTextColor: "ffffff",
    buyNowButtonBorderColor: "DC2626", buyNowButtonBorderRadius: "12",
    buyNowButtonFontSize: "18", buyNowButtonHeight: "55", hurryUpText: "⏰ Selling Fast - Order Now!",
    hurryUpBackgroundColor: "DC2626", hurryUpTextColor: "ffffff", hurryUpFontSize: "16",
    hurryUpHeight: "40", pricePosition: "top-right", priceFontSize: "22",
    isShowPrice: true, isShowAddToCartButton: true, isShowBuyNowButton: true,
    isShowHurryUpBanner: true, trafficWeight: 50
  }
}

const INITIAL_VARIANTS = [
  { ...VARIANT_PRESETS.control, name: "Control (A)", isControl: true, trafficWeight: 50 },
  { ...VARIANT_PRESETS.variantB, name: "Variant B", isControl: false, trafficWeight: 50 }
]

export default function CreateABTest() {
  const { products } = useLoaderData<typeof loader>()
  const submit = useSubmit()
  const navigate = useNavigate()
  const navigation = useNavigation()
  const isLoading = navigation.state === "submitting"

  const [testName, setTestName] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [goalMetric, setGoalMetric] = useState("conversion_rate")
  const [minSampleSize, setMinSampleSize] = useState("100")
  const [confidenceLevel, setConfidenceLevel] = useState("95")
  const [trafficAllocation, setTrafficAllocation] = useState("100")
  const [autoSelectWinner, setAutoSelectWinner] = useState(true)
  const [notes, setNotes] = useState("")
  const [shouldStartImmediately, setShouldStartImmediately] = useState(false)
  const [variants, setVariants] = useState<any[]>(INITIAL_VARIANTS)
  const [activeVariantIndex, setActiveVariantIndex] = useState(0)

  const productOptions = useMemo(() => [
    { label: 'Select a product', value: '' },
    ...products.map((p: any) => ({ label: `${p.title} (${p.handle})`, value: p.id }))
  ], [products])

  const handleAddVariant = useCallback(() => {
    if (variants.length >= 5) return

    const newWeight = 100 / (variants.length + 1)
    const newLetter = String.fromCharCode(65 + variants.length)
    const baseSettings = variants.length === 2 ? VARIANT_PRESETS.variantC : VARIANT_PRESETS.control

    setVariants(prev => [
      ...prev.map(v => ({ ...v, trafficWeight: newWeight })),
      { ...baseSettings, name: `Variant ${newLetter}`, isControl: false, trafficWeight: newWeight }
    ])
  }, [variants.length])

  const handleRemoveVariant = useCallback((index: number) => {
    if (variants.length <= 2) return

    setVariants(prev => {
      const filtered = prev.filter((_, i) => i !== index)
      const newWeight = 100 / filtered.length
      return filtered.map(v => ({ ...v, trafficWeight: newWeight }))
    })
    setActiveVariantIndex(0)
  }, [variants.length])

  const handleVariantChange = useCallback((field: string, value: any) => {
    setVariants(prev => prev.map((v, i) => 
      i === activeVariantIndex ? { ...v, [field]: value } : v
    ))
  }, [activeVariantIndex])

  const handleSubmit = useCallback(() => {
    if (!testName || !selectedProduct) {
      alert("Please fill in test name and select a product")
      return
    }

    const product = products.find((p: any) => p.id === selectedProduct)
    if (!product) return

    const testData = {
      name: testName,
      productId: selectedProduct,
      productHandle: product.handle,
      goalMetric,
      minSampleSize,
      confidenceLevel,
      trafficAllocation,
      autoSelectWinner,
      notes,
      status: shouldStartImmediately ? "running" : "draft"
    }

    const formData = new FormData()
    formData.append("action", "create")
    formData.append("testData", JSON.stringify(testData))
    formData.append("variantsData", JSON.stringify(variants))

    submit(formData, { method: "post" })
  }, [testName, selectedProduct, products, goalMetric, minSampleSize, confidenceLevel, trafficAllocation, autoSelectWinner, notes, shouldStartImmediately, variants, submit])

  const activeVariant = variants[activeVariantIndex]

  return (
    <Page fullWidth backAction={{ content: "A/B Tests", url: "/app/ab-tests" }}>
      <TitleBar title="Create A/B Test" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">Test Configuration</Text>

                <TextField
                  label="Test Name"
                  value={testName}
                  onChange={setTestName}
                  placeholder="e.g., Red vs Blue Button Test"
                  autoComplete="off"
                />

                <Select
                  label="Product"
                  options={productOptions}
                  value={selectedProduct}
                  onChange={setSelectedProduct}
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

                <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
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

                <Checkbox
                  label="Start test immediately after creation"
                  checked={shouldStartImmediately}
                  onChange={setShouldStartImmediately}
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

            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingLg">Variants ({variants.length})</Text>
                  <Button onClick={handleAddVariant} disabled={variants.length >= 5}>
                    Add Variant
                  </Button>
                </InlineStack>

                <Banner>
                  <Text as="p" variant="bodySm">
                    Traffic will be split equally: {(100 / variants.length).toFixed(1)}% each
                  </Text>
                </Banner>

                <InlineStack gap="200" wrap={false}>
                  {variants.map((variant: any, index: number) => (
                    <Button
                      key={index}
                      pressed={activeVariantIndex === index}
                      onClick={() => setActiveVariantIndex(index)}
                    >
                      {variant.name}{variant.isControl && " ⭐"}
                    </Button>
                  ))}
                </InlineStack>

                <Divider />

                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <TextField
                      label="Variant Name"
                      value={activeVariant.name}
                      onChange={(value) => handleVariantChange('name', value)}
                      autoComplete="off"
                    />
                    {!activeVariant.isControl && variants.length > 2 && (
                      <Button tone="critical" onClick={() => handleRemoveVariant(activeVariantIndex)}>
                        Remove
                      </Button>
                    )}
                  </InlineStack>

                  <Text as="h3" variant="headingMd">Banner Settings</Text>

                  <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
                    <TextField label="Height (px)" value={activeVariant.bannerHeight} onChange={(v) => handleVariantChange('bannerHeight', v)} autoComplete="off" />
                    <TextField label="Image Height (px)" value={activeVariant.bannerImageHeight} onChange={(v) => handleVariantChange('bannerImageHeight', v)} autoComplete="off" />
                    <TextField label="Border Radius (px)" value={activeVariant.bannerBorderRadius} onChange={(v) => handleVariantChange('bannerBorderRadius', v)} autoComplete="off" />
                  </InlineGrid>

                  <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
                    <TextField label="Background Color" value={activeVariant.bannerBackgroundColor} onChange={(v) => handleVariantChange('bannerBackgroundColor', v)} prefix="#" autoComplete="off" />
                    <TextField label="Text Color" value={activeVariant.bannerTextColor} onChange={(v) => handleVariantChange('bannerTextColor', v)} prefix="#" autoComplete="off" />
                    <TextField label="Price Color" value={activeVariant.bannerPriceColor} onChange={(v) => handleVariantChange('bannerPriceColor', v)} prefix="#" autoComplete="off" />
                  </InlineGrid>

                  <Text as="h3" variant="headingMd">Add to Cart Button</Text>

                  <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                    <TextField label="Button Text" value={activeVariant.buttonText} onChange={(v) => handleVariantChange('buttonText', v)} autoComplete="off" />
                    <TextField label="Height (px)" value={activeVariant.buttonHeight} onChange={(v) => handleVariantChange('buttonHeight', v)} autoComplete="off" />
                  </InlineGrid>

                  <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
                    <TextField label="Background" value={activeVariant.buttonBackgroundColor} onChange={(v) => handleVariantChange('buttonBackgroundColor', v)} prefix="#" autoComplete="off" />
                    <TextField label="Text Color" value={activeVariant.buttonTextColor} onChange={(v) => handleVariantChange('buttonTextColor', v)} prefix="#" autoComplete="off" />
                    <TextField label="Border Color" value={activeVariant.buttonBorderColor || activeVariant.buttonBackgroundColor} onChange={(v) => handleVariantChange('buttonBorderColor', v)} prefix="#" autoComplete="off" />
                    <TextField label="Border Radius" value={activeVariant.buttonBorderRadius} onChange={(v) => handleVariantChange('buttonBorderRadius', v)} autoComplete="off" />
                  </InlineGrid>

                  <Text as="h3" variant="headingMd">Buy Now Button</Text>

                  <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                    <TextField label="Button Text" value={activeVariant.buyNowButtonText} onChange={(v) => handleVariantChange('buyNowButtonText', v)} autoComplete="off" />
                    <TextField label="Height (px)" value={activeVariant.buyNowButtonHeight} onChange={(v) => handleVariantChange('buyNowButtonHeight', v)} autoComplete="off" />
                  </InlineGrid>

                  <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
                    <TextField label="Background" value={activeVariant.buyNowButtonBackgroundColor} onChange={(v) => handleVariantChange('buyNowButtonBackgroundColor', v)} prefix="#" autoComplete="off" />
                    <TextField label="Text Color" value={activeVariant.buyNowButtonTextColor} onChange={(v) => handleVariantChange('buyNowButtonTextColor', v)} prefix="#" autoComplete="off" />
                    <TextField label="Border Color" value={activeVariant.buyNowButtonBorderColor || activeVariant.buyNowButtonBackgroundColor} onChange={(v) => handleVariantChange('buyNowButtonBorderColor', v)} prefix="#" autoComplete="off" />
                    <TextField label="Border Radius" value={activeVariant.buyNowButtonBorderRadius} onChange={(v) => handleVariantChange('buyNowButtonBorderRadius', v)} autoComplete="off" />
                  </InlineGrid>

                  <Text as="h3" variant="headingMd">Hurry Up Banner</Text>

                  <TextField label="Text" value={activeVariant.hurryUpText} onChange={(v) => handleVariantChange('hurryUpText', v)} autoComplete="off" />

                  <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
                    <TextField label="Background" value={activeVariant.hurryUpBackgroundColor} onChange={(v) => handleVariantChange('hurryUpBackgroundColor', v)} prefix="#" autoComplete="off" />
                    <TextField label="Text Color" value={activeVariant.hurryUpTextColor} onChange={(v) => handleVariantChange('hurryUpTextColor', v)} prefix="#" autoComplete="off" />
                    <TextField label="Height (px)" value={activeVariant.hurryUpHeight} onChange={(v) => handleVariantChange('hurryUpHeight', v)} autoComplete="off" />
                  </InlineGrid>

                  <Text as="h3" variant="headingMd">Visibility Options</Text>

                  <BlockStack gap="300">
                    <Checkbox label="Show Price" checked={activeVariant.isShowPrice} onChange={(v) => handleVariantChange('isShowPrice', v)} />
                    <Checkbox label="Show Add to Cart Button" checked={activeVariant.isShowAddToCartButton} onChange={(v) => handleVariantChange('isShowAddToCartButton', v)} />
                    <Checkbox label="Show Buy Now Button" checked={activeVariant.isShowBuyNowButton} onChange={(v) => handleVariantChange('isShowBuyNowButton', v)} />
                    <Checkbox label="Show Hurry Up Banner" checked={activeVariant.isShowHurryUpBanner} onChange={(v) => handleVariantChange('isShowHurryUpBanner', v)} />
                  </BlockStack>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <InlineStack align="end" gap="300">
                <Button onClick={() => navigate("/app/ab-tests")}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
                  {shouldStartImmediately ? "Create & Start Test" : "Create Test"}
                </Button>
              </InlineStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}