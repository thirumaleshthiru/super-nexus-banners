import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Checkbox,
  Divider,
  Banner,
  Modal,
  FormLayout,
  Select,
  Badge,
  DataTable,
  EmptyState,
} from "@shopify/polaris"
import { TitleBar } from "@shopify/app-bridge-react"
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { Form, useLoaderData, useNavigation } from "@remix-run/react"
import { useState } from "react"
import prisma from "app/db.server"
import { authenticate } from "../shopify.server"

// ---- Types ----
interface Product {
  id: string
  shopifyId: string
  title: string
  handle: string
  price: string
  currencyCode: string
  featuredImage: string | null
}

interface ProductBannerCustomization {
  id: string
  productId: string
  isShowPrice: boolean
  isShowAddToCartButton: boolean
  isShowBuyNowButton: boolean
  isShowHurryUpBanner: boolean
  createdAt: string
  updatedAt: string
}

// ---- Loader ----
export async function loader({ request, params }: LoaderFunctionArgs) {
  const auth = await authenticate.admin(request);
  if (auth instanceof Response) {
    return auth;
  }
  
  const productId = params.id;
  if (!productId) {
    throw new Response("Product ID is required", { status: 400 });
  }

  try {
    // Fetch the product and templates
    const [product, templates] = await Promise.all([
      (prisma as any).product.findUnique({
        where: { id: productId },
        include: {
          productBannerCustomization: true
        }
      }),
      (prisma as any).productBannerTemplate.findMany({
        orderBy: [
          { isPrebuilt: "desc" },
          { usageCount: "desc" },
          { updatedAt: "desc" },
        ],
      })
    ])

    if (!product) {
      throw new Response("Product not found", { status: 404 });
    }

    return json({ product, templates })
  } catch (error) {
    console.error("Loader error:", error)
    throw new Response("Failed to load product", { status: 500 });
  }
}

// ---- Action ----
export async function action({ request, params }: ActionFunctionArgs) {
  const auth = await authenticate.admin(request);
  if (auth instanceof Response) {
    return auth;
  }
  
  const productId = params.id;
  if (!productId) {
    throw new Response("Product ID is required", { status: 400 });
  }

  const formData = await request.formData()
  const intent = formData.get("_intent")

  if (intent === "update") {
    const isShowPrice = formData.get("isShowPrice") === "true"
    const isShowAddToCartButton = formData.get("isShowAddToCartButton") === "true"
    const isShowBuyNowButton = formData.get("isShowBuyNowButton") === "true"
    const isShowHurryUpBanner = formData.get("isShowHurryUpBanner") === "true"

    try {
      // Check if customization exists
      const existing = await (prisma as any).productBannerCustomization.findUnique({
        where: { productId: productId }
      })

      if (existing) {
        // Update existing customization
        await (prisma as any).productBannerCustomization.update({
          where: { productId: productId },
          data: {
            isShowPrice,
            isShowAddToCartButton,
            isShowBuyNowButton,
            isShowHurryUpBanner,
          }
        })
      } else {
        // Create new customization
        await (prisma as any).productBannerCustomization.create({
          data: {
            productId,
            isShowPrice,
            isShowAddToCartButton,
            isShowBuyNowButton,
            isShowHurryUpBanner,
          }
        })
      }

      return redirect("/app/manage-product-banners")
    } catch (error) {
      console.error("Action error:", error)
      return json({ success: false, error: String(error) }, { status: 500 })
    }
  }

  if (intent === "reset") {
    try {
      // Delete customization to use global settings
      await (prisma as any).productBannerCustomization.deleteMany({
        where: { productId: productId }
      })

      return redirect("/app/manage-product-banners")
    } catch (error) {
      console.error("Reset error:", error)
      return json({ success: false, error: String(error) }, { status: 500 })
    }
  }

  if (intent === "apply_template") {
    const templateId = formData.get("templateId") as string
    
    try {
      // Fetch the template
      const template = await (prisma as any).productBannerTemplate.findUnique({
        where: { id: templateId }
      })

      if (!template) {
        return json({ success: false, error: "Template not found" }, { status: 404 })
      }

      // Apply template settings to product customization
      const customizationData = {
        isShowPrice: template.showPrice,
        isShowAddToCartButton: template.isShowAddToCartButton,
        isShowBuyNowButton: template.isShowBuyNowButton,
        isShowHurryUpBanner: template.isShowHurryUpBanner,
      }

      // Check if customization exists
      const existing = await (prisma as any).productBannerCustomization.findUnique({
        where: { productId: productId }
      })

      if (existing) {
        // Update existing customization
        await (prisma as any).productBannerCustomization.update({
          where: { productId: productId },
          data: customizationData
        })
      } else {
        // Create new customization
        await (prisma as any).productBannerCustomization.create({
          data: {
            productId,
            ...customizationData
          }
        })
      }

      // Update template usage
      await (prisma as any).productBannerTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date()
        }
      })

      return json({ success: true, message: "Template applied successfully!" })
    } catch (error) {
      console.error("Apply template error:", error)
      return json({ success: false, error: String(error) }, { status: 500 })
    }
  }

  return redirect("/app/manage-product-banners")
}

// ---- UI ----
export default function EditProductBannerPage() {
  const { product, templates } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"
  const isRedirecting = navigation.state === "loading" && navigation.formData == null

  const customization = product.productBannerCustomization
  const hasCustomization = !!customization

  // State for customization settings (use defaults if no customization exists)
  const [isShowPrice, setIsShowPrice] = useState(customization?.isShowPrice ?? true)
  const [isShowAddToCartButton, setIsShowAddToCartButton] = useState(customization?.isShowAddToCartButton ?? true)
  const [isShowBuyNowButton, setIsShowBuyNowButton] = useState(customization?.isShowBuyNowButton ?? true)
  const [isShowHurryUpBanner, setIsShowHurryUpBanner] = useState(customization?.isShowHurryUpBanner ?? true)
  
  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

  return (
    <Page>
      <TitleBar title={`Edit Banner: ${product.title}`} />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Product Info Card */}
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">
                    Product Information
                  </Text>
                  <Button url="/app/manage-product-banners">
                    Back to Products
                  </Button>
                </InlineStack>
                
                <Divider />
                
                <InlineStack gap="400" blockAlign="center">
                  {product.featuredImage && (
                    <div style={{ width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden" }}>
                      <img 
                        src={product.featuredImage} 
                        alt={product.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingMd">
                      {product.title}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      ${product.price} {product.currencyCode}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Handle: {product.handle}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Status Banner */}
            {hasCustomization ? (
              <Banner tone="success">
                <p>
                  This product has custom banner settings. Changes here will override the global settings.
                </p>
              </Banner>
            ) : (
              <Banner tone="info">
                <p>
                  This product is using global banner settings. Enable customizations below to override them for this product.
                </p>
              </Banner>
            )}

            {/* Customization Form */}
            <Card>
              <Form method="post">
                <input type="hidden" name="_intent" value="update" />
                <input type="hidden" name="isShowPrice" value={isShowPrice.toString()} />
                <input type="hidden" name="isShowAddToCartButton" value={isShowAddToCartButton.toString()} />
                <input type="hidden" name="isShowBuyNowButton" value={isShowBuyNowButton.toString()} />
                <input type="hidden" name="isShowHurryUpBanner" value={isShowHurryUpBanner.toString()} />

                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Banner Customization Settings
                  </Text>

                  <Text as="p" variant="bodySm" tone="subdued">
                    Control which elements are displayed in the product banner for this specific product. 
                    All styling (colors, sizes, etc.) will still use the global settings.
                  </Text>

                  <Divider />

                  {/* Show/Hide Controls */}
                  <BlockStack gap="300">
                    <Card>
                      <BlockStack gap="300">
                        <Text as="h4" variant="headingSm">
                          Display Options
                        </Text>
                        
                        <Checkbox 
                          label="Show Price" 
                          checked={isShowPrice} 
                          onChange={setIsShowPrice}
                          helpText="Display the product price in the banner"
                        />
                        
                        <Checkbox 
                          label="Show Add to Cart Button" 
                          checked={isShowAddToCartButton} 
                          onChange={setIsShowAddToCartButton}
                          helpText="Display the Add to Cart button in the banner"
                        />
                        
                        <Checkbox 
                          label="Show Buy Now Button" 
                          checked={isShowBuyNowButton} 
                          onChange={setIsShowBuyNowButton}
                          helpText="Display the Buy Now button in the banner"
                        />
                        
                        <Checkbox 
                          label="Show Hurry Up Banner" 
                          checked={isShowHurryUpBanner} 
                          onChange={setIsShowHurryUpBanner}
                          helpText="Display the low stock hurry up banner when inventory is low"
                        />
                      </BlockStack>
                    </Card>
                  </BlockStack>

                  <Divider />

                  {/* Action Buttons */}
                  <InlineStack gap="200">
                    <Button 
                      submit 
                      variant="primary" 
                      loading={isSubmitting || isRedirecting}
                      disabled={isSubmitting || isRedirecting}
                    >
                      {isSubmitting ? "Saving..." : isRedirecting ? "Redirecting..." : "Save Customization"}
                    </Button>
                    <Button 
                      url="/app/manage-product-banners" 
                      disabled={isSubmitting || isRedirecting}
                    >
                      Cancel
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Form>
            </Card>

            {/* Apply Template */}
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  Apply Template
                </Text>
                <Text as="p">
                  Quickly apply a pre-configured template to this product banner.
                </Text>
                <Button 
                  onClick={() => setShowTemplateModal(true)}
                  disabled={isSubmitting || isRedirecting}
                >
                  Choose Template
                </Button>
              </BlockStack>
            </Card>

            {/* Reset to Global Settings */}
            {hasCustomization && (
              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Danger Zone
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Remove custom settings and use global banner settings for this product.
                  </Text>
                  <Form method="post">
                    <input type="hidden" name="_intent" value="reset" />
                    <Button 
                      submit 
                      tone="critical"
                      loading={isSubmitting || isRedirecting}
                      disabled={isSubmitting || isRedirecting}
                    >
                      Reset to Global Settings
                    </Button>
                  </Form>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>

      {/* Template Selection Modal */}
      <Modal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Choose Template"
        primaryAction={{
          content: "Apply Template",
          disabled: !selectedTemplate,
          loading: isSubmitting,
          onAction: () => {
            if (selectedTemplate) {
              const formData = new FormData();
              formData.append("_intent", "apply_template");
              formData.append("templateId", selectedTemplate);
              
              fetch(window.location.href, {
                method: "POST",
                body: formData,
              }).then(response => response.json()).then(data => {
                if (data.success) {
                  // Refresh the page to show updated settings
                  window.location.reload();
                } else {
                  console.error("Failed to apply template:", data.error);
                }
                setShowTemplateModal(false);
              });
            }
          },
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowTemplateModal(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Filter by Category"
              value={filterCategory}
              onChange={setFilterCategory}
              options={[
                { label: "All Templates", value: "all" },
                { label: "Pre-built", value: "prebuilt" },
                { label: "Custom", value: "custom" },
                { label: "Sale", value: "sale" },
                { label: "New Arrival", value: "new_arrival" },
                { label: "Bestseller", value: "bestseller" },
                { label: "Limited Time", value: "limited_time" },
                { label: "Featured", value: "featured" },
              ]}
            />
            
            {templates.length === 0 ? (
              <EmptyState
                heading="No templates available"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Create templates from the Banner Templates page to use them here.</p>
              </EmptyState>
            ) : (
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <DataTable
                  columnContentTypes={["text", "text", "text", "text"]}
                  headings={["", "Name", "Category", "Usage"]}
                  rows={templates
                    .filter((template: any) => {
                      if (filterCategory === "all") return true;
                      if (filterCategory === "prebuilt") return template.isPrebuilt;
                      return template.category === filterCategory;
                    })
                    .map((template: any) => [
                      <input
                        key={template.id}
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={selectedTemplate === template.id}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                      />,
                      template.name,
                      <Badge key={template.id} tone={template.isPrebuilt ? "info" : undefined}>
                        {template.isPrebuilt ? "Pre-built" : template.category}
                      </Badge>,
                      template.usageCount,
                    ])}
                />
              </div>
            )}
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  )
}

