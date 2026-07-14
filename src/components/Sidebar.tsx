"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import {
  LayoutDashboard,
  ArrowUpDown,
  FolderTree,
  FileText,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Wallet,
} from "lucide-react";

interface SidebarContentProps {
  session: { user?: { name?: string | null; email?: string | null } } | null;
  theme: "light" | "dark";
  toggleTheme: () => void;
  handleSignOut: () => void;
  menuItems: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
  pathname: string;
  setIsOpen: (open: boolean) => void;
}

function SidebarContent({
  session,
  theme,
  toggleTheme,
  handleSignOut,
  menuItems,
  pathname,
  setIsOpen,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r border-border/80 py-6 px-4">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="p-2.5 bg-primary/10 text-primary rounded-2xl border border-primary/20">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight leading-none bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            FasihFinance
          </h1>
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mt-1 block">Manajemen Keuangan</span>
        </div>
      </div>

      {/* User Info Details */}
      {session?.user && (
        <div className="flex items-center gap-3 px-3 py-3 mb-6 bg-secondary/30 dark:bg-secondary/10 rounded-2xl border border-border/60">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-indigo-500/20 text-primary border border-primary/20 font-bold text-sm select-none">
            {session.user.name ? session.user.name[0].toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate leading-none mb-1">
              {session.user.name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate leading-none font-semibold">
              {session.user.email}
            </p>
          </div>
        </div>
      )}

      {/* Nav Menu */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 hover:translate-x-0.5 ${
                isActive
                  ? "bg-gradient-to-r from-primary to-blue-600 text-primary-foreground shadow-lg shadow-primary/15"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer controls */}
      <div className="pt-4 border-t border-border/80 space-y-2">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all duration-200 cursor-pointer"
        >
          <span className="flex items-center gap-3">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            Tema {theme === "dark" ? "Terang" : "Gelap"}
          </span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 hover:text-rose-700 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transaksi", href: "/transactions", icon: ArrowUpDown },
    { name: "Kategori", href: "/categories", icon: FolderTree },
    { name: "Laporan", href: "/reports", icon: FileText },
    { name: "Pengaturan", href: "/settings", icon: Settings },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      {/* Mobile Top Header Navigation */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary text-primary-foreground rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            FasihFinance
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 hover:bg-secondary rounded-xl text-foreground transition-colors cursor-pointer"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Desktop Permanent Sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0">
        <SidebarContent
          session={session}
          theme={theme}
          toggleTheme={toggleTheme}
          handleSignOut={handleSignOut}
          menuItems={menuItems}
          pathname={pathname}
          setIsOpen={setIsOpen}
        />
      </aside>

      {/* Mobile Sidebar Overlay Drawer Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop background screen */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          {/* Drawer sidebar panel */}
          <div className="relative w-64 h-full z-50 animate-slide-up bg-card">
            <SidebarContent
              session={session}
              theme={theme}
              toggleTheme={toggleTheme}
              handleSignOut={handleSignOut}
              menuItems={menuItems}
              pathname={pathname}
              setIsOpen={setIsOpen}
            />
          </div>
        </div>
      )}
    </>
  );
}
