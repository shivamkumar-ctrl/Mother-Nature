import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  CancelOrderParams,
} from "@workspace/api-zod";
import { isOwner } from "./products";

const router: IRouter = Router();

async function buildOrderResponse(order: typeof ordersTable.$inferSelect) {
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
}

router.get("/orders", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = ListOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(ordersTable).$dynamic();

  if (isOwner(req.user.id, req.user.email)) {
    if (params.data.status) {
      query = query.where(eq(ordersTable.status, params.data.status));
    }
    if (params.data.customerId) {
      query = query.where(eq(ordersTable.userId, params.data.customerId));
    }
  } else {
    query = query.where(eq(ordersTable.userId, req.user.id));
  }

  const orders = await query.orderBy(desc(ordersTable.createdAt));

  const result = await Promise.all(orders.map(buildOrderResponse));
  res.json(result);
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (!isOwner(req.user.id, req.user.email) && order.userId !== req.user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(await buildOrderResponse(order));
});

router.patch("/orders/:id/status", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!isOwner(req.user.id, req.user.email)) {
    res.status(403).json({ error: "Forbidden: owner only" });
    return;
  }

  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(await buildOrderResponse(order));
});

router.post("/orders/:id/cancel", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = CancelOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (!isOwner(req.user.id, req.user.email) && order.userId !== req.user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const twoHoursMs = 2 * 60 * 60 * 1000;
  if (Date.now() - order.createdAt.getTime() > twoHoursMs) {
    res.status(400).json({ error: "Cannot cancel: order was placed more than 2 hours ago" });
    return;
  }

  if (!["pending", "processing"].includes(order.status)) {
    res.status(400).json({ error: `Cannot cancel: order is already ${order.status}` });
    return;
  }

  const [cancelled] = await db
    .update(ordersTable)
    .set({ status: "cancelled" })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  res.json(await buildOrderResponse(cancelled));
});

export default router;
