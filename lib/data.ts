export type Role = "ADMIN" | "STAFF" | "ACCOUNTANT" | "WAREHOUSE";

export type Product = {
  id: string;
  serialCode: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  supplier: string;
  dateAdded: string;
  updatedAt: string;
  lowStockAt: number;
  transactionHistory: ProductTransaction[];
};

export type ProductTransaction = {
  id: string;
  type: "Stock In" | "Stock Out" | "Adjustment";
  quantity: number;
  note: string;
  date: string;
};

export type Sale = {
  id: string;
  customer: string;
  product: string;
  quantity: number;
  total: number;
  paid: number;
  status: "Paid" | "Partial" | "Unpaid";
  date: string;
  method: "Cash" | "Transfer" | "POS" | "Credit";
};

export type Debt = {
  id: string;
  customer: string;
  product: string;
  quantity?: number;
  total: number;
  paid: number;
  dueDate: string;
  status: "Current" | "Overdue" | "Settled";
  paymentHistory: PaymentRecord[];
};

export type PaymentRecord = {
  id: string;
  amount: number;
  method: "Cash" | "Transfer" | "POS" | "Credit";
  date: string;
  reference: string;
};

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  email?: string;
  address?: string;
  product: string;
  quantity: number;
  costPrice: number;
  total: number;
  paid: number;
  deliveryDate: string;
  dueDate?: string;
};

export type CustomerRequest = {
  id: string;
  productName: string;
  quantity: number;
  customerName?: string;
  dateRequested: string;
  notes?: string;
  status: "Open" | "Sourced" | "Closed";
};

export type Expense = {
  id: string;
  category: "Transport" | "Fuel" | "Salaries" | "Repairs" | "Warehouse" | "Utilities";
  description: string;
  amount: number;
  date: string;
};

export const products: Product[] = [
  { id: "KSC-FLIT-001", serialCode: "KSC-FLIT-001", name: "BNC Mosquito Big Flit", category: "Insecticides", quantity: 7, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [{ id: "TX-KSC-FLIT-001", type: "Stock In", quantity: 7, note: "Opening stock", date: "2026-06-03" }] },
  { id: "KSC-FLIT-002", serialCode: "KSC-FLIT-002", name: "BNC Mosquito Small", category: "Insecticides", quantity: 0, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [] },
  { id: "KSC-FLIT-003", serialCode: "KSC-FLIT-003", name: "Mr Gecko Big", category: "Insecticides", quantity: 4, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [{ id: "TX-KSC-FLIT-003", type: "Stock In", quantity: 4, note: "Opening stock", date: "2026-06-03" }] },
  { id: "KSC-FLIT-004", serialCode: "KSC-FLIT-004", name: "Mr Gecko Small", category: "Insecticides", quantity: 5, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [{ id: "TX-KSC-FLIT-004", type: "Stock In", quantity: 5, note: "Opening stock", date: "2026-06-03" }] },
  { id: "KSC-FLIT-005", serialCode: "KSC-FLIT-005", name: "Raid A Dream Big", category: "Insecticides", quantity: 1, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [{ id: "TX-KSC-FLIT-005", type: "Stock In", quantity: 1, note: "Opening stock", date: "2026-06-03" }] },
  { id: "KSC-FLIT-006", serialCode: "KSC-FLIT-006", name: "Sniper", category: "Insecticides", quantity: 8, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [{ id: "TX-KSC-FLIT-006", type: "Stock In", quantity: 8, note: "Opening stock", date: "2026-06-03" }] },
  { id: "KSC-FLIT-007", serialCode: "KSC-FLIT-007", name: "Slap", category: "Insecticides", quantity: 4, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [{ id: "TX-KSC-FLIT-007", type: "Stock In", quantity: 4, note: "Opening stock", date: "2026-06-03" }] },
  { id: "KSC-FLIT-008", serialCode: "KSC-FLIT-008", name: "Raid Big", category: "Insecticides", quantity: 0, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [] },
  { id: "KSC-FLIT-009", serialCode: "KSC-FLIT-009", name: "Raid Small", category: "Insecticides", quantity: 5, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [{ id: "TX-KSC-FLIT-009", type: "Stock In", quantity: 5, note: "Opening stock", date: "2026-06-03" }] },
  { id: "KSC-FLIT-010", serialCode: "KSC-FLIT-010", name: "Bagon Big", category: "Insecticides", quantity: 0, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [] },
  { id: "KSC-FLIT-011", serialCode: "KSC-FLIT-011", name: "Bagon Small", category: "Insecticides", quantity: 3, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [{ id: "TX-KSC-FLIT-011", type: "Stock In", quantity: 3, note: "Opening stock", date: "2026-06-03" }] },
  { id: "KSC-FLIT-012", serialCode: "KSC-FLIT-012", name: "Sniper Chemical Big", category: "Insecticides", quantity: 0, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [] },
  { id: "KSC-FLIT-013", serialCode: "KSC-FLIT-013", name: "Sniper Chemical Small", category: "Insecticides", quantity: 3, unitPrice: 0, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 2, transactionHistory: [{ id: "TX-KSC-FLIT-013", type: "Stock In", quantity: 3, note: "Opening stock", date: "2026-06-03" }] },
  { id: "KSC-FLIT-014", serialCode: "KSC-FLIT-014", name: "Goodnight Electric Mosquito", category: "Insecticides", quantity: 20, unitPrice: 4000, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 5, transactionHistory: [{ id: "TX-KSC-FLIT-014", type: "Stock In", quantity: 20, note: "Opening stock", date: "2026-06-03" }] },
  { id: "KSC-FLIT-015", serialCode: "KSC-FLIT-015", name: "Cockroach Powder", category: "Insecticides", quantity: 20, unitPrice: 4000, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 5, transactionHistory: [{ id: "TX-KSC-FLIT-015", type: "Stock In", quantity: 20, note: "Opening stock", date: "2026-06-03" }] },
  { id: "KSC-FLIT-016", serialCode: "KSC-FLIT-016", name: "BNC Coil", category: "Insecticides", quantity: 12, unitPrice: 4000, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 5, transactionHistory: [{ id: "TX-KSC-FLIT-016", type: "Stock In", quantity: 12, note: "Opening stock", date: "2026-06-03" }] },
  { id: "KSC-FLIT-017", serialCode: "KSC-FLIT-017", name: "Rainbow Coil", category: "Insecticides", quantity: 12, unitPrice: 4000, costPrice: 0, supplier: "", dateAdded: "2026-06-03", updatedAt: "2026-06-03", lowStockAt: 5, transactionHistory: [{ id: "TX-KSC-FLIT-017", type: "Stock In", quantity: 12, note: "Opening stock", date: "2026-06-03" }] }
];

export const sales: Sale[] = [];

export const debts: Debt[] = [];

export const suppliers: Supplier[] = [];

export const expenses: Expense[] = [];

export const revenueSeries = [];

export const productPerformance = [];

export const notifications = [];

export const kpis = {
  totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
  monthlyRevenue: 47600000,
  dailyRevenue: sales.filter((sale) => sale.date === "2026-05-29").reduce((sum, sale) => sum + sale.total, 0),
  debts: debts.reduce((sum, debt) => sum + (debt.total - debt.paid), 0),
  expenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
  supplierBalances: suppliers.reduce((sum, supplier) => sum + (supplier.total - supplier.paid), 0)
};

export const customerRequests: CustomerRequest[] = [];

export const netProfit = 0;
