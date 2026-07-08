import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, cartsTable, cartItemsTable, productsTable, ordersTable, orderItemsTable } from "@workspace/db";
import {
  AddToCartBody,
  UpdateCartItemParams,
  UpdateCartItemBody,
  RemoveFromCartParams,
  CheckoutCartBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateCart(userId: string) {
  let [cart] = await db.select().from(cartsTable).where(eq(cartsTable.userId, userId));
  if (!cart) {
    [cart] = await db.insert(cartsTable).values({ userId }).returning();
  }
  return cart;
}

async function buildCartResponse(cartId: number, userId: string) {
  const items = await db
    .select({
      id: cartItemsTable.id,
      cartId: cartItemsTable.cartId,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      createdAt: cartItemsTable.createdAt,
      product: {
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        price: productsTable.price,
        category: productsTable.category,
        stock: productsTable.stock,
        imageUrl: productsTable.imageUrl,
        featured: productsTable.featured,
        careLevel: productsTable.careLevel,
        sunlight: productsTable.sunlight,
        watering: productsTable.watering,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
      },
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.cartId, cartId));

  const total = items.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );

  return {
    id: cartId,
    userId,
    items: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      product: {
        ...item.product,
        price: parseFloat(item.product.price),
        createdAt: item.product.createdAt.toISOString(),
        updatedAt: item.product.updatedAt.toISOString(),
      },
    })),
    total: Math.round(total * 100) / 100,
  };
}

router.get("/cart", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const cart = await getOrCreateCart(req.user.id);
  res.json(await buildCartResponse(cart.id, req.user.id));
});

router.post("/cart/items", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.productId));

  if (!product) {
    res.status(400).json({ error: "Product not found" });
    return;
  }

  if (product.stock <= 0) {
    res.status(400).json({ error: `${product.name} is out of stock` });
    return;
  }

  const cart = await getOrCreateCart(req.user.id);

  const [existingItem] = await db
    .select()
    .from(cartItemsTable)
    .where(
      and(
        eq(cartItemsTable.cartId, cart.id),
        eq(cartItemsTable.productId, parsed.data.productId)
      )
    );

  const newQuantity = existingItem
    ? existingItem.quantity + parsed.data.quantity
    : parsed.data.quantity;

  if (newQuantity > product.stock) {
    res.status(400).json({ error: `Only ${product.stock} in stock for "${product.name}"` });
    return;
  }

  if (existingItem) {
    await db
      .update(cartItemsTable)
      .set({ quantity: newQuantity })
      .where(eq(cartItemsTable.id, existingItem.id));
  } else {
    await db.insert(cartItemsTable).values({
      cartId: cart.id,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
    });
  }

  res.json(await buildCartResponse(cart.id, req.user.id));
});

router.patch("/cart/items/:productId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const cart = await getOrCreateCart(req.user.id);

  const [item] = await db
    .select()
    .from(cartItemsTable)
    .where(
      and(
        eq(cartItemsTable.cartId, cart.id),
        eq(cartItemsTable.productId, params.data.productId)
      )
    );

  if (!item) {
    res.status(404).json({ error: "Cart item not found" });
    return;
  }

  await db
    .update(cartItemsTable)
    .set({ quantity: parsed.data.quantity })
    .where(eq(cartItemsTable.id, item.id));

  res.json(await buildCartResponse(cart.id, req.user.id));
});

router.delete("/cart/items/:productId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = RemoveFromCartParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const cart = await getOrCreateCart(req.user.id);

  await db
    .delete(cartItemsTable)
    .where(
      and(
        eq(cartItemsTable.cartId, cart.id),
        eq(cartItemsTable.productId, params.data.productId)
      )
    );

  res.json(await buildCartResponse(cart.id, req.user.id));
});

router.post("/cart/checkout", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CheckoutCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const cart = await getOrCreateCart(req.user.id);
  const items = await db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      product: {
        id: productsTable.id,
        name: productsTable.name,
        price: productsTable.price,
        stock: productsTable.stock,
      },
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.cartId, cart.id));

  if (items.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  // Validate stock before placing order
  for (const item of items) {
    if (item.product.stock < item.quantity) {
      res.status(400).json({
        error: `Insufficient stock for "${item.product.name}". Only ${item.product.stock} available.`,
      });
      return;
    }
  }

  const total = items.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId: req.user.id,
      customerName: parsed.data.customerName,
      customerEmail: req.user.email ?? null,
      phoneNumber: parsed.data.phoneNumber,
      status: "pending",
      total: String(Math.round(total * 100) / 100),
      shippingAddress: parsed.data.shippingAddress,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  const orderItemValues = items.map((item) => ({
    orderId: order.id,
    productId: item.product.id,
    quantity: item.quantity,
    unitPrice: item.product.price,
    productName: item.product.name,
  }));

  const orderItemsRows = await db
    .insert(orderItemsTable)
    .values(orderItemValues)
    .returning();

  // Decrement stock for each ordered product
  for (const item of items) {
    await db
      .update(productsTable)
      .set({ stock: sql`${productsTable.stock} - ${item.quantity}` })
      .where(eq(productsTable.id, item.product.id));
  }

  // Clear cart
  await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));

  res.status(201).json({
    ...order,
    total: parseFloat(order.total),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: orderItemsRows.map((oi) => ({
      ...oi,
      unitPrice: parseFloat(oi.unitPrice),
    })),
  });
});

export default router;
