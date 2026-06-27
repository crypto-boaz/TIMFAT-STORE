"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, DataTable, PageHeader, Panel, StatCard } from "@/components/ui";
import { Notice, type NoticeState } from "@/components/notice";
import { addDebtRecord, deleteDebtRecord, type DebtRecordInput } from "@/lib/business-store";
import { useBusinessData } from "@/lib/use-business-data";
import { downloadCsv, money, shortDate } from "@/lib/utils";
import { AlertTriangle, Download, FileText, Plus, Save, Trash2, X } from "lucide-react";

export default function DebtsPage() {
  const { debts } = useBusinessData();
  const [notice, setNotice] = useState<NoticeState>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DebtRecordInput>({
    customer: "",
    product: "",
    quantity: 1,
    total: 0,
    paid: 0,
    dueDate: new Date().toISOString().slice(0, 10)
  });

  const outstanding = debts.reduce((sum, debt) => sum + (debt.total - debt.paid), 0);
  const overdue = debts.filter((debt) => debt.status === "Overdue");
  const dueToday = debts.filter((debt) => debt.status !== "Settled" && debt.dueDate === new Date().toISOString().slice(0, 10));
  const dueAlerts = [...overdue, ...dueToday.filter((debt) => !overdue.some((item) => item.id === debt.id))];
  const collected = debts.reduce((sum, debt) => sum + debt.paymentHistory.reduce((payments, payment) => payments + payment.amount, 0), 0);
  const remainingBalance = Math.max(0, form.total - form.paid);

  const saveRecord = () => {
    try {
      const debt = addDebtRecord(form);
      setNotice({ type: "success", message: `${debt.customer} ledger record added. Remaining balance is ${money(debt.total - debt.paid)}.` });
      setForm({ customer: "", product: "", quantity: 1, total: 0, paid: 0, dueDate: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to add ledger record." });
    }
  };

  const deleteRecord = (debtId: string) => {
    const debt = debts.find((item) => item.id === debtId);
    if (!debt) return;
    if (!window.confirm(`Delete ${debt.customer}'s debt ledger for ${debt.product}?`)) return;
    try {
      const deleted = deleteDebtRecord(debtId);
      setNotice({ type: "success", message: `${deleted.customer}'s debt ledger was deleted.` });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to delete debt ledger." });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Customer Debt Ledger"
        description="Track customer balances, due dates, payment history, status, and transaction statements."
        action={<Button onClick={() => setShowForm((value) => !value)}><Plus size={16} /> Add Record</Button>}
      />
      <Notice notice={notice} />
      {dueAlerts.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-black">Due payment alert</p>
              <p className="mt-1 font-semibold">
                {dueAlerts.map((debt) => `${debt.customer} owes ${money(debt.total - debt.paid)} due ${shortDate(debt.dueDate)}`).join("; ")}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding Balance" value={outstanding} tone="warning" />
        <StatCard label="Overdue Accounts" value={String(overdue.length)} tone="danger" />
        <StatCard label="Collected Payments" value={collected} tone="success" />
      </div>

      {showForm && (
        <Panel title="Add Customer Record" className="mt-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm font-bold">Customer Name<input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} /></label>
            <label className="text-sm font-bold">Product<input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} /></label>
            <label className="text-sm font-bold">Product Quantity<input type="number" min={1} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} /></label>
            <label className="text-sm font-bold">Total Amount<input type="number" min={0} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.total} onChange={(event) => setForm({ ...form, total: Number(event.target.value) })} /></label>
            <label className="text-sm font-bold">Amount Paid<input type="number" min={0} max={form.total} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.paid} onChange={(event) => setForm({ ...form, paid: Number(event.target.value) })} /></label>
            <label className="text-sm font-bold">Due Date<input type="date" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            Remaining balance: {money(remainingBalance)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={saveRecord}><Save size={16} /> Save Record</Button>
            <Button className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" onClick={() => setShowForm(false)}><X size={16} /> Cancel</Button>
          </div>
        </Panel>
      )}

      <Panel title="Debt Records" className="mt-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" onClick={() => downloadCsv("customer-debts.csv", debts)}>
            <Download size={16} /> Export Statement
          </Button>
          <Button className="bg-slate-900 dark:bg-slate-700" onClick={() => window.print()}><FileText size={16} /> Customer Statement</Button>
        </div>
          <DataTable
          headers={["Customer", "Product", "Qty", "Total", "Paid", "Balance", "Due Date", "Status", "Last Payment", "Delete"]}
          rows={debts.map((debt) => [
            debt.customer,
            debt.product,
            debt.quantity ?? "-",
            money(debt.total),
            money(debt.paid),
            money(debt.total - debt.paid),
            shortDate(debt.dueDate),
            <Badge key={debt.id} tone={debt.status === "Settled" ? "success" : debt.status === "Overdue" ? "danger" : "warning"}>{debt.status}</Badge>,
            debt.paymentHistory[0] ? `${money(debt.paymentHistory[0].amount)} on ${shortDate(debt.paymentHistory[0].date)}` : "No payment yet",
            <Button key={`${debt.id}-delete`} className="h-8 bg-red-600 px-3 hover:bg-red-700" onClick={() => deleteRecord(debt.id)}><Trash2 size={15} /> Delete</Button>
          ])}
        />
      </Panel>
    </AppShell>
  );
}
