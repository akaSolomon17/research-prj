import { request } from "@/shared/api/http";
import type { Profile } from "@/shared/types/models";

interface ProfilePayload {
  profile: Profile;
  orderSummary: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
}

interface UpdateProfileInput {
  fullName: string;
  phone: string;
  avatarUrl: string;
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
