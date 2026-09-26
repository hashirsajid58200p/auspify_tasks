"use client";

import * as React from "react";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface AdminCategoriesViewProps {
  initialCategories: CategoryItem[];
}

export function AdminCategoriesView({ initialCategories }: AdminCategoriesViewProps) {
  const [categories, setCategories] = React.useState<CategoryItem[]>(initialCategories);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<CategoryItem | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Delete State
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setIsDialogOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        // Update
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), slug: slug.trim(), description: description.trim() }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to update category");

        toast.success("Category updated successfully");
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? json.data : c))
        );
      } else {
        // Create
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), slug: slug.trim(), description: description.trim() }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to create category");

        toast.success("Category created successfully");
        setCategories((prev) => [...prev, json.data]);
      }

      setIsDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to delete category");

      toast.success("Category deleted");
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Category Taxonomy
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Organize platform courses into searchable educational disciplines.
          </p>
        </div>

        <Button size="sm" className="rounded-xl shadow-xs" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <FolderTree className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground">No categories defined</p>
            <p>Click &quot;Add Category&quot; to initialize taxonomy terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-2xs text-muted-foreground">
                      {c.slug}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-sm truncate">
                      {c.description || "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-2xs h-8 px-2"
                          onClick={() => openEditDialog(c)}
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-2xs h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                        >
                          {deletingId === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define the category label and URL slug used throughout the catalog filter.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name" className="text-xs font-semibold">Category Name</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Web Development"
                className="rounded-xl h-10 text-xs"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-slug" className="text-xs font-semibold">URL Slug</Label>
              <Input
                id="cat-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. web-development"
                className="rounded-xl h-10 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-desc" className="text-xs font-semibold">Description (Optional)</Label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of topics encompassed by this category..."
                className="rounded-xl text-xs min-h-[80px]"
                maxLength={300}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : editingCategory ? (
                  "Update Category"
                ) : (
                  "Create Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
