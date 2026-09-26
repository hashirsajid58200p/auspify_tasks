"use client";

import * as React from "react";
import { Tag, Plus, Edit2, Trash2, Loader2, RefreshCw, Briefcase, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { fetchApi } from "@/lib/api-client";
import { toast } from "sonner";

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  jobCount: number;
  createdAt: string;
}

export function CategoriesManager() {
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Create modal state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createDesc, setCreateDesc] = React.useState("");
  const [createLoading, setCreateLoading] = React.useState(false);

  // Edit modal state
  const [editingCategory, setEditingCategory] = React.useState<CategoryItem | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [editLoading, setEditLoading] = React.useState(false);

  // Delete modal state
  const [deletingCategory, setDeletingCategory] = React.useState<CategoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetchApi<any>("/api/admin/categories");
        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.data || [];
          setCategories(list);
        }
      } catch (err: any) {
        if (isMounted) toast.error(err.message || "Failed to load categories");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;

    setCreateLoading(true);
    try {
      await fetchApi("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: createName.trim(),
          description: createDesc.trim() || undefined,
        }),
      });
      toast.success("Category created successfully");
      setCreateOpen(false);
      setCreateName("");
      setCreateDesc("");
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;

    setEditLoading(true);
    try {
      await fetchApi(`/api/admin/categories/${editingCategory._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim(),
        }),
      });
      toast.success("Category updated successfully");
      setEditingCategory(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to update category");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingCategory) return;

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await fetchApi(`/api/admin/categories/${deletingCategory._id}`, {
        method: "DELETE",
      });
      toast.success("Category deleted successfully");
      setDeletingCategory(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete category");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge className="bg-[#FFC224] text-black border-2 border-black font-bold uppercase text-[11px]">
            Platform Taxonomies
          </Badge>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Category Management ({categories.length})
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm font-semibold">
            Define job categories and track published inventory across sectors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="border-2 border-black font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            className="bg-black text-white hover:bg-neutral-800 border-2 border-black font-bold shadow-neo-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Grid of Categories */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground font-semibold flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading categories...</span>
        </div>
      ) : (categories?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl border-2 border-black bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center">
              <Tag className="w-6 h-6 text-muted-foreground" />
            </div>
            <h4 className="text-base font-bold">No categories exist yet</h4>
            <p className="text-xs text-muted-foreground">
              Create your first category to organize job postings.
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="border-2 border-black font-bold mt-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(categories || []).map((cat) => (
            <div
              key={cat._id}
              className="p-5 rounded-2xl border-2 border-black bg-white dark:bg-[#191919] shadow-neo flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-base">{cat.name}</h3>
                  <Badge
                    variant="outline"
                    className="border-2 border-black font-bold text-xs bg-[#FFC224]/20 text-black shrink-0"
                  >
                    <Briefcase className="w-3 h-3 mr-1" />
                    {cat.jobCount} jobs
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground font-mono">slug: {cat.slug}</div>
                {cat.description ? (
                  <p className="text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/60 italic">No description</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(cat);
                    setEditName(cat.name);
                    setEditDesc(cat.description || "");
                  }}
                  className="border-2 border-black font-bold text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDeletingCategory(cat);
                    setDeleteError(null);
                  }}
                  className="border-2 border-black font-bold text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-3 border-black shadow-neo-lg rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Create Job Category</DialogTitle>
            <DialogDescription className="font-semibold text-xs text-muted-foreground">
              Define a new category taxonomy sector for employers to classify openings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Category Name
              </label>
              <Input
                placeholder="e.g., Engineering & Architecture"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="border-2 border-black font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Description (Optional)
              </label>
              <textarea
                placeholder="Brief summary of roles in this sector..."
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-black font-medium text-sm bg-transparent resize-none h-20"
                maxLength={500}
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createLoading}
                className="border-2 border-black font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                className="border-2 border-black font-bold bg-black text-white"
              >
                {createLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Create Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editingCategory !== null} onOpenChange={(o) => !o && setEditingCategory(null)}>
        <DialogContent className="border-3 border-black shadow-neo-lg rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Edit Category</DialogTitle>
            <DialogDescription className="font-semibold text-xs text-muted-foreground">
              Updating the category name will also generate an updated URL slug.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Category Name
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border-2 border-black font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Description
              </label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-black font-medium text-sm bg-transparent resize-none h-20"
                maxLength={500}
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCategory(null)}
                disabled={editLoading}
                className="border-2 border-black font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editLoading}
                className="border-2 border-black font-bold bg-black text-white"
              >
                {editLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deletingCategory !== null}
        onOpenChange={(o) => !o && setDeletingCategory(null)}
      >
        <DialogContent className="border-3 border-black shadow-neo-lg rounded-3xl max-w-md">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl border-2 border-black bg-red-100 text-red-600 flex items-center justify-center mb-1">
              <AlertCircle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black">Delete Category</DialogTitle>
            <DialogDescription className="font-semibold text-xs leading-relaxed text-muted-foreground">
              Are you sure you want to delete <strong>&quot;{deletingCategory?.name}&quot;</strong>?
              {deletingCategory && deletingCategory.jobCount > 0 && (
                <span className="block text-red-600 font-bold mt-2">
                  Warning: This category currently has {deletingCategory.jobCount} associated job
                  listings. Categories with associated jobs cannot be deleted.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 rounded-xl border-2 border-red-500 bg-red-50 text-red-700 text-xs font-bold">
              {deleteError}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingCategory(null)}
              disabled={deleteLoading}
              className="border-2 border-black font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading || (deletingCategory?.jobCount ?? 0) > 0}
              className="border-2 border-black font-bold"
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
