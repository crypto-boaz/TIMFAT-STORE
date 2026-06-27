"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { buildSmartNotifications, markSmartNotificationsRead } from "@/lib/notifications";
import { useBusinessData } from "@/lib/use-business-data";
import { money, shortDate } from "@/lib/utils";
import { BellRing, ArrowUpRight } from "lucide-react";

export default function NotificationsPage() {
  const data = useBusinessData();
  const alerts = useMemo(() => buildSmartNotifications(data), [data]);
  const alertIdsKey = useMemo(() => alerts.map((item) => item.id).join("|"), [alerts]);

  useEffect(() => {
    markSmartNotificationsRead(alertIdsKey ? alertIdsKey.split("|") : []);
  }, [alertIdsKey]);

  return (
    <AppShell>
      <PageHeader title="Notification Center" description="Automatic alerts for customer debts, supplier payments, low stock, due dates, and customer request activity." />
      <Panel title="Smart Alerts">
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
              <BellRing className="mx-auto text-slate-400" size={38} />
              <p className="mt-3 font-black">No alerts yet</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">The system will create alerts automatically as real activity is recorded.</p>
            </div>
          ) : alerts.map((item) => (
            <Link key={item.id} href={item.href} className="grid gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-brand-50/70 dark:border-slate-800 dark:hover:bg-slate-800/80 md:grid-cols-[42px_1fr_auto] md:items-start">
              <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-100">
                <BellRing size={18} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{item.title}</p>
                  <Badge tone={item.priority === "High" ? "danger" : item.priority === "Medium" ? "warning" : "default"}>{item.priority}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.type} - {item.message}</p>
                <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                  <span>Person/Supplier: {item.person || "N/A"}</span>
                  <span>Product: {item.product || "N/A"}</span>
                  <span>Amount: {typeof item.amount === "number" ? money(item.amount) : "N/A"}</span>
                  <span>Due date: {item.dueDate ? shortDate(item.dueDate) : "N/A"}</span>
                  <span>Status: {item.status || "Active"}</span>
                </div>
              </div>
              <ArrowUpRight className="text-slate-400" size={18} />
            </Link>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
