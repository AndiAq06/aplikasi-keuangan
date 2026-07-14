"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Calendar,
  FileText,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  TrendingUpDown,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";

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

interface DailyGroup {
  date: string;
  pemasukan: number;
  pengeluaran: number;
  investasi: number;
  saldo: number;
  transactions: Transaction[];
}

interface CategoryGroup {
  name: string;
  total: number;
  percentage: number;
}

// Helper to format currency to IDR
const formatIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

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

export default function ReportsPage() {
  const { showToast } = useToast();
  const now = new Date();

  // Filters State
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<"daily" | "category">("daily");
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Group Grouped Data State
  const [dailyData, setDailyData] = useState<DailyGroup[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryGroup[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);

  // Years array for filter (last 5 years + next 2 years)
  const years = Array.from({ length: 8 }, (_, i) => now.getFullYear() - 5 + i);

  // Fetch data
  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Calculate start and end date of selected month/year
      const start = new Date(selectedYear, selectedMonth - 1, 1);
      const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

      const startDateStr = start.toISOString().split("T")[0];
      const endDateStr = end.toISOString().split("T")[0];

      const res = await fetch(`/api/transactions?startDate=${startDateStr}&endDate=${endDateStr}`);
      if (res.ok) {
        const data: Transaction[] = await res.json();
        setTransactions(data);

        // 1. Calculate Totals
        const incomeSum = data
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + t.amount, 0);

        const expenseSum = data
          .filter((t) => t.type === "EXPENSE" && t.category.name.toLowerCase() !== "investasi")
          .reduce((sum, t) => sum + t.amount, 0);

        const investmentSum = data
          .filter((t) => t.type === "EXPENSE" && t.category.name.toLowerCase() === "investasi")
          .reduce((sum, t) => sum + t.amount, 0);

        setTotalIncome(incomeSum);
        setTotalExpense(expenseSum);
        setTotalInvestment(investmentSum);

        // 2. Process Daily Grouping
        const dailyMap: { [key: string]: DailyGroup } = {};
        
        // Initialize all days of the month with 0 values to show complete month progression
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          dailyMap[dateKey] = {
            date: dateKey,
            pemasukan: 0,
            pengeluaran: 0,
            investasi: 0,
            saldo: 0,
            transactions: [],
          };
        }

        // Populate with actual transactions
        data.forEach((t) => {
          const dateKey = new Date(t.date).toISOString().split("T")[0];
          if (dailyMap[dateKey]) {
            if (t.type === "INCOME") {
              dailyMap[dateKey].pemasukan += t.amount;
            } else if (t.category.name.toLowerCase() === "investasi") {
              dailyMap[dateKey].investasi += t.amount;
            } else {
              dailyMap[dateKey].pengeluaran += t.amount;
            }
            dailyMap[dateKey].transactions.push(t);
          }
        });

        // Compute balances and map to list, sorted by date DESC
        const dailyList = Object.values(dailyMap)
          .map((d) => ({
            ...d,
            saldo: d.pemasukan - d.pengeluaran - d.investasi,
          }))
          .sort((a, b) => b.date.localeCompare(a.date));

        // Filter out empty days that don't have transactions if we want a cleaner list,
        // but displaying only active days is usually cleaner in listings.
        const activeDailyList = dailyList.filter(d => d.transactions.length > 0);
        setDailyData(activeDailyList);

        // 3. Process Category Grouping (expenses only, excluding investments)
        const categoryMap: { [key: string]: number } = {};
        const expenses = data.filter((t) => t.type === "EXPENSE" && t.category.name.toLowerCase() !== "investasi");
        
        expenses.forEach((t) => {
          const catName = t.category.name;
          categoryMap[catName] = (categoryMap[catName] || 0) + t.amount;
        });

        const catList = Object.entries(categoryMap).map(([name, total]) => ({
          name,
          total,
          percentage: expenseSum > 0 ? Math.round((total / expenseSum) * 100) : 0,
        })).sort((a, b) => b.total - a.total);

        setCategoryData(catList);
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat data laporan", "error");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, showToast, setIsLoading, setTransactions, setTotalIncome, setTotalExpense, setTotalInvestment, setDailyData, setCategoryData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReportData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchReportData]);

  // Export to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showToast("Tidak ada data untuk diekspor", "warning");
      return;
    }

    const headers = ["ID", "Tanggal", "Jenis", "Kategori", "Nominal", "Keterangan"];
    const rows = transactions.map((t) => [
      t.id,
      new Date(t.date).toLocaleDateString("id-ID"),
      t.type === "INCOME" ? "PEMASUKAN" : "PENGELUARAN",
      t.category.name,
      t.amount,
      t.description || "",
    ]);

    const csvContent =
      "\uFEFF" + // UTF-8 BOM for Excel compatibility
      [headers.join(","), ...rows.map((row) => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Keuangan_${monthsIndo[selectedMonth - 1]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Laporan berhasil diunduh sebagai CSV", "success");
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (transactions.length === 0) {
      showToast("Tidak ada data untuk diekspor", "warning");
      return;
    }

    const formattedData = transactions.map((t) => ({
      Tanggal: new Date(t.date).toLocaleDateString("id-ID"),
      Jenis: t.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
      Kategori: t.category.name,
      Nominal: t.amount,
      Keterangan: t.description || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detail Transaksi");

    // Add summary tab
    const summaryData = [
      { Deskripsi: "Total Pemasukan", Jumlah: totalIncome },
      { Deskripsi: "Total Pengeluaran", Jumlah: totalExpense },
      { Deskripsi: "Total Investasi", Jumlah: totalInvestment },
      { Deskripsi: "Sisa Saldo", Jumlah: totalIncome - totalExpense - totalInvestment },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

    XLSX.writeFile(wb, `Laporan_Keuangan_${monthsIndo[selectedMonth - 1]}_${selectedYear}.xlsx`);
    showToast("Laporan berhasil diunduh sebagai Excel", "success");
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (transactions.length === 0) {
      showToast("Tidak ada data untuk diekspor", "warning");
      return;
    }

    const doc = new jsPDF();
    const title = `Laporan Keuangan Bulanan`;
    const period = `Periode: ${monthsIndo[selectedMonth - 1]} ${selectedYear}`;

    // Header Branding
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("FasihFinance", 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Aplikasi Manajemen Keuangan Pribadi Modern", 14, 20);

    // Divider Line
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 24, 196, 24);

    // Title Period
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 32);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(period, 14, 38);

    // Summary Card Box block
    doc.setFillColor(248, 250, 252); // soft grey background
    doc.rect(14, 44, 182, 24, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("TOTAL PEMASUKAN", 18, 50);
    doc.text("TOTAL PENGELUARAN", 65, 50);
    doc.text("TOTAL INVESTASI", 112, 50);
    doc.text("SISA SALDO NET", 158, 50);

    doc.setFontSize(10);
    doc.text(formatIDR(totalIncome), 18, 59);
    doc.text(formatIDR(totalExpense), 65, 59);
    doc.text(formatIDR(totalInvestment), 112, 59);
    
    const balance = totalIncome - totalExpense - totalInvestment;
    if (balance >= 0) {
      doc.setTextColor(34, 197, 94); // green
    } else {
      doc.setTextColor(239, 68, 68); // red
    }
    doc.text(formatIDR(balance), 158, 59);
    doc.setTextColor(0, 0, 0); // reset black

    // Table mapping
    const tableBody = transactions.map((t) => [
      new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      t.description || "-",
      t.category.name,
      t.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
      formatIDR(t.amount),
    ]);

    autoTable(doc, {
      startY: 74,
      head: [["Tanggal", "Keterangan", "Kategori", "Jenis", "Nominal"]],
      body: tableBody,
      headStyles: { fillColor: [37, 99, 235], fontSize: 9, halign: "left" }, // Primary blue
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        4: { halign: "right", fontStyle: "bold" }, // Nominal column align right
      },
    });

    doc.save(`Laporan_Keuangan_${monthsIndo[selectedMonth - 1]}_${selectedYear}.pdf`);
    showToast("Laporan berhasil diunduh sebagai PDF", "success");
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Laporan Keuangan</h2>
          <p className="text-sm text-muted-foreground">
            Analisis pembukuan keuangan dan unduh rekapan data berkala Anda.
          </p>
        </div>

        {/* Download Buttons block */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-border bg-card rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
            title="Download CSV"
          >
            <FileDown className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 border border-border bg-card rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/95 transition-all cursor-pointer"
            title="Download PDF"
          >
            <Download className="w-4 h-4" /> PDF Statement
          </button>
        </div>
      </div>

      {/* Date Filter & Aggregation Header */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Dropdowns card */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-sm font-bold border-b border-border pb-2.5">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Pilih Periode Laporan</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:border-primary transition-colors"
            >
              {monthsIndo.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
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

        {/* Totals Summary Cards block */}
        <div className="md:col-span-2 bg-card border border-border p-5 rounded-2xl shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1 border-r border-border pr-2">
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Total Masuk</span>
            </div>
            <p className="text-sm md:text-base font-black text-emerald-600 dark:text-emerald-400 truncate">
              {formatIDR(totalIncome)}
            </p>
          </div>

          <div className="space-y-1 border-r border-border px-2">
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              <span>Total Keluar</span>
            </div>
            <p className="text-sm md:text-base font-black text-rose-600 dark:text-rose-400 truncate">
              {formatIDR(totalExpense)}
            </p>
          </div>

          <div className="space-y-1 border-r border-border px-2">
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span>Total Investasi</span>
            </div>
            <p className="text-sm md:text-base font-black text-blue-600 dark:text-blue-400 truncate">
              {formatIDR(totalInvestment)}
            </p>
          </div>

          <div className="space-y-1 pl-2">
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <TrendingUpDown className="w-3.5 h-3.5 text-primary" />
              <span>Sisa Saldo</span>
            </div>
            <p className={`text-sm md:text-base font-black truncate ${
              totalIncome - totalExpense - totalInvestment >= 0 ? "text-primary" : "text-rose-500"
            }`}>
              {formatIDR(totalIncome - totalExpense - totalInvestment)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("daily")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "daily"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Laporan Harian
        </button>
        <button
          onClick={() => setActiveTab("category")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "category"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Rekap Kategori
        </button>
      </div>

      {/* Report views render */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-semibold">Memuat laporan...</span>
          </div>
        ) : activeTab === "daily" ? (
          /* Daily tab table */
          dailyData.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground font-semibold">
              Tidak ada catatan transaksi untuk periode ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase border-b border-border bg-secondary/35">
                    <th className="py-3.5 px-6 font-bold">Tanggal</th>
                    <th className="py-3.5 px-6 font-bold text-right">Pemasukan Harian</th>
                    <th className="py-3.5 px-6 font-bold text-right">Pengeluaran Harian</th>
                    <th className="py-3.5 px-6 font-bold text-right">Investasi Harian</th>
                    <th className="py-3.5 px-6 font-bold text-right">Saldo Harian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dailyData.map((d) => (
                    <tr key={d.date} className="hover:bg-secondary/15 transition-colors">
                      <td className="py-4 px-6 font-bold text-foreground">
                        {new Date(d.date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {d.pemasukan > 0 ? `+ ${formatIDR(d.pemasukan)}` : "-"}
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-rose-600 dark:text-rose-400">
                        {d.pengeluaran > 0 ? `- ${formatIDR(d.pengeluaran)}` : "-"}
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-blue-600 dark:text-blue-400">
                        {d.investasi > 0 ? `* ${formatIDR(d.investasi)}` : "-"}
                      </td>
                      <td className={`py-4 px-6 text-right font-black ${
                        d.saldo >= 0 ? "text-primary" : "text-rose-500"
                      }`}>
                        {formatIDR(d.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Category tab distribution list */
          categoryData.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground font-semibold">
              Tidak ada rincian belanja pengeluaran untuk periode ini.
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="max-w-xl mx-auto space-y-4">
                {categoryData.map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-foreground">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-muted-foreground">({item.percentage}%)</span>
                        <span className="font-black">{formatIDR(item.total)}</span>
                      </div>
                    </div>

                    {/* Progress bar represent percentage */}
                    <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden border border-border/50">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
