import { FileText, Trash2 } from "lucide-react";
import { createInvoiceAction, deleteInvoiceAction } from "@/app/(dashboard)/_actions";
import { requireTenant } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moneyMAD } from "@/lib/utils";

export default async function InvoicesPage() {
  await requireTenant();
  const supabase = await createSupabaseServerClient();
  const [{ data: invoices }, { data: bookings }] = await Promise.all([
    supabase.from("invoices").select("*, bookings(event_date, event_type, clients(full_name))").order("created_at", { ascending: false }),
    supabase.from("bookings").select("id, event_date, event_type, total_amount, clients(full_name)").order("event_date", { ascending: false })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gold">Module</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-ink">Factures</h2>
        <p className="mt-2 max-w-2xl text-stone-500">Générez les factures liées aux réservations et gardez leur historique.</p>
      </div>

      <form action={createInvoiceAction} className="premium-card grid gap-4 p-5 md:grid-cols-[1fr_auto]">
        <select className="input" name="booking_id" required defaultValue="">
          <option value="" disabled>Choisir une réservation</option>
          {(bookings || []).map((booking) => {
            const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients;
            return <option key={booking.id} value={booking.id}>{client?.full_name || "Client"} — {booking.event_date} — {moneyMAD(booking.total_amount)}</option>;
          })}
        </select>
        <button className="btn-primary">Créer facture</button>
      </form>

      <div className="premium-card overflow-hidden">
        {(invoices || []).length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500">Aucune facture créée.</div>
        ) : (
          invoices?.map((invoice) => {
            const booking = Array.isArray(invoice.bookings) ? invoice.bookings[0] : invoice.bookings;
            const client = Array.isArray(booking?.clients) ? booking?.clients[0] : booking?.clients;
            return (
              <div key={invoice.id} className="grid grid-cols-12 items-center border-b border-stone-100 px-5 py-4 last:border-b-0">
                <div className="col-span-5 flex items-center gap-3">
                  <div className="rounded-2xl bg-champagne p-3"><FileText className="h-4 w-4 text-ink" /></div>
                  <div>
                    <p className="font-bold text-ink">{invoice.invoice_number}</p>
                    <p className="text-xs text-stone-500">{client?.full_name || "Client"} — {booking?.event_date || "—"}</p>
                  </div>
                </div>
                <p className="col-span-2 text-sm text-stone-600">{invoice.issue_date}</p>
                <p className="col-span-3 text-sm font-black text-ink">{moneyMAD(invoice.total_amount)}</p>
                <form action={deleteInvoiceAction} className="col-span-2 text-right">
                  <input type="hidden" name="id" value={invoice.id} />
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
