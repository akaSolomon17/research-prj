import type { Response } from "express";

export const sendBadRequest = (res: Response, message: string) =>
  res.status(400).json({ message });

export const sendUnauthorized = (res: Response, message = "Unauthorized") =>
  res.status(401).json({ message });

export const sendForbidden = (res: Response, message = "Forbidden") =>
  res.status(403).json({ message });

export const sendNotFound = (res: Response, message = "Not found") =>
  res.status(404).json({ message });

export const sendServerError = (res: Response, message = "Internal server error") =>
  res.status(500).json({ message });
