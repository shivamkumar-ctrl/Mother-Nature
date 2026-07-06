import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import wishlistRouter from "./wishlist";
import customersRouter from "./customers";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(wishlistRouter);
router.use(customersRouter);
router.use(dashboardRouter);

export default router;
