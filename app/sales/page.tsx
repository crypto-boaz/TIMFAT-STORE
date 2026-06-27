"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, DataTable, PageHeader, Panel, StatCard } from "@/components/ui";
import { Notice, type NoticeState } from "@/components/notice";
import { completeCartSale } from "@/lib/business-store";
import { type Sale } from "@/lib/data";
import { useBusinessData } from "@/lib/use-business-data";
import { downloadCsv, money, shortDate } from "@/lib/utils";
import { Download, FileDown, Printer, ReceiptText, ShoppingCart } from "lucide-react";

type InvoiceItem = {
  productId: string;
  name: string;
  serialCode: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  lowStockAt: number;
  price: number;
};

type CustomerForm = {
  fullName: string;
  address: string;
  phone: string;
  email: string;
  date: string;
  paymentMethod: Sale["method"];
  amountPaid: number;
  dueDate: string;
  notes: string;
};

type ReceiptSnapshot = {
  invoiceNo: string;
  customer: CustomerForm;
  items: InvoiceItem[];
  discount: number;
  subtotal: number;
  total: number;
  balance: number;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function SalesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products, cart, sales } = useBusinessData();
  const [discount, setDiscount] = useState(0);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [receipt, setReceipt] = useState<ReceiptSnapshot | null>(null);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [customer, setCustomer] = useState<CustomerForm>({
    fullName: "",
    address: "",
    phone: "",
    email: "",
    date: today(),
    paymentMethod: "Transfer",
    amountPaid: 0,
    dueDate: today(),
    notes: ""
  });

  const cartItems = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        if (!product) return null;
        return {
          productId: product.id,
          name: product.name,
          serialCode: product.serialCode,
          category: product.category,
          quantity: item.quantity,
          availableQuantity: product.quantity,
          lowStockAt: product.lowStockAt,
          price: product.unitPrice
        };
      })
      .filter(Boolean) as InvoiceItem[];
  }, [cart, products]);

  const invoiceItems = cartItems;
  const subtotal = useMemo(() => invoiceItems.reduce((sum, item) => sum + item.quantity * item.price, 0), [invoiceItems]);
  const total = Math.max(0, subtotal - discount);
  const balance = Math.max(0, total - customer.amountPaid);
  const todaySales = sales.filter((sale) => sale.date === today());
  const invoiceNo = useMemo(() => `INV-${customer.date.replaceAll("-", "")}-${String(Date.now()).slice(-5)}`, [customer.date]);
  const receiptCustomer = receipt?.customer ?? customer;
  const receiptItems = receipt?.items ?? invoiceItems;
  const receiptSubtotal = receipt?.subtotal ?? subtotal;
  const receiptDiscount = receipt?.discount ?? discount;
  const receiptTotal = receipt?.total ?? total;
  const receiptBalance = receipt?.balance ?? balance;
  const receiptNo = receipt?.invoiceNo ?? invoiceNo;
  const receiptPrintTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const updateCustomer = <K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) => {
    setCustomer((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    const method = searchParams.get("method");
    const amount = Number(searchParams.get("amount") ?? 0);
    const nextDiscount = Number(searchParams.get("discount") ?? 0);
    if (method === "Cash" || method === "Transfer" || method === "POS" || method === "Credit") {
      setCustomer((current) => ({ ...current, paymentMethod: method, amountPaid: amount > 0 ? amount : current.amountPaid }));
    }
    if (nextDiscount > 0) {
      setDiscount(nextDiscount);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!pendingPrint || !receipt) return;
    const timer = window.setTimeout(() => {
      window.print();
      setPendingPrint(false);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [pendingPrint, receipt]);

  const prepareReceipt = (snapshotInvoiceNo = invoiceNo): ReceiptSnapshot | null => {
    if (!invoiceItems.length) {
      setNotice({ type: "error", message: "Add items to the invoice before recording the sale." });
      return null;
    }
    if (!customer.date) {
      setNotice({ type: "error", message: "Select the invoice date." });
      return null;
    }
    const snapshot = {
      invoiceNo: snapshotInvoiceNo,
      customer: { ...customer },
      items: invoiceItems.map((item) => ({ ...item })),
      discount,
      subtotal,
      total,
      balance
    };
    setReceipt(snapshot);
    return snapshot;
  };

  const printCurrentInvoice = () => {
    const snapshot = prepareReceipt();
    if (!snapshot) return;
    setPendingPrint(true);
  };

  const issueReceipt = () => {
    try {
      const snapshot = prepareReceipt();
      if (!snapshot) return;
      const saleInput = {
        invoiceNo,
        customer: customer.fullName,
        date: customer.date,
        method: customer.paymentMethod,
        paid: customer.amountPaid,
        discount,
        dueDate: customer.dueDate
      };
      const sale = completeCartSale(saleInput);
      setReceipt({
        invoiceNo: sale.id,
        customer: { ...customer },
        items: snapshot.items,
        discount,
        subtotal: snapshot.subtotal,
        total: sale.total,
        balance: sale.total - sale.paid
      });
      setNotice({ type: "success", message: `Sale ${sale.id} recorded. Stock has been updated and the receipt is ready to print.` });
      setPendingPrint(true);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to issue invoice." });
    }
  };

  return (
    <AppShell>
      <div className="print:hidden">
        <PageHeader
          title="Sales & Credit Management"
          description="Create invoices from POS cart items, record cash or credit sales, auto-create debt ledgers, track repayments, and print receipts."
          action={<Button onClick={() => router.push("/cart")}><ShoppingCart size={16} /> Open Cart</Button>}
        />
        <Notice notice={notice} />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Invoices Today" value={todaySales.length} />
          <StatCard label="Sales Value" value={sales.reduce((sum, sale) => sum + sale.total, 0)} tone="success" />
          <StatCard label="Current Balance" value={balance} tone={balance > 0 ? "warning" : "success"} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
          <Panel title="Customer Details">
            <div className="grid gap-3">
              <label className="text-sm font-semibold">Customer Name
                <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={customer.fullName} onChange={(event) => updateCustomer("fullName", event.target.value)} placeholder="Walk-in Customer" />
              </label>
              <label className="text-sm font-semibold">Address
                <textarea className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={customer.address} onChange={(event) => updateCustomer("address", event.target.value)} placeholder="Delivery or billing address" />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold">Date
                  <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" type="date" value={customer.date} onChange={(event) => updateCustomer("date", event.target.value)} />
                </label>
                <label className="text-sm font-semibold">Phone
                  <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} placeholder="+234..." />
                </label>
              </div>
              <label className="text-sm font-semibold">Email
                <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" type="email" value={customer.email} onChange={(event) => updateCustomer("email", event.target.value)} placeholder="Optional email" />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold">Payment Method
                  <select className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={customer.paymentMethod} onChange={(event) => updateCustomer("paymentMethod", event.target.value as Sale["method"])}>
                    <option>Transfer</option>
                    <option>Cash</option>
                    <option>POS</option>
                    <option>Credit</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">Amount Paid
                  <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" type="number" min={0} value={customer.amountPaid} onChange={(event) => updateCustomer("amountPaid", Number(event.target.value))} />
                </label>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="font-black">Credit Sales Area</p>
                <p className="mt-1">Choose Credit or enter an amount below the invoice total. PayTrack will create the sale record, customer debt ledger, outstanding balance, and repayment history automatically.</p>
                <label className="mt-3 block text-sm font-bold">Credit Due Date
                  <input className="mt-1 h-10 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm dark:border-amber-800 dark:bg-slate-950" type="date" value={customer.dueDate} onChange={(event) => updateCustomer("dueDate", event.target.value)} />
                </label>
              </div>
              <label className="text-sm font-semibold">Notes
                <textarea className="mt-1 min-h-16 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={customer.notes} onChange={(event) => updateCustomer("notes", event.target.value)} placeholder="Optional invoice note" />
              </label>
            </div>
          </Panel>

          <Panel title="Invoice Builder">
            {cartItems.length > 0 ? (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                Detected {cartItems.length} cart line{cartItems.length === 1 ? "" : "s"} automatically. Product names, quantities, categories, and prices are ready for the invoice.
              </div>
            ) : (
              <div className="mb-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500 dark:border-slate-700">
                No cart items detected. Add products from Cart/POS first, then return here to record and print the sale.
              </div>
            )}

            <div className="space-y-3">
              {invoiceItems.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[1fr_90px_120px_120px] md:items-center">
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{item.category}</p>
                    {item.availableQuantity <= 0 && <p className="mt-1 text-xs font-black text-red-600 dark:text-red-300">Out of stock. Sale can still be recorded.</p>}
                    {item.availableQuantity > 0 && item.quantity > item.availableQuantity && <p className="mt-1 text-xs font-black text-amber-600 dark:text-amber-300">Insufficient stock: {item.availableQuantity.toLocaleString()} available.</p>}
                    {item.availableQuantity > 0 && item.availableQuantity <= item.lowStockAt && item.quantity <= item.availableQuantity && <p className="mt-1 text-xs font-black text-amber-600 dark:text-amber-300">Low stock item.</p>}
                  </div>
                  <input className="h-10 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-950" type="number" min={1} value={item.quantity} disabled />
                  <input className="h-10 rounded-lg border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-950" type="number" min={0} value={item.price} disabled />
                  <strong className="text-right">{money(item.quantity * item.price)}</strong>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold">Discount
                <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-950" type="number" min={0} max={subtotal} value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
              </label>
              <div className="rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-950">
                <div className="flex justify-between"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                <div className="mt-2 flex justify-between"><span>Discount</span><strong>{money(discount)}</strong></div>
                <div className="mt-2 flex justify-between text-lg"><span>Total</span><strong>{money(total)}</strong></div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={issueReceipt}><ReceiptText size={16} /> Record Sale & Print</Button>
              <Button onClick={printCurrentInvoice} className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"><Printer size={16} /> Print Preview</Button>
              <Button onClick={printCurrentInvoice} className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"><FileDown size={16} /> PDF</Button>
            </div>
          </Panel>
        </div>

        <Panel title="Sales Records" className="mt-6">
          <div className="mb-4">
            <Button className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" onClick={() => downloadCsv("sales.csv", sales)}>
              <Download size={16} /> Export CSV
            </Button>
          </div>
          <DataTable
            headers={["Customer", "Product", "Qty", "Total", "Paid", "Method", "Status", "Date"]}
            rows={sales.map((sale) => [
              sale.customer,
              sale.product,
              sale.quantity,
              money(sale.total),
              money(sale.paid),
              sale.method,
              <Badge key={sale.id} tone={sale.status === "Paid" ? "success" : sale.status === "Partial" ? "warning" : "danger"}>{sale.status}</Badge>,
              shortDate(sale.date)
            ])}
          />
        </Panel>
      </div>

      <main className="receipt-print hidden bg-white text-black print:block">
        <div className="receipt-rule">================================</div>
        <h1>KINGS STORE COSMETICS</h1>
        <p className="receipt-center">No. 162, Ibrahim Taiwo Road</p>
        <p className="receipt-center">Opposite Item 7</p>
        <p className="receipt-center">Phone: 07089741271</p>
        <div className="receipt-title">Invoice</div>
        <div className="receipt-rule">================================</div>

        <div className="receipt-meta">
          <p><span>Invoice:</span><strong>{receiptNo}</strong></p>
          <p><span>Date:</span><strong>{shortDate(receiptCustomer.date)}</strong></p>
          <p><span>Time:</span><strong>{receiptPrintTime}</strong></p>
          <p><span>Customer:</span><strong>{receiptCustomer.fullName || "Walk-in Customer"}</strong></p>
        </div>

        <div className="receipt-line" />
        <div className="receipt-row receipt-head">
          <span>Item</span>
          <span>Qty</span>
          <span>Amt</span>
        </div>
        <div className="receipt-line" />

        <div className="receipt-items">
          {receiptItems.map((item, index) => (
            <div key={`${item.productId}-print-${index}`} className="receipt-item">
              <div className="receipt-row">
                <span>{item.name}</span>
                <span>{item.quantity}</span>
                <span>{money(item.quantity * item.price).replace("₦", "")}</span>
              </div>
              <div className="receipt-unit">@ {money(item.price).replace("₦", "")}</div>
            </div>
          ))}
        </div>

        <div className="receipt-line" />
        <div className="receipt-totals">
          <p><span>SUBTOTAL:</span><strong>{money(receiptSubtotal).replace("₦", "")}</strong></p>
          {receiptDiscount > 0 && <p><span>DISCOUNT:</span><strong>{money(receiptDiscount).replace("₦", "")}</strong></p>}
          <p><span>AMOUNT PAID:</span><strong>{money(receiptCustomer.amountPaid).replace("₦", "")}</strong></p>
          {receiptBalance > 0 && <p><span>BALANCE:</span><strong>{money(receiptBalance).replace("₦", "")}</strong></p>}
        </div>
        <div className="receipt-line" />
        <div className="receipt-grand">
          <span>TOTAL:</span>
          <strong>{money(receiptTotal).replace("₦", "")}</strong>
        </div>
        <div className="receipt-line" />

        <p className="receipt-payment">Payment Method: {receiptCustomer.paymentMethod.toUpperCase()}</p>
        {receiptCustomer.notes && <p className="receipt-notes">{receiptCustomer.notes}</p>}
        <p className="receipt-thanks">Thank You For Shopping</p>
        <div className="receipt-rule">================================</div>
      </main>
    </AppShell>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={null}>
      <SalesContent />
    </Suspense>
  );
}
