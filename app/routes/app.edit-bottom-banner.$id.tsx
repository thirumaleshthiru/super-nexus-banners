import { useState, useEffect, useRef } from "react"
import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/node"
import { useLoaderData, useNavigation, Form, Link } from "@remix-run/react"
import { authenticate } from "../shopify.server"
import { Card, Text, BlockStack, InlineStack, Button, TextField, Select, Checkbox, Divider, Page, Layout } from "@shopify/polaris"
import { TitleBar } from "@shopify/app-bridge-react"
import prisma from "../db.server"

interface Product {
  id: string
  title: string
  price: string
  sku: string | null
  variants: Array<{
    id: string
    title: string
    price: string
    sku: string | null
  }>
}

interface BottomBannerSlide {
  message: string
  isTimer: boolean
  startTime: string
  endTime: string
  hasProduct: boolean
  productId: string
  productTitle: string
  productVariantId: string
  showImage: boolean
  priceOverride: string
  couponCode: string
  showAddToCartButton: boolean
  showViewProductButton: boolean
  addToCartButtonText: string
  viewProductButtonText: string
}

interface LoaderData {
  products: Array<Product>
  bottomBanner: any
}

// Helper function to parse variants JSON string
function parseVariants(variantsString: string | null) {
  if (!variantsString) return [];
  try {
    return JSON.parse(variantsString);
  } catch {
    return [];
  }
}

// ---- Loader ----
export async function loader({ request, params }: LoaderFunctionArgs) {
  const auth = await authenticate.admin(request);
  if (auth instanceof Response) {
    return auth;
  }

  const bannerId = params.id;
  if (!bannerId) {
    throw new Response("Banner ID is required", { status: 400 });
  }

  // Fetch the existing bottom banner with slides
  const bottomBanner = await (prisma as any).bottomBanner.findUnique({
    where: { id: bannerId },
    include: {
      slides: {
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!bottomBanner) {
    throw new Response("Bottom banner not found", { status: 404 });
  }

  // Fetch products
  const products = await (prisma as any).product.findMany({
    orderBy: { title: 'asc' }
  });

  return json({ products, bottomBanner });
}

// ---- Action ----
export async function action({ request, params }: ActionFunctionArgs) {
  const auth = await authenticate.admin(request);
  if (auth instanceof Response) {
    return auth;
  }
  
  const formData = await request.formData()
  const intent = formData.get("_intent")
  const bannerId = params.id;

  if (intent === "update") {
    // Parse slides from form data
    const slidesJson = String(formData.get("slides") || "[]")
    const slides = JSON.parse(slidesJson) as BottomBannerSlide[]
    
    // Validate slides with products have variants selected
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      if (slide.hasProduct && slide.productId && !slide.productVariantId) {
        // Slide has product but no variant selected - this will be handled by frontend validation
      }
    }

    // Banner Layout & Positioning
    const bannerWidth = String(formData.get("bannerWidth") || "full")
    const customWidth = String(formData.get("customWidth") || "")
    const bannerHeight = String(formData.get("bannerHeight") || "auto")
    const customHeight = String(formData.get("customHeight") || "")
    const bannerPadding = String(formData.get("bannerPadding") || "16")
    const bannerLeftMargin = String(formData.get("bannerLeftMargin") || "0")
    const bannerRightMargin = String(formData.get("bannerRightMargin") || "0")
    const bannerTopMargin = String(formData.get("bannerTopMargin") || "0")
    const bannerBottomMargin = String(formData.get("bannerBottomMargin") || "0")
    const bannerBorderRadius = String(formData.get("bannerBorderRadius") || "12")
    const priority = Number.parseInt(String(formData.get("priority") || "0"))

    // Message Carousel System (legacy, keep for backward compatibility)
    const areMessagesCarousel = slides.length > 1
    const messages = JSON.stringify(slides.map(s => s.message))
    const messageFontSize = String(formData.get("messageFontSize") || "16")
    const messagePosition = String(formData.get("messagePosition") || "left")
    const messageColor = "#" + String(formData.get("messageColor") || "2d3748")
    const messagePadding = String(formData.get("messagePadding") || "12")

    // Timer System (legacy from first slide)
    const isTimer = slides.length > 0 && slides[0].isTimer
    const startTime = isTimer && slides[0].startTime ? new Date(slides[0].startTime) : null
    const endTime = isTimer && slides[0].endTime ? new Date(slides[0].endTime) : null
    const timerBackgroundColor = "#" + String(formData.get("timerBackgroundColor") || "f7fafc")
    const timerBorderColor = "#" + String(formData.get("timerBorderColor") || "e2e8f0")
    const timerPadding = String(formData.get("timerPadding") || "8")
    const timerTextColor = "#" + String(formData.get("timerTextColor") || "2d3748")
    const timerFontSize = String(formData.get("timerFontSize") || "14")

    // Product Integration (legacy from first slide)
    const hasProduct = slides.length > 0 && slides[0].hasProduct
    const productId = slides.length > 0 && slides[0].productId ? slides[0].productId : null
    const manualProductTitle = slides.length > 0 ? slides[0].productTitle : ""
    const productImage = String(formData.get("productImage") || "")
    const showImage = slides.length > 0 ? slides[0].showImage : false
    const priceOverride = slides.length > 0 ? slides[0].priceOverride : ""
    const couponCode = slides.length > 0 ? slides[0].couponCode : ""
    const productFontSize = String(formData.get("productFontSize") || "14")
    const actionType = slides.length > 0 ? "view_product" : "view_product"
    const actionButtonText = slides.length > 0 ? slides[0].viewProductButtonText : "View Product"
    const actionButtonTextColor = "#" + String(formData.get("actionButtonTextColor") || "ffffff")
    const actionButtonBackgroundColor = "#" + String(formData.get("actionButtonBackgroundColor") || "1a1a1a")
    const actionButtonBorderRadius = String(formData.get("actionButtonBorderRadius") || "8")
    const actionButtonPadding = String(formData.get("actionButtonPadding") || "12")

    // Button settings
    const showAddToCartButton = slides.length > 0 ? slides[0].showAddToCartButton : false
    const showViewProductButton = slides.length > 0 ? slides[0].showViewProductButton : false
    const addToCartButtonText = slides.length > 0 ? slides[0].addToCartButtonText : "Add to Cart"
    const viewProductButtonText = slides.length > 0 ? slides[0].viewProductButtonText : "View Product"
    const addToCartButtonTextColor = "#" + String(formData.get("addToCartButtonTextColor") || "ffffff")
    const addToCartButtonBackgroundColor = "#" + String(formData.get("addToCartButtonBackgroundColor") || "2563eb")
    const viewProductButtonTextColor = "#" + String(formData.get("viewProductButtonTextColor") || "ffffff")
    const viewProductButtonBackgroundColor = "#" + String(formData.get("viewProductButtonBackgroundColor") || "374151")

    // Background
    const bgColor = "#" + String(formData.get("bgColor") || "ffffff")

    const isActive = formData.get("isActive") === "true"

    // Update bottom banner
    const updatedBanner = await (prisma as any).bottomBanner.update({
      where: { id: bannerId },
      data: {
        isActive,
        bannerWidth,
        customWidth: bannerWidth === "custom" ? customWidth : null,
        bannerHeight,
        customHeight: bannerHeight === "custom" ? customHeight : null,
        bannerPadding: String(bannerPadding),
        bannerLeftMargin: String(bannerLeftMargin),
        bannerRightMargin: String(bannerRightMargin),
        bannerTopMargin: String(bannerTopMargin),
        bannerBottomMargin: String(bannerBottomMargin),
        bannerBorderRadius: String(bannerBorderRadius),
        priority,
        areMessagesCarousel,
        messages,
        messageFontSize: String(messageFontSize),
        messagePosition,
        messageColor,
        messagePadding: String(messagePadding),
        isTimer,
        startTime,
        endTime,
        timerBackgroundColor,
        timerBorderColor,
        timerPadding: String(timerPadding),
        timerTextColor,
        timerFontSize: String(timerFontSize),
        hasProduct,
        productTitle: manualProductTitle,
        productImage,
        showImage,
        priceOverride,
        couponCode,
        productFontSize: String(productFontSize),
        actionType,
        actionButtonText,
        actionButtonTextColor,
        actionButtonBackgroundColor,
        actionButtonBorderRadius: String(actionButtonBorderRadius),
        actionButtonPadding: String(actionButtonPadding),
        showAddToCartButton,
        showViewProductButton,
        addToCartButtonText,
        viewProductButtonText,
        addToCartButtonTextColor,
        addToCartButtonBackgroundColor,
        viewProductButtonTextColor,
        viewProductButtonBackgroundColor,
        bgColor,
        hasSlides: true,
      }
    });

    // Delete existing slides
    await (prisma as any).bottomBannerSlide.deleteMany({
      where: { bottomBannerId: bannerId }
    });

    // Create new slides
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      
      let internalProductId = null;
      let numericVariantId = null;
      
      if (slide.hasProduct && slide.productId) {
        internalProductId = slide.productId;
        
        if (slide.productVariantId) {
          numericVariantId = slide.productVariantId;
        }
      }
      
      // Get product's featured image from database
      let productImageUrl = null;
      if (slide.hasProduct && slide.showImage && internalProductId) {
        const product = await (prisma as any).product.findUnique({
          where: { id: internalProductId },
          select: { featuredImage: true }
        });
        productImageUrl = product?.featuredImage || null;
      }
      
      const slideData = {
        bottomBannerId: updatedBanner.id,
        order: i,
        message: slide.message,
        isTimer: slide.isTimer,
        startTime: slide.isTimer && slide.startTime ? new Date(slide.startTime) : null,
        endTime: slide.isTimer && slide.endTime ? new Date(slide.endTime) : null,
        hasProduct: slide.hasProduct,
        productId: internalProductId,
        productTitle: slide.hasProduct ? slide.productTitle : null,
        productImage: productImageUrl,
        showImage: slide.showImage,
        priceOverride: slide.hasProduct ? slide.priceOverride : null,
        couponCode: slide.hasProduct ? slide.couponCode : null,
        productVariantId: numericVariantId,
        actionType: slide.hasProduct ? "view_product" : "view_product",
        actionButtonText: slide.hasProduct ? slide.viewProductButtonText : null,
        showAddToCartButton: slide.showAddToCartButton,
        showViewProductButton: slide.showViewProductButton,
        addToCartButtonText: slide.addToCartButtonText,
        viewProductButtonText: slide.viewProductButtonText,
      }
      
      await (prisma as any).bottomBannerSlide.create({
        data: slideData,
      })
    }

    return redirect("/app/manage-bottom-banners")
  }

  return json({ success: true })
}

// ---- UI ----
export default function EditBottomBannerPage() {
  const { products, bottomBanner } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"
  const isRedirecting = navigation.state === "loading" && navigation.formData == null

  // Professional Design System Defaults
  const defaultSettings = {
    messageFontSize: "16",
    messagePosition: "left", 
    messageColor: "2d3748", // Professional dark gray
    messagePadding: "12",
    timerBackgroundColor: "f7fafc", // Light gray
    timerBorderColor: "e2e8f0", // Subtle border
    timerPadding: "8",
    timerTextColor: "2d3748", // Professional dark gray
    timerFontSize: "14",
    productFontSize: "16",
    actionButtonTextColor: "ffffff",
    actionButtonBackgroundColor: "1a1a1a",
    actionButtonBorderRadius: "8",
    actionButtonPadding: "12",
    addToCartButtonTextColor: "ffffff",
    addToCartButtonBackgroundColor: "2563eb", // Professional blue
    viewProductButtonTextColor: "ffffff", 
    viewProductButtonBackgroundColor: "374151", // Professional dark gray
    bgColor: "ffffff", // Clean white background
    bannerPadding: "16",
    bannerTopMargin: "0",
    bannerBottomMargin: "0", 
    bannerLeftMargin: "0",
    bannerRightMargin: "0",
    bannerBorderRadius: "12"
  }

  // Banner Layout & Positioning - Prefilled from existing banner
  const [isActive, setIsActive] = useState(bottomBanner.isActive)
  const [bannerWidth, setBannerWidth] = useState(bottomBanner.bannerWidth || "full")
  const [customWidth, setCustomWidth] = useState(bottomBanner.customWidth || "")
  const [bannerHeight, setBannerHeight] = useState(bottomBanner.bannerHeight || "auto")
  const [customHeight, setCustomHeight] = useState(bottomBanner.customHeight || "")
  const [bannerPadding, setBannerPadding] = useState(String(bottomBanner.bannerPadding || defaultSettings.bannerPadding))
  const [bannerLeftMargin, setBannerLeftMargin] = useState(String(bottomBanner.bannerLeftMargin || defaultSettings.bannerLeftMargin))
  const [bannerRightMargin, setBannerRightMargin] = useState(String(bottomBanner.bannerRightMargin || defaultSettings.bannerRightMargin))
  const [bannerTopMargin, setBannerTopMargin] = useState(String(bottomBanner.bannerTopMargin || defaultSettings.bannerTopMargin))
  const [bannerBottomMargin, setBannerBottomMargin] = useState(String(bottomBanner.bannerBottomMargin || defaultSettings.bannerBottomMargin))
  const [bannerBorderRadius, setBannerBorderRadius] = useState(String(bottomBanner.bannerBorderRadius || defaultSettings.bannerBorderRadius))
  const [priority, setPriority] = useState(String(bottomBanner.priority || "0"))

  // Reset to defaults function - resets EVERYTHING
  const resetToDefaults = () => {
    // Reset all styling
    setMessageFontSize(defaultSettings.messageFontSize)
    setMessagePosition(defaultSettings.messagePosition)
    setMessageColor(defaultSettings.messageColor)
    setMessagePadding(defaultSettings.messagePadding)
    setTimerBackgroundColor(defaultSettings.timerBackgroundColor)
    setTimerBorderColor(defaultSettings.timerBorderColor)
    setTimerPadding(defaultSettings.timerPadding)
    setTimerTextColor(defaultSettings.timerTextColor)
    setTimerFontSize(defaultSettings.timerFontSize)
    setProductFontSize(defaultSettings.productFontSize)
    setActionButtonTextColor(defaultSettings.actionButtonTextColor)
    setActionButtonBackgroundColor(defaultSettings.actionButtonBackgroundColor)
    setActionButtonBorderRadius(defaultSettings.actionButtonBorderRadius)
    setActionButtonPadding(defaultSettings.actionButtonPadding)
    setAddToCartButtonTextColor(defaultSettings.addToCartButtonTextColor)
    setAddToCartButtonBackgroundColor(defaultSettings.addToCartButtonBackgroundColor)
    setViewProductButtonTextColor(defaultSettings.viewProductButtonTextColor)
    setViewProductButtonBackgroundColor(defaultSettings.viewProductButtonBackgroundColor)
    setBgColor(defaultSettings.bgColor)
    setBannerPadding(defaultSettings.bannerPadding)
    setBannerLeftMargin(defaultSettings.bannerLeftMargin)
    setBannerRightMargin(defaultSettings.bannerRightMargin)
    setBannerTopMargin(defaultSettings.bannerTopMargin)
    setBannerBottomMargin(defaultSettings.bannerBottomMargin)
    setBannerBorderRadius(defaultSettings.bannerBorderRadius)
    
    // Reset banner settings
    setIsActive(false)
    setBannerWidth("full")
    setCustomWidth("")
    setBannerHeight("auto")
    setCustomHeight("")
    setPriority("0")
    
    // Reset slides to default
    setSlides([defaultSlide])
  }

  // Default slide with prefilled professional content
  const defaultSlide: BottomBannerSlide = {
    message: "🎉 Special Offer! Limited Time Only",
    isTimer: true,
    startTime: "",
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 7 days from now
    hasProduct: true,
    productId: products.length > 0 ? products[0].id : "",
    productTitle: products.length > 0 ? products[0].title : "",
    productVariantId: products.length > 0 && parseVariants(products[0].variants).length > 0 ? parseVariants(products[0].variants)[0].id : "",
    showImage: true,
    priceOverride: products.length > 0 ? `$${(parseFloat(products[0].price) * 0.8).toFixed(2)}` : "$99.99", // 20% discount
    couponCode: "SAVE20",
    showAddToCartButton: true,
    showViewProductButton: true,
    addToCartButtonText: "Add to Cart",
    viewProductButtonText: "View Product"
  }

  // Convert existing slides to the format expected by the form
  const existingSlides: BottomBannerSlide[] = bottomBanner.slides?.map((slide: any) => ({
    message: slide.message || "",
    isTimer: slide.isTimer || false,
    startTime: slide.startTime ? new Date(slide.startTime).toISOString().slice(0, 16) : "",
    endTime: slide.endTime ? new Date(slide.endTime).toISOString().slice(0, 16) : "",
    hasProduct: slide.hasProduct || false,
    productId: slide.productId || "",
    productTitle: slide.productTitle || "",
    productVariantId: slide.productVariantId || "",
    showImage: slide.showImage || false,
    priceOverride: slide.priceOverride || "",
    couponCode: slide.couponCode || "",
    showAddToCartButton: slide.showAddToCartButton || false,
    showViewProductButton: slide.showViewProductButton || false,
    addToCartButtonText: slide.addToCartButtonText || "Add to Cart",
    viewProductButtonText: slide.viewProductButtonText || "View Product"
  })) || [defaultSlide];

  // Slide System - Prefilled from existing banner
  const [slides, setSlides] = useState<BottomBannerSlide[]>(existingSlides)

  // Use ref to keep track of latest slides state
  const slidesRef = useRef(slides);

  // Update ref whenever slides change
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  // Styling (global) - Prefilled from existing banner
  const [messageFontSize, setMessageFontSize] = useState(String(bottomBanner.messageFontSize || defaultSettings.messageFontSize))
  const [messagePosition, setMessagePosition] = useState(bottomBanner.messagePosition || defaultSettings.messagePosition)
  const [messageColor, setMessageColor] = useState(bottomBanner.messageColor?.replace('#', '') || defaultSettings.messageColor)
  const [messagePadding, setMessagePadding] = useState(String(bottomBanner.messagePadding || defaultSettings.messagePadding))
  const [timerBackgroundColor, setTimerBackgroundColor] = useState(bottomBanner.timerBackgroundColor?.replace('#', '') || defaultSettings.timerBackgroundColor)
  const [timerBorderColor, setTimerBorderColor] = useState(bottomBanner.timerBorderColor?.replace('#', '') || defaultSettings.timerBorderColor)
  const [timerPadding, setTimerPadding] = useState(String(bottomBanner.timerPadding || defaultSettings.timerPadding))
  const [timerTextColor, setTimerTextColor] = useState(bottomBanner.timerTextColor?.replace('#', '') || defaultSettings.timerTextColor)
  const [timerFontSize, setTimerFontSize] = useState(String(bottomBanner.timerFontSize || defaultSettings.timerFontSize))
  const [productFontSize, setProductFontSize] = useState(String(bottomBanner.productFontSize || defaultSettings.productFontSize))
  const [actionButtonTextColor, setActionButtonTextColor] = useState(bottomBanner.actionButtonTextColor?.replace('#', '') || defaultSettings.actionButtonTextColor)
  const [actionButtonBackgroundColor, setActionButtonBackgroundColor] = useState(bottomBanner.actionButtonBackgroundColor?.replace('#', '') || defaultSettings.actionButtonBackgroundColor)
  const [actionButtonBorderRadius, setActionButtonBorderRadius] = useState(String(bottomBanner.actionButtonBorderRadius || defaultSettings.actionButtonBorderRadius))
  const [actionButtonPadding, setActionButtonPadding] = useState(String(bottomBanner.actionButtonPadding || defaultSettings.actionButtonPadding))
  const [addToCartButtonTextColor, setAddToCartButtonTextColor] = useState(bottomBanner.addToCartButtonTextColor?.replace('#', '') || defaultSettings.addToCartButtonTextColor)
  const [addToCartButtonBackgroundColor, setAddToCartButtonBackgroundColor] = useState(bottomBanner.addToCartButtonBackgroundColor?.replace('#', '') || defaultSettings.addToCartButtonBackgroundColor)
  const [viewProductButtonTextColor, setViewProductButtonTextColor] = useState(bottomBanner.viewProductButtonTextColor?.replace('#', '') || defaultSettings.viewProductButtonTextColor)
  const [viewProductButtonBackgroundColor, setViewProductButtonBackgroundColor] = useState(bottomBanner.viewProductButtonBackgroundColor?.replace('#', '') || defaultSettings.viewProductButtonBackgroundColor)

  // Background - Prefilled from existing banner
  const [bgColor, setBgColor] = useState(bottomBanner.bgColor?.replace('#', '') || defaultSettings.bgColor)

  // Helper functions for slides
  const addSlide = () => {
    setSlides([...slides, {
      ...defaultSlide,
      message: "🎯 New Offer Available!",
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 7 days from now
      couponCode: "NEW10",
      productId: products.length > 0 ? products[0].id : "",
      productTitle: products.length > 0 ? products[0].title : "",
      productVariantId: products.length > 0 && parseVariants(products[0].variants).length > 0 ? parseVariants(products[0].variants)[0].id : "",
      priceOverride: products.length > 0 ? `$${(parseFloat(products[0].price) * 0.9).toFixed(2)}` : "$89.99" // 10% discount for new slides
    }])
  }

  const removeSlide = (index: number) => {
    if (slides.length > 1) {
      setSlides(slides.filter((_, i) => i !== index))
    }
  }

  const updateSlide = (index: number, field: keyof BottomBannerSlide, value: any) => {
    const newSlides = [...slides]
    newSlides[index] = { ...newSlides[index], [field]: value }
    setSlides(newSlides)
  }

  const handleSubmit = (event: React.FormEvent) => {
    if (isSubmitting) {
      event.preventDefault()
      return
    }

    // Validate slides with products have variants selected
    const invalidSlides = slides.filter((slide, index) => 
      slide.hasProduct && slide.productId && !slide.productVariantId
    )

    if (invalidSlides.length > 0) {
      event.preventDefault()
      alert('Please select a variant for all slides that have products selected.')
      return
    }
  }

  return (
    <Page>
      <TitleBar title="Edit Bottom Banner" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Edit Bottom Banner Configuration
                </Text>
               
                <InlineStack gap="200">
                  <Button 
                    variant="secondary" 
                    size="slim"
                    onClick={resetToDefaults}
                  >
                    Reset to Defaults
                  </Button>
                  <Link to="/app/sync-products">Sync Products</Link>
                </InlineStack>
              </InlineStack>

              <Form method="post" onSubmit={handleSubmit}>
                <input type="hidden" name="_intent" value="update" />
                <input type="hidden" name="isActive" value={isActive.toString()} />
                <input type="hidden" name="slides" value={JSON.stringify(slides)} />

                <BlockStack gap="500">
                  {/* Banner Status */}
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Banner Status
                      </Text>
                      <Checkbox 
                        label="Active" 
                        checked={isActive} 
                        onChange={setIsActive}
                      />
                    </BlockStack>
                  </Card>

                  {/* Slide System */}
                  <Card>
                    <BlockStack gap="300">
                      <InlineStack align="space-between">
                        <Text as="h3" variant="headingMd">
                          Banner Slides
                        </Text>
                        <Button onClick={addSlide} size="slim">
                          Add Slide
                        </Button>
                      </InlineStack>

                      <BlockStack gap="400">
                        {slides.map((slide, index) => (
                          <Card key={index}>
                            <BlockStack gap="300">
                              <InlineStack align="space-between">
                                <Text as="h4" variant="headingSm">
                                  Slide {index + 1}
                                </Text>
                                {slides.length > 1 && (
                                  <Button 
                                    variant="plain" 
                                    tone="critical" 
                                    size="slim"
                                    onClick={() => removeSlide(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </InlineStack>

                              <TextField
                                label="Message"
                                value={slide.message}
                                onChange={(value) => updateSlide(index, "message", value)}
                                placeholder="Enter your banner message"
                                autoComplete="off"
                              />

                              <Checkbox 
                                label="Enable Timer" 
                                checked={slide.isTimer} 
                                onChange={(value) => updateSlide(index, "isTimer", value)}
                              />

                              {slide.isTimer && (
                                <InlineStack gap="200">
                                  <TextField
                                    label="Start Time"
                                    type="datetime-local"
                                    value={slide.startTime}
                                    onChange={(value) => updateSlide(index, "startTime", value)}
                                    autoComplete="off"
                                  />
                                  <TextField
                                    label="End Time"
                                    type="datetime-local"
                                    value={slide.endTime}
                                    onChange={(value) => updateSlide(index, "endTime", value)}
                                    autoComplete="off"
                                  />
                                </InlineStack>
                              )}

                              <Checkbox 
                                label="Link to Product for this slide" 
                                checked={slide.hasProduct} 
                                onChange={(value) => updateSlide(index, "hasProduct", value)}
                              />

                              {slide.hasProduct && (
                                <>
                                  <Select
                                    label="Select Product"
                                    options={[
                                      { label: "Choose a product", value: "" },
                                      ...products.map((product: any) => ({
                                        label: `${product.title} - $${product.price}`,
                                        value: product.id
                                      }))
                                    ]}
                                    value={slide.productId}
                                    onChange={(value) => {
                                      const selectedProduct = products.find((p: any) => p.id === value)
                                      updateSlide(index, "productId", value)
                                      updateSlide(index, "productTitle", selectedProduct?.title || "")
                                      updateSlide(index, "productVariantId", parseVariants(selectedProduct?.variants)[0]?.id || "")
                                    }}
                                  />

                                  {slide.productId && (() => {
                                    const selectedProduct = products.find((p: any) => p.id === slide.productId)
                                    return selectedProduct ? (
                                      <Select
                                        label="Select Variant *"
                                        options={[
                                          { label: "Choose a variant", value: "" },
                                          ...parseVariants(selectedProduct.variants).map((variant: any) => ({
                                            label: `${variant.title} - $${variant.price}`,
                                            value: variant.id
                                          }))
                                        ]}
                                        value={slide.productVariantId}
                                        onChange={(value) => updateSlide(index, "productVariantId", value)}
                                        error={slide.hasProduct && slide.productId && !slide.productVariantId ? "Please select a variant (required for add to cart)" : undefined}
                                      />
                                    ) : null
                                  })()}

                                  <TextField
                                    label="Product Title Override"
                                    value={slide.productTitle}
                                    onChange={(value) => updateSlide(index, "productTitle", value)}
                                    placeholder="Override product title (optional)"
                                    autoComplete="off"
                                  />

                                  <Checkbox 
                                    label="Show Product Image" 
                                    checked={slide.showImage} 
                                    onChange={(value) => updateSlide(index, "showImage", value)}
                                    helpText="Shows the product's featured image from the products table"
                                  />

                                  <TextField
                                    label="Price Override"
                                    value={slide.priceOverride}
                                    onChange={(value) => updateSlide(index, "priceOverride", value)}
                                    placeholder="Override product price (optional)"
                                    autoComplete="off"
                                  />

                                  <TextField
                                    label="Coupon Code"
                                    value={slide.couponCode}
                                    onChange={(value) => updateSlide(index, "couponCode", value)}
                                    placeholder="Enter coupon code (optional)"
                                    autoComplete="off"
                                  />

                                  <Text as="h4" variant="headingSm">
                                    Button Configuration
                                  </Text>

                                  <Checkbox 
                                    label="Show Add to Cart Button" 
                                    checked={slide.showAddToCartButton} 
                                    onChange={(value) => updateSlide(index, "showAddToCartButton", value)}
                                  />

                                  {slide.showAddToCartButton && (
                                    <TextField
                                      label="Add to Cart Button Text"
                                      value={slide.addToCartButtonText}
                                      onChange={(value) => updateSlide(index, "addToCartButtonText", value)}
                                      placeholder="Add to Cart"
                                      autoComplete="off"
                                    />
                                  )}

                                  <Checkbox 
                                    label="Show View Product Button" 
                                    checked={slide.showViewProductButton} 
                                    onChange={(value) => updateSlide(index, "showViewProductButton", value)}
                                  />

                                  {slide.showViewProductButton && (
                                    <TextField
                                      label="View Product Button Text"
                                      value={slide.viewProductButtonText}
                                      onChange={(value) => updateSlide(index, "viewProductButtonText", value)}
                                      placeholder="View Product"
                                      autoComplete="off"
                                    />
                                  )}
                                </>
                              )}
                            </BlockStack>
                          </Card>
                        ))}
                      </BlockStack>
                    </BlockStack>
                  </Card>

                  {/* Global Styling */}
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Global Message Styling
                      </Text>

                      <TextField
                        label="Message Font Size (px)"
                        type="number"
                        name="messageFontSize"
                        value={messageFontSize}
                        onChange={setMessageFontSize}
                        autoComplete="off"
                      />

                      <Select
                        label="Message Position"
                        name="messagePosition"
                        options={[
                          { label: "Left", value: "left" },
                          { label: "Center", value: "center" },
                          { label: "Right", value: "right" }
                        ]}
                        value={messagePosition}
                        onChange={setMessagePosition}
                      />

                      <TextField
                        label="Message Color"
                        name="messageColor"
                        value={messageColor}
                        onChange={setMessageColor}
                        autoComplete="off"
                        helpText="Enter hex color code (e.g., ffffff for white)"
                      />

                      <TextField
                        label="Message Padding (px)"
                        type="number"
                        name="messagePadding"
                        value={messagePadding}
                        onChange={setMessagePadding}
                        autoComplete="off"
                      />
                    </BlockStack>
                  </Card>

                  {/* Timer Styling */}
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Global Timer Styling
                      </Text>
                      <TextField
                        label="Timer Background Color"
                        name="timerBackgroundColor"
                        value={timerBackgroundColor}
                        onChange={setTimerBackgroundColor}
                        autoComplete="off"
                        helpText="Enter hex color code (e.g., ffffff for white)"
                      />
                      <TextField
                        label="Timer Border Color"
                        name="timerBorderColor"
                        value={timerBorderColor}
                        onChange={setTimerBorderColor}
                        autoComplete="off"
                      />
                      <TextField
                        label="Timer Padding (px)"
                        type="number"
                        name="timerPadding"
                        value={timerPadding}
                        onChange={setTimerPadding}
                        autoComplete="off"
                      />
                      <TextField
                        label="Timer Text Color"
                        name="timerTextColor"
                        value={timerTextColor}
                        onChange={setTimerTextColor}
                        autoComplete="off"
                      />
                      <TextField
                        label="Timer Font Size (px)"
                        type="number"
                        name="timerFontSize"
                        value={timerFontSize}
                        onChange={setTimerFontSize}
                        autoComplete="off"
                      />
                    </BlockStack>
                  </Card>

                  {/* Product Styling */}
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Product Styling
                      </Text>
                      <TextField
                        label="Product Font Size (px)"
                        type="number"
                        name="productFontSize"
                        value={productFontSize}
                        onChange={setProductFontSize}
                        autoComplete="off"
                      />
                    </BlockStack>
                  </Card>

                  {/* Button Styling */}
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Button Styling
                      </Text>
                      <TextField
                        label="Add to Cart Button Text Color"
                        name="addToCartButtonTextColor"
                        value={addToCartButtonTextColor}
                        onChange={setAddToCartButtonTextColor}
                        autoComplete="off"
                      />
                      <TextField
                        label="Add to Cart Button Background Color"
                        name="addToCartButtonBackgroundColor"
                        value={addToCartButtonBackgroundColor}
                        onChange={setAddToCartButtonBackgroundColor}
                        autoComplete="off"
                      />
                      <TextField
                        label="View Product Button Text Color"
                        name="viewProductButtonTextColor"
                        value={viewProductButtonTextColor}
                        onChange={setViewProductButtonTextColor}
                        autoComplete="off"
                      />
                      <TextField
                        label="View Product Button Background Color"
                        name="viewProductButtonBackgroundColor"
                        value={viewProductButtonBackgroundColor}
                        onChange={setViewProductButtonBackgroundColor}
                        autoComplete="off"
                      />
                      <TextField
                        label="Button Border Radius (px)"
                        type="number"
                        name="actionButtonBorderRadius"
                        value={actionButtonBorderRadius}
                        onChange={setActionButtonBorderRadius}
                        autoComplete="off"
                      />
                      <TextField
                        label="Button Padding (px)"
                        type="number"
                        name="actionButtonPadding"
                        value={actionButtonPadding}
                        onChange={setActionButtonPadding}
                        autoComplete="off"
                      />
                    </BlockStack>
                  </Card>

                  {/* Banner Layout */}
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Banner Layout & Positioning
                      </Text>
                      <TextField
                        label="Banner Padding (px)"
                        type="number"
                        name="bannerPadding"
                        value={bannerPadding}
                        onChange={setBannerPadding}
                        autoComplete="off"
                      />
                      <TextField
                        label="Banner Border Radius (px)"
                        type="number"
                        name="bannerBorderRadius"
                        value={bannerBorderRadius}
                        onChange={setBannerBorderRadius}
                        autoComplete="off"
                      />
                      <TextField
                        label="Priority"
                        type="number"
                        name="priority"
                        value={priority}
                        onChange={setPriority}
                        autoComplete="off"
                        helpText="Higher numbers appear first"
                      />
                    </BlockStack>
                  </Card>

                  {/* Background */}
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Background
                      </Text>
                      <TextField
                        label="Background Color"
                        name="bgColor"
                        value={bgColor}
                        onChange={setBgColor}
                        autoComplete="off"
                        helpText="Enter hex color code (e.g., ffffff for white)"
                      />
                    </BlockStack>
                  </Card>

                  <Divider />

                  <InlineStack align="end">
                    <Button 
                      variant="primary" 
                      submit 
                      loading={isSubmitting}
                      disabled={isSubmitting || isRedirecting}
                    >
                      {isSubmitting ? "Updating..." : "Update Bottom Banner"}
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
