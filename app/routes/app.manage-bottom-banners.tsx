import {
    Card,
    Layout,
    Page,
    Text,
    BlockStack,
    InlineStack,
    Button,
    Badge,
    DataTable,
    EmptyState,
    Modal,
    Banner as PolarisInfoBanner,
    ChoiceList,
    ProgressBar,
  } from "@shopify/polaris"
  import { TitleBar } from "@shopify/app-bridge-react"
  import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node"
  import { json } from "@remix-run/node"
  import { useLoaderData, useNavigation, useSubmit } from "@remix-run/react"
  import { useState } from "react"
import prisma from "app/db.server"
import { authenticate } from "../shopify.server"

// Types for stats
interface BottomBannerStats {
  total: number;
  active: number;
  withProduct: number;
  withTimer: number;
  withCarousel: number;
  withMultipleButtons: number;
}

// ---- Types ----
interface BottomBanner {
  id: string
  isActive: boolean
  priority: number
  messages: string
  areMessagesCarousel: boolean
  isTimer: boolean
  hasProduct: boolean
  productTitle: string | null
  showAddToCartButton: boolean
  showViewProductButton: boolean
  startTime: string | null
  endTime: string | null
  createdAt: string
  updatedAt: string
}

// ---- Loader ----
export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await authenticate.admin(request);
  if (auth instanceof Response) {
    return auth;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const feature = url.searchParams.get("feature");

  try {
    let whereClause: any = {};
    
    if (status === "active") whereClause.isActive = true;
    if (status === "inactive") whereClause.isActive = false;
    if (feature === "carousel") whereClause.areMessagesCarousel = true;
    if (feature === "timer") whereClause.isTimer = true;
    if (feature === "product") whereClause.hasProduct = true;
    if (feature === "multiple_buttons") {
      whereClause.OR = [
        { showAddToCartButton: true, showViewProductButton: true },
        { slides: { some: { showAddToCartButton: true, showViewProductButton: true } } }
      ];
    }

    const bottomBanners = await (prisma as any).bottomBanner.findMany({
      where: whereClause,
      orderBy: [
        { priority: "asc" },
        { createdAt: "desc" }
      ],
      include: {
        product: {
          select: {
            title: true,
            handle: true
          }
        },
        slides: {
          select: {
            showAddToCartButton: true,
            showViewProductButton: true
          }
        }
      }
    });

    // Parse messages and format dates
    const formattedBottomBanners = bottomBanners.map((banner: any) => ({
      ...banner,
      messages: banner.messages || "[]",
      productTitle: banner.product?.title || null,
      productHandle: banner.product?.handle || null,
      createdAt: new Date(banner.createdAt).toLocaleDateString(),
      updatedAt: new Date(banner.updatedAt).toLocaleDateString(),
    }));

    // Calculate stats
    const stats = {
      total: bottomBanners.length,
      active: bottomBanners.filter((b: any) => b.isActive).length,
      withProduct: bottomBanners.filter((b: any) => b.hasProduct).length,
      withTimer: bottomBanners.filter((b: any) => b.isTimer).length,
      withCarousel: bottomBanners.filter((b: any) => b.areMessagesCarousel).length,
      withMultipleButtons: bottomBanners.filter((b: any) => 
        (b.showAddToCartButton && b.showViewProductButton) ||
        b.slides.some((slide: any) => slide.showAddToCartButton && slide.showViewProductButton)
      ).length,
    };

    return json({ bottomBanners: formattedBottomBanners, stats });
  } catch (error) {
    console.error("Loader error:", error);
    return json({ bottomBanners: [], stats: null });
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
    const bottomBannerId = String(formData.get("bottomBannerId") || "")
  
    if (intent === "delete" && bottomBannerId) {
      try {
        await (prisma as any).bottomBanner.delete({
          where: { id: bottomBannerId },
        })
        return json({ success: true })
      } catch (error) {
        console.error("Delete error:", error)
        return json({ success: false, error: "Failed to delete bottom banner" })
      }
    }
  
    if (intent === "toggle" && bottomBannerId) {
      try {
        const bottomBanner = await (prisma as any).bottomBanner.findUnique({
          where: { id: bottomBannerId },
        })
        
        if (bottomBanner) {
          await (prisma as any).bottomBanner.update({
            where: { id: bottomBannerId },
            data: { isActive: !bottomBanner.isActive },
          })
        }
        return json({ success: true })
      } catch (error) {
        console.error("Toggle error:", error)
        return json({ success: false, error: "Failed to toggle bottom banner" })
      }
    }
  
    return json({ success: false })
  }
  
  // ---- UI ----
  export default function ManageBottomBannersPage() {
    const { bottomBanners, stats } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const isLoading = navigation.state === "loading" || navigation.state === "submitting";

    const [deleteModalActive, setDeleteModalActive] = useState(false);
    const [selectedBottomBannerId, setSelectedBottomBannerId] = useState<string | null>(null);
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({
      status: '',
      feature: ''
    });
  
    const handleDeleteClick = (bottomBannerId: string) => {
      setSelectedBottomBannerId(bottomBannerId)
      setDeleteModalActive(true)
    }
  
    const handleDeleteConfirm = () => {
      if (selectedBottomBannerId) {
        const formData = new FormData()
        formData.append("_intent", "delete")
        formData.append("bottomBannerId", selectedBottomBannerId)
        submit(formData, { method: "post" })
      }
      setDeleteModalActive(false)
      setSelectedBottomBannerId(null)
    }
  
    const handleToggleActive = (bottomBannerId: string) => {
      const formData = new FormData()
      formData.append("_intent", "toggle")
      formData.append("bottomBannerId", bottomBannerId)
      submit(formData, { method: "post" })
    }
  
    // Parse messages for display
    const getMessagePreview = (messagesJson: string) => {
      try {
        const messages = JSON.parse(messagesJson)
        if (Array.isArray(messages) && messages.length > 0) {
          const firstMessage = messages[0]
          return firstMessage.length > 40 ? `${firstMessage.substring(0, 40)}...` : firstMessage
        }
        return "No message"
      } catch {
        return "Invalid message format"
      }
    }
  
    // Prepare rows for DataTable
    const rows = bottomBanners.map((banner: BottomBanner) => [
      // Priority
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        {banner.priority}
      </Text>,
      
      // Status Badge
      <Badge tone={banner.isActive ? "success" : "info"}>
        {banner.isActive ? "Active" : "Inactive"}
      </Badge>,
      
      // Message Preview
      <div style={{ maxWidth: "250px" }}>
        <Text as="p" variant="bodySm" truncate>
          {getMessagePreview(banner.messages)}
        </Text>
        {banner.areMessagesCarousel && (
          <Badge tone="info" size="small">Carousel</Badge>
        )}
      </div>,
      
      // Features
      <InlineStack gap="100">
        {banner.isTimer && (
          <Badge tone="warning" size="small">Timer</Badge>
        )}
        {banner.hasProduct && (
          <Badge tone="attention" size="small">Product</Badge>
        )}
        {(banner.showAddToCartButton && banner.showViewProductButton) && (
          <Badge tone="success" size="small">Multi-Button</Badge>
        )}
      </InlineStack>,
      
      // Product
      <Text as="span" variant="bodySm">
        {banner.productTitle || "-"}
      </Text>,
      
      // Created
      <Text as="span" variant="bodySm" tone="subdued">
        {banner.createdAt}
      </Text>,
      
      // Actions
      <InlineStack gap="200" align="end">
        <Button
          size="slim"
          onClick={() => handleToggleActive(banner.id)}
          disabled={isLoading}
        >
          {banner.isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button
          size="slim"
          url={`/app/edit-bottom-banner/${banner.id}`}
          disabled={isLoading}
        >
          Edit
        </Button>
        <Button
          size="slim"
          tone="critical"
          onClick={() => handleDeleteClick(banner.id)}
          disabled={isLoading}
        >
          Delete
        </Button>
      </InlineStack>,
    ])
  
    return (
      <Page>
        <TitleBar title="Manage Bottom Banners" />
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              {/* Header Actions */}
              <Card>
                <InlineStack align="space-between">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingLg">
                      Bottom Banner Management
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {bottomBanners.length} {bottomBanners.length === 1 ? "bottom banner" : "bottom banners"} total
                    </Text>
                  </BlockStack>
                  <InlineStack gap="200">
                    <Button url="/app/sync-products" variant="secondary">
                      Sync Products
                    </Button>
                    <Button url="/app/create-bottom-banner" variant="primary">
                      Create Bottom Banner
                    </Button>
                  </InlineStack>
                </InlineStack>
              </Card>
  
              {/* Filters */}
              {bottomBanners.length > 0 && (
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <Text as="h3" variant="headingMd">
                        Filters
                      </Text>
                      {Object.values(selectedFilters).some(v => v) && (
                        <Button
                          variant="plain"
                          onClick={() => {
                            setSelectedFilters({
                              status: '',
                              feature: ''
                            });
                            submit(new URLSearchParams(), { replace: true });
                          }}
                        >
                          Clear all
                        </Button>
                      )}
                    </InlineStack>

                    <InlineStack gap="300" wrap>
                      <ChoiceList
                        title="Status"
                        choices={[
                          { label: 'All', value: '' },
                          { label: 'Active', value: 'active' },
                          { label: 'Inactive', value: 'inactive' }
                        ]}
                        selected={[selectedFilters.status]}
                        onChange={value => {
                          const newFilters = { ...selectedFilters, status: value[0] };
                          setSelectedFilters(newFilters);
                          const params = new URLSearchParams(Object.entries(newFilters).filter(([_, v]) => v));
                          submit(params, { replace: true });
                        }}
                      />

                      <ChoiceList
                        title="Feature"
                        choices={[
                          { label: 'All', value: '' },
                          { label: 'Carousel', value: 'carousel' },
                          { label: 'Timer', value: 'timer' },
                          { label: 'Product', value: 'product' },
                          { label: 'Multiple Buttons', value: 'multiple_buttons' }
                        ]}
                        selected={[selectedFilters.feature]}
                        onChange={value => {
                          const newFilters = { ...selectedFilters, feature: value[0] };
                          setSelectedFilters(newFilters);
                          const params = new URLSearchParams(Object.entries(newFilters).filter(([_, v]) => v));
                          submit(params, { replace: true });
                        }}
                      />
                    </InlineStack>
                  </BlockStack>
                </Card>
              )}

              {/* Info Banner */}
              {bottomBanners.length > 0 && (
                <PolarisInfoBanner tone="info">
                  Bottom banners are displayed at the bottom of your store pages with fixed positioning. 
                  Only active banners will be visible on your storefront.
                </PolarisInfoBanner>
              )}
  
              {/* Bottom Banners Table */}
              <Card padding="0">
                {bottomBanners.length === 0 ? (
                  <EmptyState
                    heading="No bottom banners yet"
                    action={{
                      content: "Create Bottom Banner",
                      url: "/app/create-bottom-banner",
                    }}
                    secondaryAction={{
                      content: "Sync Products",
                      url: "/app/sync-products",
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <Text as="p" variant="bodyMd">
                      Create your first bottom banner to engage customers with promotional messages, 
                      timers, product integrations, and multiple action buttons at the bottom of your pages.
                    </Text>
                  </EmptyState>
                ) : (
                  <DataTable
                    columnContentTypes={[
                      "numeric",
                      "text",
                      "text",
                      "text",
                      "text",
                      "text",
                      "text",
                    ]}
                    headings={[
                      "Priority",
                      "Status",
                      "Message",
                      "Features",
                      "Product",
                      "Created",
                      "Actions",
                    ]}
                    rows={rows}
                    hoverable
                  />
                )}
              </Card>
  
              {/* Stats Cards */}
              {bottomBanners.length > 0 && stats && (
                <BlockStack gap="400">
                  {/* Bottom Banner Status Card */}
                  <Card>
                    <BlockStack gap="400">
                      <Text as="h3" variant="headingMd">
                        Bottom Banner Status
                      </Text>
                      <InlineStack gap="400" wrap={false}>
                        <div style={{ flex: 1 }}>
                          <BlockStack gap="200">
                            <InlineStack align="space-between">
                              <Text as="span" variant="bodyMd">Active Bottom Banners</Text>
                              <Text as="span" variant="headingLg">{stats.active}</Text>
                            </InlineStack>
                            <ProgressBar
                              progress={(stats.active / stats.total) * 100}
                              tone="success"
                              size="small"
                            />
                          </BlockStack>
                        </div>
                        <div style={{ flex: 1 }}>
                          <BlockStack gap="200">
                            <InlineStack align="space-between">
                              <Text as="span" variant="bodyMd">Inactive Bottom Banners</Text>
                              <Text as="span" variant="headingLg">{stats.total - stats.active}</Text>
                            </InlineStack>
                            <ProgressBar
                              progress={((stats.total - stats.active) / stats.total) * 100}
                              tone="critical"
                              size="small"
                            />
                          </BlockStack>
                        </div>
                      </InlineStack>
                    </BlockStack>
                  </Card>

                  {/* Features Usage Card */}
                  <Card>
                    <BlockStack gap="400">
                      <Text as="h3" variant="headingMd">
                        Features Usage
                      </Text>
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">Product Integration</Text>
                          <Text as="span" variant="headingMd">{stats.withProduct}</Text>
                        </InlineStack>
                        <ProgressBar
                          progress={(stats.withProduct / stats.total) * 100}
                          tone="highlight"
                          size="small"
                        />

                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">Timer Enabled</Text>
                          <Text as="span" variant="headingMd">{stats.withTimer}</Text>
                        </InlineStack>
                        <ProgressBar
                          progress={(stats.withTimer / stats.total) * 100}
                          tone="success"
                          size="small"
                        />

                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">Message Carousel</Text>
                          <Text as="span" variant="headingMd">{stats.withCarousel}</Text>
                        </InlineStack>
                        <ProgressBar
                          progress={(stats.withCarousel / stats.total) * 100}
                          tone="highlight"
                          size="small"
                        />

                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">Multiple Buttons</Text>
                          <Text as="span" variant="headingMd">{stats.withMultipleButtons}</Text>
                        </InlineStack>
                        <ProgressBar
                          progress={(stats.withMultipleButtons / stats.total) * 100}
                          tone="success"
                          size="small"
                        />
                      </BlockStack>
                    </BlockStack>
                  </Card>
                </BlockStack>
              )}
            </BlockStack>
          </Layout.Section>
        </Layout>
  
        {/* Delete Confirmation Modal */}
        <Modal
          open={deleteModalActive}
          onClose={() => setDeleteModalActive(false)}
          title="Delete Bottom Banner"
          primaryAction={{
            content: "Delete",
            destructive: true,
            onAction: handleDeleteConfirm,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setDeleteModalActive(false),
            },
          ]}
        >
          <Modal.Section>
            <Text as="p" variant="bodyMd">
              Are you sure you want to delete this bottom banner? This action cannot be undone.
              All analytics data associated with this bottom banner will also be deleted.
            </Text>
          </Modal.Section>
        </Modal>
      </Page>
    )
  }
