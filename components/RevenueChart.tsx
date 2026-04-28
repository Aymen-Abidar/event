"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { month: "Jan", revenue: 12000 },
  { month: "Fév", revenue: 18500 },
  { month: "Mar", revenue: 26000 },
  { month: "Avr", revenue: 33500 },
  { month: "Mai", revenue: 29000 },
  { month: "Juin", revenue: 41000 }
];

export function RevenueChart() {
  return (
    <div className="premium-card p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-ink">Revenus mensuels</h2>
          <p className="text-sm text-stone-500">Vue commerciale rapide</p>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C79A42" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#C79A42" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D7" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="revenue" stroke="#C79A42" fill="url(#revenue)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
