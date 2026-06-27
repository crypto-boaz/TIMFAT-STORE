import type { BusinessData } from "@/lib/business-store";

export type SmartNotification = {
  id: string;
  title: string;
  type: "Inventory" | "Customer Debt" | "Supplier Payment" | "Customer Request" | "Sales";
  priority: "High" | "Medium" | "Normal";
  message: string;
  href: string;
  dueDate?: string;
  amount?: number;
  person?: string;
  product?: string;
  status?: string;
};

const READ_NOTIFICATIONS_KEY = "paytrack_read_notifications";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readNotificationIds() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(READ_NOTIFICATIONS_KEY) ?? "[]") as string[]);
  } catch {
    return new Set<string>();
  }
}

export function isSmartNotificationRead(id: string) {
  return readNotificationIds().has(id);
}

export function markSmartNotificationsRead(ids: string[]) {
  if (typeof window === "undefined") return;
  const readIds = readNotificationIds();
  ids.forEach((id) => readIds.add(id));
  window.localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...readIds]));
  window.dispatchEvent(new CustomEvent("smart-notifications-read"));
}

export function buildSmartNotifications(data: BusinessData): SmartNotification[] {
  const currentDate = today();
  const lowStock = data.products
    .filter((product) => product.quantity <= product.lowStockAt)
    .map((product) => ({
      id: `low-stock-${product.id}`,
      title: `Low stock: ${product.name}`,
      type: "Inventory" as const,
      priority: "High" as const,
      message: `${product.quantity.toLocaleString()} available. Reorder level is ${product.lowStockAt.toLocaleString()}.`,
      href: `/inventory?product=${encodeURIComponent(product.id)}`,
      product: product.name,
      status: "Low stock"
    }));

  const debtAlerts = data.debts
    .filter((debt) => debt.status !== "Settled")
    .map((debt) => {
      const overdue = debt.dueDate < currentDate;
      return {
        id: `debt-${debt.id}`,
        title: `${overdue ? "Overdue debt" : debt.dueDate === currentDate ? "Debt due today" : "Customer debt"}: ${debt.customer}`,
        type: "Customer Debt" as const,
        priority: overdue || debt.dueDate === currentDate ? "High" as const : "Medium" as const,
        message: `${debt.product} - balance ${(debt.total - debt.paid).toLocaleString()} due ${debt.dueDate}.`,
        href: "/debts",
        dueDate: debt.dueDate,
        amount: debt.total - debt.paid,
        person: debt.customer,
        product: debt.product,
        status: debt.status
      };
    });

  const supplierAlerts = data.suppliers
    .filter((supplier) => supplier.total > supplier.paid)
    .map((supplier) => ({
      id: `supplier-${supplier.id}`,
      title: `Supplier payment due: ${supplier.name}`,
      type: "Supplier Payment" as const,
      priority: supplier.dueDate && supplier.dueDate <= currentDate ? "High" as const : "Medium" as const,
      message: `${supplier.product} - balance ${(supplier.total - supplier.paid).toLocaleString()}${supplier.dueDate ? ` due ${supplier.dueDate}` : ""}.`,
      href: "/suppliers",
      dueDate: supplier.dueDate,
      amount: supplier.total - supplier.paid,
      person: supplier.name,
      product: supplier.product,
      status: supplier.dueDate && supplier.dueDate < currentDate ? "Overdue" : "Pending"
    }));

  const requestAlerts = data.customerRequests
    .filter((request) => request.status === "Open")
    .map((request) => ({
      id: `request-${request.id}`,
      title: `Requested product: ${request.productName}`,
      type: "Customer Request" as const,
      priority: "Normal" as const,
      message: `${request.quantity.toLocaleString()} requested${request.customerName ? ` by ${request.customerName}` : ""}.`,
      href: "/requests",
      person: request.customerName,
      product: request.productName,
      status: request.status
    }));

  return [...lowStock, ...debtAlerts, ...supplierAlerts, ...requestAlerts];
}
