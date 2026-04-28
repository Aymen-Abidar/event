import { KpiCard } from "@/components/KpiCard";
import { CalendarDays, CreditCard, PackageCheck, Users, WalletCards } from "lucide-react";
import { requireTenant } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moneyMAD } from "@/lib/utils";

export default async function ReportsPage() {
  await requireTenant();
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";

  const [{ count: clients }, { count: materials }, { count: bookings }, { data: payments }, { data: unpaid }, { data: topItems }] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("materials").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("amount").gte("payment_date", monthStart),
    supabase.from("bookings").select("reste_amount").gt("reste_amount", 0),
    supabase.from("booking_items").select("quantity, materials(name)").limit(1000)
  ]);

  const revenue = (payments || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const reste = (unpaid || []).reduce((sum, row) => sum + Number(row.reste_amount || 0), 0);
  const itemMap = new Map<string, number>();
  (topItems || []).forEach((row: any) => {
    const material = Array.isArray(row.materials) ? row.materials[0] : row.materials;
    const name = material?.name || "Article";
    itemMap.set(name, (itemMap.get(name) || 0) + Number(row.quantity || 0));
  });
  const top = Array.from(itemMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-gold">Module</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-ink">Rapports</h2>
        <p className="mt-2 max-w-2xl text-stone-500">Revenus, impayés, matériel le plus loué, disponibilité et statistiques.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Clients" value={`${clients || 0}`} hint="Total clients" icon={Users} />
        <KpiCard title="Matériel" value={`${materials || 0}`} hint="Articles enregistrés" icon={PackageCheck} />
        <KpiCard title="Réservations" value={`${bookings || 0}`} hint="Toutes les réservations" icon={CalendarDays} />
        <KpiCard title="Revenu mois" value={moneyMAD(revenue)} hint="Paiements reçus" icon={WalletCards} />
        <KpiCard title="Reste impayé" value={moneyMAD(reste)} hint="À récupérer" icon={CreditCard} />
      </div>

      <div className="premium-card p-5">
        <h3 className="text-lg font-black text-ink">Top matériel loué</h3>
        <div className="mt-4 space-y-3">
          {top.length === 0 ? <p className="text-sm text-stone-500">Pas encore de données.</p> : top.map(([name, quantity]) => (
            <div key={name} className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm">
              <span className="font-semibold text-ink">{name}</span>
              <span className="text-stone-600">{quantity} unités</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
