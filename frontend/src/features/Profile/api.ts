import { request } from "@/shared/api/http";
import type { OrderSummary, Profile } from "@/shared/types/models";

interface ProfilePayload {
  profile: Profile;
  orderSummary: OrderSummary;
}

interface UpdateProfileInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  source?: string;
  birthDate?: string;
}

export const getProfile = (accessToken: string) =>
  request<ProfilePayload>("/api/v1/profile", {
    method: "GET",
    accessToken,
  });

export const updateProfile = (accessToken: string, payload: UpdateProfileInput) =>
  request<Profile>("/api/v1/profile", {
    method: "PATCH",
    accessToken,
    body: JSON.stringify(payload),
  });
