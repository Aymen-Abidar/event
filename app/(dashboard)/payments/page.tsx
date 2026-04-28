import { Trash2, WalletCards } from "lucide-react";
import { createPaymentAction, deletePaymentAction } from "@/app/(dashboard)/_actions";
import { requireTenant } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moneyMAD } from "@/lib/utils";

export default async function PaymentsPage() {
  await requireTenant();
  const supabase = await createSupabaseServerClient();
  const [{ data: payments }, { data: bookings }] = await Promise.all([
    supabase.from("payments").select("*, bookings(event_type, event_date, total_amount, reste_amount, clients(full_name))").order("payment_date", { ascending: false }),
    supabase.from("bookings").select("id, event_type, event_date, total_amount, reste_amount, clients(full_name)").order("event_date", { ascending: false })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gold">Module</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-ink">Paiements</h2>
        <p className="mt-2 max-w-2xl text-stone-500">Avance, reste, mode de paiement et historique financier.</p>
      </div>

      <form action={createPaymentAction} className="premium-card grid gap-4 p-5 md:grid-cols-6">
        <select className="input md:col-span-2" name="booking_id" required defaultValue="">
          <option value="" disabled>Choisir une réservation</option>
          {(bookings || []).map((booking) => {
            const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients;
            return <option key={booking.id} value={booking.id}>{client?.full_name || "Client"} — {booking.event_date} — reste {moneyMAD(booking.reste_amount)}</option>;
          })}
        </select>
        <input className="input" name="amount" type="number" min="1" step="0.01" placeholder="Montant" required />
        <select className="input" name="method" defaultValue="cash">
          <option value="cash">Cash</option>
          <option value="bank_transfer">Virement</option>
          <option value="check">Chèque</option>
          <option value="other">Autre</option>
        </select>
        <input className="input" name="payment_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
        <button className="btn-primary">Ajouter</button>
        <input className="input md:col-span-6" name="notes" placeholder="Notes optionnelles" />
      </form>

      <div className="premium-card overflow-hidden">
        {(payments || []).length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500">Aucun paiement ajouté.</div>
        ) : (
          payments?.map((payment) => {
            const booking = Array.isArray(payment.bookings) ? payment.bookings[0] : payment.bookings;
            const client = Array.isArray(booking?.clients) ? booking?.clients[0] : booking?.clients;
            return (
              <div key={payment.id} className="grid grid-cols-12 items-center border-b border-stone-100 px-5 py-4 last:border-b-0">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-champagne p-3"><WalletCards className="h-4 w-4 text-ink" /></div>
                  <div>
                    <p className="font-bold text-ink">{client?.full_name || "Client"}</p>
                    <p className="text-xs text-stone-500">{booking?.event_date || "—"}</p>
                  </div>
                </div>
                <p className="col-span-2 text-sm font-black text-ink">{moneyMAD(payment.amount)}</p>
                <p className="col-span-2 text-sm text-stone-600">{payment.method}</p>
                <p className="col-span-2 text-sm text-stone-600">{payment.payment_date}</p>
                <form action={deletePaymentAction} className="col-span-2 text-right">
                  <input type="hidden" name="id" value={payment.id} />
                  <input type="hidden" name="booking_id" value={payment.booking_id} />
                  <button className="rounded-xl p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </form>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
