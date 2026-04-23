import type { Role } from "./database.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string | null;
        role: Role;
        accessToken: string;
      };
    }
  }
}

export {};
