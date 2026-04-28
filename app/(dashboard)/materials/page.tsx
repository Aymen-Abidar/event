import { Package, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { createMaterialAction, deleteMaterialAction } from "@/app/(dashboard)/_actions";
import { requireTenant } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moneyMAD } from "@/lib/utils";

export default async function MaterialsPage() {
  await requireTenant();
  const supabase = await createSupabaseServerClient();
  const { data: materials } = await supabase.from("materials").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-gold">Module</p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-ink">Matériel / Produits</h2>
          <p className="mt-2 max-w-2xl text-stone-500">Chaises, tables, tentes, décoration, sonorisation, éclairage et articles traiteur.</p>
        </div>
      </div>

      <form action={createMaterialAction} className="premium-card grid gap-4 p-5 md:grid-cols-6">
        <input className="input md:col-span-2" name="name" placeholder="Nom du matériel" required />
        <input className="input" name="category" placeholder="Catégorie" required />
        <input className="input" name="quantity_total" type="number" min="0" placeholder="Quantité" required />
        <input className="input" name="rental_price" type="number" min="0" step="0.01" placeholder="Prix / jour" required />
        <select className="input" name="condition_status" defaultValue="good">
          <option value="excellent">Excellent</option>
          <option value="good">Bon</option>
          <option value="damaged">Abîmé</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <textarea className="input md:col-span-5" name="notes" placeholder="Notes optionnelles" rows={2} />
        <button className="btn-primary md:col-span-1">Ajouter</button>
      </form>

      <div className="premium-card overflow-hidden">
        <div className="grid grid-cols-12 border-b border-stone-100 px-5 py-3 text-xs font-bold uppercase tracking-wide text-stone-500">
          <span className="col-span-4">Matériel</span>
          <span className="col-span-2">Stock</span>
          <span className="col-span-2">Prix</span>
          <span className="col-span-2">État</span>
          <span className="col-span-2 text-right">Action</span>
        </div>
        {(materials || []).length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500">Aucun matériel ajouté.</div>
        ) : (
          materials?.map((item) => (
            <div key={item.id} className="grid grid-cols-12 items-center border-b border-stone-100 px-5 py-4 last:border-b-0">
              <div className="col-span-4 flex items-center gap-3">
                <div className="rounded-2xl bg-champagne p-3"><Package className="h-4 w-4 text-ink" /></div>
                <div>
                  <p className="font-bold text-ink">{item.name}</p>
                  <p className="text-xs text-stone-500">{item.category}</p>
                </div>
              </div>
              <p className="col-span-2 text-sm text-stone-700">{item.quantity_available}/{item.quantity_total}</p>
              <p className="col-span-2 text-sm font-semibold text-ink">{moneyMAD(item.rental_price)}</p>
              <div className="col-span-2"><StatusBadge status={item.condition_status} /></div>
              <form action={deleteMaterialAction} className="col-span-2 text-right">
                <input type="hidden" name="id" value={item.id} />
                <button className="inline-flex rounded-xl p-2 text-red-600 hover:bg-red-50" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
