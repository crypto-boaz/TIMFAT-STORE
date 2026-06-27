"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/utils";

type TrendPoint = {
  month?: string;
  revenue?: number;
  expenses?: number;
  profit?: number;
};

export function FinanceTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `${Number(value) / 1000000}m`} />
        <Tooltip formatter={(value) => money(Number(value))} />
        <Line type="monotone" dataKey="revenue" stroke="#147a51" strokeWidth={3} />
        <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={3} />
        <Line type="monotone" dataKey="profit" stroke="#2563eb" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
}
