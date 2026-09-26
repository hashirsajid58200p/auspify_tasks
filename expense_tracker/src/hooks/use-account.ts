"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import {
  UpdateProfileInput,
  ChangePasswordInput,
  DeleteAccountInput,
} from "@/validations/account";

export interface AccountProfile {
  id: string;
  name: string;
  email: string;
  currency: string;
  locale: string;
  isDemo: boolean;
}

export interface DeviceSession {
  id: string;
  familyId: string;
  userAgent: string;
  ipHash: string;
  createdAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

export function useAccount() {
  return useQuery<AccountProfile>({
    queryKey: ["account"],
    queryFn: () => api.get<AccountProfile>("/api/auth/me"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      api.patch<AccountProfile>("/api/account", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      api.patch<{ success: boolean; message: string }>(
        "/api/account/password",
        input
      ),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (input: DeleteAccountInput) =>
      api.delete<{ success: boolean }>(
        "/api/account",
        input
      ),
  });
}

export function useSessions() {
  return useQuery<DeviceSession[]>({
    queryKey: ["sessions"],
    queryFn: () => api.get<DeviceSession[]>("/api/auth/sessions"),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      api.delete<{ success: boolean }>(
        `/api/auth/sessions/${sessionId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useLogoutAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<{ success: boolean }>(
        "/api/auth/logout-all",
        {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
