"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, DataTable, Panel } from "@/components/ui";
import { buildSmartNotifications } from "@/lib/notifications";
import { useBusinessData } from "@/lib/use-business-data";
import { money, shortDate } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BellRing,
  Boxes,
  CreditCard,
  Database,
  Headphones,
  PackageCheck,
  PackageX,
  ReceiptText,
  ShoppingCart,
  Users
} from "lucide-react";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

function moneyWithDecimals(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function DashboardTile({
  href,
  label,
  value,
  detail,
  action,
  tone,
  icon: Icon
}: {
  href: string;
  label: string;
  value: string;
  detail: string;
  action: string;
  tone: string;
  icon: React.ElementType;
}) {
  return (
    <Link href={href} className={`group relative block min-h-[126px] overflow-hidden px-5 py-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${tone}`}>
      <div className="relative z-10">
        <p className="text-xs font-black uppercase text-white/65">{label}</p>
        <p className="mt-4 text-[28px] font-black leading-none tracking-normal text-white">{value}</p>
        <p className="mt-2 text-sm font-bold text-white/90">{detail}</p>
        <div className="mt-5 flex items-center justify-between pt-3 text-xs font-black uppercase text-white/80">
          <span>{action}</span>
          <ArrowRight size={16} className="transition group-hover:translate-x-1" />
        </div>
      </div>
      <Icon className="absolute bottom-4 right-5 text-white/78" size={56} strokeWidth={1.8} />
      <div className="absolute -right-8 -top-8 size-28 bg-white/5" />
    </Link>
  );
}

function PanelHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex h-11 items-center border-b border-[#d7dde8] bg-white text-[#06152d]">
      <span className="grid h-full w-11 place-items-center border-r border-[#d7dde8] text-blue-500">
        <Icon size={17} />
      </span>
      <h2 className="px-4 text-sm font-black uppercase tracking-normal">{title}</h2>
    </div>
  );
}

export default function DashboardPage() {
  const data = useBusinessData();
  const [accountName, setAccountName] = useState("PayTrack User");
  const { products, debts, expenses, suppliers, sales, categories } = data;
  const alerts = useMemo(() => buildSmartNotifications(data), [data]);
  const todayValue = today();
  const currentMonth = monthKey();
  const metrics = useMemo(() => {
    let dailySales = 0;
    let dailyTransactions = 0;
    let monthlySales = 0;
    for (const sale of sales) {
      if (sale.date === todayValue) {
        dailySales += sale.total;
        dailyTransactions += 1;
      }
      if (sale.date.startsWith(currentMonth)) monthlySales += sale.total;
    }

    let inventoryValue = 0;
    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    for (const product of products) {
      inventoryValue += Math.max(0, product.quantity) * Math.max(0, product.unitPrice);
      totalUnits += product.quantity;
      if (product.quantity <= product.lowStockAt) lowStockCount += 1;
      if (product.quantity <= 0) outOfStockCount += 1;
    }

    return {
      dailySales,
      dailyTransactions,
      monthlySales,
      customerDebts: debts.reduce((sum, debt) => sum + Math.max(0, debt.total - debt.paid), 0),
      activeDebts: debts.filter((debt) => debt.status !== "Settled").length,
      supplierPayments: suppliers.reduce((sum, supplier) => sum + Math.max(0, supplier.total - supplier.paid), 0),
      expenseTotal: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      inventoryValue,
      totalUnits,
      lowStockCount,
      outOfStockCount
    };
  }, [currentMonth, debts, expenses, products, sales, suppliers, todayValue]);
  const recentSales = useMemo(() => sales.slice(0, 8), [sales]);
  const chartMax = Math.max(metrics.dailySales, metrics.monthlySales, metrics.inventoryValue, metrics.customerDebts, 1);
  const chartBars = [
    { label: "Today", value: metrics.dailySales, color: "bg-blue-500" },
    { label: "Month", value: metrics.monthlySales, color: "bg-emerald-500" },
    { label: "Stock", value: metrics.inventoryValue, color: "bg-lime-500" },
    { label: "Debt", value: metrics.customerDebts, color: "bg-amber-500" }
  ];

  useEffect(() => {
    setAccountName(localStorage.getItem("paytrack_name") || "PayTrack User");
  }, []);

  return (
    <AppShell>
      <section className="border border-[#d6dbe5] bg-[#152238] px-6 py-7 text-white shadow-md">
        <h1 className="text-[25px] font-black tracking-normal">
          Good evening, <span className="text-blue-400">{accountName}!</span>
        </h1>
        <p className="mt-3 text-sm font-medium text-blue-100/80">Here is a quick overview of your business today.</p>
        <p className="mt-1 text-sm font-medium text-blue-100/80">
          Everything is running smoothly. Today is <span className="font-black text-white">{new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>.
        </p>
      </section>

      <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardTile href="/inventory" label="Inventory Value" value={moneyWithDecimals(metrics.inventoryValue)} detail={`${metrics.totalUnits.toLocaleString()} units in stock`} action="Click to view inventory" tone="bg-[#2f63e5]" icon={Database} />
        <DashboardTile href="/sales" label="Today's Sales" value={money(metrics.dailySales)} detail={`${metrics.dailyTransactions} transactions today`} action="Click to view today's sales" tone="bg-[#0f956a]" icon={ShoppingCart} />
        <DashboardTile href="/reports" label="Monthly Sales" value={money(metrics.monthlySales)} detail="Current month sales history" action="Click to open reports" tone="bg-[#7d2ee6]" icon={BarChart3} />
        <DashboardTile href="/inventory" label="Total Products" value={products.length.toLocaleString()} detail={`${metrics.totalUnits.toLocaleString()} total units`} action="Click to view products" tone="bg-[#db4209]" icon={Boxes} />
        <DashboardTile href="/inventory" label="Low Stock Items" value={metrics.lowStockCount.toLocaleString()} detail="Products at or below reorder level" action="Click to restock" tone="bg-[#e7473c]" icon={PackageCheck} />
        <DashboardTile href="/inventory" label="Out of Stock" value={metrics.outOfStockCount.toLocaleString()} detail="Products currently at zero stock" action="Click to review stock" tone="bg-[#2d89b8]" icon={PackageX} />
        <DashboardTile href="/debts" label="Customer Debts" value={money(metrics.customerDebts)} detail={`${metrics.activeDebts} active ledgers`} action="Click to manage debts" tone="bg-[#f28a40]" icon={Users} />
        <DashboardTile href="/suppliers" label="Supplier Payments" value={money(metrics.supplierPayments)} detail="Outstanding supplier balances" action="Click to manage purchases" tone="bg-[#15933c]" icon={CreditCard} />
        <DashboardTile href="/finance" label="Financial Overview" value={money(metrics.expenseTotal)} detail="Expense and finance overview" action="Click to view finance" tone="bg-[#7f8c8d]" icon={ReceiptText} />
        <DashboardTile href="/notifications" label="Notification Center" value={alerts.length.toLocaleString()} detail="Smart system alerts" action="Click to open alerts" tone="bg-[#2c3e50]" icon={BellRing} />
      </section>

      <section className="mt-7 border border-[#d7dde8] border-l-4 border-l-emerald-500 bg-white shadow-sm">
        <PanelHeader icon={Headphones} title="Need Help?" />
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#06152d]">Have questions or running into issues?</p>
            <p className="mt-1 text-sm text-slate-600">Check alerts and notifications for stock, debt, supplier, and sales issues.</p>
          </div>
          <Link href="/notifications" className="inline-flex h-12 items-center justify-center gap-2 bg-[#0ec786] px-6 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-[#0aae74]">
            <BellRing size={17} /> Open Alert Center
          </Link>
        </div>
      </section>

      <div className="mt-7 grid gap-7 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="border border-[#d7dde8] bg-white">
          <PanelHeader icon={BarChart3} title="Overview Chart" />
          <p className="border-b border-[#d7dde8] px-4 py-3 text-sm text-slate-700">
            Stock overview including daily sales, monthly sales, customer debts, supplier payments, and current stock value by price.
          </p>
          <div className="h-80 px-7 py-6">
            <div className="flex h-full items-end gap-8 border-b border-l border-[#d7dde8] px-5 pb-8">
              {chartBars.map((item) => (
                <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-3">
                  <div className={`${item.color} mx-auto w-full max-w-[150px] shadow-inner`} style={{ height: `${Math.max(6, (item.value / chartMax) * 100)}%` }} />
                  <div className="text-center">
                    <p className="text-xs font-black uppercase text-slate-500">{item.label}</p>
                    <p className="text-sm font-black text-[#06152d]">{money(item.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border border-[#d7dde8] bg-white">
          <PanelHeader icon={Database} title="Inventory Snapshot" />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {[
              ["Inventory Value", moneyWithDecimals(metrics.inventoryValue)],
              ["Units In Stock", metrics.totalUnits.toLocaleString()],
              ["Categories", categories.length.toLocaleString()],
              ["Low Stock", metrics.lowStockCount.toLocaleString()]
            ].map(([label, value]) => (
              <div key={label} className="border border-[#d7dde8] bg-[#f8fafc] p-5">
                <p className="text-xs font-black uppercase text-slate-500">{label}</p>
                <p className="mt-4 text-xl font-black text-[#06152d]">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Recent Transactions">
          {recentSales.length === 0 ? (
            <Link href="/sales" className="block border border-dashed border-slate-300 p-8 text-center transition hover:bg-blue-50">
              <p className="font-black">No transactions yet</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Sales recorded in POS will appear here immediately.</p>
            </Link>
          ) : (
            <DataTable
              headers={["Invoice", "Customer", "Items", "Amount", "Paid", "Status", "Date"]}
              rowHrefs={recentSales.map(() => "/sales")}
              rows={recentSales.map((sale) => [
                sale.id,
                sale.customer,
                sale.product,
                money(sale.total),
                money(sale.paid),
                <Badge key={sale.id} tone={sale.status === "Paid" ? "success" : sale.status === "Partial" ? "warning" : "danger"}>{sale.status}</Badge>,
                shortDate(sale.date)
              ])}
            />
          )}
        </Panel>

        <Panel title="Notification Center">
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <Link href="/notifications" className="block border border-dashed border-slate-300 p-6 text-center transition hover:bg-blue-50">
                <BellRing className="mx-auto text-slate-400" size={32} />
                <p className="mt-3 font-black">No critical alerts</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">PayTrack will notify you when stock, debt, or supplier events need attention.</p>
              </Link>
            ) : alerts.slice(0, 8).map((item) => (
              <Link key={item.id} href={item.href} className="flex items-start gap-3 border border-slate-200 p-3 transition hover:bg-blue-50">
                <AlertTriangle className={item.priority === "High" ? "text-red-600" : "text-amber-500"} size={18} />
                <div className="flex-1">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.message}</p>
                </div>
                <ArrowUpRight size={16} className="text-slate-400" />
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
