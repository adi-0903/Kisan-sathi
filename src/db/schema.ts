import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const neonTestTable = pgTable("neon_test", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appData = pgTable("app_data", {
  id: text("id").primaryKey(), // Combined "collection:docId"
  collection: text("collection").notNull(),
  docId: text("doc_id").notNull(),
  data: text("data").notNull(), // Stringified JSON
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  supplierId: text("supplier_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  unit: text("unit").notNull(),
  quantity: integer("quantity"),
  isAgriInput: boolean("is_agri_input").default(false),
  status: text("status").default("Listed"),
  image: text("image"),
  description: text("description"),
  farmerName: text("farmer_name"),
  certified: boolean("certified").default(false),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  buyerId: text("buyer_id").notNull(),
  buyerName: text("buyer_name"),
  buyerPhone: text("buyer_phone"),
  deliveryAddress: text("delivery_address"),
  supplierId: text("supplier_id"),
  totalAmount: integer("total_amount").notNull(),
  isGroupBuy: boolean("is_group_buy").default(false),
  societyCode: text("society_code"),
  status: text("status").default("Pending"),
  paymentStatus: text("payment_status").default("Pending"),
  isAgriInput: boolean("is_agri_input").default(false),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
  items: jsonb("items").notNull(),
});
