"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Dices, PackagePlus, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Notice, type NoticeState } from "@/components/notice";
import { Button } from "@/components/ui";
import {
  getLastBackendSyncError,
  saveProduct,
  saveProductToBackend,
  type ProductInput
} from "@/lib/business-store";
import { PRODUCT_CATEGORIES } from "@/lib/product-categories";
import { generateNumericBarcode } from "@/lib/barcode";
import { productSlug } from "@/lib/product-slug";
import { useBusinessData } from "@/lib/use-business-data";

function emptyProduct(category = ""): ProductInput {
  return {
    serialCode: "",
    name: "",
    slug: "",
    description: "",
    category,
    quantity: 0,
    unitPrice: 0,
    costPrice: 0,
    supplier: "",
    lowStockAt: 0
  };
}

export default function AddProductPage() {
  const { categories, products } = useBusinessData();
  const [form, setForm] = useState<ProductInput>(() => emptyProduct());
  const [notice, setNotice] = useState<NoticeState>(null);
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const categoryOptions = useMemo(
    () => Array.from(new Set([
      ...PRODUCT_CATEGORIES,
      ...categories,
      ...products.map((product) => product.category).filter(Boolean)
    ])).sort(),
    [categories, products]
  );

  const updateForm = (key: keyof ProductInput, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveAndContinue = async () => {
    if (saving) return;
    setSaving(true);
    setNotice(null);
    try {
      if (form.lowStockAt <= 0) {
        throw new Error("Low stock level is required. Enter a value greater than zero.");
      }
      const product = saveProduct(form);
      const synced = await saveProductToBackend(product);
      if (!synced) {
        const reason = getLastBackendSyncError();
        setNotice({
          type: "error",
          message: `${product.name} was saved locally, but it did not reach the backend. ${reason || "Check the API connection and try again."}`
        });
        return;
      }

      setNotice({ type: "success", message: `${product.name} saved. You can add the next product now.` });
      setForm(emptyProduct(product.category));
      window.setTimeout(() => nameInputRef.current?.focus(), 0);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to save product." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <Notice notice={notice} />
      <section className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">Inventory</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Add Products</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Save one product after another without leaving this page.</p>
          </div>
          <Link href="/inventory" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50">
            <ArrowLeft size={16} /> Product List
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <span className="grid size-11 place-items-center rounded-xl bg-blue-600 text-white">
              <PackagePlus size={21} />
            </span>
            <div>
              <h2 className="font-black text-slate-950 dark:text-white">New Product</h2>
              <p className="text-xs font-semibold text-slate-500">Fields reset after every successful save; the selected category remains for convenience.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Product Name
              <input ref={nameInputRef} autoFocus className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 uppercase outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950" value={form.name} onChange={(event) => {
                const name = event.target.value.toUpperCase();
                setForm((current) => ({ ...current, name, slug: productSlug(name) }));
              }} />
            </label>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Barcode
              <span className="mt-1 flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white dark:border-slate-700 dark:bg-slate-950">
                <input inputMode="numeric" maxLength={10} className="h-11 min-w-0 flex-1 bg-transparent px-3 outline-none" value={form.serialCode} onChange={(event) => updateForm("serialCode", event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Up to 10 digits" />
                <button type="button" onClick={() => updateForm("serialCode", generateNumericBarcode(products.map((product) => product.serialCode)))} className="grid w-11 place-items-center border-l border-slate-200 text-blue-600 transition hover:bg-blue-50 dark:border-slate-700" title="Generate a unique 10-digit barcode" aria-label="Generate barcode">
                  <Dices size={17} />
                </button>
              </span>
            </label>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Slug
              <input disabled className="mt-1 h-11 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 lowercase text-slate-500 opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400" value={form.slug ?? ""} placeholder="Generated from product name" />
            </label>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Category
              <select className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950" value={form.category} onChange={(event) => updateForm("category", event.target.value)}>
                <option value="">Select category</option>
                {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Quantity
              <input type="number" min={0} className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950" value={form.quantity === 0 ? "" : form.quantity} onChange={(event) => updateForm("quantity", event.target.value === "" ? 0 : Number(event.target.value))} />
            </label>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Selling Price
              <input type="number" min={0} placeholder="Enter selling price" className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950" value={form.unitPrice === 0 ? "" : form.unitPrice} onChange={(event) => updateForm("unitPrice", event.target.value === "" ? 0 : Number(event.target.value))} />
            </label>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Cost Price
              <input type="number" min={0} placeholder="Enter cost price" className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950" value={form.costPrice === 0 ? "" : form.costPrice} onChange={(event) => updateForm("costPrice", event.target.value === "" ? 0 : Number(event.target.value))} />
            </label>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Low Stock Level
              <input type="number" min={1} placeholder="Enter low stock level" className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950" value={form.lowStockAt === 0 ? "" : form.lowStockAt} onChange={(event) => updateForm("lowStockAt", event.target.value === "" ? 0 : Number(event.target.value))} />
            </label>
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 md:col-span-2 xl:col-span-4">
              Description
              <textarea className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950" value={form.description ?? ""} onChange={(event) => updateForm("description", event.target.value)} />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button className="rounded-lg bg-blue-600 px-6 hover:bg-blue-700" onClick={saveAndContinue} disabled={saving}>
              <Plus size={16} /> {saving ? "Saving..." : "Save & Add Another"}
            </Button>
            <span className="text-xs font-semibold text-slate-500">You will remain on this page after saving.</span>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
