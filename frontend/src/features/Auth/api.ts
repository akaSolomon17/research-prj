import { request } from "@/shared/api/http";
import type { Profile } from "@/shared/types/models";

export interface MePayload {
  user: {
    id: string;
    email: string | null;
  };
  profile: Profile;
}

export const getMe = (accessToken: string) =>
  request<MePayload>("/api/v1/auth/me", {
    method: "GET",
    accessToken,
  });
