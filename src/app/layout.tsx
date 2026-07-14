import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import PWARegistration from "@/components/PWARegistration";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FasihFinance - Manajemen Keuangan Pribadi Modern",
  description: "Aplikasi pencatatan keuangan pribadi yang modern, aman, responsif, dengan pelacakan target tabungan dan ekspor data.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FasihFinance",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb", // Vibrant fintech blue
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans transition-colors duration-200">
        <Providers>
          {children}
          <PWARegistration />
        </Providers>
      </body>
    </html>
  );
}
