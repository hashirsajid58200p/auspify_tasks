"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { BudgetOverview, BudgetProgressItem } from "@/server/services/budget";
import { UpsertBudgetInput } from "@/validations/budget";

export function useBudgets(month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return useQuery<BudgetOverview>({
    queryKey: ["budgets", month || "current"],
    queryFn: () => api.get<BudgetOverview>(`/api/budgets${query}`),
  });
}

export function useUpsertBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertBudgetInput) =>
      api.put<BudgetProgressItem>("/api/budgets", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (budgetId: string) =>
      api.delete<{ success: boolean }>(
        `/api/budgets/${budgetId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}
