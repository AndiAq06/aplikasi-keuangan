"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/Toast";
import { Wallet, Loader2, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        showToast(result.error, "error");
      } else {
        showToast("Login berhasil! Selamat datang kembali.", "success");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan sistem.", "error");
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
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Selamat Datang Kembali</h2>
          <p className="text-sm text-muted-foreground">
            Masuk untuk mengakses catatan keuangan Anda.
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              placeholder="••••••••"
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
                Masuk <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Onboarding redirects */}
        <div className="text-center text-sm pt-2">
          <span className="text-muted-foreground">Belum punya akun? </span>
          <Link href="/register" className="font-bold text-primary hover:text-indigo-600 hover:underline transition-colors">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
