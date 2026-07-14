"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  Target,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

interface SavingsTarget {
  id: string;
  month: number;
  year: number;
  amount: number;
}

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

const monthsIndoShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agt",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// Format numbers to IDR currency
const formatIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

// Compact format for calendar cells (e.g. 1.2jt, 50rb)
const formatCompactIDR = (num: number) => {
  if (num === 0) return "";
  if (num >= 1000000) {
    const val = num / 1000000;
    return `${val.toFixed(val % 1 === 0 ? 0 : 1)}jt`;
  }
  if (num >= 1000) {
    return `${Math.round(num / 1000)}rb`;
  }
  return String(num);
};

export default function DailyMonthlyOverview() {
  const now = new Date();
  
  // Navigation states
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number>(now.getDate());

  // Data states
  const [monthlyTransactions, setMonthlyTransactions] = useState<Transaction[]>([]);
  const [yearlyTransactions, setYearlyTransactions] = useState<Transaction[]>([]);
  const [yearlyTargets, setYearlyTargets] = useState<SavingsTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch transactions for the calendar (monthly data)
  const fetchMonthlyData = useCallback(async (month: number, year: number) => {
    setIsLoading(true);
    try {
      const start = new Date(year, month, 1).toISOString().split("T")[0];
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString().split("T")[0];
      
      const res = await fetch(`/api/transactions?startDate=${start}&endDate=${end}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyTransactions(data);
      }
    } catch (err) {
      console.error("Error fetching monthly data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch transactions and targets for the yearly grid (monthly overview tab)
  const fetchYearlyData = useCallback(async (year: number) => {
    setIsLoading(true);
    try {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      
      const [transRes, targetsRes] = await Promise.all([
        fetch(`/api/transactions?startDate=${start}&endDate=${end}`),
        fetch(`/api/savings-target?month=all&year=${year}`),
      ]);

      if (transRes.ok) {
        const data = await transRes.json();
        setYearlyTransactions(data);
      }
      if (targetsRes.ok) {
        const targets = await targetsRes.json();
        setYearlyTargets(targets);
      }
    } catch (err) {
      console.error("Error fetching yearly data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data based on tab and settings
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "daily") {
        fetchMonthlyData(currentMonth, currentYear);
      } else {
        fetchYearlyData(currentYear);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [activeTab, currentMonth, currentYear, fetchMonthlyData, fetchYearlyData]);

  // Calendar Helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
  
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
    setSelectedDay(1);
  };

  // Group monthly transactions by day
  const getDaySummary = (day: number) => {
    const dayTrans = monthlyTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = dayTrans.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTrans.filter((t) => t.type === "EXPENSE" && t.category.name.toLowerCase() !== "investasi").reduce((sum, t) => sum + t.amount, 0);
    const investment = dayTrans.filter((t) => t.type === "EXPENSE" && t.category.name.toLowerCase() === "investasi").reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      investment,
      count: dayTrans.length,
      transactions: dayTrans,
    };
  };

  // Selected Day Transactions list
  const selectedDayData = getDaySummary(selectedDay);
  const formattedSelectedDateStr = `${selectedDay} ${monthsIndo[currentMonth]} ${currentYear}`;
  const selectedDateISO = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

  // Yearly data compilation
  const yearlyChartData = monthsIndoShort.map((mShort, idx) => {
    const monthTrans = yearlyTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === idx;
    });

    const income = monthTrans.filter((t) => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTrans.filter((t) => t.type === "EXPENSE" && t.category.name.toLowerCase() !== "investasi").reduce((sum, t) => sum + t.amount, 0);
    const investment = monthTrans.filter((t) => t.type === "EXPENSE" && t.category.name.toLowerCase() === "investasi").reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense - investment;

    const targetObj = yearlyTargets.find((t) => t.month === idx + 1);
    const target = targetObj ? targetObj.amount : 0;

    let percent = 0;
    if (target > 0) {
      percent = Math.min(Math.round((net / target) * 100), 100);
      if (percent < 0) percent = 0;
    }

    return {
      monthNum: idx + 1,
      monthName: monthsIndo[idx],
      monthShort: mShort,
      pemasukan: income,
      pengeluaran: expense,
      investasi: investment,
      saldo: net,
      target,
      percent,
    };
  });

  const currentYearOptions = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 4 + i);

  return (
    <div className="bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
      {/* Header controls and Tabs */}
      <div className="p-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-card via-secondary/10 to-card">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-foreground tracking-tight">
              Buku Catatan Keuangan
            </h3>
            <p className="text-xs text-muted-foreground/80 mt-0.5 font-semibold">
              Analisis catatan keuangan harian dan ringkasan bulanan tahunan Anda
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-secondary/60 dark:bg-secondary/20 p-1.5 rounded-2xl border border-border/50 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === "daily"
                ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/25 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Harian (Kalender)
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === "monthly"
                ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/25 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Bulanan (Setahun)
          </button>
        </div>
      </div>

      {activeTab === "daily" ? (
        /* DAILY CALENDAR VIEW PANEL */
        <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Calendar Grid (7 columns) */}
          <div className="lg:col-span-8 p-6 space-y-5">
            {/* Calendar Header Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/20 dark:bg-secondary/5 p-4 rounded-2xl border border-border/40">
              <div className="flex items-center gap-3 justify-between sm:justify-start w-full sm:w-auto">
                <span className="font-black text-lg text-foreground tracking-tight">
                  {monthsIndo[currentMonth]} {currentYear}
                </span>
                
                {/* Year and Month Direct Selectors */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={currentMonth}
                    onChange={(e) => {
                      setCurrentMonth(parseInt(e.target.value));
                      setSelectedDay(1);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-border bg-card text-[11px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer shadow-sm"
                  >
                    {monthsIndo.map((m, idx) => (
                      <option key={m} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={currentYear}
                    onChange={(e) => {
                      setCurrentYear(parseInt(e.target.value));
                      setSelectedDay(1);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-border bg-card text-[11px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer shadow-sm"
                  >
                    {currentYearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-primary/10 hover:text-primary border border-border/60 rounded-xl text-muted-foreground active:scale-95 transition-all cursor-pointer shadow-sm bg-card"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentMonth(now.getMonth());
                    setCurrentYear(now.getFullYear());
                    setSelectedDay(now.getDate());
                  }}
                  className="px-3.5 py-2 border border-border/60 rounded-xl text-[11px] font-bold bg-card hover:bg-secondary hover:text-foreground transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  Hari Ini
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-primary/10 hover:text-primary border border-border/60 rounded-xl text-muted-foreground active:scale-95 transition-all cursor-pointer shadow-sm bg-card"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Skeleton Loading */}
            {isLoading ? (
              <div className="grid grid-cols-7 gap-2 animate-pulse">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-[10px] font-bold text-muted-foreground/60 py-1 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-square bg-secondary/30 dark:bg-secondary/10 rounded-xl border border-border/30 h-16 sm:h-20"
                  />
                ))}
              </div>
            ) : (
              /* Calendar Grid Content */
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                {/* Days labels */}
                {daysOfWeek.map((day, idx) => (
                  <div
                    key={day}
                    className={`text-center text-[10px] font-bold py-1.5 uppercase tracking-wider ${
                      idx === 0 
                        ? "text-rose-500" 
                        : idx === 6 
                        ? "text-primary" 
                        : "text-muted-foreground/80"
                    }`}
                  >
                    {day}
                  </div>
                ))}

                {/* Blank days from prev month */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div
                    key={`blank-${idx}`}
                    className="aspect-square bg-secondary/5 dark:bg-card/5 rounded-2xl border border-dashed border-border/20 opacity-20 min-h-[72px]"
                  />
                ))}

                {/* Actual day cells */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const isSelected = selectedDay === day;
                  const isToday =
                    day === now.getDate() &&
                    currentMonth === now.getMonth() &&
                    currentYear === now.getFullYear();
                  
                  const summary = getDaySummary(day);
                  const hasIncome = summary.income > 0;
                  const hasExpense = summary.expense > 0;

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => setSelectedDay(day)}
                      className={`aspect-square relative flex flex-col justify-between p-2 rounded-2xl border text-left transition-all duration-200 group cursor-pointer min-h-[72px] sm:min-h-[80px] focus:outline-none ${
                        isSelected
                          ? "border-2 border-primary bg-primary/5 dark:bg-primary/20"
                          : isToday
                          ? "border border-indigo-500 bg-indigo-500/5 dark:bg-indigo-950/15 hover:border-indigo-500 hover:bg-indigo-500/10"
                          : "border-border/60 bg-card/60 hover:border-foreground/30 hover:bg-secondary/40"
                      }`}
                    >
                      {/* Day number */}
                      <span
                        className={`text-xs font-bold leading-none select-none rounded-lg px-1.5 py-1 ${
                          isToday
                            ? "text-indigo-600 dark:text-indigo-400 font-extrabold underline decoration-2 underline-offset-4"
                            : isSelected
                            ? "text-primary font-extrabold"
                            : "text-foreground/80"
                        }`}
                      >
                        {day}
                      </span>

                      {/* Cashflow Indicators */}
                      <div className="w-full flex flex-col gap-1 text-[8px] font-extrabold tracking-tight mt-1.5 truncate">
                        {hasIncome && (
                          <span className="text-emerald-600 dark:text-emerald-400 leading-none truncate bg-emerald-500/10 dark:bg-emerald-500/5 px-1 py-0.5 rounded flex items-center gap-0.5">
                            <span className="text-[6px]">▲</span>{formatCompactIDR(summary.income)}
                          </span>
                        )}
                        {hasExpense && (
                          <span className="text-rose-600 dark:text-rose-400 leading-none truncate bg-rose-500/10 dark:bg-rose-500/5 px-1 py-0.5 rounded flex items-center gap-0.5">
                            <span className="text-[6px]">▼</span>{formatCompactIDR(summary.expense)}
                          </span>
                        )}
                        {summary.investment > 0 && (
                          <span className="text-blue-600 dark:text-blue-400 leading-none truncate bg-blue-500/10 dark:bg-blue-500/5 px-1 py-0.5 rounded flex items-center gap-0.5">
                            <span className="text-[6px]">■</span>{formatCompactIDR(summary.investment)}
                          </span>
                        )}
                      </div>

                      {/* Dot for indicator if cell is too small */}
                      {summary.count > 0 && (
                        <div className="absolute right-2 top-2 flex gap-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              (summary.income > 0 && summary.expense > 0) || (summary.income > 0 && summary.investment > 0) || (summary.expense > 0 && summary.investment > 0)
                                ? "bg-primary"
                                : summary.income > 0
                                ? "bg-emerald-500"
                                : summary.investment > 0
                                ? "bg-blue-500"
                                : "bg-rose-500"
                            }`}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Day Details Panel */}
          <div className="lg:col-span-4 p-6 flex flex-col h-full bg-gradient-to-b from-secondary/10 via-transparent to-transparent border-t lg:border-t-0 lg:border-l border-border/60">
            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
              <div>
                <h4 className="font-bold text-sm text-foreground tracking-tight">Detail Transaksi</h4>
                <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5 mt-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                  {formattedSelectedDateStr}
                </p>
              </div>
              <Link
                href={`/transactions?date=${selectedDateISO}`}
                className="w-9 h-9 flex items-center justify-center rounded-xl btn-premium transition-all shadow-md cursor-pointer"
                title="Catat transaksi untuk tanggal ini"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex-1 py-10 flex flex-col items-center justify-center gap-2 text-muted-foreground/60">
                <span className="text-xs font-semibold animate-pulse">Memproses detail hari...</span>
              </div>
            ) : selectedDayData.count === 0 ? (
              /* Empty state for selected day */
              <div className="flex-1 py-12 text-center space-y-4 flex flex-col justify-center items-center">
                <div className="p-3.5 bg-secondary/80 dark:bg-card border border-border/85 rounded-2xl text-muted-foreground/60 shadow-sm">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">Tidak ada pencatatan</p>
                  <p className="text-[10px] text-muted-foreground max-w-[200px] leading-normal mx-auto font-semibold">
                    Belum ada pemasukan atau pengeluaran yang dicatat pada hari ini.
                  </p>
                </div>
                <Link
                  href={`/transactions?date=${selectedDateISO}`}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold btn-premium transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Catat Transaksi Baru
                </Link>
              </div>
            ) : (
              /* Transaction list for selected day */
              <div className="flex-1 flex flex-col justify-between space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gradient-to-br from-emerald-500/8 to-emerald-500/2 border border-emerald-500/15 p-2 rounded-2xl space-y-1 shadow-sm">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-2.5 h-2.5 text-emerald-500" /> Masuk
                    </span>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 truncate">
                      {formatIDR(selectedDayData.income)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-500/8 to-rose-500/2 border border-rose-500/15 p-2 rounded-2xl space-y-1 shadow-sm">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <TrendingDown className="w-2.5 h-2.5 text-rose-500" /> Keluar
                    </span>
                    <p className="text-xs font-bold text-rose-700 dark:text-rose-400 truncate">
                      {formatIDR(selectedDayData.expense)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/8 to-blue-500/2 border border-blue-500/15 p-2 rounded-2xl space-y-1 shadow-sm">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <TrendingUp className="w-2.5 h-2.5 text-blue-500" /> Investasi
                    </span>
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 truncate">
                      {formatIDR(selectedDayData.investment)}
                    </p>
                  </div>
                </div>

                {/* Net Flow summary card */}
                {(() => {
                  const netDaily = selectedDayData.income - selectedDayData.expense - selectedDayData.investment;
                  return (
                    <div className={`p-3.5 border rounded-2xl flex items-center justify-between text-xs shadow-sm bg-card/45 backdrop-blur-md ${
                      netDaily >= 0
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-400"
                    }`}>
                      <span className="font-bold text-muted-foreground/80 text-[10px]">Selisih Harian:</span>
                      <span className="font-bold text-sm">
                        {netDaily >= 0 ? "+" : ""}
                        {formatIDR(netDaily)}
                      </span>
                    </div>
                  );
                })()}

                {/* Transactions list map */}
                <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1 flex-1 mt-2.5 scrollbar-thin">
                  {selectedDayData.transactions.map((t) => (
                    <div
                       key={t.id}
                       className="relative overflow-hidden bg-card border border-border/60 hover:border-border/90 p-3.5 rounded-2xl flex flex-col gap-1.5 transition-all shadow-sm hover:shadow-md"
                    >
                      {/* Left color bar indicator */}
                      <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
                        t.type === "INCOME" 
                          ? "bg-emerald-500" 
                          : t.category.name.toLowerCase() === "investasi"
                          ? "bg-blue-500"
                          : "bg-rose-500"
                      }`} />

                      <div className="pl-2 flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-secondary border border-border/60 text-muted-foreground uppercase tracking-wider truncate max-w-[120px]">
                          {t.category.name}
                        </span>
                        <span className={`text-xs font-bold shrink-0 ${
                          t.type === "INCOME" 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : t.category.name.toLowerCase() === "investasi"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}>
                          {t.type === "INCOME" ? "+" : "-"} {formatIDR(t.amount)}
                        </span>
                      </div>
                      
                      <p className="pl-2 text-[10px] font-semibold text-foreground/90 leading-normal">
                        {t.description || "Tanpa Keterangan"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Quick link to transaction page */}
                <Link
                  href="/transactions"
                  className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-primary hover:underline hover:gap-2.5 transition-all pt-3 border-t border-border/60 mt-auto"
                >
                  Kelola & Edit Semua Transaksi <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MONTHLY YEARLY OVERVIEW GRID */
        <div className="p-6 space-y-6">
          {/* Year selector and summary stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h4 className="font-extrabold text-sm text-foreground">Ringkasan Bulanan dalam Setahun</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Perkembangan cashflow bulanan dan performa pencapaian target tabungan tahun {currentYear}
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-muted-foreground">Pilih Tahun:</span>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-bold outline-none focus:border-primary transition-colors cursor-pointer"
              >
                {currentYearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <span className="text-xs font-semibold animate-pulse">Memuat laporan tahunan...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Year Summary Cards Grid (12 Months) */}
              <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {yearlyChartData.map((data) => {
                  const hasTarget = data.target > 0;
                  const isTargetAchieved = hasTarget && data.saldo >= data.target;
                  
                  return (
                    <div
                      key={data.monthNum}
                      className={`bg-card border p-5 rounded-2xl shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-primary/20 ${
                        data.pemasukan === 0 && data.pengeluaran === 0
                          ? "border-border/50 opacity-60 border-t-primary/20"
                          : isTargetAchieved
                          ? "border-emerald-500/20 bg-emerald-500/2 border-t-emerald-500"
                          : hasTarget && data.saldo < data.target
                          ? "border-rose-500/10 bg-rose-500/2 border-t-rose-500"
                          : "border-border border-t-primary"
                      } border-t-4`}
                    >
                      {/* Month & status badge */}
                      <div className="flex items-center justify-between border-b border-border/50 pb-2.5 mb-3.5">
                        <span className="font-bold text-sm text-foreground tracking-tight">{data.monthName}</span>
                        {hasTarget ? (
                          isTargetAchieved ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 uppercase tracking-wide border border-emerald-500/10">
                              <CheckCircle className="w-2.5 h-2.5" /> Tercapai
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold bg-rose-100 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 uppercase tracking-wide border border-rose-500/10">
                              <AlertCircle className="w-2.5 h-2.5" /> Kurang
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-secondary text-muted-foreground border border-border/60 uppercase tracking-wide">
                            No Goal
                          </span>
                        )}
                      </div>

                      {/* Financial info block */}
                      <div className="space-y-2 text-xs font-semibold">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-[10px] font-bold">Pemasukan:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {formatIDR(data.pemasukan)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-[10px] font-bold">Pengeluaran:</span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            {formatIDR(data.pengeluaran)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-[10px] font-bold">Investasi:</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {formatIDR(data.investasi || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border/40 pt-2 font-bold">
                          <span className="text-[10px] text-foreground">Tabungan (Net):</span>
                          <span className={data.saldo >= 0 ? "text-primary text-sm" : "text-rose-500 text-sm"}>
                            {formatIDR(data.saldo)}
                          </span>
                        </div>
                      </div>

                      {/* Target savings progress tracker */}
                      {hasTarget && (
                        <div className="mt-4.5 pt-3.5 border-t border-border/50 space-y-2">
                          <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground">
                            <span className="flex items-center gap-1 font-bold text-foreground/80">
                              <Target className="w-3.5 h-3.5 text-primary" /> Target: {formatIDR(data.target)}
                            </span>
                            <span className="bg-secondary px-1.5 py-0.5 rounded border border-border/50">{data.percent}%</span>
                          </div>
                          
                          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden border border-border/20 shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-500 shadow-md ${
                                isTargetAchieved ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-primary to-indigo-500"
                              }`}
                              style={{ width: `${data.percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Visual annual overview charts */}
              {yearlyTransactions.length > 0 && (
                <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">Grafik Pencapaian Tabungan Bulanan</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                      Perbandingan saldo penyimpanan bersih vs target tabungan yang ditetapkan untuk tahun {currentYear}
                    </p>
                  </div>
                  
                  <div className="h-80 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border) / 0.7)" />
                        <XAxis
                          dataKey="monthShort"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v)}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "16px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                          }}
                          formatter={(value: unknown) => [formatIDR(Number(value || 0)), ""]}
                          labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))", fontSize: "12px" }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                          wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }}
                        />
                        <Bar
                          dataKey="saldo"
                          name="Tabungan Bersih (Net)"
                          fill="#3b82f6"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="target"
                          name="Target Tabungan"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
