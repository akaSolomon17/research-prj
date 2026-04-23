import { Router } from "express";

import { authRouter } from "./auth.routes.js";
import { ordersRouter } from "./orders.routes.js";
import { profileRouter } from "./profile.routes.js";
import { statsRouter } from "./stats.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/stats", statsRouter);
