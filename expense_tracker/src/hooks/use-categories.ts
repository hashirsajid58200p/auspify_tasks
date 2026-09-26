import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/validations/category";

export interface CategoryItem {
  _id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
  isSystem: boolean;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchApi<CategoryItem[]>("/api/categories"),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryInput) =>
      fetchApi<CategoryItem>("/api/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) =>
      fetchApi<CategoryItem>(`/api/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reassignToCategoryId,
    }: {
      id: string;
      reassignToCategoryId?: string;
    }) => {
      const url = reassignToCategoryId
        ? `/api/categories/${id}?reassignToCategoryId=${encodeURIComponent(reassignToCategoryId)}`
        : `/api/categories/${id}`;
      return fetchApi<{ success: boolean }>(url, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
