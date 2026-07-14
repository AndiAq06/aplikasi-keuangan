"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import {
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  Loader2,
  Search,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  _count?: {
    transactions: number;
  };
}

const categoryFormSchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(50, "Nama kategori maksimal 50 karakter"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function CategoriesPage() {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
    },
  });

  // Fetch all user categories
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat kategori", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCategories]);

  // Open form for Create
  const handleOpenCreate = () => {
    setSelectedCategory(null);
    reset({ name: "" });
    setIsFormOpen(true);
  };

  // Open form for Edit
  const handleOpenEdit = (c: Category) => {
    setSelectedCategory(c);
    setValue("name", c.name);
    setIsFormOpen(true);
  };

  // Open delete warning modal
  const handleOpenDelete = (c: Category) => {
    setSelectedCategory(c);
    setIsDeleteOpen(true);
  };

  // Handle Save (Create / Update)
  const onSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const url = selectedCategory 
        ? `/api/categories/${selectedCategory.id}` 
        : "/api/categories";
      const method = selectedCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const body = await res.json();

      if (!res.ok) {
        showToast(body.message || "Gagal menyimpan kategori", "error");
      } else {
        showToast(
          selectedCategory 
            ? "Kategori berhasil diperbarui" 
            : "Kategori baru berhasil ditambahkan",
          "success"
        );
        setIsFormOpen(false);
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Category Delete
  const executeDelete = async () => {
    if (!selectedCategory) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Kategori berhasil dihapus", "success");
        setIsDeleteOpen(false);
        fetchCategories();
      } else {
        const body = await res.json();
        showToast(body.message || "Gagal menghapus kategori", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter list on search query
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Kategori Keuangan</h2>
          <p className="text-sm text-muted-foreground">
            Kelola kategori khusus untuk mengelompokkan transaksi Anda.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-fit flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Tambah Kategori
        </button>
      </div>

      {/* Search Filter input */}
      <div className="max-w-md bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Grid listing */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-semibold">Memuat kategori...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground font-medium">
            Tidak ada kategori ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase border-b border-border bg-secondary/35">
                  <th className="py-3.5 px-6 font-bold">Kategori</th>
                  <th className="py-3.5 px-6 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/15 transition-colors">
                    <td className="py-4 px-6 font-bold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary rounded-xl text-muted-foreground">
                          <FolderTree className="w-4 h-4 text-primary" />
                        </div>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(c)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nama Kategori</label>
            <input
              type="text"
              placeholder="Contoh: Hiburan, Transportasi, dsb."
              {...register("name")}
              className={`w-full px-4 py-2.5 rounded-xl border bg-background text-sm font-semibold transition-all outline-none focus:border-primary ${
                errors.name ? "border-destructive focus:border-destructive text-destructive" : "border-border"
              }`}
            />
            {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold border border-border hover:bg-secondary transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Kategori"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Kategori"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-2xl">
            <p className="text-sm text-rose-800 dark:text-rose-300 font-bold leading-normal">
              Peringatan Penting!
            </p>
            <p className="text-xs text-rose-700 dark:text-rose-400 leading-normal mt-1">
              Menghapus kategori ini akan menghapus secara permanen semua catatan transaksi yang terkait dengannya. Tindakan ini bersifat destruktif dan tidak dapat dibatalkan.
            </p>
          </div>

          {selectedCategory && (
            <div className="p-4 bg-secondary/50 dark:bg-secondary/20 border border-border rounded-xl">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Kategori yang Dihapus</span>
              <span className="text-sm font-extrabold text-foreground mt-1 block">{selectedCategory.name}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold border border-border hover:bg-secondary transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={executeDelete}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saya Mengerti, Hapus Kategori"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
