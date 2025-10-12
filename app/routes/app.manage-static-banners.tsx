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
interface StaticBannerStats {
  total: number;
  active: number;
  withTimer: number;
  withCoupon: number;
  withCarousel: number;
}

// ---- Types ----
interface StaticBanner {
  id: string
  isActive: boolean
  priority: number
  messages: string
  areMessagesCarousel: boolean
  isTimer: boolean
  hasCoupon: boolean
  couponCode: string | null
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
    if (feature === "coupon") whereClause.hasCoupon = true;

    const staticBanners = await (prisma as any).staticBanner.findMany({
      where: whereClause,
      orderBy: [
        { priority: "asc" },
        { createdAt: "desc" }
      ],
      include: {
        slides: {
          select: {
            isTimer: true,
            hasCoupon: true
          }
        }
      }
    });

    // Parse messages and format dates
    const formattedStaticBanners = staticBanners.map((banner: any) => ({
      ...banner,
      messages: banner.messages || "[]",
      createdAt: new Date(banner.createdAt).toLocaleDateString(),
      updatedAt: new Date(banner.updatedAt).toLocaleDateString(),
    }));

    // Calculate stats
    const stats = {
      total: staticBanners.length,
      active: staticBanners.filter((b: any) => b.isActive).length,
      withTimer: staticBanners.filter((b: any) => b.isTimer).length,
      withCoupon: staticBanners.filter((b: any) => b.hasCoupon).length,
      withCarousel: staticBanners.filter((b: any) => b.areMessagesCarousel).length,
    };

    return json({ staticBanners: formattedStaticBanners, stats });
  } catch (error) {
    console.error("Loader error:", error);
    return json({ staticBanners: [], stats: null });
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
    const staticBannerId = String(formData.get("staticBannerId") || "")
  
    if (intent === "delete" && staticBannerId) {
      try {
        await (prisma as any).staticBanner.delete({
          where: { id: staticBannerId },
        })
        return json({ success: true })
      } catch (error) {
        console.error("Delete error:", error)
        return json({ success: false, error: "Failed to delete static banner" })
      }
    }
  
    if (intent === "toggle" && staticBannerId) {
      try {
        const staticBanner = await (prisma as any).staticBanner.findUnique({
          where: { id: staticBannerId },
        })
        
        if (staticBanner) {
          await (prisma as any).staticBanner.update({
            where: { id: staticBannerId },
            data: { isActive: !staticBanner.isActive },
          })
        }
        return json({ success: true })
      } catch (error) {
        console.error("Toggle error:", error)
        return json({ success: false, error: "Failed to toggle static banner" })
      }
    }
  
    return json({ success: false })
  }
  
  // ---- UI ----
  export default function ManageStaticBannersPage() {
    const { staticBanners, stats } = useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const isLoading = navigation.state === "loading" || navigation.state === "submitting";

    const [deleteModalActive, setDeleteModalActive] = useState(false);
    const [selectedStaticBannerId, setSelectedStaticBannerId] = useState<string | null>(null);
    const [selectedFilters, setSelectedFilters] = useState({
      status: '',
      feature: ''
    });
  
    const handleDeleteClick = (staticBannerId: string) => {
      setSelectedStaticBannerId(staticBannerId)
      setDeleteModalActive(true)
    }
  
    const handleDeleteConfirm = () => {
      if (selectedStaticBannerId) {
        const formData = new FormData()
        formData.append("_intent", "delete")
        formData.append("staticBannerId", selectedStaticBannerId)
        submit(formData, { method: "post" })
      }
      setDeleteModalActive(false)
      setSelectedStaticBannerId(null)
    }
  
    const handleToggleActive = (staticBannerId: string) => {
      const formData = new FormData()
      formData.append("_intent", "toggle")
      formData.append("staticBannerId", staticBannerId)
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
    const rows = staticBanners.map((banner: StaticBanner) => [
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
        {banner.hasCoupon && (
          <Badge tone="attention" size="small">Coupon</Badge>
        )}
      </InlineStack>,
      
      // Coupon Code
      <Text as="span" variant="bodySm">
        {banner.couponCode || "-"}
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
          url={`/app/edit-static-banner/${banner.id}`}
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
        <TitleBar title="Manage Static Banners" />
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              {/* Header Actions */}
              <Card>
                <InlineStack align="space-between">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingLg">
                      Static Banner Management
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {staticBanners.length} {staticBanners.length === 1 ? "static banner" : "static banners"} total
                    </Text>
                  </BlockStack>
                  <InlineStack gap="200">
                    <Button url="/app/create-static-banner" variant="primary">
                      Create Static Banner
                    </Button>
                  </InlineStack>
                </InlineStack>
              </Card>
  
              {/* Filters */}
              {staticBanners.length > 0 && (
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
                          { label: 'Coupon', value: 'coupon' }
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
              {staticBanners.length > 0 && (
                <PolarisInfoBanner tone="info">
                  Static banners can be placed anywhere in your theme using the static-banners block. 
                  They are responsive and will display in a column layout on mobile devices.
                </PolarisInfoBanner>
              )}
  
              {/* Static Banners Table */}
              <Card padding="0">
                {staticBanners.length === 0 ? (
                  <EmptyState
                    heading="No static banners yet"
                    action={{
                      content: "Create Static Banner",
                      url: "/app/create-static-banner",
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <Text as="p" variant="bodyMd">
                      Create your first static banner to display promotional messages, 
                      timers, and coupon codes anywhere in your theme.
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
                      "Coupon",
                      "Created",
                      "Actions",
                    ]}
                    rows={rows}
                    hoverable
                  />
                )}
              </Card>
  
              {/* Stats Cards */}
              {staticBanners.length > 0 && stats && (
                <BlockStack gap="400">
                  {/* Static Banner Status Card */}
                  <Card>
                    <BlockStack gap="400">
                      <Text as="h3" variant="headingMd">
                        Static Banner Status
                      </Text>
                      <InlineStack gap="400" wrap={false}>
                        <div style={{ flex: 1 }}>
                          <BlockStack gap="200">
                            <InlineStack align="space-between">
                              <Text as="span" variant="bodyMd">Active Static Banners</Text>
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
                              <Text as="span" variant="bodyMd">Inactive Static Banners</Text>
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
                          <Text as="span" variant="bodyMd">Timer Enabled</Text>
                          <Text as="span" variant="headingMd">{stats.withTimer}</Text>
                        </InlineStack>
                        <ProgressBar
                          progress={(stats.withTimer / stats.total) * 100}
                          tone="success"
                          size="small"
                        />

                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">Coupon Enabled</Text>
                          <Text as="span" variant="headingMd">{stats.withCoupon}</Text>
                        </InlineStack>
                        <ProgressBar
                          progress={(stats.withCoupon / stats.total) * 100}
                          tone="highlight"
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
          title="Delete Static Banner"
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
              Are you sure you want to delete this static banner? This action cannot be undone.
              All analytics data associated with this static banner will also be deleted.
            </Text>
          </Modal.Section>
        </Modal>
      </Page>
    )
  }
