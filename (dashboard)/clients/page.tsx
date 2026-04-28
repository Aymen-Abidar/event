import { Trash2, UserRound } from "lucide-react";
import { createClientAction, deleteClientAction } from "@/app/(dashboard)/_actions";
import { requireTenant } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ClientsPage() {
  await requireTenant();
  const supabase = await createSupabaseServerClient();
  const { data: clients } = await supabase.from("clients").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gold">Module</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-ink">Clients</h2>
        <p className="mt-2 max-w-2xl text-stone-500">Informations client, CIN, WhatsApp, historique et documents attachés.</p>
      </div>

      <form action={createClientAction} className="premium-card grid gap-4 p-5 md:grid-cols-6">
        <input className="input md:col-span-2" name="full_name" placeholder="Nom complet" required />
        <input className="input" name="phone" placeholder="Téléphone" required />
        <input className="input" name="whatsapp" placeholder="WhatsApp" />
        <input className="input" name="email" type="email" placeholder="Email" />
        <input className="input" name="cin_number" placeholder="CIN" />
        <input className="input md:col-span-5" name="address" placeholder="Adresse" />
        <button className="btn-primary">Ajouter</button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(clients || []).length === 0 ? (
          <div className="premium-card p-8 text-center text-sm text-stone-500 md:col-span-2 xl:col-span-3">Aucun client ajouté.</div>
        ) : (
          clients?.map((client) => (
            <div key={client.id} className="premium-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-champagne p-3"><UserRound className="h-5 w-5 text-ink" /></div>
                  <div>
                    <p className="font-black text-ink">{client.full_name}</p>
                    <p className="text-sm text-stone-500">{client.phone}</p>
                  </div>
                </div>
                <form action={deleteClientAction}>
                  <input type="hidden" name="id" value={client.id} />
                  <button className="rounded-xl p-2 text-red-600 hover:bg-red-50" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </form>
              </div>
              <div className="mt-4 space-y-1 text-sm text-stone-600">
                <p>WhatsApp: {client.whatsapp || "—"}</p>
                <p>Email: {client.email || "—"}</p>
                <p>CIN: {client.cin_number || "—"}</p>
                <p>Adresse: {client.address || "—"}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
