import {
  Card,
  Layout,
  Page,
  FormLayout,
  TextField,
  Button,
  Toast,
  Frame,
  Text,
  Checkbox,
  BlockStack,
  InlineStack,
  ColorPicker,
  ChoiceList,
  DatePicker,
  Combobox,
  Icon,
  Banner as PolarisInfoBanner,
  type HSBAColor,
  Listbox,
  type AutoSelection,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigate, useNavigation } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";
import { SearchIcon } from "@shopify/polaris-icons";

// Types for our data
interface Product {
  id: string;
  title: string;
  handle: string;
  price: string;
  featuredImage: string | null;
  description: string | null;
}

interface Banner {
  id: string;
  isActive: boolean;
  messages: string;
  position: string;
  priority: number;
  bannerWidth: string;
  customWidth: string | null;
  bannerHeight: string;
  customHeight: string | null;
  bannerPadding: string;
  bannerLeftMargin: string;
  bannerRightMargin: string;
  bannerTopMargin: string;
  bannerBottomMargin: string;
  bannerBorderRadius: string;
  zIndex: string;
  areMessagesCarousel: boolean;
  messageFontSize: string;
  messagePosition: string;
  messageColor: string;
  messagePadding: string;
  isTimer: boolean;
  startTime: string | null;
  endTime: string | null;
  timerBackgroundColor: string;
  timerBorderColor: string;
  timerPadding: string;
  timerTextColor: string;
  hasProduct: boolean;
  product: Product | null;
}

interface StyleSettings {
  bannerWidth: string;
  customWidth: string;
  bannerHeight: string;
  customHeight: string;
  bannerPadding: string;
  bannerLeftMargin: string;
  bannerRightMargin: string;
  bannerTopMargin: string;
  bannerBottomMargin: string;
  bannerBorderRadius: string;
  zIndex: string;
  messageColor: HSBAColor;
  messagePadding: string;
  messageFontSize: string;
  messagePosition: string;
  timerBackgroundColor: HSBAColor;
  timerBorderColor: HSBAColor;
  timerPadding: string;
  timerTextColor: HSBAColor;
}

// Helper function to convert hex/string color to HSBA
function parseColorToHSBA(color: string): HSBAColor {
  // Default HSBA color (white)
  const defaultColor: HSBAColor = { hue: 0, saturation: 0, brightness: 1, alpha: 1 };
  
  if (!color) return defaultColor;
  
  // If it's already an object, return it
  if (typeof color === 'object' && 'hue' in color) {
    return color as HSBAColor;
  }
  
  // Parse hex color
  if (typeof color === 'string' && color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let hue = 0;
    if (delta !== 0) {
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
      hue = Math.round(hue * 60);
      if (hue < 0) hue += 360;
    }
    
    const saturation = max === 0 ? 0 : delta / max;
    const brightness = max;
    
    return { hue, saturation, brightness, alpha: 1 };
  }
  
  return defaultColor;
}

// Helper to convert HSBA to hex
function hsbaToHex(color: HSBAColor): string {
  const { hue, saturation, brightness } = color;
  const c = brightness * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = brightness - c;
  
  let r = 0, g = 0, b = 0;
  if (hue < 60) { r = c; g = x; b = 0; }
  else if (hue < 120) { r = x; g = c; b = 0; }
  else if (hue < 180) { r = 0; g = c; b = x; }
  else if (hue < 240) { r = 0; g = x; b = c; }
  else if (hue < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { id } = params;
  const auth = await authenticate.admin(request);
  if (auth instanceof Response) return auth;

  try {
    // Fetch banner with product
    const banner = await prisma.banner.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!banner) {
      throw new Error("Banner not found");
    }

    // Fetch all products for product selector
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        handle: true,
        price: true,
        featuredImage: true
      },
      orderBy: { title: 'asc' }
    });

    return json({ banner, products });
  } catch (error) {
    console.error("Loader error:", error);
    throw new Response(null, { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { id } = params;
  const auth = await authenticate.admin(request);
  if (auth instanceof Response) return auth;

  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "update") {
    try {
      const messages = formData.get("messages") as string;
      const productId = formData.get("productId") as string;
      const position = formData.get("position") as string;
      const priority = parseInt(formData.get("priority") as string);
      const bannerWidth = formData.get("bannerWidth") as string;
      const customWidth = formData.get("customWidth") as string;
      const bannerHeight = formData.get("bannerHeight") as string;
      const customHeight = formData.get("customHeight") as string;
      const bannerPadding = formData.get("bannerPadding") as string;
      const bannerLeftMargin = formData.get("bannerLeftMargin") as string;
      const bannerRightMargin = formData.get("bannerRightMargin") as string;
      const bannerTopMargin = formData.get("bannerTopMargin") as string;
      const bannerBottomMargin = formData.get("bannerBottomMargin") as string;
      const bannerBorderRadius = formData.get("bannerBorderRadius") as string;
      const zIndex = formData.get("zIndex") as string;
      const messageColor = formData.get("messageColor") as string;
      const messagePadding = formData.get("messagePadding") as string;
      const messageFontSize = formData.get("messageFontSize") as string;
      const messagePosition = formData.get("messagePosition") as string;
      const timerBackgroundColor = formData.get("timerBackgroundColor") as string;
      const timerBorderColor = formData.get("timerBorderColor") as string;
      const timerPadding = formData.get("timerPadding") as string;
      const timerTextColor = formData.get("timerTextColor") as string;

      const isActive = formData.get("isActive") === "true";
      const areMessagesCarousel = formData.get("areMessagesCarousel") === "true";
      const isTimer = formData.get("isTimer") === "true";
      const hasProduct = formData.get("hasProduct") === "true";

      // Parse dates if timer is enabled
      let startTime = null;
      let endTime = null;
      if (isTimer) {
        startTime = formData.get("startTime") ? new Date(formData.get("startTime") as string) : null;
        endTime = formData.get("endTime") ? new Date(formData.get("endTime") as string) : null;
      }

      await prisma.banner.update({
        where: { id },
        data: {
          isActive,
          messages,
          position,
          priority,
          bannerWidth,
          customWidth,
          bannerHeight,
          customHeight,
          bannerPadding,
          bannerLeftMargin,
          bannerRightMargin,
          bannerTopMargin,
          bannerBottomMargin,
          bannerBorderRadius,
          zIndex,
          areMessagesCarousel,
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
          hasProduct,
          productId: hasProduct ? productId : null,
        },
      });

      return json({ success: true });
    } catch (error) {
      console.error("Update error:", error);
      return json({ success: false, error: "Failed to update banner" });
    }
  }

  return json({ success: false });
}

export default function EditBannerPage() {
  const { banner, products } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const navigate = useNavigate();
  const isLoading = navigation.state === "submitting";

  const [messages, setMessages] = useState<string[]>(JSON.parse(banner.messages || "[]"));
  const [isActive, setIsActive] = useState(banner.isActive);
  const [position, setPosition] = useState(banner.position);
  const [priority, setPriority] = useState(banner.priority.toString());
  const [areMessagesCarousel, setAreMessagesCarousel] = useState(banner.areMessagesCarousel);
  const [isTimer, setIsTimer] = useState(banner.isTimer);
  const [hasProduct, setHasProduct] = useState(banner.hasProduct);
  const [selectedProduct, setSelectedProduct] = useState(banner.product);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(banner.startTime ? new Date(banner.startTime) : null);
  const [endDate, setEndDate] = useState<Date | null>(banner.endTime ? new Date(banner.endTime) : null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [styleSettings, setStyleSettings] = useState<StyleSettings>({
    bannerWidth: banner.bannerWidth,
    customWidth: banner.customWidth || "",
    bannerHeight: banner.bannerHeight,
    customHeight: banner.customHeight || "",
    bannerPadding: banner.bannerPadding,
    bannerLeftMargin: banner.bannerLeftMargin,
    bannerRightMargin: banner.bannerRightMargin,
    bannerTopMargin: banner.bannerTopMargin,
    bannerBottomMargin: banner.bannerBottomMargin,
    bannerBorderRadius: banner.bannerBorderRadius,
    zIndex: banner.zIndex,
    messageColor: parseColorToHSBA(banner.messageColor),
    messagePadding: banner.messagePadding,
    messageFontSize: banner.messageFontSize,
    messagePosition: banner.messagePosition,
    timerBackgroundColor: parseColorToHSBA(banner.timerBackgroundColor),
    timerBorderColor: parseColorToHSBA(banner.timerBorderColor),
    timerPadding: banner.timerPadding,
    timerTextColor: parseColorToHSBA(banner.timerTextColor)
  });

  const filteredProducts = products.filter((product: Product) =>
    product.title.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("_intent", "update");
    formData.append("isActive", isActive.toString());
    formData.append("messages", JSON.stringify(messages));
    formData.append("position", position);
    formData.append("priority", priority);
    formData.append("areMessagesCarousel", areMessagesCarousel.toString());
    formData.append("isTimer", isTimer.toString());
    formData.append("hasProduct", hasProduct.toString());
    formData.append("productId", selectedProduct?.id || "");

    // Convert HSBA colors to hex before submitting
    formData.append("messageColor", hsbaToHex(styleSettings.messageColor));
    formData.append("timerBackgroundColor", hsbaToHex(styleSettings.timerBackgroundColor));
    formData.append("timerBorderColor", hsbaToHex(styleSettings.timerBorderColor));
    formData.append("timerTextColor", hsbaToHex(styleSettings.timerTextColor));

    // Other style settings
    formData.append("bannerWidth", styleSettings.bannerWidth);
    formData.append("customWidth", styleSettings.customWidth);
    formData.append("bannerHeight", styleSettings.bannerHeight);
    formData.append("customHeight", styleSettings.customHeight);
    formData.append("bannerPadding", styleSettings.bannerPadding);
    formData.append("bannerLeftMargin", styleSettings.bannerLeftMargin);
    formData.append("bannerRightMargin", styleSettings.bannerRightMargin);
    formData.append("bannerTopMargin", styleSettings.bannerTopMargin);
    formData.append("bannerBottomMargin", styleSettings.bannerBottomMargin);
    formData.append("bannerBorderRadius", styleSettings.bannerBorderRadius);
    formData.append("zIndex", styleSettings.zIndex);
    formData.append("messagePadding", styleSettings.messagePadding);
    formData.append("messageFontSize", styleSettings.messageFontSize);
    formData.append("messagePosition", styleSettings.messagePosition);
    formData.append("timerPadding", styleSettings.timerPadding);

    // Timer dates
    if (isTimer) {
      if (startDate) formData.append("startTime", startDate.toISOString());
      if (endDate) formData.append("endTime", endDate.toISOString());
    }

    submit(formData, { method: "post" });
  }, [
    submit, isActive, messages, position, priority, areMessagesCarousel,
    isTimer, hasProduct, selectedProduct, styleSettings, startDate, endDate
  ]);

  useEffect(() => {
    if (navigation.state === "idle" && (navigation as any).formData?.get("_intent") === "update") {
      setToastActive(true);
      setToastMessage("Banner updated successfully");
    }
  }, [navigation.state, navigation.formData]);

  const positionOptions = [
    { label: "Static", value: "static" },
    { label: "Fixed", value: "fixed" },
    { label: "Sticky", value: "sticky" },
    { label: "Relative", value: "relative" },
    { label: "Absolute", value: "absolute" }
  ];

  const messagePositionOptions = [
    { label: "Left", value: "left" },
    { label: "Center", value: "center" },
    { label: "Right", value: "right" }
  ];

  return (
    <Frame>
      <Page
        backAction={{ content: "Banners", onAction: () => navigate("/app/manage-banners") }}
        title="Edit Banner"
      >
        <TitleBar title="Edit Banner" />

        <Layout>
          {/* Main Banner Settings */}
          <Layout.Section>
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">
                    Basic Settings
                  </Text>
                  <FormLayout>
                    <Checkbox
                      label="Active"
                      checked={isActive}
                      onChange={setIsActive}
                      helpText="When active, this banner will be displayed on your storefront"
                    />
                    
                    <TextField
                      label="Priority"
                      type="number"
                      value={priority}
                      onChange={setPriority}
                      helpText="Lower numbers appear first (0 is highest priority)"
                      autoComplete="off"
                    />

                    <ChoiceList
                      title="Position"
                      choices={positionOptions}
                      selected={[position]}
                      onChange={([value]) => setPosition(value)}
                    />
                  </FormLayout>
                </BlockStack>
              </Card>

              {/* Messages Section */}
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">
                    Messages
                  </Text>
                  <FormLayout>
                    {messages.map((message, index) => (
                      <InlineStack key={index} gap="200" align="start">
                        <div style={{ flex: 1 }}>
                          <TextField
                            label={`Message ${index + 1}`}
                            value={message}
                            onChange={(value) => {
                              const newMessages = [...messages];
                              newMessages[index] = value;
                              setMessages(newMessages);
                            }}
                            multiline={3}
                            autoComplete="off"
                          />
                        </div>
                        <Button
                          tone="critical"
                          variant="tertiary"
                          onClick={() => {
                            const newMessages = messages.filter((_, i) => i !== index);
                            setMessages(newMessages);
                          }}
                        >
                          Remove
                        </Button>
                      </InlineStack>
                    ))}
                    <Button
                      onClick={() => setMessages([...messages, ""])}
                      variant="secondary"
                    >
                      Add Message
                    </Button>
                    <Checkbox
                      label="Enable Message Carousel"
                      checked={areMessagesCarousel}
                      onChange={setAreMessagesCarousel}
                      helpText="Messages will rotate automatically when enabled"
                    />
                  </FormLayout>
                </BlockStack>
              </Card>

              {/* Timer Settings */}
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">
                    Timer
                  </Text>
                  <FormLayout>
                    <Checkbox
                      label="Enable Timer"
                      checked={isTimer}
                      onChange={setIsTimer}
                      helpText="Display a countdown timer in the banner"
                    />
                    {isTimer && (
                      <>
                        <BlockStack gap="200">
                          <Text as="h3" variant="headingSm">Start Date</Text>
                          <TextField
                            label=""
                            value={startDate ? startDate.toLocaleDateString() : ""}
                            onFocus={() => setShowStartDatePicker(true)}
                            autoComplete="off"
                            readOnly
                          />
                          {showStartDatePicker && (
                            <DatePicker
                              month={startDate?.getMonth() ?? new Date().getMonth()}
                              year={startDate?.getFullYear() ?? new Date().getFullYear()}
                              selected={{
                                start: startDate ?? new Date(),
                                end: startDate ?? new Date()
                              }}
                              onChange={(date) => {
                                setStartDate(date.start);
                                setShowStartDatePicker(false);
                              }}
                              onMonthChange={(month, year) => {
                                const newDate = new Date(year, month, 1);
                                setStartDate(newDate);
                              }}
                            />
                          )}
                        </BlockStack>
                        <BlockStack gap="200">
                          <Text as="h3" variant="headingSm">End Date</Text>
                          <TextField
                            label=""
                            value={endDate ? endDate.toLocaleDateString() : ""}
                            onFocus={() => setShowEndDatePicker(true)}
                            autoComplete="off"
                            readOnly
                          />
                          {showEndDatePicker && (
                            <DatePicker
                              month={endDate?.getMonth() ?? new Date().getMonth()}
                              year={endDate?.getFullYear() ?? new Date().getFullYear()}
                              selected={{
                                start: endDate ?? new Date(),
                                end: endDate ?? new Date()
                              }}
                              onChange={(date) => {
                                setEndDate(date.start);
                                setShowEndDatePicker(false);
                              }}
                              onMonthChange={(month, year) => {
                                const newDate = new Date(year, month, 1);
                                setEndDate(newDate);
                              }}
                            />
                          )}
                        </BlockStack>
                      </>
                    )}
                  </FormLayout>
                </BlockStack>
              </Card>

              {/* Product Integration */}
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">
                    Product Integration
                  </Text>
                  <FormLayout>
                    <Checkbox
                      label="Link to Product"
                      checked={hasProduct}
                      onChange={setHasProduct}
                      helpText="Add product details and quick actions to the banner"
                    />
                    {hasProduct && (
                      <Combobox
                        activator={
                          <Combobox.TextField
                            prefix={<Icon source={SearchIcon} />}
                            label="Search Products"
                            value={selectedProduct ? selectedProduct.title : productSearchTerm}
                            onChange={setProductSearchTerm}
                            autoComplete="off"
                          />
                        }
                      >
                        <Listbox
                          onSelect={(value) => {
                            const product = products.find((p: Product) => p.id === value);
                            setSelectedProduct(product || null);
                            setProductSearchTerm("");
                          }}
                        >
                          {filteredProducts.map((product: Product) => (
                            <Listbox.Option key={product.id} value={product.id}>
                              <InlineStack gap="200">
                                {product.featuredImage && (
                                  <img
                                    src={product.featuredImage}
                                    alt={product.title}
                                    style={{ width: 40, height: 40, objectFit: "cover" }}
                                  />
                                )}
                                <BlockStack gap="025">
                                  <Text as="span" variant="bodyMd">
                                    {product.title}
                                  </Text>
                                  <Text as="span" variant="bodySm" tone="subdued">
                                    ${product.price}
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                            </Listbox.Option>
                          ))}
                        </Listbox>
                      </Combobox>
                    )}
                  </FormLayout>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>

          {/* Style Settings Sidebar */}
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Style Settings
                </Text>
                <FormLayout>
                  <ChoiceList
                    title="Banner Width"
                    choices={[
                      { label: "Full Width", value: "full" },
                      { label: "Custom Width", value: "custom" }
                    ]}
                    selected={[styleSettings.bannerWidth]}
                    onChange={([value]) => setStyleSettings({
                      ...styleSettings,
                      bannerWidth: value
                    })}
                  />
                  {styleSettings.bannerWidth === "custom" && (
                    <TextField
                      label="Custom Width (vw)"
                      type="number"
                      value={styleSettings.customWidth}
                      onChange={(value) => setStyleSettings({
                        ...styleSettings,
                        customWidth: value
                      })}
                      suffix="vw"
                      helpText="Viewport width percentage (1-100)"
                      autoComplete="off"
                    />
                  )}

                  <TextField
                    label="Border Radius"
                    type="number"
                    value={styleSettings.bannerBorderRadius}
                    onChange={(value) => setStyleSettings({
                      ...styleSettings,
                      bannerBorderRadius: value
                    })}
                    suffix="px"
                    autoComplete="off"
                  />

                  <TextField
                    label="Z-Index"
                    type="number"
                    value={styleSettings.zIndex}
                    onChange={(value) => setStyleSettings({
                      ...styleSettings,
                      zIndex: value
                    })}
                    autoComplete="off"
                  />

                  <ChoiceList
                    title="Message Position"
                    choices={messagePositionOptions}
                    selected={[styleSettings.messagePosition]}
                    onChange={([value]) => setStyleSettings({
                      ...styleSettings,
                      messagePosition: value
                    })}
                  />

                  <TextField
                    label="Message Font Size"
                    type="number"
                    value={styleSettings.messageFontSize}
                    onChange={(value) => setStyleSettings({
                      ...styleSettings,
                      messageFontSize: value
                    })}
                    suffix="px"
                    autoComplete="off"
                  />

                  {/* Color Pickers */}
                  <Text as="h3" variant="headingMd">
                    Colors
                  </Text>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingSm">Message Text Color</Text>
                    <ColorPicker
                      onChange={(color) => setStyleSettings({
                        ...styleSettings,
                        messageColor: color
                      })}
                      color={styleSettings.messageColor}
                      allowAlpha
                    />
                  </BlockStack>

                  {isTimer && (
                    <>
                      <BlockStack gap="400">
                        <Text as="h3" variant="headingSm">Timer Background</Text>
                        <ColorPicker
                          onChange={(color) => setStyleSettings({
                            ...styleSettings,
                            timerBackgroundColor: color
                          })}
                          color={styleSettings.timerBackgroundColor}
                          allowAlpha
                        />
                      </BlockStack>
                      <BlockStack gap="400">
                        <Text as="h3" variant="headingSm">Timer Border</Text>
                        <ColorPicker
                          onChange={(color) => setStyleSettings({
                            ...styleSettings,
                            timerBorderColor: color
                          })}
                          color={styleSettings.timerBorderColor}
                          allowAlpha
                        />
                      </BlockStack>
                      <BlockStack gap="400">
                        <Text as="h3" variant="headingSm">Timer Text</Text>
                        <ColorPicker
                          onChange={(color) => setStyleSettings({
                            ...styleSettings,
                            timerTextColor: color
                          })}
                          color={styleSettings.timerTextColor}
                          allowAlpha
                        />
                      </BlockStack>
                    </>
                  )}
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Save Button */}
          <Layout.Section>
            <InlineStack align="end">
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={isLoading}
              >
                Save Changes
              </Button>
            </InlineStack>
          </Layout.Section>
        </Layout>

        {toastActive && (
          <Toast
            content={toastMessage}
            onDismiss={() => setToastActive(false)}
            duration={4000}
          />
        )}
      </Page>
    </Frame>
  );
}