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

interface Slide {
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
}

// ---- Loader ----
export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await authenticate.admin(request);
  if (auth instanceof Response) {
    return auth;
  }
  
  try {
    const products = await (prisma as any).product.findMany({
      orderBy: { title: "asc" },
    })

    // Parse variants for each product
    const productsWithVariants = products.map((product: any) => ({
      ...product,
      variants: product.variants ? JSON.parse(product.variants) : []
    }))

    return json({ products: productsWithVariants })
  } catch (error) {
    console.error("Loader error:", error)
    return json({ products: [] })
  }
}

// ---- Action ----
export async function action({ request }: ActionFunctionArgs) {
  const auth = await authenticate.admin(request);
  if (auth instanceof Response) {
    return auth;
  }
  
  const formData = await request.formData()
  const intent = formData.get("_intent")

  if (intent === "create") {
    // Parse slides from form data
    const slidesJson = String(formData.get("slides") || "[]")
    const slides = JSON.parse(slidesJson) as Slide[]
    
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
    const bannerPadding = String(formData.get("bannerPadding") || "20")
    const bannerLeftMargin = String(formData.get("bannerLeftMargin") || "0")
    const bannerRightMargin = String(formData.get("bannerRightMargin") || "0")
    const bannerTopMargin = String(formData.get("bannerTopMargin") || "0")
    const bannerBottomMargin = String(formData.get("bannerBottomMargin") || "0")
    const bannerBorderRadius = String(formData.get("bannerBorderRadius") || "8")
    const priority = Number.parseInt(String(formData.get("priority") || "0"))

    // Message Carousel System (legacy, keep for backward compatibility)
    const areMessagesCarousel = slides.length > 1
    const messages = JSON.stringify(slides.map(s => s.message))
    const messageFontSize = String(formData.get("messageFontSize") || "16")
    const messagePosition = String(formData.get("messagePosition") || "left")
    const messageColor = String(formData.get("messageColor") || "#ffffff")
    const messagePadding = String(formData.get("messagePadding") || "8")

    // Timer System (legacy from first slide)
    const isTimer = slides.length > 0 && slides[0].isTimer
    const startTime = isTimer && slides[0].startTime ? new Date(slides[0].startTime) : null
    const endTime = isTimer && slides[0].endTime ? new Date(slides[0].endTime) : null
    const timerBackgroundColor = String(formData.get("timerBackgroundColor") || "rgba(255,255,255,0.2)")
    const timerBorderColor = String(formData.get("timerBorderColor") || "rgba(255,255,255,0.3)")
    const timerPadding = String(formData.get("timerPadding") || "6")
    const timerTextColor = String(formData.get("timerTextColor") || "#ffffff")
    const timerFontSize = String(formData.get("timerFontSize") || "14")

    // Product Integration (legacy from first slide)
    const hasProduct = slides.length > 0 && slides[0].hasProduct
    const productId = slides.length > 0 && slides[0].productId ? slides[0].productId : null
    const manualProductTitle = slides.length > 0 ? slides[0].productTitle : ""
    const productImage = String(formData.get("productImage") || "")
    const productFontSize = String(formData.get("productFontSize") || "14")
    const actionType = slides.length > 0 ? slides[0].actionType : "view_product"
    const actionButtonText = slides.length > 0 ? slides[0].actionButtonText : "View Product"
    const actionButtonTextColor = String(formData.get("actionButtonTextColor") || "#ffffff")
    const actionButtonBackgroundColor = String(formData.get("actionButtonBackgroundColor") || "#007cba")
    const actionButtonBorderRadius = String(formData.get("actionButtonBorderRadius") || "4")
    const actionButtonPadding = String(formData.get("actionButtonPadding") || "8")

    // Background
    const bgColor = String(formData.get("bgColor") || "#ff0000")

    const isActive = formData.get("isActive") === "true"

    // Create banner with slides
    const banner = await (prisma as any).banner.create({
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
        productFontSize,
        actionType,
        actionButtonText: hasProduct ? actionButtonText : null,
        actionButtonTextColor,
        actionButtonBackgroundColor,
        actionButtonBorderRadius,
        actionButtonPadding,
        bgColor,
      },
    })

    // Create slides
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
      
      const slideData = {
        bannerId: banner.id,
        order: i,
        message: slide.message,
        isTimer: slide.isTimer,
        startTime: slide.isTimer && slide.startTime ? new Date(slide.startTime) : null,
        endTime: slide.isTimer && slide.endTime ? new Date(slide.endTime) : null,
        hasProduct: slide.hasProduct,
        productId: internalProductId,
        productTitle: slide.hasProduct ? slide.productTitle : null,
        productVariantId: numericVariantId,
        actionType: slide.hasProduct ? slide.actionType : "view_product",
        actionButtonText: slide.hasProduct ? slide.actionButtonText : null,
      }
      
      
      await (prisma as any).bannerSlide.create({
        data: slideData,
      })
    }

    return redirect("/app/manage-banners")
  }

  return redirect("/app/manage-banners")
}

// ---- UI ----
export default function CreateBannerPage() {
  const { products } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"
  const isRedirecting = navigation.state === "loading" && navigation.formData == null

  // Banner Layout & Positioning
  const [isActive, setIsActive] = useState(false)
  const [bannerWidth, setBannerWidth] = useState("full")
  const [customWidth, setCustomWidth] = useState("")
  const [bannerHeight, setBannerHeight] = useState("auto")
  const [customHeight, setCustomHeight] = useState("")
  const [bannerPadding, setBannerPadding] = useState("20")
  const [bannerLeftMargin, setBannerLeftMargin] = useState("0")
  const [bannerRightMargin, setBannerRightMargin] = useState("0")
  const [bannerTopMargin, setBannerTopMargin] = useState("0")
  const [bannerBottomMargin, setBannerBottomMargin] = useState("0")
  const [bannerBorderRadius, setBannerBorderRadius] = useState("8")
  const [priority, setPriority] = useState("0")

  // Slide System - replaces message/timer/product separate systems
  const [slides, setSlides] = useState<Slide[]>([{
    message: "",
    isTimer: false,
    startTime: "",
    endTime: "",
    hasProduct: false,
    productId: "",
    productTitle: "",
    productVariantId: "",
    actionType: "view_product",
    actionButtonText: "View Product"
  }])

  // Use ref to keep track of latest slides state
  const slidesRef = useRef(slides);

  // Update ref whenever slides change
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  // Styling (global) - Using schema defaults
  const [messageFontSize, setMessageFontSize] = useState("16")
  const [messagePosition, setMessagePosition] = useState("left")
  const [messageColor, setMessageColor] = useState("#1a1a1a")
  const [messagePadding, setMessagePadding] = useState("8")
  const [timerBackgroundColor, setTimerBackgroundColor] = useState("rgba(0,0,0,0.1)")
  const [timerBorderColor, setTimerBorderColor] = useState("rgba(0,0,0,0.15)")
  const [timerPadding, setTimerPadding] = useState("6")
  const [timerTextColor, setTimerTextColor] = useState("#1a1a1a")
  const [timerFontSize, setTimerFontSize] = useState("14")
  const [productFontSize, setProductFontSize] = useState("14")
  const [actionButtonTextColor, setActionButtonTextColor] = useState("#ffffff")
  const [actionButtonBackgroundColor, setActionButtonBackgroundColor] = useState("#1a1a1a")
  const [actionButtonBorderRadius, setActionButtonBorderRadius] = useState("6")
  const [actionButtonPadding, setActionButtonPadding] = useState("8")

  // Background
  const [bgColor, setBgColor] = useState("#f7f7f7")

  // Helper functions for slides
  const addSlide = () => {
    setSlides([...slides, {
      message: "",
      isTimer: false,
      startTime: "",
      endTime: "",
      hasProduct: false,
      productId: "",
      productTitle: "",
      productVariantId: "",
      actionType: "view_product",
      actionButtonText: "View Product"
    }])
  }

  const removeSlide = (index: number) => {
    if (slides.length > 1) {
      setSlides(slides.filter((_, i) => i !== index))
    }
  }

  const updateSlide = (index: number, field: keyof Slide, value: any) => {
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
      <TitleBar title="Create New Banner" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Banner Configuration
                </Text>
               
                <Link to="/app/sync-products">Sync Products</Link>
              </InlineStack>

              <Form method="post" onSubmit={handleSubmit}>
                <input type="hidden" name="_intent" value="create" />
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
                        label="Activate Banner" 
                        checked={isActive} 
                        onChange={setIsActive}
                        helpText="Enable this banner to display on your store"
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
                        Each slide can have its own message, timer, and product. Add multiple slides to create a carousel.
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
                                               {variant.title}
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

                                <Select
                                  label="Action Type"
                                  options={[
                                    { label: "View Product", value: "view_product" },
                                    { label: "Add to Cart", value: "add_to_cart" },
                                  ]}
                                  value={slide.actionType}
                                  onChange={(value) => {
                                    // Update both actionType and actionButtonText in one go
                                    const newSlides = [...slides];
                                    newSlides[index] = {
                                      ...newSlides[index],
                                      actionType: value,
                                      actionButtonText: value === "view_product" ? "View Product" : "Add to Cart"
                                    };
                                    setSlides(newSlides);
                                  }}
                                />

                                <TextField
                                  label="Button Text"
                                  value={slide.actionButtonText}
                                  onChange={(value) => updateSlide(index, "actionButtonText", value)}
                                  autoComplete="off"
                                />
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
                        prefix="#"
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
                        helpText="Use rgba for transparency (e.g., rgba(255,255,255,0.2))"
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
                        prefix="#"
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
                      <TextField
                        label="Button Text Color"
                        name="actionButtonTextColor"
                        value={actionButtonTextColor}
                        onChange={setActionButtonTextColor}
                        autoComplete="off"
                        prefix="#"
                      />
                      <TextField
                        label="Button Background Color"
                        name="actionButtonBackgroundColor"
                        value={actionButtonBackgroundColor}
                        onChange={setActionButtonBackgroundColor}
                        autoComplete="off"
                        prefix="#"
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
                        prefix="#"
                        helpText="Main background color for the banner"
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
                      {isSubmitting ? "Creating Banner..." : isRedirecting ? "Redirecting..." : "Create Banner"}
                    </Button>
                    <Button url="/app/manage-banners" disabled={isSubmitting || isRedirecting}>
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