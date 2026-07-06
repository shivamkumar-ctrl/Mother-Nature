import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, wishlistsTable, productsTable } from "@workspace/db";

const router: IRouter = Router();

async function buildWishlistItem(item: typeof wishlistsTable.$inferSelect) {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, item.productId));

  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    product: product
      ? { ...product, price: parseFloat(product.price) }
      : null,
  };
}

router.get("/wishlist", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const items = await db
    .select()
    .from(wishlistsTable)
    .where(eq(wishlistsTable.userId, req.user.id));

  const result = await Promise.all(items.map(buildWishlistItem));
  res.json(result);
});

router.post("/wishlist", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const productId = Number(req.body?.productId);
  if (!productId || isNaN(productId)) {
    res.status(400).json({ error: "productId is required" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [inserted] = await db
    .insert(wishlistsTable)
    .values({ userId: req.user.id, productId })
    .onConflictDoNothing()
    .returning();

  if (!inserted) {
    const [existing] = await db
      .select()
      .from(wishlistsTable)
      .where(
        and(
          eq(wishlistsTable.userId, req.user.id),
          eq(wishlistsTable.productId, productId)
        )
      );
    res.status(201).json(await buildWishlistItem(existing));
    return;
  }

  res.status(201).json(await buildWishlistItem(inserted));
});

router.delete("/wishlist/:productId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const productId = parseInt(req.params.productId);
  if (isNaN(productId)) {
    res.status(400).json({ error: "Invalid productId" });
    return;
  }

  await db
    .delete(wishlistsTable)
    .where(
      and(
        eq(wishlistsTable.userId, req.user.id),
        eq(wishlistsTable.productId, productId)
      )
    );

  res.json({ success: true });
});

export default router;
