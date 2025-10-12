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
import { authenticate } from "../shopify.server"
import prisma from "app/db.server"

// ---- Types ----
interface StaticBannerSlide {
  message: string
  isTimer: boolean
  startTime: string
  endTime: string
  hasCoupon: boolean
  couponCode: string
}

interface LoaderData {
  staticBanner: {
    id: string
    isActive: boolean
    bannerWidth: string
    customWidth: string | null
    bannerHeight: string
    customHeight: string | null
    bannerPadding: string
    bannerLeftMargin: string
    bannerRightMargin: string
    bannerTopMargin: string
    bannerBottomMargin: string
    bannerBorderRadius: string
    priority: number
    messageFontSize: string
    messagePosition: string
    messageColor: string
    messagePadding: string
    timerBackgroundColor: string
    timerBorderColor: string
    timerPadding: string
    timerTextColor: string
    timerFontSize: string
    couponBackgroundColor: string
    couponBorderColor: string
    couponTextColor: string
    couponFontSize: string
    couponPadding: string
    bgColor: string
  }
  slides: Array<{
    id: string
    message: string
    isTimer: boolean
    startTime: string | null
    endTime: string | null
    hasCoupon: boolean
    couponCode: string | null
    order: number
  }>
}

// ---- Loader ----
export async function loader({ request, params }: LoaderFunctionArgs) {
  const auth = await authenticate.admin(request)
  if (auth instanceof Response) {
    return auth
  }

  const { id } = params
  if (!id) {
    throw new Response("Not Found", { status: 404 })
  }

  // Fetch static banner with slides
  const staticBanner = await (prisma as any).staticBanner.findUnique({
    where: { id },
    include: {
      slides: {
        orderBy: { order: "asc" },
      },
    },
  })

  if (!staticBanner) {
    throw new Response("Not Found", { status: 404 })
  }

  // Transform data for the frontend
  const loaderData: LoaderData = {
    staticBanner: {
      id: staticBanner.id,
      isActive: staticBanner.isActive,
      bannerWidth: staticBanner.bannerWidth,
      customWidth: staticBanner.customWidth,
      bannerHeight: staticBanner.bannerHeight,
      customHeight: staticBanner.customHeight,
      bannerPadding: staticBanner.bannerPadding,
      bannerLeftMargin: staticBanner.bannerLeftMargin,
      bannerRightMargin: staticBanner.bannerRightMargin,
      bannerTopMargin: staticBanner.bannerTopMargin,
      bannerBottomMargin: staticBanner.bannerBottomMargin,
      bannerBorderRadius: staticBanner.bannerBorderRadius,
      priority: staticBanner.priority,
      messageFontSize: staticBanner.messageFontSize,
      messagePosition: staticBanner.messagePosition,
      messageColor: staticBanner.messageColor.replace("#", ""),
      messagePadding: staticBanner.messagePadding,
      timerBackgroundColor: staticBanner.timerBackgroundColor.replace("#", ""),
      timerBorderColor: staticBanner.timerBorderColor.replace("#", ""),
      timerPadding: staticBanner.timerPadding,
      timerTextColor: staticBanner.timerTextColor.replace("#", ""),
      timerFontSize: staticBanner.timerFontSize,
      couponBackgroundColor: staticBanner.couponBackgroundColor.replace("#", ""),
      couponBorderColor: staticBanner.couponBorderColor.replace("#", ""),
      couponTextColor: staticBanner.couponTextColor.replace("#", ""),
      couponFontSize: staticBanner.couponFontSize,
      couponPadding: staticBanner.couponPadding,
      bgColor: staticBanner.bgColor.replace("#", ""),
    },
    slides: staticBanner.slides.map((slide: any) => ({
      id: slide.id,
      message: slide.message,
      isTimer: slide.isTimer,
      startTime: slide.startTime ? new Date(slide.startTime).toISOString().slice(0, 16) : null,
      endTime: slide.endTime ? new Date(slide.endTime).toISOString().slice(0, 16) : null,
      hasCoupon: slide.hasCoupon,
      couponCode: slide.couponCode,
      order: slide.order,
    })),
  }

  return json(loaderData)
}

// ---- Action ----
export async function action({ request, params }: ActionFunctionArgs) {
  const auth = await authenticate.admin(request)
  if (auth instanceof Response) {
    return auth
  }

  const { id } = params
  if (!id) {
    throw new Response("Not Found", { status: 404 })
  }

  const formData = await request.formData()
  const intent = formData.get("_intent")

  if (intent === "update") {
    // Parse slides from form data
    const slidesJson = String(formData.get("slides") || "[]")
    const slides = JSON.parse(slidesJson) as StaticBannerSlide[]

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

    // Message Carousel System
    const areMessagesCarousel = slides.length > 1
    const messages = JSON.stringify(slides.map(s => s.message))
    const messageFontSize = String(formData.get("messageFontSize") || "16")
    const messagePosition = String(formData.get("messagePosition") || "left")
    const messageColor = "#" + String(formData.get("messageColor") || "2d3748")
    const messagePadding = String(formData.get("messagePadding") || "12")

    // Timer System (from first slide)
    const isTimer = slides.length > 0 && slides[0].isTimer
    const startTime = isTimer && slides[0].startTime ? new Date(slides[0].startTime) : null
    const endTime = isTimer && slides[0].endTime ? new Date(slides[0].endTime) : null
    const timerBackgroundColor = "#" + String(formData.get("timerBackgroundColor") || "f7fafc")
    const timerBorderColor = "#" + String(formData.get("timerBorderColor") || "e2e8f0")
    const timerPadding = String(formData.get("timerPadding") || "8")
    const timerTextColor = "#" + String(formData.get("timerTextColor") || "2d3748")
    const timerFontSize = String(formData.get("timerFontSize") || "14")

    // Coupon System (from first slide)
    const hasCoupon = slides.length > 0 && slides[0].hasCoupon
    const couponCode = slides.length > 0 ? slides[0].couponCode : ""
    const couponBackgroundColor = "#" + String(formData.get("couponBackgroundColor") || "fef3c7")
    const couponBorderColor = "#" + String(formData.get("couponBorderColor") || "f59e0b")
    const couponTextColor = "#" + String(formData.get("couponTextColor") || "92400e")
    const couponFontSize = String(formData.get("couponFontSize") || "14")
    const couponPadding = String(formData.get("couponPadding") || "8")

    // Background
    const bgColor = "#" + String(formData.get("bgColor") || "ffffff")

    const isActive = formData.get("isActive") === "true"

    // Update static banner
    await (prisma as any).staticBanner.update({
      where: { id },
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
        hasCoupon,
        couponCode: hasCoupon && couponCode ? couponCode : null,
        couponBackgroundColor,
        couponBorderColor,
        couponTextColor,
        couponFontSize,
        couponPadding,
        bgColor,
      },
    })

    // Delete all existing slides
    await (prisma as any).staticBannerSlide.deleteMany({
      where: { staticBannerId: id },
    })

    // Create new slides
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      
      const slideData = {
        staticBannerId: id,
        order: i,
        message: slide.message,
        isTimer: slide.isTimer,
        startTime: slide.isTimer && slide.startTime ? new Date(slide.startTime) : null,
        endTime: slide.isTimer && slide.endTime ? new Date(slide.endTime) : null,
        hasCoupon: slide.hasCoupon,
        couponCode: slide.hasCoupon ? slide.couponCode : null,
      }
      
      await (prisma as any).staticBannerSlide.create({
        data: slideData,
      })
    }

    return redirect("/app/manage-static-banners")
  }

  return redirect("/app/manage-static-banners")
}

// ---- UI ----
export default function EditStaticBannerPage() {
  const loaderData = useLoaderData<typeof loader>()
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
    couponBackgroundColor: "fef3c7",
    couponBorderColor: "f59e0b",
    couponTextColor: "92400e",
    couponFontSize: "14",
    couponPadding: "8",
    bgColor: "ffffff",
    bannerPadding: "16",
    bannerTopMargin: "0",
    bannerBottomMargin: "0", 
    bannerLeftMargin: "0",
    bannerRightMargin: "0",
    bannerBorderRadius: "12"
  }

  // Banner Layout & Positioning - Initialize from loader data
  const [isActive, setIsActive] = useState(loaderData.staticBanner.isActive)
  const [bannerWidth, setBannerWidth] = useState(loaderData.staticBanner.bannerWidth)
  const [customWidth, setCustomWidth] = useState(loaderData.staticBanner.customWidth || "")
  const [bannerHeight, setBannerHeight] = useState(loaderData.staticBanner.bannerHeight)
  const [customHeight, setCustomHeight] = useState(loaderData.staticBanner.customHeight || "")
  const [bannerPadding, setBannerPadding] = useState(loaderData.staticBanner.bannerPadding)
  const [bannerLeftMargin, setBannerLeftMargin] = useState(loaderData.staticBanner.bannerLeftMargin)
  const [bannerRightMargin, setBannerRightMargin] = useState(loaderData.staticBanner.bannerRightMargin)
  const [bannerTopMargin, setBannerTopMargin] = useState(loaderData.staticBanner.bannerTopMargin)
  const [bannerBottomMargin, setBannerBottomMargin] = useState(loaderData.staticBanner.bannerBottomMargin)
  const [bannerBorderRadius, setBannerBorderRadius] = useState(loaderData.staticBanner.bannerBorderRadius)
  const [priority, setPriority] = useState(String(loaderData.staticBanner.priority))

  // Default slide with prefilled professional content
  const defaultSlide: StaticBannerSlide = {
    message: "🎉 Special Offer! Limited Time Only",
    isTimer: true,
    startTime: "",
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    hasCoupon: true,
    couponCode: "SAVE20"
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
    setCouponBackgroundColor(defaultSettings.couponBackgroundColor)
    setCouponBorderColor(defaultSettings.couponBorderColor)
    setCouponTextColor(defaultSettings.couponTextColor)
    setCouponFontSize(defaultSettings.couponFontSize)
    setCouponPadding(defaultSettings.couponPadding)
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

  // Slide System - Initialize from loader data
  const [slides, setSlides] = useState<StaticBannerSlide[]>(() => {
    return loaderData.slides.map((slide: any) => ({
      message: slide.message,
      isTimer: slide.isTimer,
      startTime: slide.startTime || "",
      endTime: slide.endTime || "",
      hasCoupon: slide.hasCoupon,
      couponCode: slide.couponCode || ""
    }))
  })

  // Use ref to keep track of latest slides state
  const slidesRef = useRef(slides)

  // Update ref whenever slides change
  useEffect(() => {
    slidesRef.current = slides
  }, [slides])

  // Styling (global) - Initialize from loader data
  const [messageFontSize, setMessageFontSize] = useState(loaderData.staticBanner.messageFontSize)
  const [messagePosition, setMessagePosition] = useState(loaderData.staticBanner.messagePosition)
  const [messageColor, setMessageColor] = useState(loaderData.staticBanner.messageColor)
  const [messagePadding, setMessagePadding] = useState(loaderData.staticBanner.messagePadding)
  const [timerBackgroundColor, setTimerBackgroundColor] = useState(loaderData.staticBanner.timerBackgroundColor)
  const [timerBorderColor, setTimerBorderColor] = useState(loaderData.staticBanner.timerBorderColor)
  const [timerPadding, setTimerPadding] = useState(loaderData.staticBanner.timerPadding)
  const [timerTextColor, setTimerTextColor] = useState(loaderData.staticBanner.timerTextColor)
  const [timerFontSize, setTimerFontSize] = useState(loaderData.staticBanner.timerFontSize)
  const [couponBackgroundColor, setCouponBackgroundColor] = useState(loaderData.staticBanner.couponBackgroundColor)
  const [couponBorderColor, setCouponBorderColor] = useState(loaderData.staticBanner.couponBorderColor)
  const [couponTextColor, setCouponTextColor] = useState(loaderData.staticBanner.couponTextColor)
  const [couponFontSize, setCouponFontSize] = useState(loaderData.staticBanner.couponFontSize)
  const [couponPadding, setCouponPadding] = useState(loaderData.staticBanner.couponPadding)

  // Background - Initialize from loader data
  const [bgColor, setBgColor] = useState(loaderData.staticBanner.bgColor)

  // Helper functions for slides
  const addSlide = () => {
    setSlides([...slides, {
      ...defaultSlide,
      message: "🎯 New Offer Available!",
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      couponCode: "NEW10"
    }])
  }

  const removeSlide = (index: number) => {
    if (slides.length > 1) {
      setSlides(slides.filter((_, i) => i !== index))
    }
  }

  const updateSlide = (index: number, field: keyof StaticBannerSlide, value: any) => {
    const newSlides = [...slides]
    newSlides[index] = { ...newSlides[index], [field]: value }
    setSlides(newSlides)
  }

  return (
    <Page>
      <TitleBar title="Edit Static Banner" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd">
                  Static Banner Configuration
                </Text>
               
                <InlineStack gap="200">
                  <Button 
                    variant="secondary" 
                    size="slim"
                    onClick={resetToDefaults}
                  >
                    Reset to Defaults
                  </Button>
                </InlineStack>
              </InlineStack>

              <Form method="post">
                <input type="hidden" name="_intent" value="update" />
                <input type="hidden" name="isActive" value={isActive.toString()} />
                
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
                        label="Activate Static Banner" 
                        checked={isActive} 
                        onChange={setIsActive}
                        helpText="Enable this static banner to display wherever you place it in your theme"
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
                        Each slide can have its own message, timer, and coupon code. Add multiple slides to create a carousel.
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

                            <TextField
                              label="Message"
                              value={slide.message}
                              onChange={(value) => updateSlide(index, "message", value)}
                              autoComplete="off"
                              placeholder="Enter your message..."
                            />

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

                            <Checkbox 
                              label="Enable Coupon for this slide" 
                              checked={slide.hasCoupon} 
                              onChange={(value) => updateSlide(index, "hasCoupon", value)}
                            />

                            {slide.hasCoupon && (
                              <TextField
                                label="Coupon Code"
                                value={slide.couponCode}
                                onChange={(value) => updateSlide(index, "couponCode", value)}
                                placeholder="Enter coupon code..."
                                autoComplete="off"
                              />
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

                  {/* Global Coupon Styling */}
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingMd">
                        Global Coupon Styling
                      </Text>
                      <TextField
                        label="Coupon Background Color"
                        name="couponBackgroundColor"
                        value={couponBackgroundColor}
                        onChange={setCouponBackgroundColor}
                        autoComplete="off"
                        helpText="Enter hex color code (e.g., fef3c7 for light yellow)"
                      />
                      <TextField
                        label="Coupon Border Color"
                        name="couponBorderColor"
                        value={couponBorderColor}
                        onChange={setCouponBorderColor}
                        autoComplete="off"
                      />
                      <TextField
                        label="Coupon Text Color"
                        name="couponTextColor"
                        value={couponTextColor}
                        onChange={setCouponTextColor}
                        autoComplete="off"
                      />
                      <TextField
                        label="Coupon Font Size (px)"
                        type="number"
                        name="couponFontSize"
                        value={couponFontSize}
                        onChange={setCouponFontSize}
                        autoComplete="off"
                      />
                      <TextField
                        label="Coupon Padding (px)"
                        type="number"
                        name="couponPadding"
                        value={couponPadding}
                        onChange={setCouponPadding}
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
                      {isSubmitting ? "Updating Static Banner..." : isRedirecting ? "Redirecting..." : "Update Static Banner"}
                    </Button>
                    <Button url="/app/manage-static-banners" disabled={isSubmitting || isRedirecting}>
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
