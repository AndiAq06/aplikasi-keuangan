"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Loader2,
  XCircle,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

const transactionFormSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  amount: z.number().positive("Nominal harus lebih besar dari 0"),
  description: z.string().max(200, "Deskripsi maksimal 200 karakter").optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

// Helper to format currency to IDR
const formatIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function TransactionsPage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const dateParam = searchParams ? searchParams.get("date") : null;

  // Transactions & Categories State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "EXPENSE",
      categoryId: "",
      amount: 0,
      description: "",
    },
  });

  const typeValue = watch("type");

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat daftar kategori", "error");
    }
  }, [showToast]);

  // Fetch Transactions with Query Filters
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (filterCategory) query.append("categoryId", filterCategory);
      if (filterType) query.append("type", filterType);
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);

      const res = await fetch(`/api/transactions?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat data transaksi", "error");
    } finally {
      setIsLoading(false);
    }
  }, [search, filterCategory, filterType, startDate, endDate, showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (dateParam && categories.length > 0) {
      setSelectedTransaction(null);
      reset({
        date: dateParam,
        type: "EXPENSE",
        categoryId: categories[0].id,
        amount: 0,
        description: "",
      });
      setIsFormOpen(true);

      // Clean up search query parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("date");
      window.history.replaceState({}, "", url.toString());
    }
  }, [dateParam, categories, reset]);

  useEffect(() => {
    // Debounce search slightly to avoid excessive calls
    const delayDebounceFn = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchTransactions]);

  // Open Form Modal for Create
  const handleOpenCreate = () => {
    setSelectedTransaction(null);
    reset({
      date: new Date().toISOString().split("T")[0],
      type: "EXPENSE",
      categoryId: categories.length > 0 ? categories[0].id : "",
      amount: 0,
      description: "",
    });
    setIsFormOpen(true);
  };

  // Open Form Modal for Edit
  const handleOpenEdit = (t: Transaction) => {
    setSelectedTransaction(t);
    setValue("date", new Date(t.date).toISOString().split("T")[0]);
    setValue("type", t.type);
    setValue("categoryId", t.categoryId);
    setValue("amount", t.amount);
    setValue("description", t.description);
    setIsFormOpen(true);
  };

  // Open Delete Confirmation
  const handleOpenDelete = (t: Transaction) => {
    setSelectedTransaction(t);
    setIsDeleteOpen(true);
  };

  // Create or Update submit handler
  const onSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true);
    try {
      const url = selectedTransaction 
        ? `/api/transactions/${selectedTransaction.id}` 
        : "/api/transactions";
      const method = selectedTransaction ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const body = await res.json();

      if (!res.ok) {
        showToast(body.message || "Gagal menyimpan transaksi", "error");
      } else {
        showToast(
          selectedTransaction 
            ? "Transaksi berhasil diperbarui" 
            : "Transaksi berhasil dicatat",
          "success"
        );
        setIsFormOpen(false);
        fetchTransactions();
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete execution
  const executeDelete = async () => {
    if (!selectedTransaction) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${selectedTransaction.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Transaksi berhasil dihapus", "success");
        setIsDeleteOpen(false);
        fetchTransactions();
      } else {
        const body = await res.json();
        showToast(body.message || "Gagal menghapus transaksi", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick reset filters
  const resetFilters = () => {
    setSearch("");
    setFilterCategory("");
    setFilterType("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pencatatan Transaksi</h2>
          <p className="text-sm text-muted-foreground">
            Kelola data pemasukan dan pengeluaran keuangan pribadi Anda.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-fit flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Catat Transaksi
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold border-b border-border pb-3">
          <Filter className="w-4 h-4 text-primary" />
          <span>Filter & Cari Transaksi</span>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Search text */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cari Deskripsi</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari keterangan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Category drop */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kategori</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary transition-colors"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type drop */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jenis Transaksi</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary transition-colors"
            >
              <option value="">Semua Jenis</option>
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
          </div>

          {/* Start date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mulai Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* End date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hingga Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Clear filters trigger */}
        {(search || filterCategory || filterType || startDate || endDate) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:underline cursor-pointer"
            >
              <XCircle className="w-4 h-4" /> Atur Ulang Filter
            </button>
          </div>
        )}
      </div>

      {/* Transactions list */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-semibold">Memuat transaksi...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <p className="text-muted-foreground text-sm font-medium">Tidak ada data transaksi ditemukan.</p>
            <p className="text-xs text-muted-foreground/80">Silakan tambahkan transaksi baru atau sesuaikan filter Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase border-b border-border bg-secondary/35">
                  <th className="py-3.5 px-6 font-bold">Tanggal</th>
                  <th className="py-3.5 px-6 font-bold">Keterangan</th>
                  <th className="py-3.5 px-6 font-bold">Kategori</th>
                  <th className="py-3.5 px-6 font-bold">Jenis</th>
                  <th className="py-3.5 px-6 font-bold text-right">Nominal</th>
                  <th className="py-3.5 px-6 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-secondary/15 transition-colors">
                    <td className="py-4 px-6 font-semibold text-muted-foreground whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6 font-bold text-foreground max-w-xs truncate">
                      {t.description || "-"}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-secondary border border-border/50 text-foreground">
                        {t.category.name}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                        t.type === "INCOME"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
                      }`}>
                        {t.type === "INCOME" ? (
                          <>
                            <TrendingUp className="w-3 h-3" /> Pemasukan
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3" /> Pengeluaran
                          </>
                        )}
                      </span>
                    </td>
                    <td className={`py-4 px-6 font-extrabold text-right whitespace-nowrap ${
                      t.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}>
                      {t.type === "INCOME" ? "+" : "-"} {formatIDR(t.amount)}
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(t)}
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

      {/* CRUD Add/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedTransaction ? "Edit Catatan Transaksi" : "Catat Transaksi Baru"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Transaction Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setValue("type", "EXPENSE")}
              className={`py-3 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                typeValue === "EXPENSE"
                  ? "bg-rose-500/10 border-rose-500 text-rose-600"
                  : "border-border text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              <TrendingDown className="w-4 h-4" /> Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setValue("type", "INCOME")}
              className={`py-3 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                typeValue === "INCOME"
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-600"
                  : "border-border text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Pemasukan
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tanggal</label>
              <input
                type="date"
                {...register("date")}
                className={`w-full px-4 py-2.5 rounded-xl border bg-background text-sm font-semibold transition-all outline-none focus:border-primary ${
                  errors.date ? "border-destructive focus:border-destructive text-destructive" : "border-border"
                }`}
              />
              {errors.date && <p className="text-xs text-destructive font-medium">{errors.date.message}</p>}
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kategori</label>
              <select
                {...register("categoryId")}
                className={`w-full px-4 py-2.5 rounded-xl border bg-background text-sm font-semibold transition-all outline-none focus:border-primary ${
                  errors.categoryId ? "border-destructive focus:border-destructive text-destructive" : "border-border"
                }`}
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-destructive font-medium">{errors.categoryId.message}</p>}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nominal (Rupiah)</label>
            <input
              type="number"
              placeholder="Masukkan jumlah uang..."
              {...register("amount", { valueAsNumber: true })}
              className={`w-full px-4 py-3 rounded-xl border bg-background text-sm font-bold transition-all outline-none focus:border-primary ${
                errors.amount ? "border-destructive focus:border-destructive text-destructive" : "border-border"
              }`}
            />
            {errors.amount && <p className="text-xs text-destructive font-medium">{errors.amount.message}</p>}
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Keterangan / Deskripsi</label>
            <textarea
              placeholder="Contoh: Belanja bulanan Supermarket"
              rows={3}
              {...register("description")}
              className={`w-full px-4 py-3 rounded-xl border bg-background text-sm font-semibold transition-all outline-none resize-none focus:border-primary ${
                errors.description ? "border-destructive focus:border-destructive text-destructive" : "border-border"
              }`}
            />
            {errors.description && <p className="text-xs text-destructive font-medium">{errors.description.message}</p>}
          </div>

          {/* Actions */}
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
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Transaksi"
      >
        <div className="space-y-4">
          <p className="text-sm leading-normal text-muted-foreground">
            Apakah Anda yakin ingin menghapus catatan transaksi ini? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
          </p>

          {selectedTransaction && (
            <div className="p-4 bg-secondary/50 dark:bg-secondary/20 border border-border rounded-xl space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Detil Transaksi</p>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-foreground">{selectedTransaction.description || "Tanpa Keterangan"}</span>
                <span className={`font-extrabold ${selectedTransaction.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}>
                  {selectedTransaction.type === "INCOME" ? "+" : "-"} {formatIDR(selectedTransaction.amount)}
                </span>
              </div>
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
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus Permanen"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
