import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  InlineStack,
  Button,
  TextField,
  Checkbox,
  Select,
  Divider,
} from "@shopify/polaris"
import { TitleBar } from "@shopify/app-bridge-react"
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { Form, useLoaderData, useNavigation } from "@remix-run/react"
import { useState, useEffect, useRef } from "react"
import prisma from "app/db.server"
import { Link } from "@remix-run/react"
import { authenticate } from "../shopify.server"

// ---- Types ----
interface Product {
  id: string
  shopifyId: string
  title: string
  handle: string
  featuredImage: string | null
  price: string
  currencyCode: string
  variantId: string | null
  variants?: Array<{
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
  actionType: string
  actionButtonText: string
  showImage: boolean
  priceOverride: string
  couponCode: string
  showAddToCartButton: boolean
  showViewProductButton: boolean
  addToCartButtonText: string
  viewProductButtonText: string
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

  try {
    // Fetch products
    const products = await (prisma as any).product.findMany({
      orderBy: { title: "asc" },
    })

    // Parse variants for each product
    const productsWithVariants = products.map((product: any) => ({
      ...product,
      variants: product.variants ? JSON.parse(product.variants) : []
    }))

    // Fetch the banner with its slides
    const banner = await (prisma as any).bottomBanner.findUnique({
      where: { id: bannerId },
      include: {
        slides: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!banner) {
      throw new Response("Banner not found", { status: 404 });
    }

    return json({ products: productsWithVariants, banner })
  } catch (error) {
    console.error("Loader error:", error)
    return json({ products: [], banner: null })
  }
}

// ---- Action ----
export async function action({ request, params }: ActionFunctionArgs) {
  const auth = await authenticate.admin(request);
  if (auth instanceof Response) {
    return auth;
  }
  
  const bannerId = params.id;
  if (!bannerId) {
    throw new Response("Banner ID is required", { status: 400 });
  }

  const formData = await request.formData()
  const intent = formData.get("_intent")

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
    const actionButtonBorderRadius = String(formData.get("actionButtonBorderRadius") || "6")
    const actionButtonPadding = String(formData.get("actionButtonPadding") || "8")

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
    await (prisma as any).bottomBanner.update({
      where: { id: bannerId },
      data: {
        isActive,
        bannerWidth,
        customWidth: customWidth || null,
        bannerHeight,
        customHeight: customHeight || null,
        bannerPadding,
        bannerLeftMargin,
        bannerRightMargin,
        bannerTopMargin,
        bannerBottomMargin,
        bannerBorderRadius,
        priority,
        areMessagesCarousel,
        messages,
        messageFontSize,
        messagePosition,
        messageColor,
        messagePadding,
        isTimer,
        startTime,
        endTime,
        timerBackgroundColor,
        timerBorderColor,
        timerPadding,
        timerTextColor,
        timerFontSize,
        hasProduct,
        productId: hasProduct && productId ? productId : null,
        productTitle: hasProduct && manualProductTitle ? manualProductTitle : null,
        productImage: hasProduct && productImage ? productImage : null,
        showImage,
        priceOverride: hasProduct && priceOverride ? priceOverride : null,
        couponCode: hasProduct && couponCode ? couponCode : null,
        productFontSize,
        actionType,
        actionButtonText: hasProduct ? actionButtonText : null,
        actionButtonTextColor,
        actionButtonBackgroundColor,
        actionButtonBorderRadius,
        actionButtonPadding,
        showAddToCartButton,
        showViewProductButton,
        addToCartButtonText,
        viewProductButtonText,
        addToCartButtonTextColor,
        addToCartButtonBackgroundColor,
        viewProductButtonTextColor,
        viewProductButtonBackgroundColor,
        bgColor,
      },
    })

    // Delete all existing slides for this banner
    await (prisma as any).bottomBannerSlide.deleteMany({
      where: { bottomBannerId: bannerId }
    })

    // Create new slides
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      
      // Use the productId directly since it's already the internal database ID
      let internalProductId = null;
      let numericVariantId = null;
      
      if (slide.hasProduct && slide.productId) {
        // ProductId is already the internal database ID
        internalProductId = slide.productId;
        
        // Variant ID should already be numeric from frontend
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
        bottomBannerId: bannerId,
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
        actionType: slide.hasProduct ? slide.actionType : "view_product",
        actionButtonText: slide.hasProduct ? slide.actionButtonText : null,
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

  return redirect("/app/manage-bottom-banners")
}

// ---- UI ----
export default function EditBottomBannerPage() {
  const { products, banner } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"
  const isRedirecting = navigation.state === "loading" && navigation.formData == null

  // Professional Design System Defaults
  const defaultSettings = {
    messageFontSize: "16",
    messagePosition: "left", 
    messageColor: "2d3748",
    messagePadding: "12",
    timerBackgroundColor: "f7fafc",
    timerBorderColor: "e2e8f0",
    timerPadding: "8",
    timerTextColor: "2d3748",
    timerFontSize: "14",
    productFontSize: "16",
    actionButtonTextColor: "ffffff",
    actionButtonBackgroundColor: "1a1a1a",
    actionButtonBorderRadius: "8",
    actionButtonPadding: "12",
    addToCartButtonTextColor: "ffffff",
    addToCartButtonBackgroundColor: "2563eb",
    viewProductButtonTextColor: "ffffff", 
    viewProductButtonBackgroundColor: "374151",
    bgColor: "ffffff",
    bannerPadding: "16",
    bannerTopMargin: "0",
    bannerBottomMargin: "0", 
    bannerLeftMargin: "0",
    bannerRightMargin: "0",
    bannerBorderRadius: "12"
  }

  // Helper to strip # from hex colors
  const stripHash = (color: string) => color?.replace('#', '') || ''

  // Convert existing slides to form format
  const existingSlides: BottomBannerSlide[] = banner?.slides?.length > 0 
    ? banner.slides.map((slide: any) => ({
        message: slide.message || "",
        isTimer: slide.isTimer || false,
        startTime: slide.startTime ? new Date(slide.startTime).toISOString().slice(0, 16) : "",
        endTime: slide.endTime ? new Date(slide.endTime).toISOString().slice(0, 16) : "",
        hasProduct: slide.hasProduct || false,
        productId: slide.productId || "",
        productTitle: slide.productTitle || "",
        productVariantId: slide.productVariantId || "",
        actionType: slide.actionType || "view_product",
        actionButtonText: slide.actionButtonText || "View Product",
        showImage: slide.showImage || false,
        priceOverride: slide.priceOverride || "",
        couponCode: slide.couponCode || "",
        showAddToCartButton: slide.showAddToCartButton || false,
        showViewProductButton: slide.showViewProductButton || false,
        addToCartButtonText: slide.addToCartButtonText || "Add to Cart",
        viewProductButtonText: slide.viewProductButtonText || "View Product"
      }))
    : [{
        message: "🎉 Special Offer! Limited Time Only",
        isTimer: true,
        startTime: "",
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        hasProduct: true,
        productId: products.length > 0 ? products[0].id : "",
        productTitle: products.length > 0 ? products[0].title : "",
        productVariantId: products.length > 0 && products[0].variants.length > 0 ? products[0].variants[0].id : "",
        actionType: "view_product",
        actionButtonText: "View Product",
        showImage: true,
        priceOverride: products.length > 0 ? `$${(parseFloat(products[0].price) * 0.8).toFixed(2)}` : "$99.99",
        couponCode: "SAVE20",
        showAddToCartButton: true,
        showViewProductButton: true,
        addToCartButtonText: "Add to Cart",
        viewProductButtonText: "View Product"
      }]

  // Banner Layout & Positioning - Prefilled from existing banner
  const [isActive, setIsActive] = useState(banner?.isActive || false)
  const [bannerWidth, setBannerWidth] = useState(banner?.bannerWidth || "full")
  const [customWidth, setCustomWidth] = useState(banner?.customWidth || "")
  const [bannerHeight, setBannerHeight] = useState(banner?.bannerHeight || "auto")
  const [customHeight, setCustomHeight] = useState(banner?.customHeight || "")
  const [bannerPadding, setBannerPadding] = useState(String(banner?.bannerPadding || defaultSettings.bannerPadding))
  const [bannerLeftMargin, setBannerLeftMargin] = useState(String(banner?.bannerLeftMargin || defaultSettings.bannerLeftMargin))
  const [bannerRightMargin, setBannerRightMargin] = useState(String(banner?.bannerRightMargin || defaultSettings.bannerRightMargin))
  const [bannerTopMargin, setBannerTopMargin] = useState(String(banner?.bannerTopMargin || defaultSettings.bannerTopMargin))
  const [bannerBottomMargin, setBannerBottomMargin] = useState(String(banner?.bannerBottomMargin || defaultSettings.bannerBottomMargin))
  const [bannerBorderRadius, setBannerBorderRadius] = useState(String(banner?.bannerBorderRadius || defaultSettings.bannerBorderRadius))
  const [priority, setPriority] = useState(String(banner?.priority || "0"))

  // Default slide for new slides
  const defaultSlide: BottomBannerSlide = {
    message: "🎯 New Offer Available!",
    isTimer: true,
    startTime: "",
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    hasProduct: true,
    productId: products.length > 0 ? products[0].id : "",
    productTitle: products.length > 0 ? products[0].title : "",
    productVariantId: products.length > 0 && products[0].variants.length > 0 ? products[0].variants[0].id : "",
    actionType: "view_product",
    actionButtonText: "View Product",
    showImage: true,
    priceOverride: products.length > 0 ? `$${(parseFloat(products[0].price) * 0.9).toFixed(2)}` : "$89.99",
    couponCode: "NEW10",
    showAddToCartButton: true,
    showViewProductButton: true,
    addToCartButtonText: "Add to Cart",
    viewProductButtonText: "View Product"
  }

  // Reset to defaults function
  const resetToDefaults = () => {
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
    setIsActive(false)
    setBannerWidth("full")
    setCustomWidth("")
    setBannerHeight("auto")
    setCustomHeight("")
    setPriority("0")
    setSlides([defaultSlide])
  }

  // Slide System - Prefilled from existing banner
  const [slides, setSlides] = useState<BottomBannerSlide[]>(existingSlides)

  // Use ref to keep track of latest slides state
  const slidesRef = useRef(slides);

  // Update ref whenever slides change
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  // Styling (global) - Prefilled from existing banner
  const [messageFontSize, setMessageFontSize] = useState(String(banner?.messageFontSize || defaultSettings.messageFontSize))
  const [messagePosition, setMessagePosition] = useState(banner?.messagePosition || defaultSettings.messagePosition)
  const [messageColor, setMessageColor] = useState(stripHash(banner?.messageColor) || defaultSettings.messageColor)
  const [messagePadding, setMessagePadding] = useState(String(banner?.messagePadding || defaultSettings.messagePadding))
  const [timerBackgroundColor, setTimerBackgroundColor] = useState(stripHash(banner?.timerBackgroundColor) || defaultSettings.timerBackgroundColor)
  const [timerBorderColor, setTimerBorderColor] = useState(stripHash(banner?.timerBorderColor) || defaultSettings.timerBorderColor)
  const [timerPadding, setTimerPadding] = useState(String(banner?.timerPadding || defaultSettings.timerPadding))
  const [timerTextColor, setTimerTextColor] = useState(stripHash(banner?.timerTextColor) || defaultSettings.timerTextColor)
  const [timerFontSize, setTimerFontSize] = useState(String(banner?.timerFontSize || defaultSettings.timerFontSize))
  const [productFontSize, setProductFontSize] = useState(String(banner?.productFontSize || defaultSettings.productFontSize))
  const [actionButtonTextColor, setActionButtonTextColor] = useState(stripHash(banner?.actionButtonTextColor) || defaultSettings.actionButtonTextColor)
  const [actionButtonBackgroundColor, setActionButtonBackgroundColor] = useState(stripHash(banner?.actionButtonBackgroundColor) || defaultSettings.actionButtonBackgroundColor)
  const [actionButtonBorderRadius, setActionButtonBorderRadius] = useState(String(banner?.actionButtonBorderRadius || defaultSettings.actionButtonBorderRadius))
  const [actionButtonPadding, setActionButtonPadding] = useState(String(banner?.actionButtonPadding || defaultSettings.actionButtonPadding))
  const [addToCartButtonTextColor, setAddToCartButtonTextColor] = useState(stripHash(banner?.addToCartButtonTextColor) || defaultSettings.addToCartButtonTextColor)
  const [addToCartButtonBackgroundColor, setAddToCartButtonBackgroundColor] = useState(stripHash(banner?.addToCartButtonBackgroundColor) || defaultSettings.addToCartButtonBackgroundColor)
  const [viewProductButtonTextColor, setViewProductButtonTextColor] = useState(stripHash(banner?.viewProductButtonTextColor) || defaultSettings.viewProductButtonTextColor)
  const [viewProductButtonBackgroundColor, setViewProductButtonBackgroundColor] = useState(stripHash(banner?.viewProductButtonBackgroundColor) || defaultSettings.viewProductButtonBackgroundColor)

  // Background - Prefilled from existing banner
  const [bgColor, setBgColor] = useState(stripHash(banner?.bgColor) || defaultSettings.bgColor)

  // Helper functions for slides
  const addSlide = () => {
    setSlides([...slides, defaultSlide])
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

  // Handle form submission with validation
  const handleSubmit = (e: React.FormEvent) => {
    // Validate that all slides with products have variants selected
    const invalidSlides = slidesRef.current.filter(
      (slide, idx) => slide.hasProduct && slide.productId && !slide.productVariantId
    );
    
    if (invalidSlides.length > 0) {
      e.preventDefault();
      const slideNumbers = slidesRef.current
        .map((slide, idx) => slide.hasProduct && slide.productId && !slide.productVariantId ? idx + 1 : null)
        .filter(n => n !== null)
        .join(', ');
      
      alert(`Please select a variant for slide(s): ${slideNumbers}`);
      return false;
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
                
                {/* Use a controlled input that updates from state with key to force re-render */}
                <input 
                  type="hidden" 
                  name="slides" 
                  value={JSON.stringify(slides)} 
                  key={JSON.stringify(slides)}
                />

                <BlockStack gap="400">
                  {/* Basic Settings */}
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Basic Settings
                      </Text>
                      <Checkbox 
                        label="Activate Bottom Banner" 
                        checked={isActive} 
                        onChange={setIsActive}
                        helpText="Enable this bottom banner to display at the bottom of your store pages"
                      />
                      <TextField
                        label="Priority"
                        type="number"
                        name="priority"
                        value={priority}
                        onChange={setPriority}
                        helpText="Lower numbers appear first (0 = highest priority)"
                        autoComplete="off"
                      />
                    </BlockStack>
                  </Card>

                  {/* Slide Builder */}
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between">
                        <Text as="h3" variant="headingMd">
                          Slides Configuration {slides.length > 1 && `(${slides.length} slides)`}
                        </Text>
                        <Button onClick={addSlide} variant="primary" tone="success">
                          + Add Slide
                        </Button>
                      </InlineStack>
                      
                      <Text as="p" variant="bodySm" tone="subdued">
                        Each slide can have its own message, timer, product, and buttons. Add multiple slides to create a carousel.
                      </Text>

                      {slides.map((slide, index) => (
                        <Card key={index}>
                          <BlockStack gap="400">
                            <InlineStack align="space-between">
                              <Text as="h4" variant="headingSm">
                                Slide {index + 1}
                              </Text>
                              {slides.length > 1 && (
                                <Button 
                                  onClick={() => removeSlide(index)}
                                  tone="critical"
                                  variant="plain"
                                >
                                  Remove Slide
                                </Button>
                              )}
                            </InlineStack>

                            <Divider />

                            {/* Message */}
                            <TextField
                              label="Message"
                              value={slide.message}
                              onChange={(value) => updateSlide(index, "message", value)}
                              autoComplete="off"
                              placeholder="Enter your message..."
                            />

                            {/* Timer */}
                            <Checkbox 
                              label="Enable Timer for this slide" 
                              checked={slide.isTimer} 
                              onChange={(value) => updateSlide(index, "isTimer", value)}
                            />

                            {slide.isTimer && (
                              <BlockStack gap="200">
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
                                  helpText="Timer will count down to this time"
                                />
                              </BlockStack>
                            )}

                            {/* Product */}
                            <Checkbox 
                              label="Link to Product for this slide" 
                              checked={slide.hasProduct} 
                              onChange={(value) => updateSlide(index, "hasProduct", value)}
                            />

                            {slide.hasProduct && (
                              <BlockStack gap="200">
                                 <div>
                                   <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>Select Product</label>
                                   <select 
                                     value={slide.productId || ""}
                                     onChange={(e) => {
                                       const value = e.target.value;
                                       
                                       const selectedProduct = products.find((p: Product) => p.id === value)
                                       
                                       // Update all fields in one go to avoid state batching issues
                                       const newSlides = [...slides];
                                       newSlides[index] = {
                                         ...newSlides[index],
                                         productId: value,
                                         productVariantId: "", // Reset variant when product changes
                                         productTitle: selectedProduct ? selectedProduct.title : ""
                                       };
                                       setSlides(newSlides);
                                     }}
                                     style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
                                   >
                                     <option value="">Choose a product</option>
                                     {products.map((product: Product) => (
                                       <option key={product.id} value={product.id}>
                                         {product.title} - ${product.price}
                                       </option>
                                     ))}
                                   </select>
                                   {products.length === 0 && (
                                     <p style={{color: '#666', fontSize: '14px', marginTop: '4px'}}>
                                       No products available. Click 'Sync Products' above.
                                     </p>
                                   )}
                                 </div>

                                 {slide.productId && (() => {
                                   const selectedProduct = products.find((p: Product) => p.id === slide.productId)
                                   const variants = selectedProduct?.variants || []
                                   
                                   if (variants.length > 0) {
                                     return (
                                       <div>
                                         <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
                                           Select Variant <span style={{color: 'red'}}>*</span>
                                         </label>
                                         <select 
                                           value={slide.productVariantId || ""}
                                           onChange={(e) => {
                                             const value = e.target.value;
                                             
                                             // Update variant in one go
                                             const newSlides = [...slides];
                                             newSlides[index] = {
                                               ...newSlides[index],
                                               productVariantId: value
                                             };
                                             setSlides(newSlides);
                                           }}
                                           style={{
                                             width: '100%', 
                                             padding: '8px', 
                                             border: `1px solid ${!slide.productVariantId ? '#ff0000' : '#ccc'}`, 
                                             borderRadius: '4px'
                                           }}
                                         >
                                           <option value="">Choose a variant</option>
                                           {variants.map((variant: { id: string; title: string; price: string; sku: string | null }) => (
                                             <option key={variant.id} value={variant.id}>
                                               {variant.title} - ${variant.price}
                                             </option>
                                           ))}
                                         </select>
                                         <p style={{
                                           color: !slide.productVariantId ? '#ff0000' : '#666', 
                                           fontSize: '14px', 
                                           marginTop: '4px'
                                         }}>
                                           {!slide.productVariantId 
                                             ? 'Please select a variant (required for add to cart)'
                                             : 'Variant selected for add to cart functionality'
                                           }
                                         </p>
                                       </div>
                                     )
                                   }
                                   return null
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

                                {/* Button Configuration */}
                                <BlockStack gap="200">
                                  <Text as="h5" variant="headingSm">Button Configuration</Text>
                                  
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
                                      autoComplete="off"
                                    />
                                  )}

                                  <Checkbox 
                                    label="Show Buy Now Button" 
                                    checked={slide.actionType === "buy_now"} 
                                    onChange={(value) => {
                                      const newSlides = [...slides];
                                      newSlides[index] = {
                                        ...newSlides[index],
                                        actionType: value ? "buy_now" : "view_product",
                                        actionButtonText: value ? "Buy Now" : "View Product"
                                      };
                                      setSlides(newSlides);
                                    }}
                                  />

                                  {slide.actionType === "buy_now" && (
                                    <TextField
                                      label="Buy Now Button Text"
                                      value={slide.actionButtonText}
                                      onChange={(value) => updateSlide(index, "actionButtonText", value)}
                                      autoComplete="off"
                                    />
                                  )}
                                </BlockStack>
                              </BlockStack>
                            )}
                          </BlockStack>
                        </Card>
                      ))}
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
                          { label: "Right", value: "right" },
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

                  {/* Banner Layout & Positioning */}
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Layout & Positioning
                      </Text>

                      <Select
                        label="Banner Width"
                        name="bannerWidth"
                        options={[
                          { label: "Full Width", value: "full" },
                          { label: "Custom (vw)", value: "custom" },
                        ]}
                        value={bannerWidth}
                        onChange={setBannerWidth}
                      />

                      {bannerWidth === "custom" && (
                        <TextField
                          label="Custom Width (vw)"
                          name="customWidth"
                          value={customWidth}
                          onChange={setCustomWidth}
                          placeholder="80"
                          autoComplete="off"
                          helpText="Enter width in viewport width units (e.g., 80 for 80vw)"
                        />
                      )}

                      <Select
                        label="Banner Height"
                        name="bannerHeight"
                        options={[
                          { label: "Auto", value: "auto" },
                          { label: "Custom (px)", value: "custom" },
                        ]}
                        value={bannerHeight}
                        onChange={setBannerHeight}
                      />

                      {bannerHeight === "custom" && (
                        <TextField
                          label="Custom Height (px)"
                          name="customHeight"
                          value={customHeight}
                          onChange={setCustomHeight}
                          placeholder="60"
                          autoComplete="off"
                        />
                      )}

                      <TextField
                        label="Banner Padding (px)"
                        type="number"
                        name="bannerPadding"
                        value={bannerPadding}
                        onChange={setBannerPadding}
                        autoComplete="off"
                      />

                      <InlineStack gap="200">
                        <TextField
                          label="Top Margin (px)"
                          type="number"
                          name="bannerTopMargin"
                          value={bannerTopMargin}
                          onChange={setBannerTopMargin}
                          autoComplete="off"
                        />
                        <TextField
                          label="Bottom Margin (px)"
                          type="number"
                          name="bannerBottomMargin"
                          value={bannerBottomMargin}
                          onChange={setBannerBottomMargin}
                          autoComplete="off"
                        />
                      </InlineStack>

                      <InlineStack gap="200">
                        <TextField
                          label="Left Margin (px)"
                          type="number"
                          name="bannerLeftMargin"
                          value={bannerLeftMargin}
                          onChange={setBannerLeftMargin}
                          autoComplete="off"
                        />
                        <TextField
                          label="Right Margin (px)"
                          type="number"
                          name="bannerRightMargin"
                          value={bannerRightMargin}
                          onChange={setBannerRightMargin}
                          autoComplete="off"
                        />
                      </InlineStack>

                      <TextField 
                        label="Border Radius (px)"
                        type="number"
                        name="bannerBorderRadius"
                        value={bannerBorderRadius}
                        onChange={setBannerBorderRadius}
                        autoComplete="off"
                        helpText="Rounded corners for the banner"
                      />
                    </BlockStack>
                  </Card>

                  {/* Global Timer Styling */}
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

                  {/* Global Product/Button Styling */}
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Global Product/Button Styling
                      </Text>
                      <TextField
                        label="Product Font Size (px)"
                        type="number"
                        name="productFontSize"
                        value={productFontSize}
                        onChange={setProductFontSize}
                        autoComplete="off"
                      />
                      
                      <Text as="h4" variant="headingSm">Add to Cart Button Styling</Text>
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

                      <Text as="h4" variant="headingSm">View Product Button Styling</Text>
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

                  {/* Submit Button */}
                  <InlineStack gap="200">
                    <Button 
                      submit 
                      variant="primary" 
                      loading={isSubmitting || isRedirecting}
                      disabled={isSubmitting || isRedirecting}
                    >
                      {isSubmitting ? "Updating Bottom Banner..." : isRedirecting ? "Redirecting..." : "Update Bottom Banner"}
                    </Button>
                    <Button url="/app/manage-bottom-banners" disabled={isSubmitting || isRedirecting}>
                      Cancel
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