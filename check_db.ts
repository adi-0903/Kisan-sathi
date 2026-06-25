import { db } from "./src/db/index.js";
import { ordersTable, productsTable } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

async function run() {
  const orders = await db.select().from(ordersTable);
  console.log("ALL ORDERS:");
  console.log(orders.map(o => ({ id: o.id, supplierId: o.supplierId, isAgriInput: o.isAgriInput })));

  const products = await db.select().from(productsTable);
  console.log("ALL PRODUCTS:");
  console.log(products.map(p => ({ id: p.id, supplierId: p.supplierId, isAgriInput: p.isAgriInput })));
  
  process.exit(0);
}

run().catch(console.error);
