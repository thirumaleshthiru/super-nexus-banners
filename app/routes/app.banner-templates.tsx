import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  DataTable,
  Badge,
  ButtonGroup,
  Modal,
  TextField,
  Select,
  FormLayout,
  Banner,
  Tooltip,
  EmptyState,
  Text as PolarisText,
  BlockStack,
  InlineStack,
  InlineGrid,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { PlusIcon, DeleteIcon, DuplicateIcon, ViewIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";
import { useState, useCallback, useEffect, useMemo } from "react";

const PREBUILT_TEMPLATES = [
  {
    name: "Flash Sale",
    description: "High-contrast design for urgent sales",
    category: "sale",
    bannerHeight: "140",
    bannerImageHeight: "90",
    bannerBackgroundColor: "DC2626",
    bannerBorderRadius: "16",
    bannerTitleColor: "ffffff",
    bannerPriceColor: "FEF3C7",
    button1Text: "Add to Cart",
    button1BackgroundColor: "ffffff",
    button1TextColor: "DC2626",
    button1BorderColor: "ffffff",
    button1Height: "48",
    button1BorderRadius: "8",
    button2Text: "Buy Now",
    button2BackgroundColor: "FBBF24",
    button2TextColor: "1F2937",
    button2BorderColor: "FBBF24",
    button2Height: "48",
    button2BorderRadius: "8",
    hurryUpText: "🔥 Flash Sale - Limited Time Only!",
    hurryUpBannerBackgroundColor: "FBBF24",
    hurryUpTextColor: "1F2937",
    showPrice: true,
    isShowAddToCartButton: true,
    isShowBuyNowButton: true,
    isShowHurryUpBanner: true,
  },
  {
    name: "New Arrival",
    description: "Clean, modern look for new products",
    category: "new_arrival",
    bannerHeight: "135",
    bannerImageHeight: "85",
    bannerBackgroundColor: "6366F1",
    bannerBorderRadius: "12",
    bannerTitleColor: "ffffff",
    bannerPriceColor: "C7D2FE",
    button1Text: "Add to Cart",
    button1BackgroundColor: "ffffff",
    button1TextColor: "6366F1",
    button1BorderColor: "ffffff",
    button1Height: "46",
    button1BorderRadius: "10",
    button2Text: "Buy Now",
    button2BackgroundColor: "10B981",
    button2TextColor: "ffffff",
    button2BorderColor: "10B981",
    button2Height: "46",
    button2BorderRadius: "10",
    hurryUpText: "✨ New Arrival - Just Launched!",
    hurryUpBannerBackgroundColor: "10B981",
    hurryUpTextColor: "ffffff",
    showPrice: true,
    isShowAddToCartButton: true,
    isShowBuyNowButton: true,
    isShowHurryUpBanner: true,
  },
  {
    name: "Bestseller",
    description: "Premium gold theme for top products",
    category: "bestseller",
    bannerHeight: "150",
    bannerImageHeight: "95",
    bannerBackgroundColor: "1F2937",
    bannerBorderRadius: "20",
    bannerTitleColor: "F9FAFB",
    bannerPriceColor: "FCD34D",
    button1Text: "Add to Cart",
    button1BackgroundColor: "FCD34D",
    button1TextColor: "1F2937",
    button1BorderColor: "FCD34D",
    button1Height: "50",
    button1BorderRadius: "12",
    button2Text: "Buy Now",
    button2BackgroundColor: "ffffff",
    button2TextColor: "1F2937",
    button2BorderColor: "ffffff",
    button2Height: "50",
    button2BorderRadius: "12",
    hurryUpText: "🏆 Bestseller - Top Choice!",
    hurryUpBannerBackgroundColor: "FCD34D",
    hurryUpTextColor: "1F2937",
    showPrice: true,
    isShowAddToCartButton: true,
    isShowBuyNowButton: true,
    isShowHurryUpBanner: true,
  },
  {
    name: "Limited Edition",
    description: "Exclusive purple design for limited items",
    category: "limited_time",
    bannerHeight: "145",
    bannerImageHeight: "90",
    bannerBackgroundColor: "7C3AED",
    bannerBorderRadius: "18",
    bannerTitleColor: "ffffff",
    bannerPriceColor: "E0E7FF",
    button1Text: "Add to Cart",
    button1BackgroundColor: "ffffff",
    button1TextColor: "7C3AED",
    button1BorderColor: "ffffff",
    button1Height: "48",
    button1BorderRadius: "10",
    button2Text: "Buy Now",
    button2BackgroundColor: "C4B5FD",
    button2TextColor: "5B21B6",
    button2BorderColor: "C4B5FD",
    button2Height: "48",
    button2BorderRadius: "10",
    hurryUpText: "🎯 Limited Edition - Few Left!",
    hurryUpBannerBackgroundColor: "DC2626",
    hurryUpTextColor: "ffffff",
    showPrice: true,
    isShowAddToCartButton: true,
    isShowBuyNowButton: true,
    isShowHurryUpBanner: true,
  },
  {
    name: "Featured Product",
    description: "Elegant teal design for featured items",
    category: "featured",
    bannerHeight: "140",
    bannerImageHeight: "88",
    bannerBackgroundColor: "0F766E",
    bannerBorderRadius: "14",
    bannerTitleColor: "ffffff",
    bannerPriceColor: "CCFBF1",
    button1Text: "Add to Cart",
    button1BackgroundColor: "ffffff",
    button1TextColor: "0F766E",
    button1BorderColor: "ffffff",
    button1Height: "47",
    button1BorderRadius: "9",
    button2Text: "Buy Now",
    button2BackgroundColor: "14B8A6",
    button2TextColor: "ffffff",
    button2BorderColor: "14B8A6",
    button2Height: "47",
    button2BorderRadius: "9",
    hurryUpText: "⭐ Featured Product - Handpicked!",
    hurryUpBannerBackgroundColor: "14B8A6",
    hurryUpTextColor: "ffffff",
    showPrice: true,
    isShowAddToCartButton: true,
    isShowBuyNowButton: true,
    isShowHurryUpBanner: true,
  },
  {
    name: "Minimalist",
    description: "Clean, simple design for any product",
    category: "custom",
    bannerHeight: "125",
    bannerImageHeight: "75",
    bannerBackgroundColor: "F9FAFB",
    bannerBorderRadius: "8",
    bannerTitleColor: "111827",
    bannerPriceColor: "6B7280",
    button1Text: "Add to Cart",
    button1BackgroundColor: "111827",
    button1TextColor: "ffffff",
    button1BorderColor: "111827",
    button1Height: "44",
    button1BorderRadius: "6",
    button2Text: "Buy Now",
    button2BackgroundColor: "ffffff",
    button2TextColor: "111827",
    button2BorderColor: "D1D5DB",
    button2Height: "44",
    button2BorderRadius: "6",
    hurryUpText: "Limited Stock Available",
    hurryUpBannerBackgroundColor: "EF4444",
    hurryUpTextColor: "ffffff",
    showPrice: true,
    isShowAddToCartButton: true,
    isShowBuyNowButton: true,
    isShowHurryUpBanner: false,
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const [templates, currentSettings] = await Promise.all([
    prisma.productBannerTemplate.findMany({
      orderBy: [
        { isPrebuilt: "desc" },
        { usageCount: "desc" },
        { updatedAt: "desc" },
      ],
    }),
    prisma.productBannerSettings.findFirst()
  ]);

  return json({ templates, currentSettings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);

  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "create": {
        const templateData = {
          name: formData.get("name") as string,
          description: formData.get("description") as string || null,
          category: formData.get("category") as string,
          bannerHeight: formData.get("bannerHeight") as string,
          bannerImageHeight: formData.get("bannerImageHeight") as string,
          bannerPadding: formData.get("bannerPadding") as string,
          bannerTitleFontSize: formData.get("bannerTitleFontSize") as string,
          bannerTitleColor: formData.get("bannerTitleColor") as string,
          bannerPriceFontSize: formData.get("bannerPriceFontSize") as string,
          bannerPriceColor: formData.get("bannerPriceColor") as string,
          bannerBackgroundColor: formData.get("bannerBackgroundColor") as string,
          bannerBorderRadius: formData.get("bannerBorderRadius") as string,
          button1Text: formData.get("button1Text") as string,
          button1TextColor: formData.get("button1TextColor") as string,
          button1BackgroundColor: formData.get("button1BackgroundColor") as string,
          button1BorderColor: formData.get("button1BorderColor") as string,
          button1BorderRadius: formData.get("button1BorderRadius") as string,
          button1FontSize: formData.get("button1FontSize") as string,
          button1Height: formData.get("button1Height") as string,
          button2Text: formData.get("button2Text") as string,
          button2TextColor: formData.get("button2TextColor") as string,
          button2BackgroundColor: formData.get("button2BackgroundColor") as string,
          button2BorderColor: formData.get("button2BorderColor") as string,
          button2BorderRadius: formData.get("button2BorderRadius") as string,
          button2FontSize: formData.get("button2FontSize") as string,
          button2Height: formData.get("button2Height") as string,
          hurryUpText: formData.get("hurryUpText") as string,
          hurryUpBannerHeight: formData.get("hurryUpBannerHeight") as string,
          hurryUpBannerBackgroundColor: formData.get("hurryUpBannerBackgroundColor") as string,
          hurryUpTextColor: formData.get("hurryUpTextColor") as string,
          hurryUpFontSize: formData.get("hurryUpFontSize") as string,
          showPrice: formData.get("showPrice") === "true",
          isShowAddToCartButton: formData.get("isShowAddToCartButton") === "true",
          isShowBuyNowButton: formData.get("isShowBuyNowButton") === "true",
          isShowHurryUpBanner: formData.get("isShowHurryUpBanner") === "true",
        };

        await prisma.productBannerTemplate.create({
          data: templateData,
        });

        return json({ success: true, message: "Template created successfully!" });
      }

      case "delete": {
        const id = formData.get("id") as string;
        await prisma.productBannerTemplate.delete({
          where: { id },
        });
        return json({ success: true, message: "Template deleted successfully!" });
      }

      case "duplicate": {
        const id = formData.get("id") as string;
        const original = await prisma.productBannerTemplate.findUnique({
          where: { id },
        });

        if (!original) {
          return json({ error: "Template not found" }, { status: 404 });
        }

        const { id: _, createdAt, updatedAt, usageCount, lastUsedAt, ...templateData } = original;
        
        await prisma.productBannerTemplate.create({
          data: {
            ...templateData,
            name: `${original.name} (Copy)`,
            isPrebuilt: false,
            usageCount: 0,
            lastUsedAt: null,
          },
        });

        return json({ success: true, message: "Template duplicated successfully!" });
      }

      case "seed_prebuilt": {
        const existingPrebuilt = await prisma.productBannerTemplate.findFirst({
          where: { isPrebuilt: true },
        });

        if (existingPrebuilt) {
          return json({ error: "Pre-built templates already exist" }, { status: 400 });
        }

        await prisma.productBannerTemplate.createMany({
          data: PREBUILT_TEMPLATES.map(template => ({
            ...template,
            isPrebuilt: true,
          })),
        });

        return json({ success: true, message: "Pre-built templates added successfully!" });
      }

      case "apply_to_global": {
        const id = formData.get("id") as string;
        const template = await prisma.productBannerTemplate.findUnique({
          where: { id },
        });

        if (!template) {
          return json({ error: "Template not found" }, { status: 404 });
        }

        const existingSettings = await prisma.productBannerSettings.findFirst();
        
        const globalSettings = {
          bannerHeight: template.bannerHeight,
          bannerImageHeight: template.bannerImageHeight,
          bannerPadding: template.bannerPadding,
          bannerTitleFontSize: template.bannerTitleFontSize,
          bannerTitleColor: template.bannerTitleColor,
          bannerPriceFontSize: template.bannerPriceFontSize,
          bannerPriceColor: template.bannerPriceColor,
          showPrice: template.showPrice,
          bannerBackgroundColor: template.bannerBackgroundColor,
          bannerBorderRadius: template.bannerBorderRadius,
          button1Text: template.button1Text,
          button1TextColor: template.button1TextColor,
          button1BackgroundColor: template.button1BackgroundColor,
          button1BorderColor: template.button1BorderColor,
          button2Text: template.button2Text,
          button2TextColor: template.button2TextColor,
          button2BackgroundColor: template.button2BackgroundColor,
          button2BorderColor: template.button2BorderColor,
          hurryUpText: template.hurryUpText,
          hurryUpBannerHeight: template.hurryUpBannerHeight,
          hurryUpBannerBackgroundColor: template.hurryUpBannerBackgroundColor,
          hurryUpTextColor: template.hurryUpTextColor,
          hurryUpFontSize: template.hurryUpFontSize,
          mobileBannerHeight: existingSettings?.mobileBannerHeight || "90",
          mobileBannerBorderRadius: existingSettings?.mobileBannerBorderRadius || "8",
          mobileBannerMargin: existingSettings?.mobileBannerMargin || "10",
          mobileProductHeight: existingSettings?.mobileProductHeight || "60",
          mobileProductPadding: existingSettings?.mobileProductPadding || "12px 16px",
          mobileTitleFontSize: existingSettings?.mobileTitleFontSize || "16",
          mobileTitleColor: existingSettings?.mobileTitleColor || template.bannerTitleColor,
          mobilePriceFontSize: existingSettings?.mobilePriceFontSize || "14",
          mobilePriceColor: existingSettings?.mobilePriceColor || template.bannerPriceColor,
          mobileButtonHeight: existingSettings?.mobileButtonHeight || "40",
          mobileButtonPadding: existingSettings?.mobileButtonPadding || "12px 20px",
          mobileButtonFontSize: existingSettings?.mobileButtonFontSize || "16",
          mobileButtonBorderRadius: existingSettings?.mobileButtonBorderRadius || "6",
          mobileButtonTextColor: existingSettings?.mobileButtonTextColor || template.button1TextColor,
          mobileButtonBackgroundColor: existingSettings?.mobileButtonBackgroundColor || template.button1BackgroundColor,
          mobileHurryUpHeight: existingSettings?.mobileHurryUpHeight || "30",
          mobileHurryUpFontSize: existingSettings?.mobileHurryUpFontSize || "14",
          mobileHurryUpBackgroundColor: existingSettings?.mobileHurryUpBackgroundColor || template.hurryUpBannerBackgroundColor,
          mobileHurryUpTextColor: existingSettings?.mobileHurryUpTextColor || template.hurryUpTextColor,
        };

        if (existingSettings) {
          await prisma.productBannerSettings.update({
            where: { id: existingSettings.id },
            data: {
              ...globalSettings,
              appliedTemplateId: template.id,
              appliedTemplateName: template.name,
            },
          });
        } else {
          await prisma.productBannerSettings.create({
            data: {
              ...globalSettings,
              appliedTemplateId: template.id,
              appliedTemplateName: template.name,
            },
          });
        }

        await prisma.productBannerTemplate.update({
          where: { id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date()
          }
        });

        return json({ 
          success: true, 
          message: `Template "${template.name}" applied to global settings successfully! Go to Product Banner Settings to see the changes.`,
          redirect: "/app/manage-product-banners"
        });
      }

      case "reset_to_defaults": {
        const defaultGlobalSettings = {
          bannerHeight: "130",
          bannerImageHeight: "80",
          bannerPadding: "10",
          bannerTitleFontSize: "15",
          bannerTitleColor: "111827",
          bannerPriceFontSize: "14",
          bannerPriceColor: "6b7280",
          showPrice: true,
          bannerBackgroundColor: "ffffff",
          bannerBorderRadius: "0",
          button1Text: "Add to Cart",
          button1TextColor: "ffffff",
          button1BackgroundColor: "FF6B6B",
          button1BorderColor: "FF6B6B",
          button2Text: "Buy Now",
          button2TextColor: "FF6B6B",
          button2BackgroundColor: "ffffff",
          button2BorderColor: "FF6B6B",
          hurryUpText: "Hurry Up! Limited Stock",
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
        };

        const existingSettings = await prisma.productBannerSettings.findFirst();
        
        if (existingSettings) {
          await prisma.productBannerSettings.update({
            where: { id: existingSettings.id },
            data: {
              ...defaultGlobalSettings,
              appliedTemplateId: null,
              appliedTemplateName: null,
            },
          });
        } else {
          await prisma.productBannerSettings.create({
            data: {
              ...defaultGlobalSettings,
              appliedTemplateId: null,
              appliedTemplateName: null,
            },
          });
        }

        return json({ 
          success: true, 
          message: "Global settings have been reset to defaults successfully!"
        });
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Template action error:", error);
    return json({ error: "An error occurred" }, { status: 500 });
  }
};

export default function BannerTemplates() {
  const { templates, currentSettings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState("custom");
  const [pendingAction, setPendingAction] = useState<{ type: string; id?: string } | null>(null);

  const isLoading = navigation.state === "submitting";

  const resetTemplateForm = useCallback(() => {
    setTemplateName("");
    setTemplateDescription("");
    setTemplateCategory("custom");
  }, []);

  useEffect(() => {
    const styleId = "banner-templates-modal-styles";
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .Polaris-Modal-Dialog {
        max-width: 95vw !important;
        width: 95vw !important;
      }
      @media (min-width: 1600px) {
        .Polaris-Modal-Dialog {
          max-width: 1600px !important;
          width: 1600px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  const categoryOptions = [
    { label: "Custom", value: "custom" },
    { label: "Sale", value: "sale" },
    { label: "New Arrival", value: "new_arrival" },
    { label: "Bestseller", value: "bestseller" },
    { label: "Limited Time", value: "limited_time" },
    { label: "Featured", value: "featured" },
  ];

  const getCategoryBadge = useCallback((category: string, isPrebuilt: boolean) => {
    if (isPrebuilt) {
      return <Badge tone="info">Pre-built</Badge>;
    }

    const badgeMap: Record<string, { tone: any; label: string }> = {
      sale: { tone: "critical", label: "Sale" },
      new_arrival: { tone: "success", label: "New Arrival" },
      bestseller: { tone: "warning", label: "Bestseller" },
      limited_time: { tone: "attention", label: "Limited Time" },
      featured: { tone: "info", label: "Featured" },
      custom: { tone: undefined, label: "Custom" },
    };

    const badge = badgeMap[category] || badgeMap.custom;
    return <Badge tone={badge.tone}>{badge.label}</Badge>;
  }, []);

  const handleDelete = useCallback((id: string) => {
    setPendingAction({ type: "delete", id });
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (pendingAction?.id) {
      submit({ action: "delete", id: pendingAction.id }, { method: "post" });
    }
    setShowDeleteModal(false);
    setPendingAction(null);
  }, [pendingAction, submit]);

  const handleDuplicate = useCallback((id: string) => {
    submit({ action: "duplicate", id }, { method: "post" });
  }, [submit]);

  const handlePreview = useCallback((template: typeof templates[0]) => {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  }, []);

  const handleSeedPrebuilt = useCallback(() => {
    setShowSeedModal(true);
  }, []);

  const confirmSeed = useCallback(() => {
    submit({ action: "seed_prebuilt" }, { method: "post" });
    setShowSeedModal(false);
  }, [submit]);

  const handleApplyToGlobal = useCallback((id: string) => {
    setPendingAction({ type: "apply", id });
    setShowApplyModal(true);
  }, []);

  const confirmApply = useCallback(() => {
    if (pendingAction?.id) {
      submit({ action: "apply_to_global", id: pendingAction.id }, { method: "post" });
    }
    setShowApplyModal(false);
    setPendingAction(null);
  }, [pendingAction, submit]);

  const handleResetToDefaults = useCallback(() => {
    setShowResetModal(true);
  }, []);

  const confirmReset = useCallback(() => {
    submit({ action: "reset_to_defaults" }, { method: "post" });
    setShowResetModal(false);
  }, [submit]);

  const rows = useMemo(() => templates.map((template) => [
    template.name,
    template.description || "—",
    getCategoryBadge(template.category, template.isPrebuilt),
    template.usageCount,
    template.lastUsedAt ? new Date(template.lastUsedAt).toLocaleDateString() : "Never",
    <ButtonGroup key={template.id}>
      <Tooltip content="Preview">
        <Button
          icon={ViewIcon}
          variant="tertiary"
          onClick={() => handlePreview(template)}
        />
      </Tooltip>
      <Tooltip content="Apply to Global Settings">
        <Button
          variant="tertiary"
          onClick={() => handleApplyToGlobal(template.id)}
        >
          Apply
        </Button>
      </Tooltip>
      <Tooltip content="Duplicate">
        <Button
          icon={DuplicateIcon}
          variant="tertiary"
          onClick={() => handleDuplicate(template.id)}
        />
      </Tooltip>
      {!template.isPrebuilt && (
        <Tooltip content="Delete">
          <Button
            icon={DeleteIcon}
            variant="tertiary"
            tone="critical"
            onClick={() => handleDelete(template.id)}
          />
        </Tooltip>
      )}
    </ButtonGroup>,
  ]), [templates, getCategoryBadge, handlePreview, handleApplyToGlobal, handleDuplicate, handleDelete]);

  const hasPrebuiltTemplates = templates.some((t: any) => t.isPrebuilt);

  const previewStyles = useMemo(() => {
    if (!previewTemplate) return null;
    
    return {
      hurryUpFontSize: Math.max(10, (parseInt(previewTemplate.hurryUpFontSize) || 14) * 0.7),
      hurryUpHeight: Math.max(20, (parseInt(previewTemplate.hurryUpBannerHeight) || 30) * 0.7),
      bannerPadding: Math.max(6, (parseInt(previewTemplate.bannerPadding) || 10) * 0.7),
      bannerHeight: Math.max(80, (parseInt(previewTemplate.bannerHeight) || 130) * 0.7),
      imageSize: Math.max(50, (parseInt(previewTemplate.bannerImageHeight) || 80) * 0.7),
      titleFontSize: Math.max(11, (parseInt(previewTemplate.bannerTitleFontSize) || 15) * 0.75),
      priceFontSize: Math.max(10, (parseInt(previewTemplate.bannerPriceFontSize) || 14) * 0.75),
      button1FontSize: Math.max(10, (parseInt(previewTemplate.button1FontSize) || 14) * 0.75),
      button1Height: Math.max(32, (parseInt(previewTemplate.button1Height) || 45) * 0.7),
      button2FontSize: Math.max(10, (parseInt(previewTemplate.button2FontSize) || 14) * 0.75),
      button2Height: Math.max(32, (parseInt(previewTemplate.button2Height) || 45) * 0.7),
    };
  }, [previewTemplate]);

  return (
    <Page fullWidth>
      <TitleBar title="Banner Templates" />
      
      <BlockStack gap="400">
        {actionData && 'success' in actionData && actionData.success && (
          <Banner 
            tone="success" 
            onDismiss={() => {}}
            action={'redirect' in actionData && typeof actionData.redirect === 'string' ? {
              content: "View Global Settings",
              url: actionData.redirect,
            } : undefined}
          >
            {'message' in actionData ? actionData.message : 'Success'}
          </Banner>
        )}
        
        {actionData && 'error' in actionData && actionData.error && (
          <Banner tone="critical" onDismiss={() => {}}>
            {actionData.error}
          </Banner>
        )}

        {currentSettings?.appliedTemplateId && (
          <Banner 
            tone="info"
            action={{
              content: "Remove Template",
              onAction: () => {
                setShowResetModal(true);
              }
            }}
          >
            Currently using template: <strong>{currentSettings.appliedTemplateName}</strong>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <InlineStack align="space-between" blockAlign="start" gap="400" wrap>
                  <BlockStack gap="200">
                    <PolarisText as="h2" variant="headingLg">
                      Banner Templates
                    </PolarisText>
                    <PolarisText as="p" variant="bodyMd" tone="subdued">
                      Create reusable banner configurations. Apply templates to global settings or individual products instantly.
                    </PolarisText>
                  </BlockStack>
                  <InlineStack gap="300" wrap>
                    {!hasPrebuiltTemplates && (
                      <Button
                        onClick={handleSeedPrebuilt}
                        loading={isLoading}
                      >
                        Add Pre-built Templates
                      </Button>
                    )}
                    <Button
                      onClick={handleResetToDefaults}
                      loading={isLoading}
                      tone="critical"
                    >
                      Reset to Defaults
                    </Button>
                    <Button
                      variant="primary"
                      icon={PlusIcon}
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create Template
                    </Button>
                  </InlineStack>
                </InlineStack>

                {templates.length === 0 ? (
                  <EmptyState
                    heading="No templates yet"
                    action={{
                      content: "Create your first template",
                      onAction: () => setShowCreateModal(true),
                    }}
                    secondaryAction={{
                      content: "Add pre-built templates",
                      onAction: handleSeedPrebuilt,
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Save successful banner configurations as templates for quick reuse.</p>
                  </EmptyState>
                ) : (
                  <BlockStack gap="400">
                    <Banner>
                      <PolarisText as="p" variant="bodySm">
                        💡 <strong>Tip:</strong> Click "Apply" next to any template to instantly update your global banner settings, or use "Preview" to see how it looks first.
                      </PolarisText>
                    </Banner>
                    <Card>
                      <DataTable
                        columnContentTypes={["text", "text", "text", "numeric", "text", "text"]}
                        headings={["Name", "Description", "Category", "Usage", "Last Used", "Actions"]}
                        rows={rows}
                      />
                    </Card>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>

      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetTemplateForm();
        }}
        title="Create New Template"
        primaryAction={{
          content: "Create Template",
          loading: isLoading,
          onAction: () => {
            const formData = new FormData();
            formData.append("action", "create");
            formData.append("name", templateName);
            formData.append("description", templateDescription);
            formData.append("category", templateCategory);
            
            formData.append("bannerHeight", "130");
            formData.append("bannerImageHeight", "80");
            formData.append("bannerPadding", "10");
            formData.append("bannerTitleFontSize", "15");
            formData.append("bannerTitleColor", "111827");
            formData.append("bannerPriceFontSize", "14");
            formData.append("bannerPriceColor", "6b7280");
            formData.append("bannerBackgroundColor", "ffffff");
            formData.append("bannerBorderRadius", "8");
            formData.append("button1Text", "Add to Cart");
            formData.append("button1TextColor", "ffffff");
            formData.append("button1BackgroundColor", "FF6B6B");
            formData.append("button1BorderColor", "FF6B6B");
            formData.append("button1BorderRadius", "6");
            formData.append("button1FontSize", "16");
            formData.append("button1Height", "45");
            formData.append("button2Text", "Buy Now");
            formData.append("button2TextColor", "FF6B6B");
            formData.append("button2BackgroundColor", "ffffff");
            formData.append("button2BorderColor", "FF6B6B");
            formData.append("button2BorderRadius", "6");
            formData.append("button2FontSize", "16");
            formData.append("button2Height", "45");
            formData.append("hurryUpText", "Hurry Up! Limited Stock");
            formData.append("hurryUpBannerHeight", "30");
            formData.append("hurryUpBannerBackgroundColor", "FF6B6B");
            formData.append("hurryUpTextColor", "ffffff");
            formData.append("hurryUpFontSize", "14");
            formData.append("showPrice", "true");
            formData.append("isShowAddToCartButton", "true");
            formData.append("isShowBuyNowButton", "true");
            formData.append("isShowHurryUpBanner", "true");
            
            submit(formData, { method: "post" });
            setShowCreateModal(false);
            resetTemplateForm();
          },
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setShowCreateModal(false);
              resetTemplateForm();
            },
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <FormLayout.Group>
              <TextField
                label="Template Name"
                value={templateName}
                onChange={setTemplateName}
                autoComplete="off"
                placeholder="e.g., My Custom Template"
              />
              <Select
                label="Category"
                options={categoryOptions}
                value={templateCategory}
                onChange={setTemplateCategory}
              />
            </FormLayout.Group>
            
            <TextField
              label="Description"
              value={templateDescription}
              onChange={setTemplateDescription}
              multiline={3}
              autoComplete="off"
              helpText="Optional description for this template"
              placeholder="Describe when to use this template..."
            />
            
            <Banner tone="info">
              <PolarisText as="p" variant="bodySm">
                💡 <strong>Quick Start:</strong> This creates a basic template with default styling. For custom designs, use "Save as Template" from Global Settings to capture your current configuration.
              </PolarisText>
            </Banner>
          </FormLayout>
        </Modal.Section>
      </Modal>

      <Modal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={`Preview: ${previewTemplate?.name}`}
        size="large"
        secondaryActions={[
          {
            content: "Close",
            onAction: () => setShowPreviewModal(false),
          },
        ]}
      >
        {previewTemplate && previewStyles && (
          <Modal.Section>
            <BlockStack gap="500">
              <div style={{ textAlign: "center" }}>
                <PolarisText as="h3" variant="headingLg">
                  Template Preview
                </PolarisText>
                <PolarisText as="p" variant="bodyMd" tone="subdued">
                  See how your banner appears on desktop and mobile
                </PolarisText>
              </div>
              
              <BlockStack gap="400">
                <div>
                  <div style={{ 
                    marginBottom: "0.5rem", 
                    padding: "0.5rem 0.75rem", 
                    backgroundColor: "#1f2937", 
                    borderRadius: "6px",
                    textAlign: "center"
                  }}>
                    <PolarisText as="h4" variant="headingMd" tone="text-inverse">
                      <span style={{ fontSize: "0.875rem" }}>Desktop View - Full Width Banner</span>
                    </PolarisText>
                  </div>
                  
                  {previewTemplate.isShowHurryUpBanner && (
                    <div
                      style={{
                        backgroundColor: `#${previewTemplate.hurryUpBannerBackgroundColor}`,
                        color: `#${previewTemplate.hurryUpTextColor}`,
                        fontSize: `${previewStyles.hurryUpFontSize}px`,
                        textAlign: "center",
                        padding: "4px 0",
                        height: `${previewStyles.hurryUpHeight}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "600",
                        width: "100%"
                      }}
                    >
                      {previewTemplate.hurryUpText}
                    </div>
                  )}
                  
                  <div
                    style={{
                      backgroundColor: `#${previewTemplate.bannerBackgroundColor}`,
                      padding: `${previewStyles.bannerPadding}px`,
                      height: `${previewStyles.bannerHeight}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
                      border: "1px solid rgba(0,0,0,0.1)",
                      width: "100%",
                      maxWidth: "100%"
                    }}
                  >
                    <InlineStack gap="300" blockAlign="center" wrap>
                      <div
                        style={{
                          width: `${previewStyles.imageSize}px`,
                          height: `${previewStyles.imageSize}px`,
                          backgroundColor: "#f3f4f6",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          flexShrink: 0,
                          border: "1px solid #e5e7eb"
                        }}
                      >
                        📦
                      </div>
                      <BlockStack gap="100">
                        <div
                          style={{
                            color: `#${previewTemplate.bannerTitleColor}`,
                            fontSize: `${previewStyles.titleFontSize}px`,
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          Sample Product Title - Premium Quality Edition
                        </div>
                        {previewTemplate.showPrice && (
                          <div
                            style={{
                              color: `#${previewTemplate.bannerPriceColor}`,
                              fontSize: `${previewStyles.priceFontSize}px`,
                            }}
                          >
                            ₹ 2,999.00
                          </div>
                        )}
                      </BlockStack>
                    </InlineStack>
                    
                    <InlineStack gap="200" wrap>
                      {previewTemplate.isShowAddToCartButton && (
                        <button
                          style={{
                            backgroundColor: `#${previewTemplate.button1BackgroundColor}`,
                            color: `#${previewTemplate.button1TextColor}`,
                            border: `2px solid #${previewTemplate.button1BorderColor}`,
                            borderRadius: `${previewTemplate.button1BorderRadius || 6}px`,
                            padding: "0 16px",
                            fontSize: `${previewStyles.button1FontSize}px`,
                            height: `${previewStyles.button1Height}px`,
                            fontWeight: "600",
                            cursor: "pointer",
                            minWidth: "100px",
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                            minHeight: "44px"
                          }}
                        >
                          {previewTemplate.button1Text}
                        </button>
                      )}
                      {previewTemplate.isShowBuyNowButton && (
                        <button
                          style={{
                            backgroundColor: `#${previewTemplate.button2BackgroundColor}`,
                            color: `#${previewTemplate.button2TextColor}`,
                            border: `2px solid #${previewTemplate.button2BorderColor}`,
                            borderRadius: `${previewTemplate.button2BorderRadius || 6}px`,
                            padding: "0 16px",
                            fontSize: `${previewStyles.button2FontSize}px`,
                            height: `${previewStyles.button2Height}px`,
                            fontWeight: "600",
                            cursor: "pointer",
                            minWidth: "100px",
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                            minHeight: "44px"
                          }}
                        >
                          {previewTemplate.button2Text}
                        </button>
                      )}
                    </InlineStack>
                  </div>
                </div>

                <div>
                  <div style={{ 
                    marginBottom: "1rem", 
                    padding: "0.75rem 1rem", 
                    backgroundColor: "#1f2937", 
                    borderRadius: "8px",
                    textAlign: "center"
                  }}>
                    <PolarisText as="h4" variant="headingMd" tone="text-inverse">
                      Mobile View - Google Pixel 7 (412px)
                    </PolarisText>
                  </div>
                  
                  <div style={{ 
                    maxWidth: "412px",
                    width: "100%",
                    margin: "0 auto"
                  }}>
                    {previewTemplate.isShowHurryUpBanner && (
                      <div
                        style={{
                          backgroundColor: `#${previewTemplate.hurryUpBannerBackgroundColor}`,
                          color: `#${previewTemplate.hurryUpTextColor}`,
                          fontSize: "12px",
                          textAlign: "center",
                          padding: "6px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "600",
                          borderTopLeftRadius: "8px",
                          borderTopRightRadius: "8px",
                          marginBottom: "0"
                        }}
                      >
                        {previewTemplate.hurryUpText}
                      </div>
                    )}
                    
                    <div
                      style={{
                        backgroundColor: `#${previewTemplate.bannerBackgroundColor}`,
                        borderRadius: previewTemplate.isShowHurryUpBanner ? "0 0 8px 8px" : "8px",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "1px solid rgba(0,0,0,0.08)"
                      }}
                    >
                      <BlockStack gap="100">
                        <div
                          style={{
                            color: `#${previewTemplate.bannerTitleColor}`,
                            fontSize: "14px",
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          Sample Product Title
                        </div>
                        {previewTemplate.showPrice && (
                          <div
                            style={{
                              color: `#${previewTemplate.bannerPriceColor}`,
                              fontSize: "12px",
                            }}
                          >
                            ₹ 2,999.00
                          </div>
                        )}
                      </BlockStack>
                      
                      {previewTemplate.isShowAddToCartButton && (
                        <button
                          style={{
                            backgroundColor: `#${previewTemplate.button1BackgroundColor}`,
                            color: `#${previewTemplate.button1TextColor}`,
                            border: `1px solid #${previewTemplate.button1BorderColor}`,
                            borderRadius: "6px",
                            padding: "8px 16px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            minHeight: "44px"
                          }}
                        >
                          {previewTemplate.button1Text}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </BlockStack>
              
              <Card>
                <BlockStack gap="400">
                  <PolarisText as="h4" variant="headingMd">
                    Template Details
                  </PolarisText>
                  <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
                    <BlockStack gap="100">
                      <PolarisText as="p" variant="bodySm" tone="subdued" fontWeight="semibold">
                        Category
                      </PolarisText>
                      <PolarisText as="p" variant="bodyMd">
                        {previewTemplate.category.replace('_', ' ')}
                      </PolarisText>
                    </BlockStack>
                    <BlockStack gap="100">
                      <PolarisText as="p" variant="bodySm" tone="subdued" fontWeight="semibold">
                        Usage Count
                      </PolarisText>
                      <PolarisText as="p" variant="bodyMd">
                        {previewTemplate.usageCount} times
                      </PolarisText>
                    </BlockStack>
                    <BlockStack gap="100">
                      <PolarisText as="p" variant="bodySm" tone="subdued" fontWeight="semibold">
                        Type
                      </PolarisText>
                      <PolarisText as="p" variant="bodyMd">
                        {previewTemplate.isPrebuilt ? "Pre-built" : "Custom"}
                      </PolarisText>
                    </BlockStack>
                  </InlineGrid>
                  {previewTemplate.description && (
                    <BlockStack gap="200">
                      <PolarisText as="p" variant="bodySm" tone="subdued" fontWeight="semibold">
                        Description
                      </PolarisText>
                      <PolarisText as="p" variant="bodyMd">
                        {previewTemplate.description}
                      </PolarisText>
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>
            </BlockStack>
          </Modal.Section>
        )}
      </Modal>

      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPendingAction(null);
        }}
        title="Delete Template"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: confirmDelete,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setShowDeleteModal(false);
              setPendingAction(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <PolarisText as="p" variant="bodyMd">
            Are you sure you want to delete this template? This action cannot be undone.
          </PolarisText>
        </Modal.Section>
      </Modal>

      <Modal
        open={showSeedModal}
        onClose={() => setShowSeedModal(false)}
        title="Add Pre-built Templates"
        primaryAction={{
          content: "Add Templates",
          onAction: confirmSeed,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowSeedModal(false),
          },
        ]}
      >
        <Modal.Section>
          <PolarisText as="p" variant="bodyMd">
            This will add 6 pre-built templates to your collection. Continue?
          </PolarisText>
        </Modal.Section>
      </Modal>

      <Modal
        open={showApplyModal}
        onClose={() => {
          setShowApplyModal(false);
          setPendingAction(null);
        }}
        title="Apply Template to Global Settings"
        primaryAction={{
          content: "Apply",
          onAction: confirmApply,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setShowApplyModal(false);
              setPendingAction(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <PolarisText as="p" variant="bodyMd">
            This will apply the template to your global banner settings. Continue?
          </PolarisText>
        </Modal.Section>
      </Modal>

      <Modal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset to Defaults"
        primaryAction={{
          content: "Reset",
          destructive: true,
          onAction: confirmReset,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowResetModal(false),
          },
        ]}
      >
        <Modal.Section>
          <PolarisText as="p" variant="bodyMd">
            This will reset your global banner settings to default values. All current customizations will be lost. Continue?
          </PolarisText>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
