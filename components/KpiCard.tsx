import type { LucideIcon } from "lucide-react";

export function KpiCard({
  title,
  value,
  hint,
  icon: Icon
}: {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <div className="premium-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-500">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-ink">{value}</p>
        </div>
        <div className="rounded-2xl bg-champagne p-3 text-ink">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-stone-500">{hint}</p>
    </div>
  );
}
