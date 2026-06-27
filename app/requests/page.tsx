"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, DataTable, PageHeader, Panel, StatCard } from "@/components/ui";
import { Notice, type NoticeState } from "@/components/notice";
import { deleteCustomerRequest, saveCustomerRequest, type CustomerRequestInput } from "@/lib/business-store";
import { useBusinessData } from "@/lib/use-business-data";
import { shortDate } from "@/lib/utils";
import { ClipboardList, Plus, Trash2 } from "lucide-react";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const emptyRequest: CustomerRequestInput = {
  productName: "",
  quantity: 1,
  customerName: "",
  dateRequested: today(),
  notes: "",
  status: "Open"
};

export default function CustomerRequestsPage() {
  const { customerRequests } = useBusinessData();
  const [form, setForm] = useState<CustomerRequestInput>(emptyRequest);
  const [notice, setNotice] = useState<NoticeState>(null);
  const openRequests = customerRequests.filter((request) => request.status === "Open");

  const updateForm = <K extends keyof CustomerRequestInput>(key: K, value: CustomerRequestInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = () => {
    try {
      const request = saveCustomerRequest(form);
      setNotice({ type: "success", message: `${request.productName} request saved.` });
      setForm(emptyRequest);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to save request." });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Customer Request Log"
        description="Track products customers ask for when items are unavailable, then use the list when restocking from suppliers."
      />
      <Notice notice={notice} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open Requests" value={String(openRequests.length)} />
        <StatCard label="Total Requests" value={String(customerRequests.length)} />
        <StatCard label="Items Requested" value={String(customerRequests.reduce((sum, request) => sum + request.quantity, 0))} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel title={form.id ? "Edit Request" : "New Request"}>
          <div className="grid gap-3">
            <label className="text-sm font-bold">Product Name
              <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.productName} onChange={(event) => updateForm("productName", event.target.value)} placeholder="Example: matte lipstick shade 24" />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-bold">Quantity Requested
                <input type="number" min={1} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.quantity} onChange={(event) => updateForm("quantity", Number(event.target.value))} />
              </label>
              <label className="text-sm font-bold">Date Requested
                <input type="date" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.dateRequested} onChange={(event) => updateForm("dateRequested", event.target.value)} />
              </label>
            </div>
            <label className="text-sm font-bold">Customer Name <span className="text-slate-400">(Optional)</span>
              <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.customerName ?? ""} onChange={(event) => updateForm("customerName", event.target.value)} />
            </label>
            <label className="text-sm font-bold">Status
              <select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" value={form.status} onChange={(event) => updateForm("status", event.target.value as CustomerRequestInput["status"])}>
                <option>Open</option>
                <option>Sourced</option>
                <option>Closed</option>
              </select>
            </label>
            <label className="text-sm font-bold">Notes
              <textarea className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 p-3 dark:border-slate-700 dark:bg-slate-950" value={form.notes ?? ""} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Shade, brand, size, supplier hint, or customer preference" />
            </label>
            <Button onClick={save}><Plus size={16} /> Save Request</Button>
          </div>
        </Panel>

        <Panel title="Request Records">
          {customerRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
              <ClipboardList className="mx-auto text-slate-400" size={36} />
              <p className="mt-3 font-black">No customer requests yet</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Record unavailable products here so restocking decisions are easier.</p>
            </div>
          ) : (
            <DataTable
              headers={["Product", "Qty", "Customer", "Date", "Status", "Notes", "Actions"]}
              rows={customerRequests.map((request) => [
                <button key={`${request.id}-edit`} className="font-black text-brand-700 hover:underline dark:text-brand-100" onClick={() => setForm(request)}>{request.productName}</button>,
                request.quantity.toLocaleString(),
                request.customerName || "Walk-in / Unknown",
                shortDate(request.dateRequested),
                <Badge key={`${request.id}-status`} tone={request.status === "Open" ? "warning" : request.status === "Sourced" ? "success" : "default"}>{request.status}</Badge>,
                request.notes || "-",
                <Button key={`${request.id}-delete`} className="h-8 bg-red-600 px-3 hover:bg-red-700" onClick={() => deleteCustomerRequest(request.id)}><Trash2 size={14} /> Delete</Button>
              ])}
            />
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
