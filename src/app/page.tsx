import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Wallet, Shield, PieChart, Download, ArrowRight } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              FasihFinance
            </span>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold btn-premium transition-all cursor-pointer"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold btn-premium transition-all cursor-pointer"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Presentation */}
      <main className="flex-1">
        <section className="py-24 md:py-36 px-6 relative overflow-hidden">
          {/* Subtle background glow decorator */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="container mx-auto max-w-5xl text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              <span>🚀 Personal Finance Manager Modern</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
              Kelola Keuangan Anda Dengan{" "}
              <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-500 bg-clip-text text-transparent">
                Lebih Cerdas & Cepat
              </span>
            </h2>
            <p className="max-w-2xl mx-auto text-muted-foreground text-sm md:text-base leading-relaxed">
              Catat pemasukan, pantau pengeluaran bulanan, capai target tabungan, dan ekspor laporan keuangan Anda dalam satu dasbor terpadu yang dirancang indah.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
              {session ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold btn-premium transition-all cursor-pointer"
                >
                  Masuk ke Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold btn-premium transition-all cursor-pointer"
                  >
                    Mulai Sekarang <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-2xl text-base font-bold border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/40 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                  >
                    Sudah Punya Akun
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Info Grid */}
        <section className="py-24 bg-secondary/20 dark:bg-secondary/5 border-y border-border/80">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="text-center space-y-4 mb-16">
              <h3 className="text-3xl font-extrabold tracking-tight">Semua Fitur Untuk Mengontrol Uang Anda</h3>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                Dirancang dengan arsitektur fintech premium untuk memberikan insight cepat dan akurat.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature Card 1 */}
              <div className="card-premium p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="p-3 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-2xl w-fit mb-5 border border-blue-500/20">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Pencatatan Cepat</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Catat transaksi harian dengan input nominal, kategori, tanggal, dan deskripsi tervalidasi.
                  </p>
                </div>
              </div>

              {/* Feature Card 2 */}
              <div className="card-premium p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-2xl w-fit mb-5 border border-indigo-500/20">
                    <PieChart className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Visualisasi Grafik</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Analisis perbandingan pemasukan vs pengeluaran dan distribusi kategori dalam grafik interaktif.
                  </p>
                </div>
              </div>

              {/* Feature Card 3 */}
              <div className="card-premium p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-2xl w-fit mb-5 border border-emerald-500/20">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Multi-User Aman</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Data Anda dienkripsi dan diisolasi sehingga aman dan hanya dapat diakses oleh Anda sendiri.
                  </p>
                </div>
              </div>

              {/* Feature Card 4 */}
              <div className="card-premium p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="p-3 bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-2xl w-fit mb-5 border border-rose-500/20">
                    <Download className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Ekspor Laporan</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Unduh ringkasan transaksi Anda ke format PDF, Excel (.xlsx), atau CSV kapan saja dibutuhkan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-border/80 py-8 bg-card text-muted-foreground text-xs md:text-sm">
        <div className="container mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="font-bold text-foreground">FasihFinance</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-muted-foreground font-semibold">Premium Fintech Web App</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
