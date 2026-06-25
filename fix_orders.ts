import 'dotenv/config';
import { db } from "./src/db/index.js";
import { ordersTable, productsTable } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

async function fixOrders() {
  const orders = await db.select().from(ordersTable);
  const products = await db.select().from(productsTable);
  
  for (const order of orders) {
    if (order.supplierId === 'agri-business-supplier' || !order.supplierId) {
      console.log(`Fixing order ${order.id}...`);
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        const firstProductId = (order.items[0] as any).productId;
        const product = products.find(p => p.id === firstProductId);
        if (product && product.supplierId) {
          await db.update(ordersTable)
            .set({ supplierId: product.supplierId })
            .where(eq(ordersTable.id, order.id));
          console.log(`Updated order ${order.id} with supplierId ${product.supplierId}`);
        } else {
          console.log(`Could not find product for order ${order.id}`);
        }
      }
    }
  }
  console.log("Done.");
  process.exit(0);
}

fixOrders().catch(console.error);
