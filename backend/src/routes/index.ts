import { Router } from "express";

import { authRouter } from "./auth.routes.js";
import { peopleRouter } from "./people.routes.js";
import { ordersRouter } from "./orders.routes.js";
import { profileRouter } from "./profile.routes.js";
import { productsRouter } from "./products.routes.js";
import { statsRouter } from "./stats.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/people", peopleRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/stats", statsRouter);
