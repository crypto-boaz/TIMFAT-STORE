"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge, Button } from "@/components/ui";
import { Notice, type NoticeState } from "@/components/notice";
import { clearCart, removeFromCart, updateCartItem } from "@/lib/business-store";
import { useBusinessData } from "@/lib/use-business-data";
import { CheckCircle2, CreditCard, Minus, PackageSearch, Plus, ReceiptText, ShoppingBag, ShoppingCart, Sparkles, Trash2, X } from "lucide-react";

function cartAmount(value: number) {
  return new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value);
}

export default function CartPage() {
  const router = useRouter();
  const { products, cart } = useBusinessData();
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Transfer");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  const cartRows = cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return product ? { ...item, product, subtotal: item.quantity * product.unitPrice } : null;
    })
    .filter(Boolean) as Array<{ productId: string; quantity: number; product: typeof products[number]; subtotal: number }>;
  const itemCount = cartRows.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartRows.reduce((sum, item) => sum + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount);
  const stockWarnings = cartRows.filter((item) => item.quantity > item.product.quantity).length;

  const safely = (fn: () => void, success?: string) => {
    try {
      fn();
      if (success) setNotice({ type: "success", message: success });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Action failed." });
    }
  };

  const startPayment = () => {
    if (cartRows.length === 0) {
      setNotice({ type: "error", message: "Add products to the cart before making payment." });
      return;
    }
    setShowPayment(true);
    setPaymentConfirmed(false);
    setNotice({ type: "success", message: "Select a payment method and confirm the payment." });
  };

  const confirmPayment = () => {
    setPaymentConfirmed(true);
    setNotice({
      type: "success",
      message: paymentMethod === "Cash"
        ? "Cash payment confirmed. Continue to Sales to write and print the receipt."
        : `${paymentMethod} payment confirmed. Continue to Sales to print the invoice.`
    });
  };

  const goToSales = () => {
    router.push(`/sales?method=${encodeURIComponent(paymentMethod)}&amount=${total}&discount=${discount}`);
  };

  return (
    <AppShell>
      <section className="overflow-hidden border border-[#d7dde8] bg-[#132037] text-white shadow-md">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-blue-200">
              <Sparkles size={15} /> Point Of Sale Cart
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-normal">Checkout Workspace</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-blue-100/80">
              Products selected from the product list appear here for quantity review, discounts, payment confirmation, and invoice printing.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/10 px-5 py-4">
              <p className="text-[11px] font-black uppercase text-blue-100/70">Items</p>
              <p className="mt-2 text-2xl font-black">{itemCount.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 px-5 py-4">
              <p className="text-[11px] font-black uppercase text-blue-100/70">Lines</p>
              <p className="mt-2 text-2xl font-black">{cartRows.length.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 px-5 py-4">
              <p className="text-[11px] font-black uppercase text-blue-100/70">Total</p>
              <p className="mt-2 text-2xl font-black">₦{cartAmount(total)}</p>
            </div>
          </div>
        </div>
      </section>

      <Notice notice={notice} />

      {cartRows.length === 0 ? (
        <section className="mt-6 grid min-h-[58vh] place-items-center border border-dashed border-[#cbd5e1] bg-white p-8 text-center shadow-sm">
          <div className="max-w-lg">
            <span className="mx-auto grid size-20 place-items-center bg-[#eaf1ff] text-blue-600">
              <ShoppingBag size={40} />
            </span>
            <h2 className="mt-6 text-2xl font-black text-[#06152d]">Cart is ready for selected products</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              Select products from the Products page and they will fill this checkout space automatically.
            </p>
            <Button className="mt-6 h-12 bg-[#2f63e5] px-6" onClick={() => router.push("/inventory")}>
              <PackageSearch size={18} /> Open Products
            </Button>
          </div>
        </section>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="border border-[#d7dde8] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#d7dde8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#06152d]">Selected Products</h2>
                <p className="text-sm font-semibold text-slate-500">{cartRows.length} product line{cartRows.length === 1 ? "" : "s"} ready for checkout</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {stockWarnings > 0 && <Badge tone="warning">{stockWarnings} stock warning{stockWarnings === 1 ? "" : "s"}</Badge>}
                <Button className="h-9 bg-white px-3 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => router.push("/inventory")}>
                  <Plus size={15} /> Add More
                </Button>
              </div>
            </div>

            <div className="divide-y divide-[#edf1f7]">
              {cartRows.map((item, index) => (
                <div key={item.productId} className="grid gap-4 px-5 py-4 lg:grid-cols-[52px_minmax(0,1fr)_180px_150px_44px] lg:items-center">
                  <div className="grid size-12 place-items-center bg-[#f1f5f9] text-sm font-black text-slate-500">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-base font-black text-[#06152d]">{item.product.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                      <span>{item.product.category}</span>
                      <span>•</span>
                      <span>{cartAmount(item.product.unitPrice)} each</span>
                      <span>•</span>
                      <span>{item.product.quantity.toLocaleString()} available</span>
                    </div>
                    {item.quantity > item.product.quantity && (
                      <p className="mt-2 text-xs font-black text-amber-600">Selected quantity is higher than current stock.</p>
                    )}
                  </div>
                  <div className="flex h-11 items-center justify-between bg-[#f8fafc] px-2">
                    <Button className="size-8 bg-[#132037] p-0" onClick={() => safely(() => updateCartItem(item.productId, item.quantity - 1))}>
                      <Minus size={14} />
                    </Button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => safely(() => updateCartItem(item.productId, Number(event.target.value)))}
                      className="h-9 w-16 bg-transparent text-center text-sm font-black text-[#06152d] outline-none"
                    />
                    <Button className="size-8 bg-[#132037] p-0" onClick={() => safely(() => updateCartItem(item.productId, item.quantity + 1))}>
                      <Plus size={14} />
                    </Button>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-xs font-black uppercase text-slate-500">Subtotal</p>
                    <p className="mt-1 text-xl font-black text-[#06152d]">₦{cartAmount(item.subtotal)}</p>
                  </div>
                  <button
                    type="button"
                    className="grid size-10 place-items-center bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                    onClick={() => safely(() => removeFromCart(item.productId))}
                    aria-label={`Remove ${item.product.name}`}
                    title="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="border border-[#d7dde8] bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-10 place-items-center bg-[#eaf1ff] text-blue-600">
                  <ShoppingCart size={20} />
                </span>
                <div>
                  <h2 className="font-black text-[#06152d]">Order Summary</h2>
                  <p className="text-xs font-semibold text-slate-500">Broad, simple checkout total</p>
                </div>
              </div>

              <label className="text-sm font-bold text-[#06152d]">
                Discount
                <input
                  type="number"
                  min={0}
                  max={subtotal}
                  className="mt-2 h-12 w-full border border-[#d7dde8] px-3 text-lg font-black outline-none focus:border-blue-500"
                  value={discount}
                  onChange={(event) => setDiscount(Number(event.target.value))}
                />
              </label>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><strong className="text-[#06152d]">₦{cartAmount(subtotal)}</strong></div>
                <div className="flex justify-between text-slate-600"><span>Discount</span><strong className="text-[#06152d]">₦{cartAmount(discount)}</strong></div>
                <div className="border-t border-[#d7dde8] pt-4">
                  <p className="text-xs font-black uppercase text-slate-500">Total Due</p>
                  <p className="mt-1 text-4xl font-black text-[#06152d]">₦{cartAmount(total)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                <Button className="h-12 bg-[#0f956a]" onClick={startPayment}>
                  <CreditCard size={17} /> Make Payment
                </Button>
                <Button className="h-11 bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => safely(clearCart, "Cart cleared.")}>
                  <X size={16} /> Clear Cart
                </Button>
              </div>
            </section>

            {showPayment && (
              <section className="border border-[#d7dde8] bg-[#f8fafc] p-5 shadow-sm">
                <h2 className="font-black text-[#06152d]">Payment</h2>
                <label className="mt-4 block text-sm font-bold text-[#06152d]">
                  Payment Method
                  <select
                    className="mt-2 h-12 w-full border border-[#d7dde8] bg-white px-3 font-bold outline-none focus:border-blue-500"
                    value={paymentMethod}
                    onChange={(event) => {
                      setPaymentMethod(event.target.value);
                      setPaymentConfirmed(false);
                    }}
                  >
                    <option>Transfer</option>
                    <option>Cash</option>
                    <option>POS</option>
                    <option>Credit</option>
                  </select>
                </label>
                <p className="mt-4 bg-white p-3 text-sm font-semibold text-slate-600">
                  {paymentMethod === "Cash"
                    ? "Cash selected. Confirm after receiving the cash."
                    : `${paymentMethod} selected. Confirm after payment is received.`}
                </p>
                <div className="mt-4 grid gap-2">
                  <Button className="h-11 bg-[#2f63e5]" onClick={confirmPayment}>
                    <CheckCircle2 size={16} /> Confirm Payment
                  </Button>
                  {paymentConfirmed && (
                    <Button className="h-11 bg-[#132037]" onClick={goToSales}>
                      <ReceiptText size={16} /> Go to Sales / Print Invoice
                    </Button>
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      )}
    </AppShell>
  );
}
