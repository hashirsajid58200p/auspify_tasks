"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { FinancialInsight } from "@/server/services/insight";

export function useInsights() {
  return useQuery<FinancialInsight[]>({
    queryKey: ["insights"],
    queryFn: () => api.get<FinancialInsight[]>("/api/reports/insights"),
  });
}
