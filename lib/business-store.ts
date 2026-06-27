"use client";

import {
  type Debt,
  type Expense,
  type CustomerRequest,
  type PaymentRecord,
  type Product,
  type ProductTransaction,
  type Sale,
  type Supplier
} from "@/lib/data";
import { productSlug } from "@/lib/product-slug";

const STORAGE_KEY = "paytrack_kings_store_cosmetics_v3";
const CART_STORAGE_KEY = "paytrack_kings_store_cosmetics_cart_v1";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "https://paytrack-t2tp.onrender.com/api" : "http://localhost:4000/api");
const BACKEND_SYNC_TTL_MS = 30_000;
const BACKEND_FETCH_RETRIES = 2;
let currentData: BusinessData | null = null;
let pendingBackendSync = false;
let lastBackendSyncAt = 0;
let backendPersistTimer: number | null = null;
let lastBackendSyncError = "";
let backendSyncRequest: Promise<BusinessData | null> | null = null;

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("paytrack_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function clearInvalidSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("paytrack_token");
  window.localStorage.removeItem("paytrack_role");
  document.cookie = "paytrack_session=; path=/; max-age=0; SameSite=Lax";
  if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
    window.location.href = "/";
  }
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isLikelyNetworkError(error: unknown) {
  return error instanceof TypeError || (error instanceof Error && error.message === "Failed to fetch");
}

async function wakeBackend() {
  try {
    await window.fetch(`${API_URL}/health`, { cache: "no-store" });
  } catch {
    // Best effort only. The original request will surface the final error.
  }
}

async function backendFetch(input: RequestInfo | URL, init?: RequestInit, retries = BACKEND_FETCH_RETRIES) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await window.fetch(input, init);
    } catch (error) {
      lastError = error;
      if (!isLikelyNetworkError(error) || attempt >= retries) break;
      if (attempt === 0) await wakeBackend();
      await wait(700 * (attempt + 1));
    }
  }
  throw lastError;
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    return storedCart ? JSON.parse(storedCart) : [];
  } catch {
    return [];
  }
}

const initialCategories: string[] = ["Default"];
const LABTRADE_CATEGORY = "General";

const saltProductNames = [
  "Aluminium Acetate",
  "Aluminium Chloride",
  "Aluminium Nitrate",
  "Aluminium Potassium Sulphate (Alum)",
  "Aluminium Sulphate",
  "Ammonium Acetate",
  "Ammonium Bicarbonate",
  "Ammonium Carbonate",
  "Ammonium Chloride",
  "Ammonium Citrate",
  "Ammonium Nitrate",
  "Ammonium Oxalate",
  "Ammonium Sulphate",
  "Barium Acetate",
  "Barium Carbonate",
  "Barium Chloride",
  "Barium Nitrate",
  "Barium Sulphate",
  "Calcium Acetate",
  "Calcium Carbonate",
  "Calcium Chloride",
  "Calcium Citrate",
  "Calcium Nitrate",
  "Calcium Sulphate",
  "Copper Acetate",
  "Copper Chloride",
  "Copper Nitrate",
  "Copper Sulphate",
  "Ferric Ammonium Citrate",
  "Ferric Chloride",
  "Ferric Nitrate",
  "Ferric Sulphate",
  "Ferrous Ammonium Sulphate",
  "Ferrous Chloride",
  "Ferrous Sulphate",
  "Lead Acetate",
  "Lead Chloride",
  "Lead Nitrate",
  "Lithium Carbonate",
  "Lithium Chloride",
  "Magnesium Acetate",
  "Magnesium Carbonate",
  "Magnesium Chloride",
  "Magnesium Citrate",
  "Magnesium Nitrate",
  "Magnesium Sulphate",
  "Manganese Chloride",
  "Manganese Sulphate",
  "Nickel Chloride",
  "Nickel Nitrate",
  "Nickel Sulphate",
  "Potassium Acetate",
  "Potassium Bromide",
  "Potassium Carbonate",
  "Potassium Chloride",
  "Potassium Chromate",
  "Potassium Dichromate",
  "Potassium Ferricyanide",
  "Potassium Ferrocyanide",
  "Potassium Iodide",
  "Potassium Nitrate",
  "Potassium Permanganate",
  "Potassium Sulphate",
  "Silver Nitrate",
  "Sodium Acetate",
  "Sodium Benzoate",
  "Sodium Bicarbonate",
  "Sodium Bisulphate",
  "Sodium Carbonate",
  "Sodium Chloride",
  "Sodium Citrate",
  "Sodium Fluoride",
  "Sodium Nitrate",
  "Sodium Nitrite",
  "Sodium Oxalate",
  "Sodium Phosphate",
  "Sodium Sulphate",
  "Sodium Sulphide",
  "Sodium Thiosulphate",
  "Stannous Chloride",
  "Strontium Chloride",
  "Strontium Nitrate",
  "Zinc Acetate",
  "Zinc Carbonate",
  "Zinc Chloride",
  "Zinc Nitrate",
  "Zinc Sulphate",
  "Sodium Potassium Tartrate",
  "Potassium Sodium Tartrate",
  "Ammonium Iron(II) Sulphate",
  "Sodium Metabisulphite",
  "Potassium Metabisulphite",
  "Sodium Hexametaphosphate",
  "Sodium Tripolyphosphate",
  "Potassium Hydrogen Phthalate",
  "Sodium Dihydrogen Phosphate",
  "Disodium Hydrogen Phosphate",
  "Potassium Dihydrogen Phosphate",
  "Dipotassium Hydrogen Phosphate",
  "Sodium Potassium Phosphate"
];

const saltProducts: Product[] = saltProductNames.map((name, index) => {
  const code = String(index + 1).padStart(3, "0");
  return {
    id: `P-SALT-${code}`,
    serialCode: `WSO-SALT-${code}`,
    name: `${name} 500 g`,
    description: "Salt category product supplied in a 500 g pack. Set stock quantity and prices when available.",
    category: "Salt",
    quantity: 0,
    unitPrice: 0,
    costPrice: 0,
    supplier: "",
    dateAdded: "2026-05-30",
    updatedAt: "2026-05-30",
    lowStockAt: 0,
    transactionHistory: []
  };
});

const labtradeChemicalNames = [
  "Calcium Sulphate",
  "Potassium Nitrate",
  "Sodium Nitrate",
  "Manganese Dioxide",
  "Ferrous Sulphate",
  "Citric Acid",
  "Calcium Carbonate",
  "Aluminum Sulfate",
  "Zinc Sulphate",
  "Calcium Chloride",
  "Maleic Acid",
  "Hexamine",
  "Oxalic Acid Dihydrate",
  "Iron II Nitrate Nonahydrate",
  "Sodium Bromide",
  "Potassium Chromate Purified",
  "Zinc Chloride",
  "Sodium Carbonate",
  "Potassium Chromate",
  "Soda Lime",
  "Potassium Sulphate",
  "Zinc Nitrate",
  "Aluminum Chloride",
  "Lead Acetate",
  "Lead Chloride",
  "Calcium Hydrogen Phosphate",
  "Potassium Carbonate",
  "Phthalic Anhydride",
  "Ammonium Molybdate",
  "Cupric Sulphate"
];

const labtradeProducts: Product[] = labtradeChemicalNames.map((name, index) => {
  const code = String(index + 1).padStart(3, "0");
  return {
    id: `P-LAB-${code}`,
    serialCode: `LABTRADE-${code}`,
    name: `${name} 500g`,
    description: "Labtrade current chemical supplied in a 500g pack.",
    category: LABTRADE_CATEGORY,
    quantity: 25,
    unitPrice: 15000,
    costPrice: 0,
    supplier: "Labtrade",
    dateAdded: "2026-05-31",
    updatedAt: "2026-05-31",
    lowStockAt: 5,
    transactionHistory: [{ id: `TX-LAB-${code}`, type: "Stock In", quantity: 25, note: "Labtrade opening stock", date: "2026-05-31" }]
  };
});

const initialProducts: Product[] = [
  {
    id: "P-IND-001",
    serialCode: "WSO-IND-001",
    name: "Litmus",
    description: "Indicator product. Selling price is 2,000 per piece.",
    category: "Indicator",
    quantity: 10,
    unitPrice: 2000,
    costPrice: 0,
    supplier: "",
    dateAdded: "2026-05-30",
    updatedAt: "2026-05-30",
    lowStockAt: 3,
    transactionHistory: [{ id: "TX-IND-001", type: "Stock In", quantity: 10, note: "Opening stock", date: "2026-05-30" }]
  },
  {
    id: "P-IND-002",
    serialCode: "WSO-IND-002",
    name: "Phenolphthalein",
    description: "Indicator product. Selling price is 24,000 per piece.",
    category: "Indicator",
    quantity: 10,
    unitPrice: 24000,
    costPrice: 0,
    supplier: "",
    dateAdded: "2026-05-30",
    updatedAt: "2026-05-30",
    lowStockAt: 3,
    transactionHistory: [{ id: "TX-IND-002", type: "Stock In", quantity: 10, note: "Opening stock", date: "2026-05-30" }]
  },
  {
    id: "P-IND-003",
    serialCode: "WSO-IND-003",
    name: "Methyl Orange",
    description: "Indicator product. Selling price is 24,000 per piece.",
    category: "Indicator",
    quantity: 10,
    unitPrice: 24000,
    costPrice: 0,
    supplier: "",
    dateAdded: "2026-05-30",
    updatedAt: "2026-05-30",
    lowStockAt: 3,
    transactionHistory: [{ id: "TX-IND-003", type: "Stock In", quantity: 10, note: "Opening stock", date: "2026-05-30" }]
  },
  {
    id: "P-IND-004",
    serialCode: "WSO-IND-004",
    name: "Universal Indicator",
    description: "Indicator product. Selling price is 2,400 per piece.",
    category: "Indicator",
    quantity: 15,
    unitPrice: 2400,
    costPrice: 0,
    supplier: "",
    dateAdded: "2026-05-30",
    updatedAt: "2026-05-30",
    lowStockAt: 4,
    transactionHistory: [{ id: "TX-IND-004", type: "Stock In", quantity: 15, note: "Opening stock", date: "2026-05-30" }]
  },
  {
    id: "P-ACD-001",
    serialCode: "WSO-ACD-001",
    name: "Hydrochloric Acid (HCl) 2.5L",
    description: "Acid product supplied in 2.5 liter bottles. Selling price is 35,000 per piece.",
    category: "Acid",
    quantity: 10,
    unitPrice: 35000,
    costPrice: 0,
    supplier: "",
    dateAdded: "2026-05-30",
    updatedAt: "2026-05-30",
    lowStockAt: 3,
    transactionHistory: [{ id: "TX-ACD-001", type: "Stock In", quantity: 10, note: "Opening stock", date: "2026-05-30" }]
  },
  {
    id: "P-ACD-002",
    serialCode: "WSO-ACD-002",
    name: "Sulfuric Acid (H2SO4) 2.5L",
    description: "Acid product supplied in 2.5 liter bottles. Selling price is 35,000 per piece.",
    category: "Acid",
    quantity: 10,
    unitPrice: 35000,
    costPrice: 0,
    supplier: "",
    dateAdded: "2026-05-30",
    updatedAt: "2026-05-30",
    lowStockAt: 3,
    transactionHistory: [{ id: "TX-ACD-002", type: "Stock In", quantity: 10, note: "Opening stock", date: "2026-05-30" }]
  },
  {
    id: "P-ACD-003",
    serialCode: "WSO-ACD-003",
    name: "Nitric Acid (HNO3) 2.5L",
    description: "Acid product supplied in 2.5 liter bottles. Selling price is 35,000 per piece.",
    category: "Acid",
    quantity: 10,
    unitPrice: 35000,
    costPrice: 0,
    supplier: "",
    dateAdded: "2026-05-30",
    updatedAt: "2026-05-30",
    lowStockAt: 3,
    transactionHistory: [{ id: "TX-ACD-003", type: "Stock In", quantity: 10, note: "Opening stock", date: "2026-05-30" }]
  },
  {
    id: "P-ACD-004",
    serialCode: "WSO-ACD-004",
    name: "Acetic Acid (CH3COOH) 2.5L",
    description: "Acid product supplied in 2.5 liter bottles. Selling price is 35,000 per piece.",
    category: "Acid",
    quantity: 10,
    unitPrice: 35000,
    costPrice: 0,
    supplier: "",
    dateAdded: "2026-05-30",
    updatedAt: "2026-05-30",
    lowStockAt: 3,
    transactionHistory: [{ id: "TX-ACD-004", type: "Stock In", quantity: 10, note: "Opening stock", date: "2026-05-30" }]
  },
  {
    id: "P-ACD-005",
    serialCode: "WSO-ACD-005",
    name: "Citric Acid 2.5L",
    description: "Acid product supplied in 2.5 liter bottles. Selling price is 35,000 per piece.",
    category: "Acid",
    quantity: 10,
    unitPrice: 35000,
    costPrice: 0,
    supplier: "",
    dateAdded: "2026-05-30",
    updatedAt: "2026-05-30",
    lowStockAt: 3,
    transactionHistory: [{ id: "TX-ACD-005", type: "Stock In", quantity: 10, note: "Opening stock", date: "2026-05-30" }]
  },
  ...labtradeProducts,
  ...saltProducts
];

export type CartItem = {
  productId: string;
  quantity: number;
};

export type BusinessData = {
  products: Product[];
  categories: string[];
  suppliers: Supplier[];
  expenses: Expense[];
  debts: Debt[];
  sales: Sale[];
  cart: CartItem[];
  customerRequests: CustomerRequest[];
};

export type ProductInput = Omit<Product, "id" | "dateAdded" | "updatedAt" | "transactionHistory"> & {
  id?: string;
  dateAdded?: string;
};

export type SupplierInput = Omit<Supplier, "id" | "total"> & {
  id?: string;
};

export type ExpenseInput = Omit<Expense, "id">;

export type PaymentInput = {
  debtId: string;
  amount: number;
  method: PaymentRecord["method"];
  date: string;
  reference: string;
};

export type DebtRecordInput = {
  customer: string;
  product: string;
  quantity: number;
  total: number;
  paid: number;
  dueDate: string;
};

export type CartSaleInput = {
  invoiceNo: string;
  customer: string;
  date: string;
  method: Sale["method"];
  paid: number;
  discount: number;
  dueDate?: string;
};

export type SaleLineInput = {
  productId: string;
  quantity: number;
  price: number;
};

export type CustomerRequestInput = Omit<CustomerRequest, "id" | "status"> & {
  id?: string;
  status?: CustomerRequest["status"];
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function withDerivedStatus(debt: Debt): Debt {
  const paid = Math.min(debt.paid, debt.total);
  const status: Debt["status"] = paid >= debt.total ? "Settled" : new Date(debt.dueDate) < new Date(today()) ? "Overdue" : "Current";
  return { ...debt, paid, status };
}

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    slug: product.slug ?? "",
    costPrice: product.costPrice ?? 0,
    serialCode: product.serialCode || "",
    description: product.description ?? "",
    transactionHistory: product.transactionHistory?.length
      ? product.transactionHistory
      : [{ id: makeId("TX"), type: "Stock In", quantity: product.quantity, note: "Opening balance", date: product.dateAdded }]
  };
}

function productKey(name: string) {
  return name
    .toLowerCase()
    .replaceAll("aluminium", "aluminum")
    .replaceAll("sulphate", "sulfate")
    .replace(/\b500\s*g\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeProducts(products: Product[]) {
  return Array.from(
    products.reduce((map, product) => {
      map.set(productKey(product.name), product);
      return map;
    }, new Map<string, Product>()).values()
  );
}

function uniqueCategories(products: Product[], categories: string[] = []) {
  return Array.from(new Set([...categories, ...products.map((product) => product.category)].filter(Boolean))).sort();
}

function normalizeData(data: Partial<BusinessData> = {}): BusinessData {
  const sourceProducts = data.products ?? [];
  const products = dedupeProducts(sourceProducts).map(normalizeProduct);
  return {
    products,
    categories: uniqueCategories(products, data.categories ?? initialCategories),
    suppliers: data.suppliers ?? [],
    expenses: data.expenses ?? [],
    debts: (data.debts ?? []).map((debt) => withDerivedStatus({ ...debt, paymentHistory: debt.paymentHistory ?? [] })),
    sales: data.sales ?? [],
    cart: data.cart ?? [],
    customerRequests: data.customerRequests ?? []
  };
}

export function readBusinessData(): BusinessData {
  if (typeof window === "undefined") {
    return normalizeData();
  }
  if (!currentData) {
    const storedData = window.localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        currentData = normalizeData({ ...JSON.parse(storedData), cart: readStoredCart() });
      } catch {
        currentData = normalizeData();
      }
    } else {
      currentData = normalizeData();
    }
  }
  return currentData;
}

function persistBusinessDataToBackend(data: BusinessData) {
  if (typeof window === "undefined") return Promise.resolve(false);
  const token = window.localStorage.getItem("paytrack_token");
  if (!token) {
    lastBackendSyncError = "No login session was found. Sign in again, then save the product.";
    pendingBackendSync = true;
    window.dispatchEvent(new CustomEvent("business-data-backend-sync", { detail: { ok: false, message: lastBackendSyncError } }));
    return Promise.resolve(false);
  }

  const normalized = normalizeData(data);
  pendingBackendSync = true;
  lastBackendSyncError = "";
  return backendFetch(`${API_URL}/business-data`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data: normalized })
  }).then(async (response) => {
    if (response.status === 401) {
      lastBackendSyncError = "Your login session expired or is invalid. Sign out, sign in again, then retry.";
      clearInvalidSession();
      return false;
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ? `${body.message} (${response.status})` : `Backend sync failed (${response.status}).`);
    }
    pendingBackendSync = false;
    lastBackendSyncAt = Date.now();
    lastBackendSyncError = "";
    window.dispatchEvent(new CustomEvent("business-data-backend-sync", { detail: { ok: true } }));
    return true;
  }).catch((error) => {
    pendingBackendSync = true;
    lastBackendSyncError = error instanceof Error ? error.message : "Backend sync failed.";
    if (lastBackendSyncError === "Failed to fetch") {
      lastBackendSyncError = "Network/CORS failure. Confirm Vercel is allowed in Render CORS settings and Render is awake.";
    }
    window.dispatchEvent(new CustomEvent("business-data-backend-sync", { detail: { ok: false, message: lastBackendSyncError } }));
    return false;
  });
}

function scheduleBusinessDataBackendSync(data: BusinessData) {
  if (typeof window === "undefined") return;
  pendingBackendSync = true;
  if (backendPersistTimer) {
    window.clearTimeout(backendPersistTimer);
  }
  backendPersistTimer = window.setTimeout(() => {
    backendPersistTimer = null;
    void persistBusinessDataToBackend(data);
  }, 650);
}

export async function syncBusinessDataFromBackend(options: { force?: boolean } = {}) {
  if (typeof window === "undefined") return null;
  if (!options.force && currentData && Date.now() - lastBackendSyncAt < BACKEND_SYNC_TTL_MS) {
    return currentData;
  }
  if (!options.force && backendSyncRequest) return backendSyncRequest;

  backendSyncRequest = backendFetch(`${API_URL}/business-data`, { headers: authHeaders() })
    .then(async (response) => {
      if (response.status === 401) {
        clearInvalidSession();
        return null;
      }
      if (!response.ok) return null;
      const payload = await response.json();
      if (!payload.data) return null;
      const existingCart = readBusinessData().cart;
      const data = normalizeData({
        ...payload.data,
        cart: payload.data.cart?.length ? payload.data.cart : existingCart
      });
      currentData = data;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data.cart));
      pendingBackendSync = false;
      lastBackendSyncAt = Date.now();
      window.dispatchEvent(new CustomEvent("business-data-change", { detail: data }));
      return data;
    })
    .catch(() => null)
    .finally(() => {
      backendSyncRequest = null;
    });
  return backendSyncRequest;
}

export async function backupLocalBusinessDataToBackend() {
  if (typeof window === "undefined") return false;
  if (backendPersistTimer) {
    window.clearTimeout(backendPersistTimer);
    backendPersistTimer = null;
  }
  return persistBusinessDataToBackend(readBusinessData());
}
export async function saveProductToBackend(product: Product) {
  if (typeof window === "undefined") return false;
  const token = window.localStorage.getItem("paytrack_token");
  if (!token) {
    lastBackendSyncError = "No login session was found. Sign in again, then save the product.";
    window.dispatchEvent(new CustomEvent("business-data-backend-sync", { detail: { ok: false, message: lastBackendSyncError } }));
    return false;
  }

  lastBackendSyncError = "";
  return backendFetch(`${API_URL}/products/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(product)
  }).then(async (response) => {
    if (response.status === 401) {
      lastBackendSyncError = "Your login session expired or is invalid. Sign out, sign in again, then retry.";
      clearInvalidSession();
      return false;
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ? `${body.message} (${response.status})` : `Product backend save failed (${response.status}).`);
    }
    pendingBackendSync = false;
    lastBackendSyncAt = Date.now();
    lastBackendSyncError = "";
    window.dispatchEvent(new CustomEvent("business-data-backend-sync", { detail: { ok: true } }));
    return true;
  }).catch((error) => {
    pendingBackendSync = true;
    lastBackendSyncError = error instanceof Error ? error.message : "Product backend save failed.";
    if (lastBackendSyncError === "Failed to fetch") {
      lastBackendSyncError = "Network/CORS failure while saving product. PayTrack saved locally and will retry backend sync automatically. Confirm Render is deployed, awake, and using the latest CORS settings.";
    }
    scheduleBusinessDataBackendSync(readBusinessData());
    window.dispatchEvent(new CustomEvent("business-data-backend-sync", { detail: { ok: false, message: lastBackendSyncError } }));
    return false;
  });
}

export async function fetchProductHistory(productId: string): Promise<ProductTransaction[]> {
  if (typeof window === "undefined") return [];
  const token = window.localStorage.getItem("paytrack_token");
  if (!token) return [];
  try {
    const response = await backendFetch(`${API_URL}/products/${encodeURIComponent(productId)}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 401) {
      clearInvalidSession();
      return [];
    }
    if (!response.ok) return [];
    return await response.json() as ProductTransaction[];
  } catch {
    return [];
  }
}

export type ProductBulkSyncResult = {
  ok: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
};

const PRODUCT_BULK_SYNC_BATCH_SIZE = 100;

async function postProductBulkSyncBatch(products: ProductInput[], token: string, rowOffset: number): Promise<ProductBulkSyncResult | null> {
  const response = await backendFetch(`${API_URL}/products/bulk-sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ products })
  });
  if (response.status === 401) {
    lastBackendSyncError = "Your login session expired or is invalid. Sign out, sign in again, then retry.";
    clearInvalidSession();
    return null;
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ? `${body.message} (${response.status})` : `Bulk product import failed (${response.status}).`);
  }
  const payload = await response.json() as ProductBulkSyncResult;
  return {
    ...payload,
    errors: payload.errors.map((item) => ({ ...item, row: item.row + rowOffset }))
  };
}

export async function saveProductsToBackend(products: ProductInput[]): Promise<ProductBulkSyncResult | null> {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem("paytrack_token");
  if (!token) {
    lastBackendSyncError = "No login session was found. Sign in again, then import the products.";
    window.dispatchEvent(new CustomEvent("business-data-backend-sync", { detail: { ok: false, message: lastBackendSyncError } }));
    return null;
  }

  lastBackendSyncError = "";
  try {
    const result: ProductBulkSyncResult = { ok: true, created: 0, updated: 0, skipped: 0, errors: [] };
    for (let index = 0; index < products.length; index += PRODUCT_BULK_SYNC_BATCH_SIZE) {
      const batch = products.slice(index, index + PRODUCT_BULK_SYNC_BATCH_SIZE);
      const payload = await postProductBulkSyncBatch(batch, token, index);
      if (!payload) return null;
      result.created += payload.created;
      result.updated += payload.updated;
      result.skipped += payload.skipped;
      result.errors.push(...payload.errors);
    }
    pendingBackendSync = false;
    lastBackendSyncError = "";
    await syncBusinessDataFromBackend({ force: true });
    window.dispatchEvent(new CustomEvent("business-data-backend-sync", { detail: { ok: true } }));
    return result;
  } catch (error) {
    pendingBackendSync = true;
    lastBackendSyncError = error instanceof Error ? error.message : "Bulk product import failed.";
    if (lastBackendSyncError === "Failed to fetch") {
      lastBackendSyncError = "Network/CORS failure while importing products. Confirm you are using the deployed PayTrack frontend, then refresh and sign in again.";
    }
    window.dispatchEvent(new CustomEvent("business-data-backend-sync", { detail: { ok: false, message: lastBackendSyncError } }));
    return null;
  }
}
export function hasPendingBackendSync() {
  return pendingBackendSync;
}

export function getLastBackendSyncError() {
  return lastBackendSyncError;
}

export function writeBusinessData(data: BusinessData, options: { syncBackend?: boolean } = {}) {
  const shouldSyncBackend = options.syncBackend ?? true;
  const normalized = shouldSyncBackend ? normalizeData(data) : data;
  currentData = normalized;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized.cart));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent("business-data-change", { detail: normalized }));
  if (shouldSyncBackend) {
    scheduleBusinessDataBackendSync(normalized);
  }
}

export function resetInventory() {
  const data = readBusinessData();
  writeBusinessData({ ...data, products: [], categories: [], cart: [] });
}

export function saveCategory(name: string, previousName?: string) {
  const data = readBusinessData();
  const nextName = name.trim();
  if (!nextName) throw new Error("Category name is required.");
  if (data.categories.some((category) => category.toLowerCase() === nextName.toLowerCase() && category !== previousName)) {
    throw new Error("Category already exists.");
  }
  const categories = previousName
    ? data.categories.map((category) => (category === previousName ? nextName : category))
    : [...data.categories, nextName];
  const products = previousName
    ? data.products.map((product) => (product.category === previousName ? { ...product, category: nextName, updatedAt: today() } : product))
    : data.products;
  writeBusinessData({ ...data, categories, products });
  return nextName;
}

export function deleteCategory(name: string) {
  const data = readBusinessData();
  if (data.products.some((product) => product.category === name)) {
    throw new Error("Move or delete products in this category first.");
  }
  writeBusinessData({ ...data, categories: data.categories.filter((category) => category !== name) });
}

export function saveProduct(input: ProductInput) {
  const data = readBusinessData();
  if (!input.name.trim()) throw new Error("Product name is required.");
  if (!input.category.trim()) throw new Error("Product category is required.");
  const barcode = input.serialCode.trim();
  if (barcode && data.products.some((product) => product.serialCode.toLowerCase() === barcode.toLowerCase() && product.id !== input.id)) {
    throw new Error("Barcode must be unique.");
  }
  if (input.quantity < 0 || input.unitPrice < 0 || input.costPrice < 0 || input.lowStockAt < 0) {
    throw new Error("Quantity, cost price, and selling price cannot be negative.");
  }

  const existing = input.id ? data.products.find((product) => product.id === input.id) : undefined;
  const createdAt = input.dateAdded || existing?.dateAdded || today();
  const quantityDelta = input.quantity - (existing?.quantity ?? 0);
  const transaction: ProductTransaction | null = existing
    ? quantityDelta === 0
      ? null
      : {
          id: makeId("TX"),
          type: quantityDelta > 0 ? "Stock In" : "Stock Out",
          quantity: Math.abs(quantityDelta),
          note: "Product updated",
          date: today()
        }
    : {
        id: makeId("TX"),
        type: "Stock In",
        quantity: input.quantity,
        note: "Product created",
        date: createdAt
      };
  const product: Product = {
    ...input,
    name: input.name.trim().toUpperCase(),
    slug: productSlug(input.name),
    costPrice: input.costPrice ?? 0,
    serialCode: barcode,
    id: input.id || makeId("P"),
    description: input.description ?? "",
    dateAdded: createdAt,
    updatedAt: today(),
    transactionHistory: [
      ...(transaction ? [transaction] : []),
      ...(existing?.transactionHistory ?? [])
    ]
  };
  const products = existing
    ? data.products.map((item) => (item.id === existing.id ? product : item))
    : [product, ...data.products];
  const categories = uniqueCategories(products, data.categories);
  writeBusinessData({ ...data, products, categories }, { syncBackend: false });
  return product;
}

export function addProduct(input: ProductInput) {
  return saveProduct(input);
}

export function deleteProduct(productId: string) {
  const data = readBusinessData();
  writeBusinessData({
    ...data,
    products: data.products.filter((product) => product.id !== productId),
    cart: data.cart.filter((item) => item.productId !== productId)
  });
}

export function saveSupplier(input: SupplierInput) {
  const data = readBusinessData();
  if (!input.name.trim()) throw new Error("Supplier name is required.");
  if (!input.contact.trim()) throw new Error("Supplier contact is required.");
  if (!input.product.trim()) throw new Error("Supplied product is required.");
  if (input.quantity < 0 || input.costPrice < 0 || input.paid < 0) throw new Error("Supplier amounts cannot be negative.");

  const supplier: Supplier = {
    ...input,
    id: input.id || makeId("SUP"),
    total: input.quantity * input.costPrice
  };
  const suppliers = input.id
    ? data.suppliers.map((item) => (item.id === input.id ? supplier : item))
    : [supplier, ...data.suppliers];
  writeBusinessData({ ...data, suppliers });
  return supplier;
}

export function addExpense(input: ExpenseInput) {
  const data = readBusinessData();
  if (!input.description.trim()) throw new Error("Expense description is required.");
  if (input.amount <= 0) throw new Error("Expense amount must be greater than zero.");

  const expense: Expense = { ...input, id: makeId("EXP") };
  writeBusinessData({ ...data, expenses: [expense, ...data.expenses] });
  return expense;
}

export function recordDebtPayment(input: PaymentInput) {
  const data = readBusinessData();
  if (input.amount <= 0) throw new Error("Payment amount must be greater than zero.");
  const debt = data.debts.find((item) => item.id === input.debtId);
  if (!debt) throw new Error("Select a valid customer debt.");
  const balance = debt.total - debt.paid;
  if (input.amount > balance) throw new Error("Payment cannot exceed the outstanding balance.");

  const payment: PaymentRecord = {
    id: makeId("PAY"),
    amount: input.amount,
    method: input.method,
    date: input.date,
    reference: input.reference || makeId("REF")
  };
  const debts = data.debts.map((item) =>
    item.id === input.debtId
      ? withDerivedStatus({ ...item, paid: item.paid + input.amount, paymentHistory: [payment, ...(item.paymentHistory ?? [])] })
      : item
  );
  writeBusinessData({ ...data, debts });
  return payment;
}

export function addDebtRecord(input: DebtRecordInput) {
  const data = readBusinessData();
  const customerName = input.customer.trim() || "Walk-in Customer";
  if (!input.product.trim()) throw new Error("Product name is required.");
  if (input.quantity <= 0) throw new Error("Product quantity must be greater than zero.");
  if (input.total <= 0) throw new Error("Total amount must be greater than zero.");
  if (input.paid < 0) throw new Error("Amount paid cannot be negative.");
  if (input.paid > input.total) throw new Error("Amount paid cannot exceed total amount.");
  if (!input.dueDate) throw new Error("Due date is required.");

  const paymentHistory: PaymentRecord[] = input.paid > 0
    ? [{
        id: makeId("PAY"),
        amount: input.paid,
        method: "Credit",
        date: today(),
        reference: "Opening payment"
      }]
    : [];
  const debt = withDerivedStatus({
    id: makeId("D"),
    customer: customerName,
    product: input.product.trim(),
    quantity: input.quantity,
    total: input.total,
    paid: input.paid,
    dueDate: input.dueDate,
    status: "Current",
    paymentHistory
  });
  writeBusinessData({ ...data, debts: [debt, ...data.debts] });
  return debt;
}

export function deleteDebtRecord(debtId: string) {
  const data = readBusinessData();
  const debt = data.debts.find((item) => item.id === debtId);
  if (!debt) throw new Error("Debt ledger not found.");
  writeBusinessData({ ...data, debts: data.debts.filter((item) => item.id !== debtId) });
  return debt;
}

export function saveCustomerRequest(input: CustomerRequestInput) {
  const data = readBusinessData();
  if (!input.productName.trim()) throw new Error("Requested product name is required.");
  if (input.quantity <= 0) throw new Error("Quantity requested must be greater than zero.");
  if (!input.dateRequested) throw new Error("Request date is required.");

  const request: CustomerRequest = {
    id: input.id || makeId("REQ"),
    productName: input.productName.trim(),
    quantity: input.quantity,
    customerName: input.customerName?.trim() || undefined,
    dateRequested: input.dateRequested,
    notes: input.notes?.trim() || undefined,
    status: input.status ?? "Open"
  };
  const customerRequests = input.id
    ? data.customerRequests.map((item) => (item.id === input.id ? request : item))
    : [request, ...data.customerRequests];
  writeBusinessData({ ...data, customerRequests });
  return request;
}

export function deleteCustomerRequest(requestId: string) {
  const data = readBusinessData();
  writeBusinessData({
    ...data,
    customerRequests: data.customerRequests.filter((request) => request.id !== requestId)
  });
}

export function addToCart(productId: string, quantity = 1) {
  const data = readBusinessData();
  const product = data.products.find((item) => item.id === productId);
  if (!product) throw new Error("Product not found.");
  const existing = data.cart.find((item) => item.productId === productId);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  const cart = existing
    ? data.cart.map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item))
    : [...data.cart, { productId, quantity }];
  writeBusinessData({ ...data, cart }, { syncBackend: false });
}

export function updateCartItem(productId: string, quantity: number) {
  const data = readBusinessData();
  const product = data.products.find((item) => item.id === productId);
  if (!product) throw new Error("Product not found.");
  if (quantity < 1) {
    writeBusinessData({ ...data, cart: data.cart.filter((item) => item.productId !== productId) }, { syncBackend: false });
    return;
  }
  writeBusinessData({
    ...data,
    cart: data.cart.map((item) => (item.productId === productId ? { ...item, quantity } : item))
  }, { syncBackend: false });
}

export function removeFromCart(productId: string) {
  const data = readBusinessData();
  writeBusinessData({ ...data, cart: data.cart.filter((item) => item.productId !== productId) }, { syncBackend: false });
}

export function clearCart() {
  const data = readBusinessData();
  writeBusinessData({ ...data, cart: [] }, { syncBackend: false });
}

export function checkoutCart(discount: number) {
  const data = readBusinessData();
  if (!data.cart.length) throw new Error("Cart is empty.");
  if (discount < 0) throw new Error("Discount cannot be negative.");
  const products = data.products.map((product) => {
    const cartItem = data.cart.find((item) => item.productId === product.id);
    if (!cartItem) return product;
    return {
      ...product,
      quantity: product.quantity - cartItem.quantity,
      updatedAt: today(),
      transactionHistory: [
        {
          id: makeId("TX"),
          type: "Stock Out" as const,
          quantity: cartItem.quantity,
          note: "POS checkout",
          date: today()
        },
        ...product.transactionHistory
      ]
    };
  });
  writeBusinessData({ ...data, products, cart: [] });
}

export function completeCartSale(input: CartSaleInput) {
  const data = readBusinessData();
  if (!data.cart.length) throw new Error("Cart is empty.");
  return completeSaleWithLines(data.cart.map((item) => ({ productId: item.productId, quantity: item.quantity })), input, true);
}

export function completeSaleFromItems(items: SaleLineInput[], input: CartSaleInput) {
  if (!items.length) throw new Error("Add at least one item before recording the sale.");
  return completeSaleWithLines(items, input, false);
}

function completeSaleWithLines(items: Array<{ productId: string; quantity: number; price?: number }>, input: CartSaleInput, clearCurrentCart: boolean) {
  const data = readBusinessData();
  const customerName = input.customer.trim() || "Walk-in Customer";
  if (!input.date) throw new Error("Sale date is required.");
  if (input.discount < 0) throw new Error("Discount cannot be negative.");
  if (input.paid < 0) throw new Error("Amount paid cannot be negative.");

  const saleRows = items.map((saleItem) => {
    const product = data.products.find((item) => item.id === saleItem.productId);
    if (!product) throw new Error("One of the cart products no longer exists.");
    if (saleItem.quantity < 1) throw new Error(`${product.name} quantity must be greater than zero.`);
    const unitPrice = saleItem.price ?? product.unitPrice;
    if (unitPrice < 0) throw new Error(`${product.name} price cannot be negative.`);
    return { saleItem, product, unitPrice, subtotal: saleItem.quantity * unitPrice };
  });
  const subtotal = saleRows.reduce((sum, row) => sum + row.subtotal, 0);
  const total = Math.max(0, subtotal - input.discount);
  if (input.paid > total) throw new Error("Amount paid cannot exceed sale total.");

  const products = data.products.map((product) => {
    const productRows = saleRows.filter((item) => item.product.id === product.id);
    if (!productRows.length) return product;
    const soldQuantity = productRows.reduce((sum, row) => sum + row.saleItem.quantity, 0);
    return {
      ...product,
      quantity: product.quantity - soldQuantity,
      updatedAt: today(),
      transactionHistory: [
        {
          id: makeId("TX"),
          type: "Stock Out" as const,
          quantity: soldQuantity,
          note: input.invoiceNo,
          date: input.date
        },
        ...product.transactionHistory
      ]
    };
  });
  const sale: Sale = {
    id: input.invoiceNo,
    customer: customerName,
    product: saleRows.map((row) => row.product.name).join(", "),
    quantity: saleRows.reduce((sum, row) => sum + row.saleItem.quantity, 0),
    total,
    paid: input.paid,
    status: input.paid >= total ? "Paid" : input.paid > 0 ? "Partial" : "Unpaid",
    date: input.date,
    method: input.method
  };
  const balance = total - input.paid;
  const creditDebt: Debt | null = input.method === "Credit" || balance > 0
    ? withDerivedStatus({
        id: makeId("D"),
        customer: customerName,
        product: sale.product,
        quantity: sale.quantity,
        total,
        paid: input.paid,
        dueDate: input.dueDate || today(),
        status: "Current",
        paymentHistory: input.paid > 0
          ? [{ id: makeId("PAY"), amount: input.paid, method: input.method, date: input.date, reference: input.invoiceNo }]
          : []
      })
    : null;

  writeBusinessData({
    ...data,
    products,
    sales: [sale, ...data.sales.filter((item) => item.id !== sale.id)],
    debts: creditDebt ? [creditDebt, ...data.debts] : data.debts,
    cart: clearCurrentCart ? [] : data.cart
  });
  return sale;
}
