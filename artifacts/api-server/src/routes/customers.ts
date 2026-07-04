import { Router, type IRouter } from "express";
import { eq, ilike, desc, sql } from "drizzle-orm";
import { db, usersTable, ordersTable } from "@workspace/db";
import {
  ListCustomersQueryParams,
  GetCustomerParams,
} from "@workspace/api-zod";
import { isOwner } from "./products";

const router: IRouter = Router();

router.get("/customers", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!isOwner(req.user.id)) {
    res.status(403).json({ error: "Forbidden: owner only" });
    return;
  }

  const params = ListCustomersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  if (params.data.search) {
    const s = params.data.search.toLowerCase();
    users = users.filter(
      (u) =>
        (u.email ?? "").toLowerCase().includes(s) ||
        (u.firstName ?? "").toLowerCase().includes(s) ||
        (u.lastName ?? "").toLowerCase().includes(s)
    );
  }

  const result = await Promise.all(
    users.map(async (u) => {
      const orders = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.userId, u.id));

      const totalSpent = orders.reduce(
        (sum, o) => sum + parseFloat(o.total),
        0
      );

      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        profileImageUrl: u.profileImageUrl,
        totalOrders: orders.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        createdAt: u.createdAt.toISOString(),
      };
    })
  );

  res.json(result);
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!isOwner(req.user.id)) {
    res.status(403).json({ error: "Forbidden: owner only" });
    return;
  }

  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));

  if (!user) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, user.id))
    .orderBy(desc(ordersTable.createdAt));

  const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    totalOrders: orders.length,
    totalSpent: Math.round(totalSpent * 100) / 100,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
