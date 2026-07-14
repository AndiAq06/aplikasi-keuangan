import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardCharts from "@/components/DashboardCharts";
import DailyMonthlyOverview from "@/components/DailyMonthlyOverview";
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Plus,
  ArrowRight,
  AlertTriangle,
  Target,
  CheckCircle,
  Calendar,
  LineChart,
} from "lucide-react";

// Helper to format currency to IDR
const formatIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const now = new Date();
  
  // Date boundaries for current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // 1. Fetch current month transactions
  const thisMonthTransactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  // Calculate stats
  const incomeThisMonth = thisMonthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseThisMonth = thisMonthTransactions
    .filter((t) => t.type === "EXPENSE" && t.category.name.toLowerCase() !== "investasi")
    .reduce((sum, t) => sum + t.amount, 0);

  const investmentThisMonth = thisMonthTransactions
    .filter((t) => t.type === "EXPENSE" && t.category.name.toLowerCase() === "investasi")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = incomeThisMonth - expenseThisMonth - investmentThisMonth;
  const transactionCount = thisMonthTransactions.length;

  // 2. Fetch current month savings target
  const savingsTarget = await db.savingsTarget.findUnique({
    where: {
      userId_month_year: {
        userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    },
  });

  const targetAmount = savingsTarget?.amount || 0;
  const savingsProgress = incomeThisMonth - expenseThisMonth - investmentThisMonth;
  
  // Calculate percentage
  let progressPercent = 0;
  if (targetAmount > 0) {
    progressPercent = Math.min(Math.round((savingsProgress / targetAmount) * 100), 100);
    // If progress is negative, keep it at 0
    if (progressPercent < 0) progressPercent = 0;
  }

  // Safety checks for spending warning:
  // Safe Spending = Total Income - Savings Target
  // If Target is set, and Expenses exceed this Safe Spending limit, warn the user.
  const safeSpendingLimit = incomeThisMonth - targetAmount;
  const isSpendingWarning = targetAmount > 0 && expenseThisMonth > safeSpendingLimit && safeSpendingLimit > 0;

  // 3. Prepare data for the 6-month area chart
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const lastSixMonthsTransactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: sixMonthsAgo,
      },
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  const monthsIndo = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
  const monthlyChartData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = `${monthsIndo[m]} ${y}`;

    const monthTransactions = lastSixMonthsTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === m && tDate.getFullYear() === y;
    });

    const inc = monthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const exp = monthTransactions
      .filter((t) => t.type === "EXPENSE" && t.category.name.toLowerCase() !== "investasi")
      .reduce((sum, t) => sum + t.amount, 0);

    monthlyChartData.push({
      month: label,
      pemasukan: inc,
      pengeluaran: exp,
    });
  }

  // 4. Prepare data for the Category Pie Chart (current month expenses only, excluding investments)
  const categoryTotals: { [key: string]: number } = {};
  thisMonthTransactions
    .filter((t) => t.type === "EXPENSE" && t.category.name.toLowerCase() !== "investasi")
    .forEach((t) => {
      const catName = t.category.name;
      categoryTotals[catName] = (categoryTotals[catName] || 0) + t.amount;
    });

  const categoryChartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }));

  // 5. Fetch last 5 recent transactions
  const recents = await db.transaction.findMany({
    where: {
      userId,
    },
    take: 5,
    orderBy: {
      date: "desc",
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  const monthsIndoFull = [
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
  const currentMonthName = monthsIndoFull[now.getMonth()];

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Halo, {session.user.name} 👋</h2>
          <p className="text-sm text-muted-foreground">
            Berikut ringkasan keuangan Anda untuk bulan <span className="font-bold text-foreground">{currentMonthName} {now.getFullYear()}</span>.
          </p>
        </div>
        <Link
          href="/transactions"
          className="w-fit flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold btn-premium transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Catat Transaksi
        </Link>
      </div>

      {/* Target Tabungan & Notifikasi Limit Belanja */}
      {targetAmount > 0 && (
        <div className={`p-6 rounded-2xl border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all ${
          isSpendingWarning 
            ? "bg-rose-50/50 border-rose-200 dark:bg-rose-950/10 dark:border-rose-900/30" 
            : "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-900/30"
        }`}>
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2 font-extrabold text-sm">
              <Target className={`w-5 h-5 ${isSpendingWarning ? "text-rose-500" : "text-emerald-500"}`} />
              <span>Target Tabungan Bulan Ini: <span className="font-black text-foreground">{formatIDR(targetAmount)}</span></span>
            </div>
            
            <div className="w-full bg-muted dark:bg-card border border-border/80 h-3 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isSpendingWarning ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground font-bold">
              <span>Tercapai: <span className="text-foreground">{formatIDR(Math.max(0, savingsProgress))}</span> ({progressPercent}%)</span>
              <span>Sisa Target: <span className="text-foreground">{formatIDR(Math.max(0, targetAmount - savingsProgress))}</span></span>
            </div>
          </div>

          {/* Notifikasi limit jika belanja melebihi batas aman */}
          {isSpendingWarning ? (
            <div className="flex items-start gap-3 p-4 bg-rose-100/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/50 max-w-md shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-extrabold text-rose-800 dark:text-rose-400">Peringatan Anggaran!</p>
                <p className="text-rose-700 dark:text-rose-300 font-semibold leading-normal mt-1">
                  Pengeluaran Anda ({formatIDR(expenseThisMonth)}) telah melebihi batas aman belanja ({formatIDR(safeSpendingLimit)}) untuk mengamankan target tabungan Anda. Kurangi pengeluaran!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-emerald-100/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/50 max-w-md shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-extrabold text-emerald-800 dark:text-emerald-400">Keuangan Stabil</p>
                <p className="text-emerald-700 dark:text-emerald-300 font-semibold leading-normal mt-1">
                  Pengeluaran Anda masih dalam batas aman. Pertahankan kedisiplinan belanja ini untuk mencapai target tabungan Anda!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {/* Card: Total Pemasukan */}
        <div className="card-premium p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pemasukan Bulan Ini</span>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatIDR(incomeThisMonth)}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card: Total Pengeluaran */}
        <div className="card-premium p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pengeluaran Bulan Ini</span>
            <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {formatIDR(expenseThisMonth)}
            </p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Card: Total Investasi */}
        <div className="card-premium p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Investasi Bulan Ini</span>
            <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {formatIDR(investmentThisMonth)}
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-2xl">
            <LineChart className="w-6 h-6" />
          </div>
        </div>

        {/* Card: Saldo Saat Ini */}
        <div className="card-premium p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saldo Saat Ini</span>
            <p className={`text-2xl font-bold tracking-tight ${netBalance >= 0 ? "text-primary" : "text-rose-500"}`}>
              {formatIDR(netBalance)}
            </p>
          </div>
          <div className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Card: Jumlah Transaksi */}
        <div className="card-premium p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jumlah Transaksi</span>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {transactionCount} <span className="text-xs text-muted-foreground font-semibold">transaksi</span>
            </p>
          </div>
          <div className="p-3 bg-secondary text-muted-foreground border border-border/80 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics charts */}
      <DashboardCharts monthlyData={monthlyChartData} categoryData={categoryChartData} />

      {/* Interactive Daily & Monthly Financial Overview */}
      <DailyMonthlyOverview />

      {/* Recents list and Quick Actions */}
      <div className="card-premium rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/80">
          <div>
            <h3 className="font-bold text-lg text-foreground">Transaksi Terbaru</h3>
            <p className="text-xs text-muted-foreground">Ringkasan 5 aktivitas pencatatan terakhir Anda</p>
          </div>
          <Link
            href="/transactions"
            className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-indigo-600 transition-colors"
          >
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recents.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground font-medium">
            Belum ada aktivitas pencatatan transaksi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase border-b border-border/80 bg-secondary/30">
                  <th className="py-3 px-4 font-bold rounded-l-xl">Tanggal</th>
                  <th className="py-3 px-4 font-bold">Deskripsi</th>
                  <th className="py-3 px-4 font-bold">Kategori</th>
                  <th className="py-3 px-4 font-bold">Jenis</th>
                  <th className="py-3 px-4 font-bold text-right rounded-r-xl">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recents.map((t) => (
                  <tr key={t.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-muted-foreground">
                      {new Date(t.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {t.description || "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-secondary text-foreground border border-border/80">
                        {t.category.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                        t.type === "INCOME"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/10"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-500/10"
                      }`}>
                        {t.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 font-extrabold text-right ${
                      t.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}>
                      {t.type === "INCOME" ? "+" : "-"} {formatIDR(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
