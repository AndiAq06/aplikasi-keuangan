"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface MonthlyChartData {
  month: string;
  pemasukan: number;
  pengeluaran: number;
}

interface CategoryChartData {
  name: string;
  value: number;
}

interface DashboardChartsProps {
  monthlyData: MonthlyChartData[];
  categoryData: CategoryChartData[];
}

const COLORS = [
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#64748b", // Slate
];

// Helper to format currency to IDR
const formatIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function DashboardCharts({ monthlyData, categoryData }: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 card-premium p-6 rounded-2xl h-[386px] flex items-center justify-center text-xs font-semibold text-muted-foreground/60">
          Memuat Grafik Tren...
        </div>
        <div className="bg-card border border-border p-6 rounded-2xl h-[386px] flex items-center justify-center text-xs font-semibold text-muted-foreground/60">
          Memuat Grafik Distribusi...
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Area Chart: Income vs Expense Trend */}
      <div className="lg:col-span-2 card-premium p-6 rounded-2xl flex flex-col">
        <div className="mb-4">
          <h3 className="font-bold text-base text-foreground">Tren Keuangan (6 Bulan Terakhir)</h3>
          <p className="text-xs text-muted-foreground font-semibold">Perbandingan bulanan pemasukan dan pengeluaran</p>
        </div>
        <div className="h-80 w-full mt-2">
          {monthlyData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground font-semibold">
              Belum ada data transaksi yang cukup.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border) / 0.7)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v)}
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
                <Area
                  type="monotone"
                  dataKey="pemasukan"
                  name="Pemasukan"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPemasukan)"
                />
                <Area
                  type="monotone"
                  dataKey="pengeluaran"
                  name="Pengeluaran"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPengeluaran)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pie Chart: Expenses Breakdown */}
      <div className="card-premium p-6 rounded-2xl flex flex-col">
        <div className="mb-4">
          <h3 className="font-bold text-base text-foreground">Distribusi Pengeluaran</h3>
          <p className="text-xs text-muted-foreground font-semibold">Berdasarkan kategori bulan ini</p>
        </div>
        <div className="h-80 w-full relative flex-1 flex flex-col justify-center">
          {categoryData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground font-semibold">
              Belum ada data pengeluaran bulan ini.
            </div>
          ) : (
            <>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "16px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
                      }}
                      formatter={(value: unknown) => [formatIDR(Number(value || 0)), ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="max-h-28 overflow-y-auto mt-2 text-xs flex flex-wrap justify-center gap-x-3 gap-y-2 px-1">
                {categoryData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 font-bold">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate max-w-[90px] text-muted-foreground font-semibold">{item.name}</span>
                    <span className="text-foreground">({formatIDR(item.value)})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
