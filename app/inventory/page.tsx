"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button } from "@/components/ui";
import { Notice, type NoticeState } from "@/components/notice";
import { ProductQr } from "@/components/product-qr";
import {
  addToCart,
  fetchProductHistory,
  saveProductToBackend,
  saveProductsToBackend,
  getLastBackendSyncError,
  saveProduct,
  type ProductInput
} from "@/lib/business-store";
import { useBusinessData } from "@/lib/use-business-data";
import { PRODUCT_CATEGORIES } from "@/lib/product-categories";
import { generateNumericBarcode } from "@/lib/barcode";
import { productSlug } from "@/lib/product-slug";
import { cn, downloadCsv, money, shortDate } from "@/lib/utils";
import { Check, Dices, Download, Edit3, Eye, FileSpreadsheet, Grid2X2, List, PackageSearch, Plus, Search, ShoppingCart, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/data";

function priceDisplay(value: number) {
  return value > 0 ? money(value) : "Not set";
}

function quantityDisplay(value: number) {
  return value > 0 ? value.toLocaleString() : "";
}

type ExcelRow = Record<string, unknown>;

const excelColumnAliases = {
  name: ["productname", "product", "name", "item", "itemname"],
  barcode: ["barcode", "bar code", "serialcode", "serial code", "sku", "code"],
  quantity: ["qty", "quantity", "stock", "stockquantity", "stock quantity"],
  sellingPrice: ["sellingprice", "selling price", "unitprice", "unit price", "price", "amount"],
  costPrice: ["costprice", "cost price", "buyingprice", "buying price", "purchaseprice", "purchase price"],
  category: ["category", "productcategory", "product category"],
  slug: ["slug", "productslug", "product slug"],
  supplier: ["supplier", "suppliername", "supplier name"],
  description: ["description", "details", "note", "notes"],
  lowStockAt: ["lowstockat", "low stock at", "lowstock", "low stock", "lowstocklevel", "low stock level", "reorderlevel", "reorder level"]
};

const INVENTORY_PAGE_SIZE = 50;

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readExcelCell(row: ExcelRow, aliases: string[]) {
  const cells = new Map(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]));
  for (const alias of aliases) {
    const value = cells.get(normalizeHeader(alias));
    if (value !== undefined && String(value).trim() !== "") return value;
  }
  return "";
}

function textCell(value: unknown) {
  return String(value ?? "").trim();
}

function barcodeCell(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 0 });
  }
  return textCell(value).replace(/\.0$/, "");
}

function numberCell(value: unknown) {
  const cleaned = String(value ?? "").replace(/[\u20a6#,$\s]/g, "").replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function parseExcelProducts(rows: ExcelRow[], defaultCategory: string) {
  const products: ProductInput[] = [];
  const errors: string[] = [];
  rows.forEach((row, index) => {
    const name = textCell(readExcelCell(row, excelColumnAliases.name));
    if (!name) {
      errors.push(`Row ${index + 2}: product name is required.`);
      return;
    }
    products.push({
      serialCode: barcodeCell(readExcelCell(row, excelColumnAliases.barcode)),
      name: name.toUpperCase(),
      slug: textCell(readExcelCell(row, excelColumnAliases.slug)),
      description: textCell(readExcelCell(row, excelColumnAliases.description)),
      category: textCell(readExcelCell(row, excelColumnAliases.category)) || defaultCategory || "General",
      quantity: numberCell(readExcelCell(row, excelColumnAliases.quantity)),
      unitPrice: numberCell(readExcelCell(row, excelColumnAliases.sellingPrice)),
      costPrice: numberCell(readExcelCell(row, excelColumnAliases.costPrice)),
      supplier: textCell(readExcelCell(row, excelColumnAliases.supplier)),
      lowStockAt: numberCell(readExcelCell(row, excelColumnAliases.lowStockAt)) || 20
    });
  });
  return { products, errors };
}
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

export default function InventoryPage() {
  const router = useRouter();
  const { products, categories, cart } = useBusinessData();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [lastCategory, setLastCategory] = useState("");
  const [form, setForm] = useState<ProductInput>(() => emptyProduct(lastCategory || categories[0] || ""));
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [toast, setToast] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [importRows, setImportRows] = useState<ProductInput[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importingProducts, setImportingProducts] = useState(false);
  const [page, setPage] = useState(1);

  const filteredProducts = useMemo(() => {
    const value = query.trim().toLowerCase();
    const source = value ? products.filter((product) =>
      [product.name, product.slug, product.serialCode, product.category]
        .some((field) => (field ?? "").toLowerCase().includes(value))
    ) : products;
    return [...source].sort((a, b) => {
      const sellingPriceRank = Number(a.unitPrice <= 0) - Number(b.unitPrice <= 0);
      if (sellingPriceRank) return sellingPriceRank;
      const barcodeRank = Number(!a.serialCode) - Number(!b.serialCode);
      if (barcodeRank) return barcodeRank;
      return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    });
  }, [products, query]);

  const pricedProducts = useMemo(() => products.filter((product) => product.unitPrice > 0), [products]);
  const lowStock = useMemo(() => products.filter((product) => product.quantity <= product.lowStockAt), [products]);
  const outOfStock = useMemo(() => products.filter((product) => product.quantity <= 0), [products]);
  const inventoryValue = useMemo(() => products.reduce((sum, product) => sum + Math.max(0, product.quantity) * product.costPrice, 0), [products]);
  const visibleCategories = useMemo(
    () => Array.from(new Set([
      "DEFAULT",
      ...PRODUCT_CATEGORIES,
      ...categories,
      ...products.map((product) => product.category).filter(Boolean)
    ])).sort(),
    [categories, products]
  );
  const inventoryExportRows = useMemo(() => products.map((product) => ({
    barcode: product.serialCode,
    name: product.name,
    slug: product.slug ?? "",
    category: product.category,
    quantity: product.quantity,
    sellingPrice: product.unitPrice,
    costPrice: product.costPrice,
    inventoryValue: Math.max(0, product.quantity) * product.costPrice,
    dateAdded: product.dateAdded,
    lowStockAt: product.lowStockAt,
    status: product.quantity <= 0 ? "Out of stock" : product.quantity <= product.lowStockAt ? "Low stock" : "In stock"
  })), [products]);
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / INVENTORY_PAGE_SIZE));
  const visibleProducts = useMemo(() => {
    const safePage = Math.min(page, pageCount);
    const start = (safePage - 1) * INVENTORY_PAGE_SIZE;
    return filteredProducts.slice(start, start + INVENTORY_PAGE_SIZE);
  }, [filteredProducts, page, pageCount]);
  const suggestions = query ? filteredProducts.slice(0, 5) : [];
  const currentStart = (Math.min(page, pageCount) - 1) * INVENTORY_PAGE_SIZE;
  const pickedProductIds = useMemo(() => new Set(cart.map((item) => item.productId)), [cart]);

  const showProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowForm(false);
    void fetchProductHistory(product.id).then((transactionHistory) => {
      setSelectedProduct((current) => current?.id === product.id
        ? { ...current, transactionHistory }
        : current);
    });
  };

  useEffect(() => {
    setPage(1);
  }, [query, products.length]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    if (action === "add") {
      startAddProduct();
      return;
    }
    const productId = params.get("product");
    const product = productId ? products.find((item) => item.id === productId || item.serialCode === productId) : undefined;
    if (product) {
      showProductDetails(product);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  useEffect(() => {
    const openProductDetails = (event: Event) => {
      const productId = (event as CustomEvent<string>).detail;
      const product = products.find((item) => item.id === productId || item.serialCode === productId);
      if (!product) return;
      showProductDetails(product);
    };
    const openAddProduct = () => startAddProduct();
    window.addEventListener("paytrack-open-product-details", openProductDetails);
    window.addEventListener("paytrack-add-product", openAddProduct);
    return () => {
      window.removeEventListener("paytrack-open-product-details", openProductDetails);
      window.removeEventListener("paytrack-add-product", openAddProduct);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const rememberCategory = (category: string) => {
    if (!category) return;
    setLastCategory(category);
  };

  const updateForm = (key: keyof ProductInput, value: string | number) => {
    if (key === "category" && typeof value === "string") rememberCategory(value);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const startAddProduct = () => {
    router.push("/inventory/add");
  };

  function startEditProduct(product: Product) {
    rememberCategory(product.category);
    setForm({ ...product, slug: productSlug(product.name) });
    setShowForm(true);
    setSelectedProduct(null);
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  const playProductAddedSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audio = new AudioContextClass();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(760, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1080, audio.currentTime + 0.1);
      gain.gain.setValueAtTime(0.001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.2);
      window.setTimeout(() => audio.close(), 260);
    } catch {
      // Sound is optional; browsers may block audio in some cases.
    }
  };

  const showProductAddedToast = (message = "Product added") => {
    setToast(message);
    playProductAddedSound();
    window.setTimeout(() => setToast(""), 2600);
  };

  const clearSearchForNextScan = () => {
    setQuery("");
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const pickProductForCart = (product: Product) => {
    try {
      addToCart(product.id);
      setNotice({ type: "success", message: `${product.name} added to cart.` });
      clearSearchForNextScan();
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to add to cart." });
    }
  };

  const handleSaveProduct = async () => {
    if (savingProduct) return;
    setSavingProduct(true);
    try {
      if (form.lowStockAt <= 0) {
        throw new Error("Low stock level is required. Enter a value greater than zero.");
      }
      const product = saveProduct(form);
      const isNewProduct = !form.id;
      const synced = await saveProductToBackend(product);
      rememberCategory(product.category);
      if (!synced) {
        const reason = getLastBackendSyncError();
        setNotice({ type: "error", message: `${product.name} was saved locally, but it did not reach the backend. ${reason || "Check login, API URL, Render status, and CORS settings."}` });
        return;
      }
      setNotice({ type: "success", message: `${product.name} was saved to the backend.` });
      showProductAddedToast(isNewProduct ? "Product added" : "Product updated");
      setForm(emptyProduct(product.category));
      setShowForm(false);
      setSelectedProduct(null);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to save product." });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) throw new Error("The workbook is empty.");
      const rows = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[firstSheet], { defval: "", raw: false });
      if (!rows.length) throw new Error("No product rows were found in the first sheet.");
      const parsed = parseExcelProducts(rows, lastCategory || visibleCategories[0] || "Default");
      setImportFileName(file.name);
      setImportRows(parsed.products);
      setImportErrors(parsed.errors);
      setNotice(parsed.products.length
        ? { type: "success", message: `${parsed.products.length} product row${parsed.products.length === 1 ? "" : "s"} ready to import.` }
        : { type: "error", message: "No valid products were found. Check the product name column." });
    } catch (error) {
      setImportRows([]);
      setImportFileName("");
      setImportErrors([]);
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to read Excel file." });
    }
  };

  const handleImportProducts = async () => {
    if (importingProducts || importRows.length === 0) return;
    setImportingProducts(true);
    try {
      const result = await saveProductsToBackend(importRows);
      if (!result) {
        const reason = getLastBackendSyncError();
        setNotice({ type: "error", message: reason || "Unable to import products to the backend." });
        return;
      }
      const rowMessage = `${result.created} created, ${result.updated} updated${result.skipped ? `, ${result.skipped} skipped` : ""}.`;
      setNotice({ type: result.skipped ? "error" : "success", message: `Excel import finished: ${rowMessage}` });
      setImportRows([]);
      setImportFileName("");
      setImportErrors(result.errors.map((item) => `Row ${item.row}: ${item.message}`));
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to import products." });
    } finally {
      setImportingProducts(false);
    }
  };
  return (
    <AppShell>
      {toast && (
        <div className="fixed bottom-5 left-5 z-[70] flex items-center gap-3 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 shadow-2xl shadow-emerald-900/15 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-200">
          <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
            <Plus size={16} />
          </span>
          {toast}
        </div>
      )}
      <Notice notice={notice} />
      <section className="border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
        <div className="grid min-h-[42px] grid-cols-[40px_1fr] border-b border-slate-200 xl:grid-cols-[40px_1fr_auto]">
          <div className="grid place-items-center border-r border-slate-200 text-blue-600">
            <List size={17} />
          </div>
          <div className="flex min-w-0 items-center px-3 sm:px-5">
            <h1 className="text-sm font-black uppercase tracking-normal text-[#111827]">Products (All Warehouses)</h1>
          </div>
          <div className="col-span-2 flex items-stretch overflow-x-auto border-t border-slate-200 xl:col-span-1 xl:border-l xl:border-t-0">
            <button type="button" onClick={startAddProduct} className="grid w-12 place-items-center border-r border-slate-200 text-blue-600 transition hover:bg-blue-50" title="Add Product">
              <Plus size={17} />
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="grid w-12 place-items-center border-r border-slate-200 text-blue-600 transition hover:bg-blue-50" title="Import Excel">
              <Upload size={17} />
            </button>
            <button type="button" onClick={() => downloadCsv("inventory.csv", inventoryExportRows)} className="grid w-12 place-items-center border-r border-slate-200 text-blue-600 transition hover:bg-blue-50" title="Export CSV">
              <FileSpreadsheet size={17} />
            </button>
            <button type="button" className="grid w-12 place-items-center border-r border-slate-200 text-blue-600 transition hover:bg-blue-50" title="Grid View">
              <Grid2X2 size={17} />
            </button>
            <button type="button" className="grid w-12 place-items-center text-blue-600 transition hover:bg-blue-50" title="List View">
              <List size={17} />
            </button>
          </div>
        </div>
        <p className="border-b border-slate-200 px-3 py-3 text-sm leading-6 text-[#1f2937]">
          Please use the table below to navigate or filter the results. You can download the table as excel and pdf.
        </p>

        <div className="grid grid-cols-2 gap-3 border-b border-slate-200 px-3 py-4 text-xs text-[#334155] sm:px-5 md:grid-cols-3 xl:grid-cols-6">
          <div><strong>{products.length.toLocaleString()}</strong> products</div>
          <div><strong>{pricedProducts.length.toLocaleString()}</strong> priced</div>
          <div><strong>{visibleCategories.length.toLocaleString()}</strong> categories</div>
          <div><strong>{lowStock.length.toLocaleString()}</strong> low stock</div>
          <div><strong>{outOfStock.length.toLocaleString()}</strong> out of stock</div>
          <div><strong>{money(inventoryValue)}</strong> value</div>
        </div>

        {importFileName && (
          <div className="mx-5 mt-4 border border-[#d8dee9] bg-[#f8fafc] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900">{importFileName}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{importRows.length.toLocaleString()} rows ready{importErrors.length ? `, ${importErrors.length} issue${importErrors.length === 1 ? "" : "s"}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <Button className="h-9 rounded-none" onClick={handleImportProducts} disabled={importingProducts || importRows.length === 0}>
                  <Upload size={15} /> {importingProducts ? "Importing..." : "Import"}
                </Button>
                <Button className="h-9 rounded-none bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => { setImportRows([]); setImportFileName(""); setImportErrors([]); }}>
                  <X size={15} /> Clear
                </Button>
              </div>
            </div>
            {importErrors.length > 0 && (
              <div className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">
                {importErrors.slice(0, 3).map((error) => <p key={error}>{error}</p>)}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 px-3 py-5 sm:px-5 md:flex-row md:items-start md:justify-between">
          <label className="flex items-center gap-2 text-sm text-[#111827]">
            Show
            <select className="h-9 border border-[#cbd5e1] bg-white px-2 text-sm text-slate-500" value={INVENTORY_PAGE_SIZE} onChange={() => undefined}>
              <option>50</option>
            </select>
          </label>
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="inventory-search" className="text-sm text-[#111827]">Search</label>
            <input
              ref={searchInputRef}
              id="inventory-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 w-full border border-[#cbd5e1] bg-white px-3 text-base outline-none focus:border-blue-500 sm:h-9 sm:text-sm md:w-[220px] xl:w-[182px]"
            />
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-16 z-20 overflow-hidden border border-[#d8dee9] bg-white shadow-xl sm:left-auto sm:top-10 sm:w-[320px]">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      showProductDetails(product);
                      setQuery(product.name);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-blue-50"
                  >
                    <span>
                      <span className="block font-black text-[#1f2f4a]">{product.name}</span>
                      <span className="text-xs font-semibold text-slate-500">{product.serialCode || product.category}</span>
                    </span>
                    <Eye size={16} className="text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {showForm && (
          <div ref={formRef} className="mx-3 mb-5 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:mx-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black uppercase tracking-wide text-[#111827]">{form.id ? "Edit Product" : "Add Product"}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Use the barcode, category, and pricing fields to keep inventory clean.</p>
              </div>
              <Button className="size-9 rounded-full bg-slate-100 p-0 text-slate-600 hover:bg-slate-200" onClick={() => setShowForm(false)} aria-label="Close product form">
                <X size={16} />
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm font-bold text-slate-800">Product Name<input className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 uppercase outline-none transition focus:border-blue-500 focus:bg-white" value={form.name} onChange={(event) => {
                const name = event.target.value.toUpperCase();
                setForm((current) => ({ ...current, name, slug: productSlug(name) }));
              }} /></label>
              <label className="text-sm font-bold text-slate-800">Barcode<span className="mt-1 flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white"><input inputMode="numeric" maxLength={10} className="h-11 min-w-0 flex-1 bg-transparent px-3 outline-none" value={form.serialCode} onChange={(event) => updateForm("serialCode", event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Up to 10 digits" /><button type="button" onClick={() => updateForm("serialCode", generateNumericBarcode(products.map((product) => product.serialCode)))} className="grid w-11 place-items-center border-l border-slate-200 text-blue-600 transition hover:bg-blue-50" title="Generate a unique 10-digit barcode" aria-label="Generate barcode"><Dices size={17} /></button></span></label>
              <label className="text-sm font-bold text-slate-800">Slug<input disabled className="mt-1 h-11 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 lowercase text-slate-500 opacity-100" value={form.slug ?? ""} placeholder="Generated from product name" /></label>
              <label className="text-sm font-bold text-slate-800">Category<select className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none transition focus:border-blue-500 focus:bg-white" value={form.category} onChange={(event) => updateForm("category", event.target.value)}><option value="">Select category</option>{visibleCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label className="text-sm font-bold text-slate-800">Quantity<input type="number" min={0} className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none transition focus:border-blue-500 focus:bg-white" value={form.quantity === 0 ? "" : form.quantity} onChange={(event) => updateForm("quantity", event.target.value === "" ? 0 : Number(event.target.value))} /></label>
              <label className="text-sm font-bold text-slate-800">Selling Price<input type="number" min={0} placeholder="Enter selling price" className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none transition focus:border-blue-500 focus:bg-white" value={form.unitPrice === 0 ? "" : form.unitPrice} onChange={(event) => updateForm("unitPrice", event.target.value === "" ? 0 : Number(event.target.value))} /></label>
              <label className="text-sm font-bold text-slate-800">Cost Price<input type="number" min={0} placeholder="Enter cost price" className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none transition focus:border-blue-500 focus:bg-white" value={form.costPrice === 0 ? "" : form.costPrice} onChange={(event) => updateForm("costPrice", event.target.value === "" ? 0 : Number(event.target.value))} /></label>
              <label className="text-sm font-bold text-slate-800">Low Stock Level<input type="number" min={1} placeholder="Enter low stock level" className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none transition focus:border-blue-500 focus:bg-white" value={form.lowStockAt === 0 ? "" : form.lowStockAt} onChange={(event) => updateForm("lowStockAt", event.target.value === "" ? 0 : Number(event.target.value))} /></label>
              <label className="text-sm font-bold text-slate-800 md:col-span-2 xl:col-span-4">Description<textarea className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white" value={form.description ?? ""} onChange={(event) => updateForm("description", event.target.value)} /></label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button className="rounded-lg bg-blue-600 px-5 hover:bg-blue-700" onClick={handleSaveProduct} disabled={savingProduct}><Plus size={16} /> {savingProduct ? "Saving..." : "Save Product"}</Button>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="mx-3 mb-5 border border-dashed border-slate-300 p-8 text-center sm:mx-5">
            <p className="font-black">No products in inventory</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">Create a category, then add your first product.</p>
            <Button className="mt-4 rounded-none" onClick={startAddProduct}><Plus size={16} /> Add Product</Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 px-3 pb-5 sm:px-5 xl:hidden">
              {visibleProducts.map((product) => {
                const picked = pickedProductIds.has(product.id);
                return (
                <article key={product.id} className="border border-[#d8dee9] bg-white p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => pickProductForCart(product)}
                      className={cn(
                        "mt-1 grid size-6 shrink-0 place-items-center border transition hover:border-blue-500 hover:bg-blue-50 focus:border-blue-500 focus:bg-blue-50",
                        picked ? "border-blue-600 bg-blue-600 text-white" : "border-[#cbd5e1] bg-white text-transparent"
                      )}
                      aria-label={`Add ${product.name} to cart`}
                      title="Add to cart and clear search"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => showProductDetails(product)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block break-words text-sm font-black uppercase leading-5 text-[#1f2f4a]">{product.name}</span>
                      <span className="mt-1 block text-xs font-semibold text-slate-500">{product.serialCode || product.id}</span>
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#263653] sm:grid-cols-3">
                    <div className="border border-[#e5e9f0] bg-[#f8fafc] p-2">
                      <p className="font-black uppercase text-slate-500">Category</p>
                      <p className="mt-1 uppercase">{product.category || "Default"}</p>
                    </div>
                    <div className="border border-[#e5e9f0] bg-[#f8fafc] p-2">
                      <p className="font-black uppercase text-slate-500">Price</p>
                      <p className="mt-1">{money(product.unitPrice)}</p>
                    </div>
                    <div className="border border-[#e5e9f0] bg-[#f8fafc] p-2">
                      <p className="font-black uppercase text-slate-500">Qty</p>
                      <p className="mt-1">{product.quantity.toFixed(2)} PCS</p>
                    </div>
                    <div className="border border-[#e5e9f0] bg-[#f8fafc] p-2">
                      <p className="font-black uppercase text-slate-500">Cost</p>
                      <p className="mt-1">{money(product.costPrice)}</p>
                    </div>
                    <div className="border border-[#e5e9f0] bg-[#f8fafc] p-2 sm:col-span-2">
                      <p className="font-black uppercase text-slate-500">Alert Quantity</p>
                      <p className="mt-1">{product.lowStockAt.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => { showProductDetails(product); clearSearchForNextScan(); }} className="h-9 bg-[#3e87c4] text-xs font-black text-white">Details</button>
                    <button type="button" onClick={() => startEditProduct(product)} className="h-9 border border-[#cbd5e1] bg-white text-xs font-black text-[#263653]">Edit</button>
                    <button type="button" onClick={() => pickProductForCart(product)} className="h-9 border border-[#cbd5e1] bg-white text-xs font-black text-[#263653]">
                      Cart
                    </button>
                  </div>
                </article>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto px-5 pb-5 xl:block">
              <table className="w-full min-w-[1580px] border-collapse text-left text-sm text-[#263653]">
                <thead>
                  <tr className="border-y border-[#d8dee9] bg-[#f7f9fc] text-xs font-black uppercase tracking-normal text-[#33445f]">
                    {["", "S/No", "Actions", "Code", "Name", "Slug", "Category", "Cost", "Price", "Quantity", "Unit", "Price Groups", "Alert Quantity"].map((header) => (
                      <th key={header || "select"} className={cn("px-4 py-4 align-middle", header === "" && "w-12")}>
                        <span className="flex items-center justify-between gap-2">
                          {header === "" ? (
                            <button
                              type="button"
                              onClick={clearSearchForNextScan}
                              className="block size-5 border border-[#cbd5e1] bg-white transition hover:border-blue-500 hover:bg-blue-50"
                              aria-label="Clear search and focus scanner field"
                              title="Clear search"
                            />
                          ) : header}
                          {header && <span className="text-lg leading-none text-slate-300">^</span>}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product, index) => {
                    const picked = pickedProductIds.has(product.id);
                    return (
                    <tr key={product.id} className={cn("border-b border-[#e5e9f0] bg-white transition hover:bg-[#e9f6fd]", index === 5 && "bg-[#d9f0fb]")}>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => pickProductForCart(product)}
                          className={cn(
                            "grid size-5 place-items-center border transition hover:border-blue-500 hover:bg-blue-50 focus:border-blue-500 focus:bg-blue-50",
                            picked ? "border-blue-600 bg-blue-600 text-white" : "border-[#cbd5e1] bg-white text-transparent"
                          )}
                          aria-label={`Add ${product.name} to cart`}
                          title="Add to cart and clear search"
                        >
                          <Check size={14} />
                        </button>
                      </td>
                      <td className="px-4 py-4 font-black text-slate-500">{(currentStart + index + 1).toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <select
                          className="h-6 bg-[#3e87c4] px-1 text-xs font-semibold text-white outline-none"
                          defaultValue=""
                          aria-label={`Actions for ${product.name}`}
                          onChange={(event) => {
                            const action = event.target.value;
                            event.currentTarget.value = "";
                            if (action === "edit") {
                              startEditProduct(product);
                              setQuery("");
                            }
                            if (action === "details") {
                              showProductDetails(product);
                              clearSearchForNextScan();
                            }
                            if (action === "cart") pickProductForCart(product);
                          }}
                        >
                          <option value="" disabled>Actions</option>
                          <option value="edit">Edit</option>
                          <option value="cart">Add to cart</option>
                          <option value="details">Details</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">{product.serialCode || product.id}</td>
                      <td className="max-w-[280px] px-4 py-4 uppercase">
                        <button type="button" onClick={() => showProductDetails(product)} className="whitespace-normal text-left leading-5 hover:text-blue-700 hover:underline">
                          {product.name}
                        </button>
                      </td>
                      <td className="px-4 py-4 lowercase text-slate-500">{product.slug || "—"}</td>
                      <td className="px-4 py-4 uppercase">{product.category || "Default"}</td>
                      <td className="px-4 py-4">{money(product.costPrice)}</td>
                      <td className="px-4 py-4">{money(product.unitPrice)}</td>
                      <td className="px-4 py-4">{product.quantity.toFixed(2)}</td>
                      <td className="px-4 py-4">PCS</td>
                      <td className="px-4 py-4 uppercase">Retails:<br />{money(product.unitPrice)}</td>
                      <td className="px-4 py-4">{product.lowStockAt.toFixed(2)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredProducts.length > INVENTORY_PAGE_SIZE && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d8dee9] px-5 py-4 text-sm font-bold text-slate-500">
                <span>Showing {(currentStart + 1).toLocaleString()} to {(currentStart + visibleProducts.length).toLocaleString()} of {filteredProducts.length.toLocaleString()} products</span>
                <div className="flex items-center gap-2">
                  <Button className="h-9 rounded-none bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
                  <span>Page {Math.min(page, pageCount).toLocaleString()} of {pageCount.toLocaleString()}</span>
                  <Button className="h-9 rounded-none bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <section className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">{selectedProduct.name}</h2>
                {selectedProduct.serialCode && <p className="mt-1 text-sm font-bold text-slate-500">{selectedProduct.serialCode}</p>}
              </div>
              <Button className="size-10 bg-white p-0 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:ring-slate-700" onClick={() => setSelectedProduct(null)} aria-label="Close product details">
                <X size={18} />
              </Button>
            </div>
            <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
              <div>
                {selectedProduct.serialCode ? <ProductQr barcode={selectedProduct.serialCode} /> : (
                  <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm font-bold text-slate-500 dark:border-slate-700">
                    No barcode added yet
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button className="h-9" onClick={() => startEditProduct(selectedProduct)}><Edit3 size={15} /> Edit</Button>
                  <Button className="h-9 bg-brand-600" onClick={() => {
                    try {
                      addToCart(selectedProduct.id);
                      setNotice({ type: "success", message: `${selectedProduct.name} added to cart.` });
                    } catch (error) {
                      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to add to cart." });
                    }
                  }}><ShoppingCart size={15} /> Cart</Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Quantity Available", quantityDisplay(selectedProduct.quantity)],
                  ["Selling Price", priceDisplay(selectedProduct.unitPrice)],
                  ["Cost Price", priceDisplay(selectedProduct.costPrice)],
                  ["Stock Value", money(Math.max(0, selectedProduct.quantity) * selectedProduct.costPrice)],
                  ["Product Category", selectedProduct.category],
                  ["Slug", selectedProduct.slug || "Not set"],
                  ["Date Added", shortDate(selectedProduct.dateAdded)],
                  ["Low Stock Level", selectedProduct.lowStockAt.toLocaleString()]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs font-black uppercase text-slate-500">{label}</p>
                    <p className="mt-2 font-black">{value}</p>
                  </div>
                ))}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:col-span-2">
                  <p className="text-xs font-black uppercase text-slate-500">Description</p>
                  <p className="mt-2 font-semibold">{selectedProduct.description || "No description provided."}</p>
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-black dark:border-slate-800 dark:bg-slate-950">Last Transaction History</div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedProduct.transactionHistory.length === 0 ? (
                  <div className="px-4 py-3 text-sm font-semibold text-slate-500">No transactions yet.</div>
                ) : selectedProduct.transactionHistory.map((transaction) => (
                  <div key={transaction.id} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[130px_90px_1fr_120px]">
                    <span className="font-black">{transaction.type}</span>
                    <span>{transaction.quantity.toLocaleString()}</span>
                    <span className="text-slate-600 dark:text-slate-300">{transaction.note}</span>
                    <span>{shortDate(transaction.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
