"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, DataTable, PageHeader, Panel, StatCard } from "@/components/ui";
import { Notice, type NoticeState } from "@/components/notice";
import { addExpense, type ExpenseInput } from "@/lib/business-store";
import { useBusinessData } from "@/lib/use-business-data";
import { revenueSeries, type Expense } from "@/lib/data";
import { money, shortDate } from "@/lib/utils";
import { Plus, X } from "lucide-react";

const categories: Expense["category"][] = ["Transport", "Fuel", "Salaries", "Repairs", "Warehouse", "Utilities"];
const FinanceTrendChart = dynamic(
  () => import("@/components/finance-trend-chart").then((module) => module.FinanceTrendChart),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-950" />
  }
);

export default function FinancePage() {
  const { expenses } = useBusinessData();
  const [notice, setNotice] = useState<NoticeState>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExpenseInput>({
    category: "Transport",
    description: "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10)
  });
  const clearedFinanceValue = 0;

  const saveExpense = () => {
    try {
      const expense = addExpense(form);
      setNotice({ type: "success", message: `${expense.description} was saved to the expense register.` });
      setForm({ category: "Transport", description: "", amount: 0, date: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to add expense." });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Financial Management"
        description="Track daily income, expense categories, cash flow, profit calculation, and monthly summaries."
        action={<Button onClick={() => setShowForm((value) => !value)}><Plus size={16} /> Add Expense</Button>}
      />
      <Notice notice={notice} />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Daily Income" value={clearedFinanceValue} tone="success" />
        <StatCard label="Daily Expenses" value={clearedFinanceValue} tone="danger" />
        <StatCard label="Monthly Expenses" value={clearedFinanceValue} />
        <StatCard label="Net Profit" value={clearedFinanceValue} tone="success" />
      </div>

      {showForm && (
        <Panel title="Add Expense" className="mt-6">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm font-bold">Category<select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as Expense["category"] })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="text-sm font-bold md:col-span-2">Description<input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label className="text-sm font-bold">Amount<input type="number" min={0} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} /></label>
            <label className="text-sm font-bold">Date<input type="date" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={saveExpense}><Plus size={16} /> Save Expense</Button>
            <Button className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" onClick={() => setShowForm(false)}><X size={16} /> Cancel</Button>
          </div>
        </Panel>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Profit/Loss Trend">
          <div className="h-80">
            <FinanceTrendChart data={revenueSeries} />
          </div>
        </Panel>
        <Panel title="Expense Register">
          <DataTable
            headers={["Date", "Category", "Description", "Amount"]}
            rows={expenses.map((expense) => [
              shortDate(expense.date),
              <Badge key={expense.id}>{expense.category}</Badge>,
              expense.description,
              money(expense.amount)
            ])}
          />
        </Panel>
      </div>
    </AppShell>
  );
}
