"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Smartphone, Package, Bell, LogOut, Menu, Map, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getStoredTheme, toggleTheme, applyTheme, type Theme } from "@/lib/theme";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function handleToggleTheme() {
    const next = toggleTheme();
    setTheme(next);
  }

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch {
      // signOut may fail if already signed out — continue anyway
    }
    localStorage.removeItem("token");
    router.push("/login");
  }
  
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/devices", label: "Devices", icon: Smartphone },
    { href: "/shipments", label: "Shipments", icon: Package },
    { href: "/map", label: "Map", icon: Map },
    { href: "/alerts", label: "Alerts", icon: Bell },
  ];

  if (pathname.includes("/login") || pathname.includes("/track")) {
    return null; // Do not show navbar on login or tracking page
  }

  return (
    <nav className="sticky top-0 z-50 bg-base/85 backdrop-blur-xl border-b border-edge">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon to-teal flex items-center justify-center shadow-glow">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">CargoSafe</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="flex items-baseline space-x-1">
              {links.map((link) => {
                const isActive = pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-neon/10 text-neon" 
                        : "text-txt-secondary hover:text-txt-primary hover:bg-surface-hover"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wider bg-teal/10 text-teal border border-teal/20">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-slow" />
              Live
            </div>
            {/* Theme toggle */}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-xl text-txt-secondary hover:text-amber hover:bg-amber/10 transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-txt-secondary hover:text-coral hover:bg-coral/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl text-txt-secondary hover:bg-surface-hover">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-edge bg-base/95 backdrop-blur-3xl px-4 py-4 space-y-2 absolute w-full shadow-card animate-fade-in">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-neon/10 text-neon" 
                    : "text-txt-secondary hover:text-txt-primary hover:bg-surface-hover"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-4 mt-2 border-t border-edge flex items-center justify-between px-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wider bg-teal/10 text-teal border border-teal/20">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-slow" />
              Live
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleTheme}
                className="p-2 rounded-xl text-txt-secondary hover:text-amber hover:bg-amber/10 transition-colors"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 p-2 rounded-xl text-txt-secondary hover:text-coral hover:bg-coral/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
