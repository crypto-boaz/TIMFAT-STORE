"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type NoticeState = {
  type: "success" | "error";
  message: string;
} | null;

export function Notice({ notice }: { notice: NoticeState }) {
  if (!notice) return null;
  const Icon = notice.type === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-bold shadow-sm",
        notice.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
      )}
    >
      <Icon size={18} />
      <span>{notice.message}</span>
    </div>
  );
}

