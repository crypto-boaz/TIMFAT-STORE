"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, PageHeader, Panel, StatCard } from "@/components/ui";
import { Notice, type NoticeState } from "@/components/notice";
import {
  deleteProduct,
  getLastBackendSyncError,
  saveCategory,
  saveProduct,
  saveProductToBackend,
  type ProductInput
} from "@/lib/business-store";
import { useBusinessData } from "@/lib/use-business-data";
import type { Product } from "@/lib/data";
import { cn, money } from "@/lib/utils";
import { Edit3, EyeOff, Filter, PackageSearch, Save, Search, Tags, X } from "lucide-react";

const HIDDEN_CATEGORIES_KEY = "paytrack_hidden_inventory_categories_v1";

type Tab = "products" | "categories";

function emptyProduct(category = ""): ProductInput {
  return {
    serialCode: "",
    name: "",
    description: "",
    category,
    quantity: 0,
    unitPrice: 0,
    costPrice: 0,
    supplier: "",
    lowStockAt: 2
  };
}

function productToInput(product: Product): ProductInput {
  return {
    id: product.id,
    serialCode: product.serialCode,
    name: product.name,
    description: product.description ?? "",
    category: product.category,
    quantity: product.quantity,
    unitPrice: product.unitPrice,
    costPrice: product.costPrice,
    supplier: product.supplier,
    lowStockAt: product.lowStockAt,
    dateAdded: product.dateAdded
  };
}

function statusTone(product: Product) {
  if (product.quantity <= 0) return "danger";
  if (product.quantity <= product.lowStockAt) return "warning";
  return "success";
}

function statusLabel(product: Product) {
  if (product.quantity <= 0) return "Out";
  if (product.quantity <= product.lowStockAt) return "Low";
  return "OK";
}

function readHiddenCategories() {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(HIDDEN_CATEGORIES_KEY);
    return value ? JSON.parse(value) as string[] : [];
  } catch {
    return [];
  }
}

export default function InventoryControlPage() {
  const { products, categories } = useBusinessData();
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductInput | null>(null);
  const [editingCategory, setEditingCategory] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHiddenCategories(readHiddenCategories());
  }, []);

  const categoryStats = useMemo(() => categories.map((category) => {
    const categoryProducts = products.filter((product) => product.category === category);
    return {
      name: category,
      hidden: hiddenCategories.includes(category),
      products: categoryProducts.length,
      quantity: categoryProducts.reduce((sum, product) => sum + product.quantity, 0),
      value: categoryProducts.reduce((sum, product) => sum + product.quantity * product.unitPrice, 0)
    };
  }).sort((a, b) => Number(a.hidden) - Number(b.hidden) || b.products - a.products || a.name.localeCompare(b.name)), [categories, hiddenCategories, products]);

  const visibleProducts = useMemo(() => {
    const value = query.trim().toLowerCase();
    return products
      .filter((product) => showHidden || !hiddenCategories.includes(product.category))
      .filter((product) => !categoryFilter || product.category === categoryFilter)
      .filter((product) => !value || [product.name, product.serialCode, product.category].some((field) => field.toLowerCase().includes(value)))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [categoryFilter, hiddenCategories, products, query, showHidden]);

  const lowStockCount = useMemo(() => products.filter((product) => product.quantity <= product.lowStockAt).length, [products]);
  const hiddenProductCount = useMemo(() => products.filter((product) => hiddenCategories.includes(product.category)).length, [hiddenCategories, products]);

  const persistHiddenCategories = (next: string[]) => {
    setHiddenCategories(next);
    window.localStorage.setItem(HIDDEN_CATEGORIES_KEY, JSON.stringify(next));
  };

  const toggleCategoryHidden = (category: string) => {
    const next = hiddenCategories.includes(category)
      ? hiddenCategories.filter((item) => item !== category)
      : [...hiddenCategories, category];
    persistHiddenCategories(next);
    setNotice({ type: "success", message: `${category} is now ${next.includes(category) ? "hidden" : "visible"} on Inventory Control.` });
  };

  const startRenameCategory = (category: string) => {
    setEditingCategory(category);
    setCategoryName(category);
  };

  const handleRenameCategory = () => {
    try {
      const saved = saveCategory(categoryName, editingCategory);
      const nextHidden = hiddenCategories.map((category) => category === editingCategory ? saved : category);
      persistHiddenCategories(nextHidden);
      setNotice({ type: "success", message: `${editingCategory} renamed to ${saved}.` });
      setEditingCategory("");
      setCategoryName("");
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to rename category." });
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(productToInput(product));
    setActiveTab("products");
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || saving) return;
    setSaving(true);
    try {
      const product = saveProduct(editingProduct);
      const synced = await saveProductToBackend(product);
      setNotice(synced
        ? { type: "success", message: `${product.name} saved.` }
        : { type: "error", message: getLastBackendSyncError() || `${product.name} saved locally, but backend sync failed.` });
      setEditingProduct(null);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to save product." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    if (!window.confirm(`Delete ${product.name} from inventory?`)) return;
    deleteProduct(product.id);
    setNotice({ type: "success", message: `${product.name} deleted locally and queued for backend sync.` });
  };

  const updateProductForm = (key: keyof ProductInput, value: string | number) => {
    setEditingProduct((current) => current ? { ...current, [key]: value } : current);
  };

  return (
    <AppShell>
      <PageHeader
        title="Inventory Control"
        description="Search all products, control stock records, and clean up categories without cluttering the main inventory workflow."
      />
      <Notice notice={notice} />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Products" value={String(products.length)} detail={`${visibleProducts.length.toLocaleString()} currently shown`} />
        <StatCard label="Categories" value={String(categories.length)} detail={`${hiddenCategories.length.toLocaleString()} hidden here`} />
        <StatCard label="Low Stock" value={String(lowStockCount)} tone={lowStockCount ? "warning" : "success"} />
        <StatCard label="Hidden Products" value={String(hiddenProductCount)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {[
          { id: "products" as const, label: "Product Inventory", icon: PackageSearch },
          { id: "categories" as const, label: "Category Management", icon: Tags }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-black transition",
                activeTab === item.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
              )}
            >
              <Icon size={16} /> {item.label}
            </button>
          );
        })}
      </div>

      {activeTab === "products" ? (
        <Panel title="Product Inventory" className="mt-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_240px_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Search by name, barcode, or category"
              />
            </label>
            <label className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-black outline-none dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">All categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <Button
              className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
              onClick={() => setShowHidden((value) => !value)}
            >
              <EyeOff size={16} /> {showHidden ? "Hide Hidden" : "Show Hidden"}
            </Button>
          </div>

          {editingProduct && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Edit Product</h3>
                <button type="button" onClick={() => setEditingProduct(null)} className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900" aria-label="Close editor">
                  <X size={16} />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm font-bold">Name<input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" value={editingProduct.name} onChange={(event) => updateProductForm("name", event.target.value)} /></label>
                <label className="text-sm font-bold">Barcode<input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" value={editingProduct.serialCode} onChange={(event) => updateProductForm("serialCode", event.target.value)} /></label>
                <label className="text-sm font-bold">Category<select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" value={editingProduct.category} onChange={(event) => updateProductForm("category", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label className="text-sm font-bold">Quantity<input type="number" min={0} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" value={editingProduct.quantity} onChange={(event) => updateProductForm("quantity", Number(event.target.value))} /></label>
                <label className="text-sm font-bold">Selling Price<input type="number" min={0} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" value={editingProduct.unitPrice} onChange={(event) => updateProductForm("unitPrice", Number(event.target.value))} /></label>
                <label className="text-sm font-bold">Low Stock<input type="number" min={0} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900" value={editingProduct.lowStockAt} onChange={(event) => updateProductForm("lowStockAt", Number(event.target.value))} /></label>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleSaveProduct} disabled={saving}><Save size={16} /> {saving ? "Saving..." : "Save Product"}</Button>
              </div>
            </div>
          )}

          <div className="mt-5 max-h-[68vh] overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  {["Product", "Barcode", "Category", "Qty", "Price", "Status", "Actions"].map((header) => (
                    <th key={header} className="px-4 py-3 font-black">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleProducts.map((product) => (
                  <tr key={product.id} className="bg-white odd:bg-slate-50/70 hover:bg-brand-50/70 dark:bg-slate-900 dark:odd:bg-slate-950/50 dark:hover:bg-slate-800">
                    <td className="max-w-[320px] px-4 py-3 font-black text-slate-900 dark:text-white">{product.name}</td>
                    <td className="px-4 py-3 font-semibold text-slate-500">{product.serialCode || "No barcode"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-black ring-1", hiddenCategories.includes(product.category) ? "bg-slate-200 text-slate-500 ring-slate-300 dark:bg-slate-800 dark:ring-slate-700" : "bg-brand-50 text-brand-700 ring-brand-100 dark:bg-brand-950 dark:text-brand-100 dark:ring-brand-900")}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black">{product.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 font-black">{product.unitPrice ? money(product.unitPrice) : "Not set"}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(product)}>{statusLabel(product)}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button className="h-8 px-3" onClick={() => startEditProduct(product)}><Edit3 size={14} /> Edit</Button>
                        <Button className="h-8 bg-red-600 px-3 hover:bg-red-700" onClick={() => handleDeleteProduct(product)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <Panel title="Category Management" className="mt-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-600/10 dark:border-slate-700 dark:bg-slate-950"
              placeholder={editingCategory ? `Rename ${editingCategory}` : "Select a category to rename"}
            />
            <Button onClick={handleRenameCategory} disabled={!editingCategory}><Save size={16} /> Rename Category</Button>
          </div>

          <div className="mt-5 max-h-[70vh] overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  {["Category", "Products", "Units", "Sales Value", "Visibility", "Actions"].map((header) => (
                    <th key={header} className="px-4 py-3 font-black">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {categoryStats.map((category) => (
                  <tr key={category.name} className="bg-white odd:bg-slate-50/70 dark:bg-slate-900 dark:odd:bg-slate-950/50">
                    <td className="px-4 py-3 font-black text-slate-900 dark:text-white">{category.name}</td>
                    <td className="px-4 py-3 font-black">{category.products.toLocaleString()}</td>
                    <td className="px-4 py-3 font-black">{category.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 font-black">{money(category.value)}</td>
                    <td className="px-4 py-3"><Badge tone={category.hidden ? "warning" : "success"}>{category.hidden ? "Hidden" : "Visible"}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button className="h-8 px-3" onClick={() => startRenameCategory(category.name)}><Edit3 size={14} /> Rename</Button>
                        <Button className="h-8 bg-white px-3 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" onClick={() => toggleCategoryHidden(category.name)}>
                          <EyeOff size={14} /> {category.hidden ? "Show" : "Hide"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </AppShell>
  );
}
