import { Router, type IRouter } from "express";
import { eq, desc, lte, sql, count } from "drizzle-orm";
import { db, usersTable, ordersTable, productsTable } from "@workspace/db";
import { isOwner } from "./products";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!isOwner(req.user.id)) {
    res.status(403).json({ error: "Forbidden: owner only" });
    return;
  }

  const allOrders = await db.select().from(ordersTable);
  const allProducts = await db.select().from(productsTable);
  const allCustomers = await db.select().from(usersTable);

  const totalRevenue = allOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + parseFloat(o.total), 0);

  const pendingOrders = allOrders.filter((o) => o.status === "pending").length;
  const lowStockCount = allProducts.filter((p) => p.stock <= 5).length;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const ordersThisMonth = allOrders.filter(
    (o) => new Date(o.createdAt) >= startOfMonth && o.status !== "cancelled"
  );

  const revenueThisMonth = ordersThisMonth.reduce(
    (sum, o) => sum + parseFloat(o.total),
    0
  );

  res.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders: allOrders.length,
    totalCustomers: allCustomers.length,
    totalProducts: allProducts.length,
    pendingOrders,
    lowStockCount,
    revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
    ordersThisMonth: ordersThisMonth.length,
  });
});

router.get("/dashboard/recent-orders", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!isOwner(req.user.id)) {
    res.status(403).json({ error: "Forbidden: owner only" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(10);

  const { orderItemsTable } = await import("@workspace/db");

  const result = await Promise.all(
    orders.map(async (order) => {
      const items = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));

      return {
        ...order,
        total: parseFloat(order.total),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: items.map((oi) => ({
          ...oi,
          unitPrice: parseFloat(oi.unitPrice),
        })),
      };
    })
  );

  res.json(result);
});

router.get("/dashboard/low-stock", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!isOwner(req.user.id)) {
    res.status(403).json({ error: "Forbidden: owner only" });
    return;
  }

  const products = await db
    .select()
    .from(productsTable)
    .orderBy(productsTable.stock);

  const lowStock = products.filter((p) => p.stock <= 5);

  res.json(
    lowStock.map((p) => ({
      ...p,
      price: parseFloat(p.price),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
  );
});

export default router;
