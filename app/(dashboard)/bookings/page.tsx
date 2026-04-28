import { CalendarDays, MapPin, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { deleteBookingAction } from "@/app/(dashboard)/_actions";
import { BookingForm } from "./booking-form";
import { requireTenant } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moneyMAD } from "@/lib/utils";

export default async function BookingsPage() {
  await requireTenant();
  const supabase = await createSupabaseServerClient();
  const [{ data: bookings }, { data: clients }, { data: materials }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, clients(full_name, phone), booking_items(*, materials(name, category)), booking_services(*)")
      .order("event_date", { ascending: true }),
    supabase.from("clients").select("id, full_name, phone").order("full_name"),
    supabase.from("materials").select("id, name, rental_price, quantity_available, quantity_total").order("name")
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gold">Module</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-ink">Réservations</h2>
        <p className="mt-2 max-w-2xl text-stone-500">Événements, dates de livraison, retour, avance, reste, services et statuts.</p>
      </div>

      <BookingForm clients={clients || []} materials={materials || []} />

      <div className="space-y-4">
        {(bookings || []).length === 0 ? (
          <div className="premium-card p-8 text-center text-sm text-stone-500">Aucune réservation créée.</div>
        ) : (
          bookings?.map((booking) => {
            const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients;
            const items = booking.booking_items || [];
            const services = booking.booking_services || [];
            return (
              <div key={booking.id} className="premium-card p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-black capitalize text-ink">{booking.event_type}</h3>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="mt-2 text-sm text-stone-600">Client: <span className="font-semibold text-ink">{client?.full_name || "—"}</span></p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-stone-600"><MapPin className="h-4 w-4" /> {booking.location_address}</p>
                  </div>
                  <div className="text-sm text-stone-600 lg:text-right">
                    <p><CalendarDays className="mr-1 inline h-4 w-4" /> Événement: {booking.event_date}</p>
                    <p>Livraison: {booking.delivery_date} — Retour: {booking.return_date}</p>
                    <p className="mt-2 font-bold text-ink">Total: {moneyMAD(booking.total_amount)} / Reste: {moneyMAD(booking.reste_amount)}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 text-sm">
                    <p className="font-bold text-ink">Matériel</p>
                    {items.map((item: any) => {
                      const material = Array.isArray(item.materials) ? item.materials[0] : item.materials;
                      return <p key={item.id} className="mt-1 text-stone-600">{material?.name || "Article"} × {item.quantity} — {moneyMAD(item.line_total)}</p>;
                    })}
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-sm">
                    <p className="font-bold text-ink">Services</p>
                    {services.length ? services.map((service: any) => <p key={service.id} className="mt-1 text-stone-600">{service.name} — {moneyMAD(service.price)}</p>) : <p className="mt-1 text-stone-500">Aucun service.</p>}
                  </div>
                </div>
                <form action={deleteBookingAction} className="mt-4 text-right">
                  <input type="hidden" name="id" value={booking.id} />
                  <button className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Supprimer</button>
                </form>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
