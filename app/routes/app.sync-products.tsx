import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  Button,
  Banner,
  ProgressBar,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  
  const productCount = await (prisma as any).product.count();
  
  return json({ productCount });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  
  try {
    let hasNextPage = true;
    let cursor: string | null = null;
    let syncedCount = 0;

     // Fetch products in small batches to stay under query cost limits
     while (hasNextPage) {
       const response: any = await admin.graphql(`
         query getProducts($cursor: String) {
           products(first: 25, after: $cursor) {
             pageInfo {
               hasNextPage
               endCursor
             }
             edges {
               node {
                 id
                 title
                 handle
                 descriptionHtml
                 status
                 vendor
                 productType
                 tags
                 featuredImage {
                   url
                 }
                 variants(first: 25) {
                   edges {
                     node {
                       id
                       title
                       price
                       sku
                       inventoryItem {
                         id
                         tracked
                       }
                     }
                   }
                 }
               }
             }
           }
         }
       `, {
         variables: {
           cursor: cursor,
         },
       });

       const data: any = await response.json();
      
      // Check for GraphQL errors
      if (data.errors) {
        console.error("GraphQL errors:", JSON.stringify(data.errors, null, 2));
        throw new Error(`GraphQL Error: ${data.errors[0]?.message || 'Unknown error'}`);
      }

       const productsData: any = data.data.products;
      const products = productsData.edges;
      
      hasNextPage = productsData.pageInfo.hasNextPage;
      cursor = productsData.pageInfo.endCursor;

      // Process each product
      for (const edge of products) {
        const product = edge.node;
        const firstVariant = product.variants.edges[0]?.node;
        const price = firstVariant?.price || "0.00";
        const featuredImage = product.featuredImage?.url || null;
        
        const variantId = firstVariant?.id ? firstVariant.id.split('/').pop() || null : null;

         // Get REAL inventory using REST API
         let totalInventory = 0;
         let hasTrackedInventory = false;

         // Check if any variant is tracked
         for (const variantEdge of product.variants.edges) {
           const variant = variantEdge.node;
           if (variant.inventoryItem?.tracked) {
             hasTrackedInventory = true;
             break;
           }
         }

         // If inventory is tracked, fetch REAL quantities using REST API
         if (hasTrackedInventory) {
           try {
             // Get all inventory item IDs for this product
             const inventoryItemIds = product.variants.edges
               .map((edge: any) => edge.node.inventoryItem?.id?.split('/').pop())
               .filter(Boolean);
             
             if (inventoryItemIds.length > 0) {
               // Fetch REAL inventory levels using REST API
               const inventoryResponse = await admin.rest.get({
                 path: 'inventory_levels',
                 query: {
                   inventory_item_ids: inventoryItemIds.join(',')
                 }
               });
               
               const inventoryData = await inventoryResponse.json();
               
               // Sum up REAL available quantities from all locations
               if (inventoryData.inventory_levels) {
                 for (const level of inventoryData.inventory_levels) {
                   totalInventory += level.available || 0;
                 }
               }
             }
           } catch (error) {
             console.error("Error fetching REAL inventory for product:", product.handle, error);
           }
         }

         const variants = product.variants.edges.map((variantEdge: any) => {
           const variant = variantEdge.node;
           const variantNumericId = variant.id.split('/').pop();

           return {
             id: variantNumericId,
             title: variant.title,
             price: variant.price,
             sku: variant.sku || null,
             inventory_item_id: variant.inventoryItem?.id?.split('/').pop() || null,
             tracked: variant.inventoryItem?.tracked || false
           };
         });

        // Save to database
        await (prisma as any).product.upsert({
          where: { shopifyId: product.id },
          update: {
            title: product.title,
            handle: product.handle,
            description: product.descriptionHtml || null,
            featuredImage,
            price,
            currencyCode: "USD",
            status: product.status,
            vendor: product.vendor || null,
            productType: product.productType || null,
            tags: product.tags?.join(', ') || null,
            variantId,
            variants: JSON.stringify(variants),
            inventoryQuantity: totalInventory,
            inventoryTracked: hasTrackedInventory,
            updatedAt: new Date(),
          },
          create: {
            shopifyId: product.id,
            title: product.title,
            handle: product.handle,
            description: product.descriptionHtml || null,
            featuredImage,
            price,
            currencyCode: "USD",
            status: product.status,
            vendor: product.vendor || null,
            productType: product.productType || null,
            tags: product.tags?.join(', ') || null,
            variantId,
            variants: JSON.stringify(variants),
            inventoryQuantity: totalInventory,
            inventoryTracked: hasTrackedInventory,
             lowStockThreshold: 15, // Default threshold
          },
        });
        syncedCount++;
      }

      console.log(`Synced batch: ${products.length} products (Total: ${syncedCount})`);

      // Rate limit protection
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return json({ 
      success: true, 
      syncedCount,
      message: `Successfully synced ${syncedCount} products with inventory data` 
    });
  } catch (error: any) {
    console.error("Error syncing products:", error);
    return json({ 
      success: false, 
      error: error.message || "Failed to sync products" 
    }, { status: 500 });
  }
}

export default function SyncProductsPage() {
  const { productCount } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  return (
    <Page>
      <TitleBar title="Sync Products" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
             {actionData?.success && 'message' in actionData && (
               <Banner tone="success" title="Sync completed successfully">
                 <p>{actionData.message}</p>
               </Banner>
             )}
             
             {actionData && 'error' in actionData && (
               <Banner tone="critical" title="Sync failed">
                 <p>{actionData.error}</p>
               </Banner>
             )}

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Product Sync with Inventory
                </Text>
                <Text as="p" variant="bodyMd">
                  Currently have {productCount} products in the database.
                </Text>
                <Text as="p" variant="bodyMd">
                  This will sync all products with their current inventory levels from Shopify.
                </Text>
                
                {isLoading && (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      Syncing products... This may take a few moments.
                    </Text>
                    <ProgressBar progress={75} size="small" />
                  </BlockStack>
                )}

                <Form method="post">
                  <Button 
                    submit 
                    variant="primary" 
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    {isLoading ? "Syncing..." : "Sync Products from Shopify"}
                  </Button>
                </Form>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}