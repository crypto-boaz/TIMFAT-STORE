"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Heart,
  LayoutDashboard,
  List,
  Menu,
  Moon,
  PackageSearch,
  PackagePlus,
  Plus,
  ShoppingCart,
  ReceiptText,
  SlidersHorizontal,
  ShieldCheck,
  LogOut,
  Sun,
  Users,
  X,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useBusinessData } from "@/lib/use-business-data";
import { buildSmartNotifications, isSmartNotificationRead } from "@/lib/notifications";
import { supabase } from "@/lib/supabase-client";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Products", icon: Boxes },
  { href: "/sales", label: "Sales", icon: ReceiptText },
  { href: "/cart", label: "Point of Sales", icon: ShoppingCart },
  { href: "/debts", label: "Customers", icon: Heart },
  { href: "/suppliers", label: "Purchases", icon: PackagePlus },
  { href: "/requests", label: "Returns", icon: ClipboardList },
  { href: "/people", label: "People", icon: Users },
  { href: "/finance", label: "Expense Tracker", icon: CircleDollarSign },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/notifications", label: "Alerts", icon: Bell }
];

const topShortcuts = [
  { href: "/cart", label: "Point Of Sales", icon: ShoppingCart },
  { href: "/sales", label: "Sales", icon: ReceiptText },
  { href: "/inventory", label: "Products", icon: Boxes },
  { href: "/finance", label: "Expense Tracker", icon: SlidersHorizontal },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notifications", label: "Alerts", icon: Bell }
];

const productSubNavigation = [
  { href: "/inventory", label: "List Products", icon: List },
  { href: "/inventory?action=add", label: "Add Product", icon: Plus },
  { href: "/inventory", label: "Edit From Details", icon: PackageSearch },
  { href: "/inventory-control", label: "Quantity Adjustments", icon: SlidersHorizontal },
  { href: "/inventory-control", label: "Stock Counts", icon: ClipboardList }
];

let prefetchedRoutes = false;

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [notificationReadVersion, setNotificationReadVersion] = useState(0);
  const [sessionUser, setSessionUser] = useState({ name: "PayTrack User", role: "STAFF", companyName: "PayTrack" });
  const data = useBusinessData();
  const { cart } = data;
  const alerts = useMemo(() => buildSmartNotifications(data), [data]);
  const alertCount = useMemo(
    () => alerts.filter((item) => item.priority !== "Normal" && !isSmartNotificationRead(item.id)).length,
    [alerts, notificationReadVersion]
  );
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("paytrack_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(storedTheme ? storedTheme === "dark" : prefersDark);
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    localStorage.setItem("paytrack_theme", dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", dark);
  }, [dark, themeReady]);

  useEffect(() => {
    setSessionUser({
      name: localStorage.getItem("paytrack_name") || "PayTrack User",
      role: localStorage.getItem("paytrack_role") || "STAFF",
      companyName: localStorage.getItem("paytrack_company") || localStorage.getItem("paytrack_name") || "PayTrack"
    });
    const syncNotificationReads = () => setNotificationReadVersion((value) => value + 1);
    window.addEventListener("smart-notifications-read", syncNotificationReads);
    window.addEventListener("storage", syncNotificationReads);
    return () => {
      window.removeEventListener("smart-notifications-read", syncNotificationReads);
      window.removeEventListener("storage", syncNotificationReads);
    };
  }, []);

  useEffect(() => {
    if (prefetchedRoutes) return;
    prefetchedRoutes = true;
    const timer = window.setTimeout(() => {
      navigation.forEach((item) => router.prefetch(item.href));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [router]);

  const signOut = async () => {
    await supabase?.auth.signOut();
    localStorage.removeItem("paytrack_token");
    localStorage.removeItem("paytrack_role");
    localStorage.removeItem("paytrack_name");
    document.cookie = "paytrack_session=; path=/; max-age=0; SameSite=Lax";
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3] text-[#1f2937] dark:bg-[#0f172a] dark:text-slate-100">
      {open && <button className="fixed inset-0 z-30 bg-slate-950/55 print:hidden lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu overlay" />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[min(280px,86vw)] overflow-y-auto border-r border-[#1b2940] bg-[#0c1729] text-slate-300 shadow-2xl shadow-slate-950/30 transition-transform print:hidden lg:w-[250px] lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-[#1b2940] px-3">
          <Link href="/dashboard" className="min-w-0">
            <span className="block truncate text-[15px] font-black uppercase tracking-normal text-blue-400">
              {sessionUser.companyName || "PAYTRACK"}
            </span>
            <span className="block truncate text-[11px] font-semibold text-slate-500">Business management POS</span>
          </Link>
          <button className="grid size-9 place-items-center border border-[#2d3c53] text-slate-300 transition hover:bg-[#182842] lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="px-4 py-5 sm:px-7">
          {navigation.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group mb-2 flex h-[43px] items-center gap-3 px-4 text-[13px] font-semibold text-[#9fb7d7] transition hover:bg-[#15243b] hover:text-white",
                    active && "bg-[#2f63e5] text-white shadow-lg shadow-blue-950/30"
                  )}
                >
                  <span className={cn("grid size-5 place-items-center text-[#6683ad] transition group-hover:text-white", active && "text-white")}>
                    <Icon size={16} />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/cart" && cartCount > 0 && (
                    <span className="bg-blue-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                      {cartCount}
                    </span>
                  )}
                  {item.href === "/notifications" && alertCount > 0 && (
                    <span className="bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                      {alertCount}
                    </span>
                  )}
                  <span className={cn("text-[10px] text-[#64748b]", active && "text-blue-100")}>[]</span>
                </Link>
                {item.href === "/inventory" && active && (
                  <div className="-mt-1 mb-3 bg-[#07101f] px-6 py-2">
                    {productSubNavigation.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <Link
                          href={subItem.href}
                          key={subItem.label}
                          onClick={() => {
                            setOpen(false);
                            if (subItem.href === "/inventory?action=add" && pathname === "/inventory") {
                              window.dispatchEvent(new Event("paytrack-add-product"));
                            }
                          }}
                          className="flex h-9 items-center gap-3 px-3 text-xs font-semibold text-[#9fb7d7] transition hover:bg-[#101e33] hover:text-white"
                        >
                          <SubIcon size={14} className="text-[#6683ad]" />
                          <span>{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mx-4 mb-4 mt-6 border border-[#1f3049] bg-[#101e33] p-3 sm:mx-7 lg:absolute lg:bottom-4 lg:left-7 lg:right-7 lg:m-0">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center bg-[#172842] text-blue-300">
              <ShieldCheck size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-white">{sessionUser.name}</p>
              <p className="text-[11px] capitalize text-slate-500">{sessionUser.role.toLowerCase()} account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-3 inline-flex h-8 w-full items-center justify-center gap-2 bg-[#1b2d48] text-xs font-black text-slate-200 transition hover:bg-[#263b5c]"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="print:pl-0 lg:pl-[250px]">
        <header className="sticky top-0 z-20 border-b border-[#1b2940] bg-[#111c2f] print:hidden">
          <div className="flex min-h-14 items-center gap-2 px-2 sm:px-3">
            <button className="grid size-9 place-items-center border border-[#2e3e57] bg-[#1b2b44] text-slate-200 transition hover:bg-[#253854] lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <div className="hidden items-center gap-2 lg:flex">
              {topShortcuts.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex h-8 items-center gap-2 border border-[#31435d] bg-[#1b2b44] px-3 text-xs font-semibold text-[#9fb0c7] transition hover:bg-[#253854] hover:text-white",
                      active && "border-blue-500/80 bg-[#223a63] text-white"
                    )}
                  >
                    <Icon size={14} />
                    {item.label}
                    {item.href === "/notifications" && alertCount > 0 && (
                      <span className="-ml-1 -mt-4 bg-red-600 px-1 text-[9px] font-black text-white">{alertCount}</span>
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="ml-auto min-w-0 flex-1 lg:max-w-md">
              <Link
                href="/cart"
                className="flex h-9 w-full items-center justify-between border border-[#31435d] bg-[#1b2b44] px-4 text-xs font-black text-slate-100 transition hover:bg-[#253854]"
                title="Open cart"
              >
                <span className="inline-flex items-center gap-2">
                  <ShoppingCart size={16} className="text-blue-300" />
                  Cart / Point Of Sales
                </span>
                <span className="bg-blue-500 px-2 py-1 text-[11px] font-black text-white">
                  {cartCount.toLocaleString()} items
                </span>
              </Link>
            </div>
            <span className="hidden h-8 items-center gap-2 border border-[#31435d] bg-[#1b2b44] px-3 text-xs font-semibold text-slate-300 md:inline-flex">
              <CalendarDays size={14} /> {new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <button
              onClick={() => setDark((value) => !value)}
              className="grid size-8 place-items-center border border-[#31435d] bg-[#1b2b44] text-slate-300 transition hover:bg-[#253854]"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="hidden h-14 items-center border-l border-[#1b2940] px-4 text-xs font-semibold text-white md:inline-flex">
              <Zap size={14} className="mr-2 text-blue-400" /> {sessionUser.role}
            </span>
          </div>
        </header>
        <main className="px-2 py-3 print:p-0 sm:px-5 sm:py-4">{children}</main>
      </div>
    </div>
  );
}
