import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "app/db.server";

export const action: ActionFunction = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Shopify sends inventory level updates
    if (body.inventory_level) {
      const { inventory_item_id, location_id, available } = body.inventory_level;
      
      // Find the product variant that matches this inventory item
      const product = await prisma.product.findFirst({
        where: {
          variants: {
            contains: inventory_item_id
          }
        }
      });
      
      if (product) {
        // Parse variants to find the matching one
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
        
        // Find the variant that matches the inventory item
        const matchingVariant = parsedVariants.find((variant: any) => 
          variant.inventory_item_id === inventory_item_id
        );
        
        if (matchingVariant) {
          // Update the specific variant's inventory in the variants array
          const updatedVariants = parsedVariants.map((variant: any) => {
            if (variant.inventory_item_id === inventory_item_id) {
              return {
                ...variant,
                inventory_quantity: available
              };
            }
            return variant;
          });
          
          // Calculate total inventory across all variants
          let totalInventory = 0;
          for (const variant of updatedVariants) {
            if (variant.tracked && variant.inventory_quantity !== null && variant.inventory_quantity !== undefined) {
              totalInventory += variant.inventory_quantity;
            }
          }
          
          // Update the product with new total inventory and updated variants
          await prisma.product.update({
            where: { id: product.id },
            data: {
              inventoryQuantity: totalInventory,
              variants: JSON.stringify(updatedVariants),
              updatedAt: new Date()
            }
          });
          
          console.log(`Updated inventory for product ${product.handle}: variant ${inventory_item_id} now has ${available}, total inventory: ${totalInventory}`);
        }
      }
    }
    
    return json({ success: true });
  } catch (error) {
    console.error("Error processing inventory webhook:", error);
    return json({ error: "Failed to process inventory update" }, { status: 500 });
  }
};
