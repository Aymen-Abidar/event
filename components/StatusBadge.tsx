const styles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  delivered: "border-blue-200 bg-blue-50 text-blue-700",
  returned: "border-stone-200 bg-stone-50 text-stone-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  unpaid: "border-red-200 bg-red-50 text-red-700",
  partial: "border-amber-200 bg-amber-50 text-amber-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  trial: "border-blue-200 bg-blue-50 text-blue-700",
  expired: "border-red-200 bg-red-50 text-red-700",
  blocked: "border-red-200 bg-red-50 text-red-700",
  excellent: "border-emerald-200 bg-emerald-50 text-emerald-700",
  good: "border-blue-200 bg-blue-50 text-blue-700",
  damaged: "border-amber-200 bg-amber-50 text-amber-700",
  maintenance: "border-purple-200 bg-purple-50 text-purple-700"
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${styles[status] || styles.returned}`}>{status}</span>;
}
