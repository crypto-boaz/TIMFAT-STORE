"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, DataTable, PageHeader, Panel, StatCard } from "@/components/ui";
import { Notice, type NoticeState } from "@/components/notice";
import { saveSupplier, type SupplierInput } from "@/lib/business-store";
import { useBusinessData } from "@/lib/use-business-data";
import { money, shortDate } from "@/lib/utils";
import { Edit3, Plus, Save, X } from "lucide-react";

function emptySupplier(): SupplierInput {
  return {
    name: "",
    contact: "",
    email: "",
    address: "",
    product: "",
    quantity: 0,
    costPrice: 0,
    paid: 0,
    deliveryDate: new Date().toISOString().slice(0, 10)
  };
}

export default function SuppliersPage() {
  const { suppliers } = useBusinessData();
  const [notice, setNotice] = useState<NoticeState>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SupplierInput>(emptySupplier);
  const payable = suppliers.reduce((sum, supplier) => sum + (supplier.total - supplier.paid), 0);

  const submitSupplier = () => {
    try {
      const supplier = saveSupplier(form);
      setNotice({ type: "success", message: `${supplier.name} was saved successfully.` });
      setForm(emptySupplier());
      setShowForm(false);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to save supplier." });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Supplier Management"
        description="Manage suppliers, deliveries, contact details, payment history, and outstanding balances."
        action={<Button onClick={() => { setForm(emptySupplier()); setShowForm(true); }}><Plus size={16} /> Add Supplier</Button>}
      />
      <Notice notice={notice} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active Suppliers" value={String(suppliers.length)} />
        <StatCard label="Supplier Payables" value={payable} tone="warning" />
        <StatCard label="Deliveries This Month" value={String(suppliers.length)} tone="success" />
      </div>

      {showForm && (
        <Panel title={form.id ? "Edit Supplier" : "Add Supplier"} className="mt-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm font-bold">Supplier Name<input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className="text-sm font-bold">Contact<input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} /></label>
            <label className="text-sm font-bold">Email<input type="email" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.email ?? ""} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label className="text-sm font-bold">Product Supplied<input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} /></label>
            <label className="text-sm font-bold">Quantity<input type="number" min={0} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} /></label>
            <label className="text-sm font-bold">Cost Price<input type="number" min={0} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: Number(event.target.value) })} /></label>
            <label className="text-sm font-bold">Amount Paid<input type="number" min={0} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.paid} onChange={(event) => setForm({ ...form, paid: Number(event.target.value) })} /></label>
            <label className="text-sm font-bold">Delivery Date<input type="date" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.deliveryDate} onChange={(event) => setForm({ ...form, deliveryDate: event.target.value })} /></label>
            <label className="text-sm font-bold md:col-span-2 xl:col-span-4">Address<textarea className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 p-3 dark:border-slate-700 dark:bg-slate-950" value={form.address ?? ""} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={submitSupplier}><Save size={16} /> Save Supplier</Button>
            <Button className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" onClick={() => setShowForm(false)}><X size={16} /> Cancel</Button>
          </div>
        </Panel>
      )}

      <Panel title="Supplier Deliveries" className="mt-6">
        <DataTable
          headers={["Supplier", "Contact", "Product Supplied", "Qty", "Cost Price", "Total", "Paid", "Remaining", "Delivery", "Status", "Edit"]}
          rows={suppliers.map((supplier) => [
            supplier.name,
            supplier.contact,
            supplier.product,
            supplier.quantity.toLocaleString(),
            money(supplier.costPrice),
            money(supplier.total),
            money(supplier.paid),
            money(supplier.total - supplier.paid),
            shortDate(supplier.deliveryDate),
            <Badge key={supplier.id} tone={supplier.total === supplier.paid ? "success" : "warning"}>{supplier.total === supplier.paid ? "Settled" : "Pending"}</Badge>,
            <Button key={`${supplier.id}-edit`} className="h-8 bg-slate-900 px-3 dark:bg-slate-700" onClick={() => { setForm(supplier); setShowForm(true); }}><Edit3 size={15} /> Edit</Button>
          ])}
        />
      </Panel>
    </AppShell>
  );
}

