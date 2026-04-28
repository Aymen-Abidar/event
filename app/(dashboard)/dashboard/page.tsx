import { KpiCard } from "@/components/KpiCard";
import { RevenueChart } from "@/components/RevenueChart";
import { CalendarDays, CreditCard, PackageCheck, TimerReset, WalletCards } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { moneyMAD } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

export default async function DashboardPage() {
  const { profile } = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ count: bookingsCount }, { data: payments }, { data: upcoming }] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("amount").gte("payment_date", today.slice(0, 8) + "01"),
    supabase
      .from("bookings")
      .select("id, event_type, event_date, status, total_amount, reste_amount")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(5)
  ]);

  const revenue = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const reste = (upcoming || []).reduce((sum, b) => sum + Number(b.reste_amount || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-gold">Dashboard</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-ink">Vue générale commerciale</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Réservations" value={`${bookingsCount || 0}`} hint="Toutes les réservations" icon={CalendarDays} />
        <KpiCard title="Revenu mois" value={moneyMAD(revenue)} hint="Paiements reçus ce mois" icon={WalletCards} />
        <KpiCard title="Reste à payer" value={moneyMAD(reste)} hint="Upcoming unpaid balance" icon={CreditCard} />
        <KpiCard title="Stock" value="Live" hint="Disponibilité par date" icon={PackageCheck} />
        <KpiCard title="Retours" value="À vérifier" hint="Retards et retours proches" icon={TimerReset} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <RevenueChart />
        <div className="premium-card p-5">
          <h2 className="text-lg font-black text-ink">Prochains événements</h2>
          <div className="mt-5 space-y-3">
            {(upcoming || []).length === 0 ? (
              <p className="text-sm text-stone-500">Aucun événement prochain.</p>
            ) : (
              upcoming?.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-stone-100 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold capitalize text-ink">{booking.event_type}</p>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="mt-2 text-sm text-stone-500">{booking.event_date}</p>
                  <p className="mt-1 text-sm font-semibold text-stone-700">Reste: {moneyMAD(booking.reste_amount)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
