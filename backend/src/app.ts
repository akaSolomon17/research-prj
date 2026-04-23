import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { apiRouter } from "./routes/index.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/v1", requireAuth, apiRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  return app;
};
