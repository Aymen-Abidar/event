import { CalendarDays, Truck, Undo2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { requireTenant } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moneyMAD } from "@/lib/utils";

export default async function CalendarPage() {
  await requireTenant();
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, event_type, event_date, delivery_date, return_date, location_address, status, total_amount, reste_amount, clients(full_name, phone)")
    .gte("return_date", today)
    .order("delivery_date", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gold">Module</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-ink">Calendrier</h2>
        <p className="mt-2 max-w-2xl text-stone-500">Vue rapide des événements, livraisons, retours et statuts.</p>
      </div>

      <div className="grid gap-4">
        {(bookings || []).length === 0 ? (
          <div className="premium-card p-8 text-center text-sm text-stone-500">Aucun événement à venir.</div>
        ) : (
          bookings?.map((booking) => {
            const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients;
            return (
              <div key={booking.id} className="premium-card grid gap-4 p-5 lg:grid-cols-[1fr_1fr_1fr]">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-champagne p-3"><CalendarDays className="h-5 w-5 text-ink" /></div>
                    <div>
                      <p className="font-black capitalize text-ink">{booking.event_type}</p>
                      <p className="text-sm text-stone-500">{client?.full_name || "Client"} · {client?.phone || "—"}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-stone-600">{booking.location_address}</p>
                </div>
                <div className="space-y-2 text-sm text-stone-600">
                  <p><Truck className="mr-2 inline h-4 w-4" /> Livraison: {booking.delivery_date}</p>
                  <p><CalendarDays className="mr-2 inline h-4 w-4" /> Événement: {booking.event_date}</p>
                  <p><Undo2 className="mr-2 inline h-4 w-4" /> Retour: {booking.return_date}</p>
                </div>
                <div className="lg:text-right">
                  <StatusBadge status={booking.status} />
                  <p className="mt-3 text-sm font-semibold text-ink">Total: {moneyMAD(booking.total_amount)}</p>
                  <p className="text-sm text-stone-600">Reste: {moneyMAD(booking.reste_amount)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
