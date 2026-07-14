"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import {
  Target,
  Database,
  Download,
  Upload,
  Loader2,
  AlertTriangle,
  Calendar,
  Settings,
} from "lucide-react";

const monthsIndo = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function SettingsPage() {
  const { showToast } = useToast();
  const now = new Date();

  // Savings Target State
  const [targetMonth, setTargetMonth] = useState(now.getMonth() + 1);
  const [targetYear, setTargetYear] = useState(now.getFullYear());
  const [targetAmount, setTargetAmount] = useState(0);
  const [isFetchingTarget, setIsFetchingTarget] = useState(false);
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  // Backup & Restore State
  const [isBackupFetching, setIsBackupFetching] = useState(false);
  const [isRestoreSubmitting, setIsRestoreSubmitting] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [uploadedData, setUploadedData] = useState<Record<string, unknown> | null>(null);

  const years = Array.from({ length: 8 }, (_, i) => now.getFullYear() - 5 + i);

  // Fetch target for selected month/year
  const fetchSavingsTarget = useCallback(async () => {
    setIsFetchingTarget(true);
    try {
      const res = await fetch(`/api/savings-target?month=${targetMonth}&year=${targetYear}`);
      if (res.ok) {
        const data = await res.json();
        setTargetAmount(data.amount || 0);
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat target tabungan", "error");
    } finally {
      setIsFetchingTarget(false);
    }
  }, [targetMonth, targetYear, showToast, setIsFetchingTarget, setTargetAmount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSavingsTarget();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSavingsTarget]);

  // Save savings target
  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTarget(true);
    try {
      const res = await fetch("/api/savings-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: targetMonth,
          year: targetYear,
          amount: targetAmount,
        }),
      });

      if (res.ok) {
        showToast("Target tabungan berhasil diperbarui", "success");
      } else {
        const body = await res.json();
        showToast(body.message || "Gagal menyimpan target tabungan", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setIsSavingTarget(false);
    }
  };

  // Download Backup JSON
  const handleExportBackup = async () => {
    setIsBackupFetching(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) {
        showToast("Gagal mengunduh cadangan data", "error");
        return;
      }
      const data = await res.json();
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      
      const link = document.createElement("a");
      link.setAttribute("href", jsonString);
      link.setAttribute("download", `FasihFinance_Backup_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Cadangan data berhasil diunduh", "success");
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setIsBackupFetching(false);
    }
  };

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    
    if (files && files.length > 0) {
      fileReader.readAsText(files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          
          // Verify basic schema structure
          if (parsed.categories && parsed.transactions && parsed.savingsTargets) {
            setUploadedData(parsed);
            setIsWarningOpen(true); // Open overwrite warning modal
          } else {
            showToast("Struktur berkas cadangan JSON tidak valid", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Gagal membaca file. Pastikan format JSON benar.", "error");
        }
      };
      
      // Reset input element value to allow uploading same file again if needed
      e.target.value = "";
    }
  };

  // Execute database restore from uploaded data
  const executeRestore = async () => {
    if (!uploadedData) return;
    setIsWarningOpen(false);
    setIsRestoreSubmitting(true);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadedData),
      });

      if (res.ok) {
        showToast("Data berhasil dipulihkan dari berkas cadangan!", "success");
        setUploadedData(null);
        fetchSavingsTarget(); // reload target
      } else {
        const body = await res.json();
        showToast(body.message || "Gagal memulihkan data", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan koneksi", "error");
    } finally {
      setIsRestoreSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pengaturan Aplikasi</h2>
        <p className="text-sm text-muted-foreground">
          Konfigurasi target tabungan dan kelola pencadangan data finansial Anda.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card 1: Target Tabungan Bulanan */}
        <form onSubmit={handleSaveTarget} className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-base border-b border-border pb-3">
              <Target className="w-5 h-5 text-primary" />
              <span>Target Tabungan Bulanan</span>
            </div>

            <p className="text-xs text-muted-foreground leading-normal">
              Tentukan target jumlah uang bersih yang ingin Anda tabung (Pemasukan dikurangi Pengeluaran) untuk setiap bulannya.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bulan</label>
                <select
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary transition-colors"
                >
                  {monthsIndo.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tahun</label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary transition-colors"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jumlah Target (Rp)</label>
              <div className="relative">
                {isFetchingTarget ? (
                  <div className="absolute right-3.5 top-3.5">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : null}
                <input
                  type="number"
                  placeholder="Contoh: 1500000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
                  disabled={isFetchingTarget}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-bold outline-none focus:border-primary disabled:opacity-50 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={isSavingTarget || isFetchingTarget}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingTarget ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Target"}
            </button>
          </div>
        </form>

        {/* Card 2: Backup & Restore */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-base border-b border-border pb-3">
              <Database className="w-5 h-5 text-primary" />
              <span>Ekspor & Pemulihan Data</span>
            </div>

            <p className="text-xs text-muted-foreground leading-normal">
              Amankan data Anda. Ekspor seluruh transaksi, kategori, dan target tabungan Anda menjadi berkas JSON, atau pulihkan data dari berkas cadangan JSON yang Anda miliki.
            </p>

            <div className="space-y-3 pt-2">
              {/* Export Backup Trigger */}
              <button
                onClick={handleExportBackup}
                disabled={isBackupFetching || isRestoreSubmitting}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-secondary/40 text-sm font-semibold text-foreground transition-all disabled:opacity-50 cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-primary" />
                  Cadangkan Semua Data (JSON)
                </span>
                {isBackupFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              </button>

              {/* Upload Restore Input wrapper */}
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  disabled={isRestoreSubmitting || isBackupFetching}
                  className="hidden"
                  id="restore-file-input"
                />
                <label
                  htmlFor="restore-file-input"
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-border bg-card hover:bg-secondary/40 text-sm font-semibold text-foreground transition-all cursor-pointer ${
                    isRestoreSubmitting || isBackupFetching ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <Upload className="w-5 h-5 text-indigo-500" />
                  Pulihkan Data dari Berkas JSON
                  {isRestoreSubmitting ? (
                    <div className="ml-auto">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : null}
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border text-[10px] text-muted-foreground leading-normal italic">
            * Perhatian: Mengunggah berkas pemulihan akan menggantikan seluruh catatan saat ini secara permanen.
          </div>
        </div>
      </div>

      {/* Restore Warning Overwrite Modal */}
      <Modal
        isOpen={isWarningOpen}
        onClose={() => {
          setIsWarningOpen(false);
          setUploadedData(null);
        }}
        title="Konfirmasi Pemulihan Data"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/30 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-rose-800 dark:text-rose-300 font-bold leading-none">
                Tindakan Destruktif!
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-400 leading-normal mt-1.5">
                Proses pemulihan akan **MENGHAPUS SEMUA DATA** (transaksi, kategori, target) yang ada di aplikasi Anda sekarang, dan menggantinya sepenuhnya dengan data dari berkas cadangan JSON yang Anda unggah.
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin melanjutkan pemulihan data ini? Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setIsWarningOpen(false);
                setUploadedData(null);
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold border border-border hover:bg-secondary transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={executeRestore}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer"
            >
              Ya, Timpa Data Sekarang
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
