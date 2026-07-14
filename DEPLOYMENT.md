# Panduan Deployment - FasihFinance

Dokumen ini berisi panduan untuk menjalankan aplikasi **FasihFinance** secara lokal di komputer Anda (development) dan mendeploy ke **Vercel** dengan database **PostgreSQL** (production).

---

## 1. Menjalankan Aplikasi Secara Lokal (Development)

Aplikasi secara default dikonfigurasi menggunakan database **SQLite** untuk kemudahan pengembangan lokal tanpa perlu melakukan instalasi database engine terpisah.

### Langkah-langkah:

1. **Instalasi Dependensi**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Pengaturan Environment Variables**
   Salin file `.env.example` menjadi `.env`:
   ```bash
   copy .env.example .env
   ```
   Secara default, `.env` berisi:
   - `DATABASE_URL="file:./dev.db"` (Lokasi SQLite database lokal)
   - `NEXTAUTH_SECRET` (Kunci rahasia untuk enkripsi token sesi user)
   - `NEXTAUTH_URL="http://localhost:3000"` (Domain lokal)

3. **Sinkronisasi Database**
   Jalankan perintah berikut untuk membuat file database SQLite `dev.db` dan menggenerasi client types:
   ```bash
   npm run db:push
   ```

4. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Buka browser dan akses [http://localhost:3000](http://localhost:3000).

---

## 2. Struktur Database Relasional (Prisma)

Aplikasi memiliki 4 tabel utama:
- `User`: Menyimpan akun pengguna (Email unik, nama, hashed password).
- `Category`: Kategori transaksi yang terisolasi per pengguna (Gaji, Makanan, dsb.).
- `Transaction`: Catatan transaksi keuangan (Pemasukan/Pengeluaran, nominal, tanggal, keterangan).
- `SavingsTarget`: Target tabungan bulanan (Bulan, tahun, jumlah target).

---

## 3. Mekanisme Otomatis Multi-Database (SQLite & PostgreSQL)

Untuk mendukung **SQLite di lokal** dan **PostgreSQL di Vercel** tanpa modifikasi manual, aplikasi dilengkapi dengan script **Database Switcher**:

- Script terletak di `scripts/switch-db.js`.
- Saat Vercel menjalankan perintah `npm run build`, script secara otomatis mendeteksi dan mengubah `provider` pada `prisma/schema.prisma` dari `"sqlite"` menjadi `"postgresql"`, lalu melakukan kompilasi client `prisma generate` untuk driver PostgreSQL.
- Hal ini menjamin file schema Anda tetap bersih dan deployment berjalan otomatis 100%.

---

## 4. Cara Mendeploy ke Vercel (Production)

### Langkah A: Siapkan Database PostgreSQL
Aplikasi membutuhkan database PostgreSQL eksternal. Anda bisa mendapatkan database gratis di:
- **Neon Console** (https://neon.tech)
- **Supabase** (https://supabase.com)
- **Vercel Postgres** (Disediakan langsung oleh Vercel)

Dapatkan string koneksi database Anda, contohnya:
`postgresql://username:password@ep-cool-water-12345.us-east-2.aws.neon.tech/neondb?sslmode=require`

### Langkah B: Deploy ke Vercel
1. Hubungkan repository GitHub Anda ke **Vercel**.
2. Di Vercel Dashboard, tambahkan proyek baru dari repository tersebut.
3. Di bagian **Environment Variables**, tambahkan variabel berikut:
   - `DATABASE_URL` : *[Masukkan URL PostgreSQL Anda]*
   - `NEXTAUTH_SECRET` : *[Masukkan string acak 32+ karakter, misal hasil dari: openssl rand -base64 32]*
   - `NEXTAUTH_URL` : *[Masukkan domain Vercel Anda, misal: https://fasih-finance.vercel.app]*

4. Klik **Deploy**. Vercel akan otomatis menjalankan build command:
   `node scripts/switch-db.js postgresql && prisma generate && next build`

### Langkah C: Migrasi Database PostgreSQL
Setelah deployment selesai, jalankan sinkronisasi schema database PostgreSQL Anda sekali saja. Anda dapat melakukannya melalui Vercel CLI atau menjalankan command secara remote dari komputer lokal Anda:

Jalankan perintah ini di lokal (pastikan string `DATABASE_URL` di `.env` lokal Anda diarahkan ke PostgreSQL production sementara untuk migrasi):
```bash
# 1. Switch schema ke postgresql
npm run db:switch-postgres

# 2. Push schema ke database PostgreSQL production
npx prisma db push
```

*Catatan: Pastikan untuk mengembalikan nilai `DATABASE_URL` di `.env` lokal Anda kembali ke `file:./dev.db` dan jalankan `npm run db:switch-sqlite` setelah selesai agar pengembangan lokal Anda kembali menggunakan SQLite.*
