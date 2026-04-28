import Link from "next/link";
import { Download, File, Trash2 } from "lucide-react";
import { deleteDocumentAction, uploadDocumentAction } from "@/app/(dashboard)/_actions";
import { requireTenant } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatSize(bytes: number | string | null) {
  const value = Number(bytes || 0);
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const { organizationId } = await requireTenant();
  const supabase = await createSupabaseServerClient();
  const [{ data: files }, { data: clients }, { data: bookings }] = await Promise.all([
    supabase.from("files").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("id, full_name").order("full_name"),
    supabase.from("bookings").select("id, event_date, clients(full_name)").order("event_date", { ascending: false })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gold">Module</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-ink">Documents</h2>
        <p className="mt-2 max-w-2xl text-stone-500">CIN, contrats signés, reçus, PDF et fichiers sécurisés par entreprise.</p>
      </div>

      <form action={uploadDocumentAction} encType="multipart/form-data" className="premium-card grid gap-4 p-5 md:grid-cols-6">
        <input className="input md:col-span-2" name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required />
        <select className="input" name="module" defaultValue="contracts">
          <option value="contracts">Contrats</option>
          <option value="cin">CIN</option>
          <option value="receipts">Reçus</option>
          <option value="general">Général</option>
        </select>
        <select className="input" name="owner_type" defaultValue="organization">
          <option value="organization">Entreprise</option>
          <option value="client">Client</option>
          <option value="booking">Réservation</option>
        </select>
        <select className="input md:col-span-1" name="owner_id" defaultValue={organizationId}>
          <option value={organizationId}>Entreprise</option>
          {(clients || []).map((client) => <option key={client.id} value={client.id}>Client: {client.full_name}</option>)}
          {(bookings || []).map((booking) => {
            const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients;
            return <option key={booking.id} value={booking.id}>Réservation: {client?.full_name || "Client"} {booking.event_date}</option>;
          })}
        </select>
        <button className="btn-primary">Uploader</button>
      </form>

      <div className="premium-card overflow-hidden">
        {(files || []).length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500">Aucun document uploadé.</div>
        ) : (
          files?.map((file) => (
            <div key={file.id} className="grid grid-cols-12 items-center border-b border-stone-100 px-5 py-4 last:border-b-0">
              <div className="col-span-5 flex items-center gap-3">
                <div className="rounded-2xl bg-champagne p-3"><File className="h-4 w-4 text-ink" /></div>
                <div>
                  <p className="font-bold text-ink">{file.original_name}</p>
                  <p className="text-xs text-stone-500">{file.module} · {file.owner_type}</p>
                </div>
              </div>
              <p className="col-span-2 text-sm text-stone-600">{formatSize(file.size_bytes)}</p>
              <p className="col-span-2 text-sm text-stone-600">{new Date(file.created_at).toLocaleDateString("fr-MA")}</p>
              <div className="col-span-3 flex justify-end gap-2">
                <Link href={`/api/files/${file.id}/download`} className="rounded-xl p-2 text-ink hover:bg-champagne" title="Télécharger"><Download className="h-4 w-4" /></Link>
                <form action={deleteDocumentAction}>
                  <input type="hidden" name="id" value={file.id} />
                  <input type="hidden" name="storage_path" value={file.storage_path} />
                  <button className="rounded-xl p-2 text-red-600 hover:bg-red-50" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
