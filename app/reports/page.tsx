"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, DataTable, PageHeader, Panel, StatCard } from "@/components/ui";
import { useBusinessData } from "@/lib/use-business-data";
import { downloadCsv, money, shortDate } from "@/lib/utils";
import { Download, FileText } from "lucide-react";

type ReportMode = "today" | "yesterday" | "date" | "week" | "month" | "year" | "range";
const SALES_REPORT_PAGE_SIZE = 100;

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function today() {
  return isoDate(new Date());
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function saleDateKey(value: string) {
  const cleanValue = String(value || "").trim();
  const directDate = cleanValue.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (directDate) return directDate;
  const parsed = new Date(cleanValue);
  return Number.isNaN(parsed.getTime()) ? cleanValue : isoDate(parsed);
}

function monthStart(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-01`;
}

function yearStart(value: Date) {
  return `${value.getFullYear()}-01-01`;
}

function weekStart(value: Date) {
  const date = new Date(value);
  date.setDate(date.getDate() - date.getDay());
  return isoDate(date);
}

function labelForMode(mode: ReportMode) {
  const labels: Record<ReportMode, string> = {
    today: "Today's Sales",
    yesterday: "Yesterday's Sales",
    date: "Specific Date",
    week: "This Week",
    month: "This Month",
    year: "This Year",
    range: "Custom Range"
  };
  return labels[mode];
}
export default function ReportsPage() {
  const { sales, products, debts, expenses } = useBusinessData();
  const now = useMemo(() => new Date(), []);
  const todayValue = useMemo(() => today(), []);
  const yesterdayValue = useMemo(() => isoDate(addDays(now, -1)), [now]);
  const [mode, setMode] = useState<ReportMode>("today");
  const [selectedDate, setSelectedDate] = useState(todayValue);
  const [rangeStart, setRangeStart] = useState(monthStart(now));
  const [rangeEnd, setRangeEnd] = useState(todayValue);
  const [page, setPage] = useState(1);

  const period = useMemo(() => {
    if (mode === "today") return { start: todayValue, end: todayValue };
    if (mode === "yesterday") return { start: yesterdayValue, end: yesterdayValue };
    if (mode === "date") return { start: selectedDate, end: selectedDate };
    if (mode === "week") return { start: weekStart(now), end: todayValue };
    if (mode === "month") return { start: monthStart(now), end: todayValue };
    if (mode === "year") return { start: yearStart(now), end: todayValue };
    return rangeStart <= rangeEnd ? { start: rangeStart, end: rangeEnd } : { start: rangeEnd, end: rangeStart };
  }, [mode, now, rangeEnd, rangeStart, selectedDate, todayValue, yesterdayValue]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const date = saleDateKey(sale.date);
      return date >= period.start && date <= period.end;
    });
  }, [period, sales]);

  useEffect(() => {
    setPage(1);
  }, [period.start, period.end, sales.length]);
  const pageCount = Math.max(1, Math.ceil(filteredSales.length / SALES_REPORT_PAGE_SIZE));
  const visibleSales = useMemo(() => {
    const safePage = Math.min(page, pageCount);
    const start = (safePage - 1) * SALES_REPORT_PAGE_SIZE;
    return filteredSales.slice(start, start + SALES_REPORT_PAGE_SIZE);
  }, [filteredSales, page, pageCount]);

  const dailySalesSummary = useMemo(() => {
    const summary = new Map<string, { date: string; transactions: number; quantity: number; revenue: number; collected: number; outstanding: number }>();
    for (const sale of filteredSales) {
      const date = saleDateKey(sale.date);
      const current = summary.get(date) ?? { date, transactions: 0, quantity: 0, revenue: 0, collected: 0, outstanding: 0 };
      current.transactions += 1;
      current.quantity += sale.quantity;
      current.revenue += sale.total;
      current.collected += sale.paid;
      current.outstanding += Math.max(0, sale.total - sale.paid);
      summary.set(date, current);
    }
    return [...summary.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSales]);
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const amountCollected = filteredSales.reduce((sum, sale) => sum + sale.paid, 0);
  const productsSold = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const outstanding = filteredSales.reduce((sum, sale) => sum + Math.max(0, sale.total - sale.paid), 0);

  const inventoryValue = products.reduce((sum, product) => sum + Math.max(0, product.quantity) * product.costPrice, 0);
  const reports = [
    { title: "Sales History", rows: filteredSales },
    { title: "Inventory", rows: products },
    { title: "Customer Debts", rows: debts },
    { title: "Expenses", rows: expenses }
  ];

  return (
    <AppShell>
      <PageHeader title="Sales History & Reports" description="Review completed sales by day, week, month, year, or a custom date range." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Revenue" value={totalRevenue} tone="success" />
        <StatCard label="Transactions" value={String(filteredSales.length)} />
        <StatCard label="Products Sold" value={String(productsSold)} />
        <StatCard label="Amount Collected" value={amountCollected} tone="success" />
        <StatCard label="Outstanding" value={outstanding} tone={outstanding ? "warning" : "success"} />
      </div>

      <Panel title="Report Filters" className="mt-6">
        <div className="flex flex-wrap gap-2">
          {(["today", "yesterday", "date", "week", "month", "year", "range"] as ReportMode[]).map((item) => (
            <Button
              key={item}
              onClick={() => setMode(item)}
              className={mode === item ? "" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"}
            >
              {labelForMode(item)}
            </Button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm font-bold">Specific Date
            <input type="date" value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setMode("date"); }} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <label className="text-sm font-bold">From
            <input type="date" value={rangeStart} onChange={(event) => { setRangeStart(event.target.value); setMode("range"); }} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" />
          </label>
          <label className="text-sm font-bold">To
            <input type="date" value={rangeEnd} onChange={(event) => { setRangeEnd(event.target.value); setMode("range"); }} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" />
          </label>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
          Showing {labelForMode(mode).toLowerCase()} from {shortDate(period.start)} to {shortDate(period.end)}.
        </p>
      </Panel>

      <Panel title="Daily Sales Summary" className="mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Daily totals from {shortDate(period.start)} to {shortDate(period.end)}.
          </p>
          <Button className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" onClick={() => downloadCsv("daily-sales-summary.csv", dailySalesSummary)}>
            <Download size={16} /> CSV
          </Button>
        </div>
        {dailySalesSummary.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
            <p className="font-black">No daily sales total yet</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Record sales, then use Today, Yesterday, or a date range to review daily amounts.</p>
          </div>
        ) : (
          <DataTable
            headers={["Date", "Transactions", "Qty Sold", "Sales Total", "Amount Collected", "Outstanding"]}
            rows={dailySalesSummary.map((day) => [
              shortDate(day.date),
              day.transactions.toLocaleString(),
              day.quantity.toLocaleString(),
              money(day.revenue),
              money(day.collected),
              money(day.outstanding)
            ])}
          />
        )}
      </Panel>
      <Panel title="Completed Sales" className="mt-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button onClick={() => window.print()}><FileText size={16} /> PDF</Button>
          <Button className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" onClick={() => downloadCsv("sales-report.csv", filteredSales)}>
            <Download size={16} /> CSV
          </Button>
        </div>
        {filteredSales.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="font-black">No sales found</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Completed sales for the selected period will appear here.</p>
          </div>
        ) : (
          <DataTable
            headers={["Invoice", "Customer", "Products", "Qty", "Total", "Paid", "Balance", "Method", "Status", "Date"]}
            rows={visibleSales.map((sale) => [
              sale.id,
              sale.customer,
              sale.product,
              sale.quantity,
              money(sale.total),
              money(sale.paid),
              money(Math.max(0, sale.total - sale.paid)),
              sale.method,
              <Badge key={sale.id} tone={sale.status === "Paid" ? "success" : sale.status === "Partial" ? "warning" : "danger"}>{sale.status}</Badge>,
              shortDate(sale.date)
            ])}
          />
        )}
        {filteredSales.length > SALES_REPORT_PAGE_SIZE && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
            <span>Showing {visibleSales.length.toLocaleString()} of {filteredSales.length.toLocaleString()} sales</span>
            <div className="flex items-center gap-2">
              <Button className="h-9 bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
              <span>Page {Math.min(page, pageCount).toLocaleString()} of {pageCount.toLocaleString()}</span>
              <Button className="h-9 bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</Button>
            </div>
          </div>
        )}
      </Panel>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Inventory Value" value={inventoryValue} tone="success" />
        {reports.map((report) => (
          <Panel key={report.title} title={report.title}>
            <p className="mb-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{report.rows.length.toLocaleString()} rows available.</p>
            <Button className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" onClick={() => downloadCsv(`${report.title.toLowerCase().replaceAll(" ", "-")}.csv`, report.rows)}>
              <Download size={16} /> CSV
            </Button>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
