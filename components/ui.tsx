import { cn, money } from "@/lib/utils";
import Link from "next/link";

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-normal text-slate-950 dark:text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {action && <div className="mt-4 sm:mt-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
  detail
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning" | "danger";
  detail?: string;
}) {
  const tones = {
    default: "border-slate-200/90 from-white to-slate-50 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950",
    success: "border-emerald-200 from-white to-emerald-50/70 dark:border-emerald-900 dark:from-slate-900 dark:to-emerald-950/30",
    warning: "border-amber-200 from-white to-amber-50/70 dark:border-amber-900 dark:from-slate-900 dark:to-amber-950/25",
    danger: "border-red-200 from-white to-red-50/70 dark:border-red-900 dark:from-slate-900 dark:to-red-950/25"
  };

  return (
    <div className={cn("rounded-lg border bg-gradient-to-br p-5 shadow-soft transition hover:shadow-md", tones[tone])}>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
        {typeof value === "number" ? money(value) : value}
      </p>
      {detail && <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{detail}</p>}
    </div>
  );
}

export function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-slate-200/90 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900", className)}>
      <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <span className="h-5 w-1.5 rounded-full bg-brand-600" />
        <h2 className="text-base font-black text-slate-950 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function DataTable({
  headers,
  rows,
  rowHrefs
}: {
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
  rowHrefs?: string[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-100/80 dark:bg-slate-950">
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-black">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row, index) => (
            <tr key={index} className={cn("bg-white transition odd:bg-slate-50/50 hover:bg-brand-50/70 dark:bg-slate-900 dark:odd:bg-slate-950/45 dark:hover:bg-slate-800/80", rowHrefs?.[index] && "cursor-pointer")}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  {rowHrefs?.[index] ? (
                    <Link href={rowHrefs[index]} className="block">
                      {cell}
                    </Link>
                  ) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "success" | "warning" | "danger" }) {
  const tones = {
    default: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
    success: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900",
    warning: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900",
    danger: "bg-red-100 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
  };

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1", tones[tone])}>{children}</span>;
}

export function Button({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}
