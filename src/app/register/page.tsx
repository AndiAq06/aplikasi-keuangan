"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/Toast";
import { Wallet, Loader2, ArrowRight } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (!res.ok) {
        showToast(body.message || "Terjadi kesalahan registrasi", "error");
      } else {
        showToast("Registrasi berhasil! Silakan masuk ke akun Anda.", "success");
        router.push("/login");
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal menghubungi server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12 relative overflow-hidden">
      {/* Background glow decorator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 bg-card border border-border/80 p-8 rounded-3xl shadow-2xl relative z-10 animate-fade-in">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-primary/10 text-primary rounded-2xl border border-primary/20 mb-2">
            <Wallet className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Buat Akun Baru</h2>
          <p className="text-sm text-muted-foreground">
            Daftar untuk mulai mengelola keuangan pribadi Anda.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Masukkan nama Anda"
              {...register("name")}
              className={`w-full px-4 py-3 rounded-xl border bg-background text-sm font-semibold transition-all duration-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 ${
                errors.name ? "border-destructive focus:border-destructive focus:ring-destructive/10 text-destructive" : "border-border"
              }`}
            />
            {errors.name && <p className="text-xs text-destructive font-semibold">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              type="email"
              placeholder="nama@email.com"
              {...register("email")}
              className={`w-full px-4 py-3 rounded-xl border bg-background text-sm font-semibold transition-all duration-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 ${
                errors.email ? "border-destructive focus:border-destructive focus:ring-destructive/10 text-destructive" : "border-border"
              }`}
            />
            {errors.email && <p className="text-xs text-destructive font-semibold">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              {...register("password")}
              className={`w-full px-4 py-3 rounded-xl border bg-background text-sm font-semibold transition-all duration-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 ${
                errors.password ? "border-destructive focus:border-destructive focus:ring-destructive/10 text-destructive" : "border-border"
              }`}
            />
            {errors.password && <p className="text-xs text-destructive font-semibold">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold btn-premium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Daftar <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Login redirect options */}
        <div className="text-center text-sm pt-2">
          <span className="text-muted-foreground">Sudah punya akun? </span>
          <Link href="/login" className="font-bold text-primary hover:text-indigo-600 hover:underline transition-colors">
            Masuk Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
