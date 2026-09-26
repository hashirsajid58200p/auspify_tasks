import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilterInput,
} from "@/validations/transaction";
import { CategoryItem } from "./use-categories";

export interface TransactionItem {
  _id: string;
  userId: string;
  type: "INCOME" | "EXPENSE";
  amountMinor: number;
  categoryId: CategoryItem;
  occurredOn: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTransactionResponse {
  items: TransactionItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useTransactions(filter: TransactionFilterInput) {
  const queryParams = new URLSearchParams();
  if (filter.type) queryParams.set("type", filter.type);
  if (filter.categoryId) queryParams.set("categoryId", filter.categoryId);
  if (filter.startDate) queryParams.set("startDate", filter.startDate);
  if (filter.endDate) queryParams.set("endDate", filter.endDate);
  if (filter.search) queryParams.set("search", filter.search);
  if (filter.page) queryParams.set("page", filter.page.toString());
  if (filter.limit) queryParams.set("limit", filter.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/api/transactions?${queryString}` : "/api/transactions";

  return useQuery({
    queryKey: ["transactions", filter],
    queryFn: async () => {
      const res = await fetch(endpoint, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || "Failed to fetch transactions");
      }
      return {
        items: json.data as TransactionItem[],
        meta: json.meta,
      };
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionInput) =>
      fetchApi<TransactionItem>("/api/transactions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionInput }) =>
      fetchApi<TransactionItem>(`/api/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(`/api/transactions/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
