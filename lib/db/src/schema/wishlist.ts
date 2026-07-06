import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { productsTable } from "./products";

export const wishlistsTable = pgTable(
  "wishlists",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.userId, table.productId)]
);

export type Wishlist = typeof wishlistsTable.$inferSelect;
