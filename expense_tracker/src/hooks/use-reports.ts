import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import {
  SummaryMetrics,
  CategoryBreakdownItem,
  MonthlyTrendItem,
} from "@/server/services/report";

export function useReportSummary(startDate?: string, endDate?: string) {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);

  const qs = queryParams.toString();
  const endpoint = qs ? `/api/reports/summary?${qs}` : "/api/reports/summary";

  return useQuery({
    queryKey: ["reports", "summary", startDate, endDate],
    queryFn: () => fetchApi<SummaryMetrics>(endpoint),
  });
}

export function useCategoryBreakdown(startDate?: string, endDate?: string) {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);

  const qs = queryParams.toString();
  const endpoint = qs ? `/api/reports/by-category?${qs}` : "/api/reports/by-category";

  return useQuery({
    queryKey: ["reports", "by-category", startDate, endDate],
    queryFn: () => fetchApi<CategoryBreakdownItem[]>(endpoint),
  });
}

export function useMonthlyTrend(months = 6) {
  return useQuery({
    queryKey: ["reports", "trend", months],
    queryFn: () => fetchApi<MonthlyTrendItem[]>(`/api/reports/trend?months=${months}`),
  });
}
