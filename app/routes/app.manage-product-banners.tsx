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
  Divider,
  Toast,
  Frame,
  DataTable,
  Badge,
  Tabs,
  EmptyState,
} from "@shopify/polaris"
import { TitleBar } from "@shopify/app-bridge-react"
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { Form, useLoaderData, useNavigation, useActionData } from "@remix-run/react"
import { useState, useCallback, useEffect } from "react"
import prisma from "app/db.server"
import { authenticate } from "../shopify.server"

// Default values matching product-banner.liquid
const defaultSettings = {
  bannerHeight: "130",
  bannerImageHeight: "80",
  bannerPadding: "10",
  bannerTitleFontSize: "15",
  bannerTitleColor: "111827",
  bannerPriceFontSize: "14",
  bannerPriceColor: "6b7280",
  showPrice: true,
  button1TextColor: "ffffff",
  button1BackgroundColor: "FF6B6B",
  button1BorderColor: "FF6B6B",
  button2TextColor: "FF6B6B",
  button2BackgroundColor: "ffffff",
  button2BorderColor: "FF6B6B",
  hurryUpBannerHeight: "30",
  hurryUpBannerBackgroundColor: "FF6B6B",
  hurryUpTextColor: "ffffff",
  hurryUpFontSize: "14",
  mobileBannerHeight: "90",
  mobileBannerBorderRadius: "8",
  mobileBannerMargin: "10",
  mobileProductHeight: "60",
  mobileProductPadding: "12px 16px",
  mobileTitleFontSize: "16",
  mobileTitleColor: "111827",
  mobilePriceFontSize: "14",
  mobilePriceColor: "6b7280",
  mobileButtonHeight: "40",
  mobileButtonPadding: "12px 20px",
  mobileButtonFontSize: "16",
  mobileButtonBorderRadius: "6",
  mobileButtonTextColor: "ffffff",
  mobileButtonBackgroundColor: "FF6B6B",
  mobileHurryUpHeight: "30",
  mobileHurryUpFontSize: "14",
  mobileHurryUpBackgroundColor: "FF6B6B",
  mobileHurryUpTextColor: "ffffff",
}

// Loader
export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await authenticate.admin(request)
  if (auth instanceof Response) {
    return auth
  }

  try {
    const settings = await (prisma as any).productBannerSettings.findFirst()
    
    // Fetch all products with their customizations
    const products = await (prisma as any).product.findMany({
      orderBy: { title: "asc" },
      include: {
        productBannerCustomization: true
      }
    })

    return json({ 
      settings: settings || defaultSettings,
      products 
    })
  } catch (error) {
    console.error("Loader error:", error)
    return json({ settings: defaultSettings, products: [] })
  }
}

// Action
export async function action({ request }: ActionFunctionArgs) {
  const auth = await authenticate.admin(request)
  if (auth instanceof Response) {
    return auth
  }

  const formData = await request.formData()
  const intent = formData.get("_intent")

  if (intent === "update") {
    const stripHash = (color: string) => color?.replace('#', '') || ''

    const settingsData = {
      bannerHeight: String(formData.get("bannerHeight") || defaultSettings.bannerHeight),
      bannerImageHeight: String(formData.get("bannerImageHeight") || defaultSettings.bannerImageHeight),
      bannerPadding: String(formData.get("bannerPadding") || defaultSettings.bannerPadding),
      bannerTitleFontSize: String(formData.get("bannerTitleFontSize") || defaultSettings.bannerTitleFontSize),
      bannerTitleColor: stripHash(String(formData.get("bannerTitleColor") || defaultSettings.bannerTitleColor)),
      bannerPriceFontSize: String(formData.get("bannerPriceFontSize") || defaultSettings.bannerPriceFontSize),
      bannerPriceColor: stripHash(String(formData.get("bannerPriceColor") || defaultSettings.bannerPriceColor)),
      showPrice: formData.get("showPrice") === "true",
      button1TextColor: stripHash(String(formData.get("button1TextColor") || defaultSettings.button1TextColor)),
      button1BackgroundColor: stripHash(String(formData.get("button1BackgroundColor") || defaultSettings.button1BackgroundColor)),
      button1BorderColor: stripHash(String(formData.get("button1BorderColor") || defaultSettings.button1BorderColor)),
      button2TextColor: stripHash(String(formData.get("button2TextColor") || defaultSettings.button2TextColor)),
      button2BackgroundColor: stripHash(String(formData.get("button2BackgroundColor") || defaultSettings.button2BackgroundColor)),
      button2BorderColor: stripHash(String(formData.get("button2BorderColor") || defaultSettings.button2BorderColor)),
      hurryUpBannerHeight: String(formData.get("hurryUpBannerHeight") || defaultSettings.hurryUpBannerHeight),
      hurryUpBannerBackgroundColor: stripHash(String(formData.get("hurryUpBannerBackgroundColor") || defaultSettings.hurryUpBannerBackgroundColor)),
      hurryUpTextColor: stripHash(String(formData.get("hurryUpTextColor") || defaultSettings.hurryUpTextColor)),
      hurryUpFontSize: String(formData.get("hurryUpFontSize") || defaultSettings.hurryUpFontSize),
      mobileBannerHeight: String(formData.get("mobileBannerHeight") || defaultSettings.mobileBannerHeight),
      mobileBannerBorderRadius: String(formData.get("mobileBannerBorderRadius") || defaultSettings.mobileBannerBorderRadius),
      mobileBannerMargin: String(formData.get("mobileBannerMargin") || defaultSettings.mobileBannerMargin),
      mobileProductHeight: String(formData.get("mobileProductHeight") || defaultSettings.mobileProductHeight),
      mobileProductPadding: String(formData.get("mobileProductPadding") || defaultSettings.mobileProductPadding),
      mobileTitleFontSize: String(formData.get("mobileTitleFontSize") || defaultSettings.mobileTitleFontSize),
      mobileTitleColor: stripHash(String(formData.get("mobileTitleColor") || defaultSettings.mobileTitleColor)),
      mobilePriceFontSize: String(formData.get("mobilePriceFontSize") || defaultSettings.mobilePriceFontSize),
      mobilePriceColor: stripHash(String(formData.get("mobilePriceColor") || defaultSettings.mobilePriceColor)),
      mobileButtonHeight: String(formData.get("mobileButtonHeight") || defaultSettings.mobileButtonHeight),
      mobileButtonPadding: String(formData.get("mobileButtonPadding") || defaultSettings.mobileButtonPadding),
      mobileButtonFontSize: String(formData.get("mobileButtonFontSize") || defaultSettings.mobileButtonFontSize),
      mobileButtonBorderRadius: String(formData.get("mobileButtonBorderRadius") || defaultSettings.mobileButtonBorderRadius),
      mobileButtonTextColor: stripHash(String(formData.get("mobileButtonTextColor") || defaultSettings.mobileButtonTextColor)),
      mobileButtonBackgroundColor: stripHash(String(formData.get("mobileButtonBackgroundColor") || defaultSettings.mobileButtonBackgroundColor)),
      mobileHurryUpHeight: String(formData.get("mobileHurryUpHeight") || defaultSettings.mobileHurryUpHeight),
      mobileHurryUpFontSize: String(formData.get("mobileHurryUpFontSize") || defaultSettings.mobileHurryUpFontSize),
      mobileHurryUpBackgroundColor: stripHash(String(formData.get("mobileHurryUpBackgroundColor") || defaultSettings.mobileHurryUpBackgroundColor)),
      mobileHurryUpTextColor: stripHash(String(formData.get("mobileHurryUpTextColor") || defaultSettings.mobileHurryUpTextColor)),
    }

    try {
      const existing = await (prisma as any).productBannerSettings.findFirst()

      if (existing) {
        await (prisma as any).productBannerSettings.update({
          where: { id: existing.id },
          data: settingsData,
        })
      } else {
        await (prisma as any).productBannerSettings.create({
          data: settingsData,
        })
      }

      return json({ success: true, message: "Settings updated successfully" })
    } catch (error) {
      console.error("Action error:", error)
      return json({ success: false, error: String(error) }, { status: 500 })
    }
  }

  return json({ success: false, error: "Invalid action" })
}

// UI Component
export default function ManageProductBannersPage() {
  const { settings, products } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"

  const stripHash = (color: string) => color?.replace('#', '') || ''

  const [selectedTab, setSelectedTab] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)


  // Handle toast dismiss
  const handleSuccessToastDismiss = useCallback(() => {
    setShowSuccessToast(false)
  }, [])

  const handleErrorToastDismiss = useCallback(() => {
    setShowErrorToast(false)
  }, [])

  // Handle toast state changes
  useEffect(() => {
    if (actionData?.success) {
      setShowSuccessToast(true)
      setIsEditMode(false)
    }
    if (actionData?.success === false && actionData?.error) {
      setShowErrorToast(true)
    }
  }, [actionData])

  // State for all settings
  const [bannerHeight, setBannerHeight] = useState(String(settings?.bannerHeight || defaultSettings.bannerHeight))
  const [bannerImageHeight, setBannerImageHeight] = useState(String(settings?.bannerImageHeight || defaultSettings.bannerImageHeight))
  const [bannerPadding, setBannerPadding] = useState(String(settings?.bannerPadding || defaultSettings.bannerPadding))
  const [bannerTitleFontSize, setBannerTitleFontSize] = useState(String(settings?.bannerTitleFontSize || defaultSettings.bannerTitleFontSize))
  const [bannerTitleColor, setBannerTitleColor] = useState(stripHash(String(settings?.bannerTitleColor || defaultSettings.bannerTitleColor)))
  const [bannerPriceFontSize, setBannerPriceFontSize] = useState(String(settings?.bannerPriceFontSize || defaultSettings.bannerPriceFontSize))
  const [bannerPriceColor, setBannerPriceColor] = useState(stripHash(String(settings?.bannerPriceColor || defaultSettings.bannerPriceColor)))
  const [showPrice, setShowPrice] = useState(settings?.showPrice ?? defaultSettings.showPrice)
  const [button1TextColor, setButton1TextColor] = useState(stripHash(String(settings?.button1TextColor || defaultSettings.button1TextColor)))
  const [button1BackgroundColor, setButton1BackgroundColor] = useState(stripHash(String(settings?.button1BackgroundColor || defaultSettings.button1BackgroundColor)))
  const [button1BorderColor, setButton1BorderColor] = useState(stripHash(String(settings?.button1BorderColor || defaultSettings.button1BorderColor)))
  const [button2TextColor, setButton2TextColor] = useState(stripHash(String(settings?.button2TextColor || defaultSettings.button2TextColor)))
  const [button2BackgroundColor, setButton2BackgroundColor] = useState(stripHash(String(settings?.button2BackgroundColor || defaultSettings.button2BackgroundColor)))
  const [button2BorderColor, setButton2BorderColor] = useState(stripHash(String(settings?.button2BorderColor || defaultSettings.button2BorderColor)))
  const [hurryUpBannerHeight, setHurryUpBannerHeight] = useState(String(settings?.hurryUpBannerHeight || defaultSettings.hurryUpBannerHeight))
  const [hurryUpBannerBackgroundColor, setHurryUpBannerBackgroundColor] = useState(stripHash(String(settings?.hurryUpBannerBackgroundColor || defaultSettings.hurryUpBannerBackgroundColor)))
  const [hurryUpTextColor, setHurryUpTextColor] = useState(stripHash(String(settings?.hurryUpTextColor || defaultSettings.hurryUpTextColor)))
  const [hurryUpFontSize, setHurryUpFontSize] = useState(String(settings?.hurryUpFontSize || defaultSettings.hurryUpFontSize))
  const [mobileBannerHeight, setMobileBannerHeight] = useState(String(settings?.mobileBannerHeight || defaultSettings.mobileBannerHeight))
  const [mobileBannerBorderRadius, setMobileBannerBorderRadius] = useState(String(settings?.mobileBannerBorderRadius || defaultSettings.mobileBannerBorderRadius))
  const [mobileBannerMargin, setMobileBannerMargin] = useState(String(settings?.mobileBannerMargin || defaultSettings.mobileBannerMargin))
  const [mobileProductHeight, setMobileProductHeight] = useState(String(settings?.mobileProductHeight || defaultSettings.mobileProductHeight))
  const [mobileProductPadding, setMobileProductPadding] = useState(String(settings?.mobileProductPadding || defaultSettings.mobileProductPadding))
  const [mobileTitleFontSize, setMobileTitleFontSize] = useState(String(settings?.mobileTitleFontSize || defaultSettings.mobileTitleFontSize))
  const [mobileTitleColor, setMobileTitleColor] = useState(stripHash(String(settings?.mobileTitleColor || defaultSettings.mobileTitleColor)))
  const [mobilePriceFontSize, setMobilePriceFontSize] = useState(String(settings?.mobilePriceFontSize || defaultSettings.mobilePriceFontSize))
  const [mobilePriceColor, setMobilePriceColor] = useState(stripHash(String(settings?.mobilePriceColor || defaultSettings.mobilePriceColor)))
  const [mobileButtonHeight, setMobileButtonHeight] = useState(String(settings?.mobileButtonHeight || defaultSettings.mobileButtonHeight))
  const [mobileButtonPadding, setMobileButtonPadding] = useState(String(settings?.mobileButtonPadding || defaultSettings.mobileButtonPadding))
  const [mobileButtonFontSize, setMobileButtonFontSize] = useState(String(settings?.mobileButtonFontSize || defaultSettings.mobileButtonFontSize))
  const [mobileButtonBorderRadius, setMobileButtonBorderRadius] = useState(String(settings?.mobileButtonBorderRadius || defaultSettings.mobileButtonBorderRadius))
  const [mobileButtonTextColor, setMobileButtonTextColor] = useState(stripHash(String(settings?.mobileButtonTextColor || defaultSettings.mobileButtonTextColor)))
  const [mobileButtonBackgroundColor, setMobileButtonBackgroundColor] = useState(stripHash(String(settings?.mobileButtonBackgroundColor || defaultSettings.mobileButtonBackgroundColor)))
  const [mobileHurryUpHeight, setMobileHurryUpHeight] = useState(String(settings?.mobileHurryUpHeight || defaultSettings.mobileHurryUpHeight))
  const [mobileHurryUpFontSize, setMobileHurryUpFontSize] = useState(String(settings?.mobileHurryUpFontSize || defaultSettings.mobileHurryUpFontSize))
  const [mobileHurryUpBackgroundColor, setMobileHurryUpBackgroundColor] = useState(stripHash(String(settings?.mobileHurryUpBackgroundColor || defaultSettings.mobileHurryUpBackgroundColor)))
  const [mobileHurryUpTextColor, setMobileHurryUpTextColor] = useState(stripHash(String(settings?.mobileHurryUpTextColor || defaultSettings.mobileHurryUpTextColor)))

  const resetToDefaults = () => {
    setBannerHeight(defaultSettings.bannerHeight)
    setBannerImageHeight(defaultSettings.bannerImageHeight)
    setBannerPadding(defaultSettings.bannerPadding)
    setBannerTitleFontSize(defaultSettings.bannerTitleFontSize)
    setBannerTitleColor(defaultSettings.bannerTitleColor)
    setBannerPriceFontSize(defaultSettings.bannerPriceFontSize)
    setBannerPriceColor(defaultSettings.bannerPriceColor)
    setShowPrice(defaultSettings.showPrice)
    setButton1TextColor(defaultSettings.button1TextColor)
    setButton1BackgroundColor(defaultSettings.button1BackgroundColor)
    setButton1BorderColor(defaultSettings.button1BorderColor)
    setButton2TextColor(defaultSettings.button2TextColor)
    setButton2BackgroundColor(defaultSettings.button2BackgroundColor)
    setButton2BorderColor(defaultSettings.button2BorderColor)
    setHurryUpBannerHeight(defaultSettings.hurryUpBannerHeight)
    setHurryUpBannerBackgroundColor(defaultSettings.hurryUpBannerBackgroundColor)
    setHurryUpTextColor(defaultSettings.hurryUpTextColor)
    setHurryUpFontSize(defaultSettings.hurryUpFontSize)
    setMobileBannerHeight(defaultSettings.mobileBannerHeight)
    setMobileBannerBorderRadius(defaultSettings.mobileBannerBorderRadius)
    setMobileBannerMargin(defaultSettings.mobileBannerMargin)
    setMobileProductHeight(defaultSettings.mobileProductHeight)
    setMobileProductPadding(defaultSettings.mobileProductPadding)
    setMobileTitleFontSize(defaultSettings.mobileTitleFontSize)
    setMobileTitleColor(defaultSettings.mobileTitleColor)
    setMobilePriceFontSize(defaultSettings.mobilePriceFontSize)
    setMobilePriceColor(defaultSettings.mobilePriceColor)
    setMobileButtonHeight(defaultSettings.mobileButtonHeight)
    setMobileButtonPadding(defaultSettings.mobileButtonPadding)
    setMobileButtonFontSize(defaultSettings.mobileButtonFontSize)
    setMobileButtonBorderRadius(defaultSettings.mobileButtonBorderRadius)
    setMobileButtonTextColor(defaultSettings.mobileButtonTextColor)
    setMobileButtonBackgroundColor(defaultSettings.mobileButtonBackgroundColor)
    setMobileHurryUpHeight(defaultSettings.mobileHurryUpHeight)
    setMobileHurryUpFontSize(defaultSettings.mobileHurryUpFontSize)
    setMobileHurryUpBackgroundColor(defaultSettings.mobileHurryUpBackgroundColor)
    setMobileHurryUpTextColor(defaultSettings.mobileHurryUpTextColor)
  }

  const handleCancel = () => {
    setIsEditMode(false)
    setBannerHeight(String(settings?.bannerHeight || defaultSettings.bannerHeight))
    setBannerImageHeight(String(settings?.bannerImageHeight || defaultSettings.bannerImageHeight))
    setBannerPadding(String(settings?.bannerPadding || defaultSettings.bannerPadding))
    setBannerTitleFontSize(String(settings?.bannerTitleFontSize || defaultSettings.bannerTitleFontSize))
    setBannerTitleColor(stripHash(String(settings?.bannerTitleColor || defaultSettings.bannerTitleColor)))
    setBannerPriceFontSize(String(settings?.bannerPriceFontSize || defaultSettings.bannerPriceFontSize))
    setBannerPriceColor(stripHash(String(settings?.bannerPriceColor || defaultSettings.bannerPriceColor)))
    setShowPrice(settings?.showPrice ?? defaultSettings.showPrice)
    setButton1TextColor(stripHash(String(settings?.button1TextColor || defaultSettings.button1TextColor)))
    setButton1BackgroundColor(stripHash(String(settings?.button1BackgroundColor || defaultSettings.button1BackgroundColor)))
    setButton1BorderColor(stripHash(String(settings?.button1BorderColor || defaultSettings.button1BorderColor)))
    setButton2TextColor(stripHash(String(settings?.button2TextColor || defaultSettings.button2TextColor)))
    setButton2BackgroundColor(stripHash(String(settings?.button2BackgroundColor || defaultSettings.button2BackgroundColor)))
    setButton2BorderColor(stripHash(String(settings?.button2BorderColor || defaultSettings.button2BorderColor)))
    setHurryUpBannerHeight(String(settings?.hurryUpBannerHeight || defaultSettings.hurryUpBannerHeight))
    setHurryUpBannerBackgroundColor(stripHash(String(settings?.hurryUpBannerBackgroundColor || defaultSettings.hurryUpBannerBackgroundColor)))
    setHurryUpTextColor(stripHash(String(settings?.hurryUpTextColor || defaultSettings.hurryUpTextColor)))
    setHurryUpFontSize(String(settings?.hurryUpFontSize || defaultSettings.hurryUpFontSize))
    setMobileBannerHeight(String(settings?.mobileBannerHeight || defaultSettings.mobileBannerHeight))
    setMobileBannerBorderRadius(String(settings?.mobileBannerBorderRadius || defaultSettings.mobileBannerBorderRadius))
    setMobileBannerMargin(String(settings?.mobileBannerMargin || defaultSettings.mobileBannerMargin))
    setMobileProductHeight(String(settings?.mobileProductHeight || defaultSettings.mobileProductHeight))
    setMobileProductPadding(String(settings?.mobileProductPadding || defaultSettings.mobileProductPadding))
    setMobileTitleFontSize(String(settings?.mobileTitleFontSize || defaultSettings.mobileTitleFontSize))
    setMobileTitleColor(stripHash(String(settings?.mobileTitleColor || defaultSettings.mobileTitleColor)))
    setMobilePriceFontSize(String(settings?.mobilePriceFontSize || defaultSettings.mobilePriceFontSize))
    setMobilePriceColor(stripHash(String(settings?.mobilePriceColor || defaultSettings.mobilePriceColor)))
    setMobileButtonHeight(String(settings?.mobileButtonHeight || defaultSettings.mobileButtonHeight))
    setMobileButtonPadding(String(settings?.mobileButtonPadding || defaultSettings.mobileButtonPadding))
    setMobileButtonFontSize(String(settings?.mobileButtonFontSize || defaultSettings.mobileButtonFontSize))
    setMobileButtonBorderRadius(String(settings?.mobileButtonBorderRadius || defaultSettings.mobileButtonBorderRadius))
    setMobileButtonTextColor(stripHash(String(settings?.mobileButtonTextColor || defaultSettings.mobileButtonTextColor)))
    setMobileButtonBackgroundColor(stripHash(String(settings?.mobileButtonBackgroundColor || defaultSettings.mobileButtonBackgroundColor)))
    setMobileHurryUpHeight(String(settings?.mobileHurryUpHeight || defaultSettings.mobileHurryUpHeight))
    setMobileHurryUpFontSize(String(settings?.mobileHurryUpFontSize || defaultSettings.mobileHurryUpFontSize))
    setMobileHurryUpBackgroundColor(stripHash(String(settings?.mobileHurryUpBackgroundColor || defaultSettings.mobileHurryUpBackgroundColor)))
    setMobileHurryUpTextColor(stripHash(String(settings?.mobileHurryUpTextColor || defaultSettings.mobileHurryUpTextColor)))
  }

  // Prepare product rows for DataTable
  const productRows = products.map((product: any) => {
    const customization = product.productBannerCustomization
    const hasCustomization = !!customization
    
    return [
      // Product Image & Title
      <InlineStack gap="300" blockAlign="center">
        <div style={{ 
          width: "60px", 
          height: "60px", 
          borderRadius: "8px", 
          overflow: "hidden",
          flexShrink: 0,
          background: "#f3f4f6",
          border: "1px solid #e5e7eb"
        }}>
          {product.featuredImage ? (
            <img 
              src={product.featuredImage} 
              alt={product.title}
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "cover" 
              }}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: "24px"
            }}>
              📦
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text as="p" variant="bodyMd" fontWeight="semibold" truncate>
            {product.title}
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            {product.handle}
          </Text>
        </div>
      </InlineStack>,
      
      // Price
      <Text as="span" variant="bodySm" fontWeight="semibold">
        ${product.price} {product.currencyCode}
      </Text>,
      
      // Customization Status
      <Badge tone={hasCustomization ? "success" : "info"}>
        {hasCustomization ? "Custom" : "Default"}
      </Badge>,
      
      // Custom Settings Summary
      <div style={{ minWidth: "200px" }}>
        <InlineStack gap="100" wrap>
          {hasCustomization && (
            <>
              {!customization.isShowPrice && <Badge size="small" tone="warning">Price Hidden</Badge>}
              {!customization.isShowAddToCartButton && <Badge size="small" tone="warning">Add to Cart Hidden</Badge>}
              {!customization.isShowBuyNowButton && <Badge size="small" tone="warning">Buy Now Hidden</Badge>}
              {!customization.isShowHurryUpBanner && <Badge size="small" tone="warning">Hurry Up Hidden</Badge>}
            </>
          )}
          {!hasCustomization && (
            <Text as="span" variant="bodySm" tone="subdued">Using global settings</Text>
          )}
        </InlineStack>
      </div>,
      
      // Actions
      <Button
        size="slim"
        url={`/app/edit-product-banner/${product.id}`}
      >
        Edit
      </Button>,
    ]
  })

  const tabs = [
    {
      id: 'products',
      content: `Products (${products.length})`,
      panelID: 'products-panel',
    },
    {
      id: 'global-settings',
      content: 'Global Settings',
      panelID: 'global-settings-panel',
    },
  ]

  return (
    <Frame>
    <Page fullWidth>
      <TitleBar title="Product Banner Management" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Header */}
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingLg">
                  Product Banner Configuration
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Manage global banner settings and customize individual products
                </Text>
              </BlockStack>
            </Card>

            {/* Tabs */}
            <Card padding="0">
              <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
                {/* Products Tab */}
                {selectedTab === 0 && (
                  <BlockStack gap="400">
                    {/* Stats Summary */}
                    {products.length > 0 && (
                      <Card>
                        <BlockStack gap="300">
                          <Text as="h3" variant="headingMd">
                            Overview
                          </Text>
                          <InlineStack gap="600" wrap>
                            <div>
                              <Text as="p" variant="headingXl">
                                {products.length}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Total Products
                              </Text>
                            </div>
                            <div>
                              <Text as="p" variant="headingXl">
                                {products.filter((p: any) => p.productBannerCustomization).length}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Custom Banners
                              </Text>
                            </div>
                            <div>
                              <Text as="p" variant="headingXl">
                                {products.filter((p: any) => !p.productBannerCustomization).length}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Using Global Settings
                              </Text>
                            </div>
                          </InlineStack>
                        </BlockStack>
                      </Card>
                    )}

                    <Card>
                      <BlockStack gap="400">
                        <InlineStack align="space-between">
                          <Text as="h3" variant="headingMd">
                            Product List
                          </Text>
                          <Button url="/app/sync-products" variant="secondary">
                            Sync Products
                          </Button>
                        </InlineStack>

                      {products.length === 0 ? (
                        <EmptyState
                          heading="No products found"
                          action={{
                            content: "Sync Products",
                            url: "/app/sync-products",
                          }}
                          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        >
                          <Text as="p" variant="bodyMd">
                            Sync your products to customize their banner settings individually.
                          </Text>
                        </EmptyState>
                      ) : (
                        <div style={{ overflow: "auto" }}>
                          <DataTable
                            columnContentTypes={[
                              "text",
                              "numeric",
                              "text",
                              "text",
                              "text",
                            ]}
                            headings={[
                              "Product",
                              "Price",
                              "Status",
                              "Customizations",
                              "Actions",
                            ]}
                            rows={productRows}
                            hoverable
                            increasedTableDensity
                          />
                        </div>
                      )}
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}

                {/* Global Settings Tab */}
                {selectedTab === 1 && (
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between">
                        <Text as="h3" variant="headingMd">
                          Global Banner Settings
                        </Text>
                        <InlineStack gap="200">
                          {!isEditMode ? (
                            <Button variant="primary" onClick={() => setIsEditMode(true)}>
                              Edit Settings
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="secondary" 
                                size="slim"
                                onClick={resetToDefaults}
                              >
                                Reset to Defaults
                              </Button>
                              <Button 
                                variant="secondary" 
                                onClick={handleCancel}
                                disabled={isSubmitting}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </InlineStack>
                      </InlineStack>

                      <Text as="p" variant="bodySm" tone="subdued">
                        These settings apply to all products unless overridden by individual product customizations.
                      </Text>

                      <Form method="post">
                        <input type="hidden" name="_intent" value="update" />
                        <input type="hidden" name="showPrice" value={showPrice.toString()} />
                        
                {/* Hidden inputs for all form fields */}
                <input type="hidden" name="bannerHeight" value={bannerHeight} />
                <input type="hidden" name="bannerImageHeight" value={bannerImageHeight} />
                <input type="hidden" name="bannerPadding" value={bannerPadding} />
                <input type="hidden" name="bannerTitleFontSize" value={bannerTitleFontSize} />
                        <input type="hidden" name="bannerTitleColor" value={bannerTitleColor} />
                        <input type="hidden" name="bannerPriceFontSize" value={bannerPriceFontSize} />
                        <input type="hidden" name="bannerPriceColor" value={bannerPriceColor} />
                        <input type="hidden" name="button1TextColor" value={button1TextColor} />
                        <input type="hidden" name="button1BackgroundColor" value={button1BackgroundColor} />
                        <input type="hidden" name="button1BorderColor" value={button1BorderColor} />
                        <input type="hidden" name="button2TextColor" value={button2TextColor} />
                        <input type="hidden" name="button2BackgroundColor" value={button2BackgroundColor} />
                        <input type="hidden" name="button2BorderColor" value={button2BorderColor} />
                        <input type="hidden" name="hurryUpBannerHeight" value={hurryUpBannerHeight} />
                        <input type="hidden" name="hurryUpBannerBackgroundColor" value={hurryUpBannerBackgroundColor} />
                        <input type="hidden" name="hurryUpTextColor" value={hurryUpTextColor} />
                        <input type="hidden" name="hurryUpFontSize" value={hurryUpFontSize} />
                        <input type="hidden" name="mobileBannerHeight" value={mobileBannerHeight} />
                        <input type="hidden" name="mobileBannerBorderRadius" value={mobileBannerBorderRadius} />
                        <input type="hidden" name="mobileBannerMargin" value={mobileBannerMargin} />
                        <input type="hidden" name="mobileProductHeight" value={mobileProductHeight} />
                        <input type="hidden" name="mobileProductPadding" value={mobileProductPadding} />
                        <input type="hidden" name="mobileTitleFontSize" value={mobileTitleFontSize} />
                        <input type="hidden" name="mobileTitleColor" value={mobileTitleColor} />
                        <input type="hidden" name="mobilePriceFontSize" value={mobilePriceFontSize} />
                        <input type="hidden" name="mobilePriceColor" value={mobilePriceColor} />
                        <input type="hidden" name="mobileButtonHeight" value={mobileButtonHeight} />
                        <input type="hidden" name="mobileButtonPadding" value={mobileButtonPadding} />
                        <input type="hidden" name="mobileButtonFontSize" value={mobileButtonFontSize} />
                        <input type="hidden" name="mobileButtonBorderRadius" value={mobileButtonBorderRadius} />
                        <input type="hidden" name="mobileButtonTextColor" value={mobileButtonTextColor} />
                        <input type="hidden" name="mobileButtonBackgroundColor" value={mobileButtonBackgroundColor} />
                        <input type="hidden" name="mobileHurryUpHeight" value={mobileHurryUpHeight} />
                        <input type="hidden" name="mobileHurryUpFontSize" value={mobileHurryUpFontSize} />
                        <input type="hidden" name="mobileHurryUpBackgroundColor" value={mobileHurryUpBackgroundColor} />
                        <input type="hidden" name="mobileHurryUpTextColor" value={mobileHurryUpTextColor} />

                        <BlockStack gap="400">
                          {/* Desktop Banner Layout */}
                          <Card>
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingMd">
                                Desktop Banner Layout
                              </Text>

                              <InlineStack gap="200">
                                <TextField
                                  label="Banner Height (px)"
                                  name="bannerHeight"
                                  value={bannerHeight}
                                  onChange={setBannerHeight}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Banner Image Height (px)"
                                  name="bannerImageHeight"
                                  value={bannerImageHeight}
                                  onChange={setBannerImageHeight}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Banner Padding (px)"
                                  name="bannerPadding"
                                  value={bannerPadding}
                                  onChange={setBannerPadding}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                 
                                />
                              </InlineStack>
                            </BlockStack>
                          </Card>

                          {/* Desktop Title Styling */}
                          <Card>
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingMd">
                                Desktop Title Styling
                              </Text>

                              <InlineStack gap="200">
                                <TextField
                                  label="Title Font Size (px)"
                                  name="bannerTitleFontSize"
                                  value={bannerTitleFontSize}
                                  onChange={setBannerTitleFontSize}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Title Color (hex)"
                                  name="bannerTitleColor"
                                  value={bannerTitleColor}
                                  onChange={setBannerTitleColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                              </InlineStack>
                            </BlockStack>
                          </Card>

                          {/* Desktop Price Styling */}
                          <Card>
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingMd">
                                Desktop Price Styling
                              </Text>

                              <Checkbox 
                                label="Show Price" 
                                checked={showPrice} 
                                onChange={setShowPrice}
                                disabled={!isEditMode}
                              />

                              <InlineStack gap="200">
                                <TextField
                                  label="Price Font Size (px)"
                                  name="bannerPriceFontSize"
                                  value={bannerPriceFontSize}
                                  onChange={setBannerPriceFontSize}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Price Color (hex)"
                                  name="bannerPriceColor"
                                  value={bannerPriceColor}
                                  onChange={setBannerPriceColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                              </InlineStack>
                            </BlockStack>
                          </Card>

                          {/* Button 1 (Add to Cart) Styling */}
                          <Card>
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingMd">
                                Button 1 (Add to Cart) Styling
                              </Text>

                              <InlineStack gap="200">
                                <TextField
                                  label="Text Color (hex)"
                                  name="button1TextColor"
                                  value={button1TextColor}
                                  onChange={setButton1TextColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                                <TextField
                                  label="Background Color (hex)"
                                  name="button1BackgroundColor"
                                  value={button1BackgroundColor}
                                  onChange={setButton1BackgroundColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                                <TextField
                                  label="Border Color (hex)"
                                  name="button1BorderColor"
                                  value={button1BorderColor}
                                  onChange={setButton1BorderColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                              </InlineStack>
                            </BlockStack>
                          </Card>

                          {/* Button 2 (Buy Now) Styling */}
                          <Card>
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingMd">
                                Button 2 (Buy Now) Styling
                              </Text>

                              <InlineStack gap="200">
                                <TextField
                                  label="Text Color (hex)"
                                  name="button2TextColor"
                                  value={button2TextColor}
                                  onChange={setButton2TextColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                                <TextField
                                  label="Background Color (hex)"
                                  name="button2BackgroundColor"
                                  value={button2BackgroundColor}
                                  onChange={setButton2BackgroundColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                                <TextField
                                  label="Border Color (hex)"
                                  name="button2BorderColor"
                                  value={button2BorderColor}
                                  onChange={setButton2BorderColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                              </InlineStack>
                            </BlockStack>
                          </Card>

                          {/* Hurry Up Banner Styling */}
                          <Card>
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingMd">
                                Hurry Up Banner Styling
                              </Text>

                              <InlineStack gap="200">
                                <TextField
                                  label="Height (px)"
                                  name="hurryUpBannerHeight"
                                  value={hurryUpBannerHeight}
                                  onChange={setHurryUpBannerHeight}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Background Color (hex)"
                                  name="hurryUpBannerBackgroundColor"
                                  value={hurryUpBannerBackgroundColor}
                                  onChange={setHurryUpBannerBackgroundColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                                <TextField
                                  label="Text Color (hex)"
                                  name="hurryUpTextColor"
                                  value={hurryUpTextColor}
                                  onChange={setHurryUpTextColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                                <TextField
                                  label="Font Size (px)"
                                  name="hurryUpFontSize"
                                  value={hurryUpFontSize}
                                  onChange={setHurryUpFontSize}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                              </InlineStack>
                            </BlockStack>
                          </Card>

                          {/* Mobile Banner Styling */}
                          <Card>
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingMd">
                                Mobile Banner Styling
                              </Text>

                              <InlineStack gap="200">
                                <TextField
                                  label="Banner Height (px)"
                                  name="mobileBannerHeight"
                                  value={mobileBannerHeight}
                                  onChange={setMobileBannerHeight}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Border Radius (px)"
                                  name="mobileBannerBorderRadius"
                                  value={mobileBannerBorderRadius}
                                  onChange={setMobileBannerBorderRadius}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Margin (px)"
                                  name="mobileBannerMargin"
                                  value={mobileBannerMargin}
                                  onChange={setMobileBannerMargin}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                              </InlineStack>
                            </BlockStack>
                          </Card>

                          {/* Mobile Product Section */}
                          <Card>
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingMd">
                                Mobile Product Section
                              </Text>

                              <InlineStack gap="200">
                                <TextField
                                  label="Product Height (px)"
                                  name="mobileProductHeight"
                                  value={mobileProductHeight}
                                  onChange={setMobileProductHeight}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Product Padding"
                                  name="mobileProductPadding"
                                  value={mobileProductPadding}
                                  onChange={setMobileProductPadding}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  helpText="e.g., 12px 16px"
                                />
                              </InlineStack>
                            </BlockStack>
                          </Card>

                          {/* Mobile Title Styling */}
                          <Card>
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingMd">
                                Mobile Title Styling
                              </Text>

                              <InlineStack gap="200">
                                <TextField
                                  label="Font Size (px)"
                                  name="mobileTitleFontSize"
                                  value={mobileTitleFontSize}
                                  onChange={setMobileTitleFontSize}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Color (hex)"
                                  name="mobileTitleColor"
                                  value={mobileTitleColor}
                                  onChange={setMobileTitleColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                              </InlineStack>
                            </BlockStack>
                          </Card>

                          {/* Mobile Price Styling */}
                          <Card>
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingMd">
                                Mobile Price Styling
                              </Text>

                              <InlineStack gap="200">
                                <TextField
                                  label="Font Size (px)"
                                  name="mobilePriceFontSize"
                                  value={mobilePriceFontSize}
                                  onChange={setMobilePriceFontSize}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Color (hex)"
                                  name="mobilePriceColor"
                                  value={mobilePriceColor}
                                  onChange={setMobilePriceColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                              </InlineStack>
                            </BlockStack>
                          </Card>

                          {/* Mobile Button Styling */}
                          <Card>
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingMd">
                                Mobile Button Styling
                              </Text>

                              <InlineStack gap="200">
                                <TextField
                                  label="Height (px)"
                                  name="mobileButtonHeight"
                                  value={mobileButtonHeight}
                                  onChange={setMobileButtonHeight}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Padding"
                                  name="mobileButtonPadding"
                                  value={mobileButtonPadding}
                                  onChange={setMobileButtonPadding}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  helpText="e.g., 12px 20px"
                                />
                              </InlineStack>

                              <InlineStack gap="200">
                                <TextField
                                  label="Font Size (px)"
                                  name="mobileButtonFontSize"
                                  value={mobileButtonFontSize}
                                  onChange={setMobileButtonFontSize}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Border Radius (px)"
                                  name="mobileButtonBorderRadius"
                                  value={mobileButtonBorderRadius}
                                  onChange={setMobileButtonBorderRadius}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                              </InlineStack>

                              <InlineStack gap="200">
                                <TextField
                                  label="Text Color (hex)"
                                  name="mobileButtonTextColor"
                                  value={mobileButtonTextColor}
                                  onChange={setMobileButtonTextColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                                <TextField
                                  label="Background Color (hex)"
                                  name="mobileButtonBackgroundColor"
                                  value={mobileButtonBackgroundColor}
                                  onChange={setMobileButtonBackgroundColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                              </InlineStack>
                            </BlockStack>
                          </Card>

                          {/* Mobile Hurry Up Styling */}
                          <Card>
                            <BlockStack gap="300">
                              <Text as="h3" variant="headingMd">
                                Mobile Hurry Up Styling
                              </Text>

                              <InlineStack gap="200">
                                <TextField
                                  label="Height (px)"
                                  name="mobileHurryUpHeight"
                                  value={mobileHurryUpHeight}
                                  onChange={setMobileHurryUpHeight}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                                <TextField
                                  label="Font Size (px)"
                                  name="mobileHurryUpFontSize"
                                  value={mobileHurryUpFontSize}
                                  onChange={setMobileHurryUpFontSize}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                />
                              </InlineStack>

                              <InlineStack gap="200">
                                <TextField
                                  label="Background Color (hex)"
                                  name="mobileHurryUpBackgroundColor"
                                  value={mobileHurryUpBackgroundColor}
                                  onChange={setMobileHurryUpBackgroundColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                                <TextField
                                  label="Text Color (hex)"
                                  name="mobileHurryUpTextColor"
                                  value={mobileHurryUpTextColor}
                                  onChange={setMobileHurryUpTextColor}
                                  autoComplete="off"
                                  disabled={!isEditMode}
                                  prefix="#"
                                />
                              </InlineStack>
                            </BlockStack>
                          </Card>

                          <Divider />

                          {/* Submit Button - only show in edit mode */}
                          {isEditMode && (
                            <InlineStack gap="200">
                              <Button 
                                submit 
                                variant="primary" 
                                loading={isSubmitting}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? "Saving Settings..." : "Save Settings"}
                              </Button>
                              <Button 
                                onClick={handleCancel}
                                disabled={isSubmitting}
                              >
                                Cancel
                              </Button>
                            </InlineStack>
                          )}
                        </BlockStack>
                      </Form>
                    </BlockStack>
                  </Card>
                )}
              </Tabs>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
      
      {/* Success Toast */}
      {showSuccessToast && (
        <Toast
          content="Product banner settings saved successfully!"
          onDismiss={handleSuccessToastDismiss}
          duration={3000}
        />
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <Toast
          content={`Failed to save settings: ${actionData?.error || 'Unknown error'}`}
          error
          onDismiss={handleErrorToastDismiss}
          duration={5000}
        />
      )}
    </Page>
    </Frame>
  )
}
