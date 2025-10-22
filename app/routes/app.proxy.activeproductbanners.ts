import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "app/db.server";

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const productHandle = url.searchParams.get('handle');

    if (!productHandle) {
      return json({ 
        error: "Product handle is required",
        product: null 
      }, { status: 400 });
    }

    // Fetch product from database
    const product = await prisma.product.findUnique({
      where: { handle: productHandle },
      select: {
        id: true,
        shopifyId: true,
        handle: true,
        title: true,
        price: true,
        currencyCode: true,
        featuredImage: true,
        variantId: true,
        variants: true,
        description: true,
        inventoryQuantity: true,
        inventoryTracked: true,
        lowStockThreshold: true
      }
    });

    if (!product) {
      return json({ 
        error: "Product not found",
        product: null 
      }, { status: 404 });
    }

    // Parse variants if it's a JSON string
    let parsedVariants = [];
    try {
      if (typeof product.variants === 'string') {
        parsedVariants = JSON.parse(product.variants);
      } else if (Array.isArray(product.variants)) {
        parsedVariants = product.variants;
      }
    } catch (e) {
      console.error("Error parsing variants:", e);
    }

    // Check if we should show low stock banner (inventory <= 15)
    const shouldShowLowStock = product.inventoryTracked && 
      product.inventoryQuantity !== null && 
      product.inventoryQuantity <= 15;


    return json({
      product: {
        id: product.id,
        shopifyId: product.shopifyId,
        handle: product.handle,
        title: product.title,
        price: product.price,
        currencyCode: product.currencyCode || "USD",
        featuredImage: product.featuredImage,
        variantId: product.variantId,
        variants: parsedVariants,
        description: product.description,
        inventoryQuantity: product.inventoryQuantity,
        inventoryTracked: product.inventoryTracked,
        shouldShowLowStock: shouldShowLowStock
      }
    });
  } catch (err) {
    console.error("Error fetching product banner data:", err);
    return json({ 
      error: "Internal server error", 
      product: null 
    }, { status: 500 });
  }
};