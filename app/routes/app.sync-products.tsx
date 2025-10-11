import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  
  // Get count of products in our database
  const productCount = await (prisma as any).product.count();
  
  return json({ productCount });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  
  try {
    // Fetch all products from Shopify
    const response = await admin.graphql(`
      {
        products(first: 250) {
          edges {
            node {
              id
              title
              handle
              bodyHtml
              status
              vendor
              productType
              tags
              featuredImage {
                src
              }
              variants(first: 50) {
                edges {
                  node {
                    id
                    title
                    price
                    sku
                  }
                }
              }
            }
          }
        }
      }
    `);

    const data = await response.json();
    const products = data.data.products.edges;

    // Sync products to our database
    let syncedCount = 0;
    for (const edge of products) {
      const product = edge.node;
      const firstVariant = product.variants.edges[0]?.node;
      const price = firstVariant?.price || "0.00";
      const featuredImage = product.featuredImage?.src || null;
      
      // Extract numeric variant ID from GraphQL ID
      const variantId = firstVariant?.id ? firstVariant.id.split('/').pop() || null : null;

      // Process all variants for this product with numeric IDs
      const variants = product.variants.edges.map((variantEdge: any) => ({
        id: variantEdge.node.id.split('/').pop(), // Store numeric ID
        title: variantEdge.node.title,
        price: variantEdge.node.price,
        sku: variantEdge.node.sku
      }));

      await (prisma as any).product.upsert({
        where: { shopifyId: product.id },
        update: {
          title: product.title,
          handle: product.handle,
          description: product.bodyHtml || null,
          featuredImage,
          price,
          currencyCode: "USD",
          status: product.status,
          vendor: product.vendor || null,
          productType: product.productType || null,
          tags: product.tags?.join(', ') || null,
          variantId,
          variants: JSON.stringify(variants), // Store all variants as JSON
          updatedAt: new Date(),
        },
        create: {
          shopifyId: product.id,
          title: product.title,
          handle: product.handle,
          description: product.bodyHtml || null,
          featuredImage,
          price,
          currencyCode: "USD",
          status: product.status,
          vendor: product.vendor || null,
          productType: product.productType || null,
          tags: product.tags?.join(', ') || null,
          variantId,
          variants: JSON.stringify(variants), // Store all variants as JSON
        },
      });
      syncedCount++;
    }

    return json({ success: true, syncedCount });
  } catch (error) {
    console.error("Error syncing products:", error);
    return json({ success: false, error: "Failed to sync products" });
  }
}

export default function SyncProductsPage() {
  const { productCount } = useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="Sync Products" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Product Sync
              </Text>
              <Text as="p" variant="bodyMd">
                Currently have {productCount} products in the database.
              </Text>
              <Text as="p" variant="bodyMd">
                Click the button below to sync all products from Shopify to the local database.
                This will create new products and update existing ones.
              </Text>
              <Form method="post">
                <Button submit variant="primary">
                  Sync Products from Shopify
                </Button>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
