import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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
