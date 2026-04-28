import { Building2, ShieldAlert, Users } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { setOrganizationBlockedAction, setProfileBlockedAction } from "@/app/(dashboard)/_actions";
import { requireAuth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function OwnerAdminPage() {
  const { profile } = await requireAuth();
  const supabase = await createSupabaseServerClient();

  if (profile.role !== "saas_owner") {
    return <div className="premium-card p-8"><h2 className="text-2xl font-black text-ink">Accès réservé</h2><p className="mt-2 text-stone-500">Cette page est réservée au propriétaire du SaaS.</p></div>;
  }

  const [{ data: organizations }, { data: profiles }, { count: errors }, { data: files }] = await Promise.all([
    supabase.from("organizations").select("id, name, email, phone, city, subscription_status, is_blocked, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, role, organization_id, is_blocked, created_at, organizations(name)").order("created_at", { ascending: false }),
    supabase.from("error_logs").select("*", { count: "exact", head: true }),
    supabase.from("files").select("organization_id, size_bytes")
  ]);

  const storageByOrg = new Map<string, number>();
  (files || []).forEach((file) => storageByOrg.set(file.organization_id, (storageByOrg.get(file.organization_id) || 0) + Number(file.size_bytes || 0)));

  return (
    <div className="space-y-8">
      <div><p className="text-sm font-semibold text-gold">SaaS owner</p><h2 className="mt-1 text-3xl font-black tracking-tight text-ink">Admin panel</h2><p className="mt-2 max-w-2xl text-stone-500">Blocage immédiat des entreprises/utilisateurs, suivi des erreurs et usage stockage.</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Clients SaaS" value={`${organizations?.length || 0}`} hint="Organisations" icon={Building2} />
        <KpiCard title="Utilisateurs" value={`${profiles?.length || 0}`} hint="Tous les comptes" icon={Users} />
        <KpiCard title="Erreurs" value={`${errors || 0}`} hint="Logs API/upload/auth" icon={ShieldAlert} />
      </div>

      <section className="premium-card overflow-hidden">
        <div className="border-b border-stone-100 px-5 py-4"><h3 className="font-black text-ink">Entreprises</h3></div>
        {(organizations || []).length === 0 ? <div className="p-8 text-center text-sm text-stone-500">Aucune entreprise.</div> : organizations?.map((org) => (
          <div key={org.id} className="grid grid-cols-12 items-center gap-3 border-b border-stone-100 px-5 py-4 last:border-b-0">
            <div className="col-span-4"><p className="font-bold text-ink">{org.name}</p><p className="text-xs text-stone-500">{org.email || org.phone || "—"} · {org.city || "—"}</p></div>
            <div className="col-span-2"><StatusBadge status={org.is_blocked ? "blocked" : org.subscription_status} /></div>
            <p className="col-span-2 text-sm text-stone-600">Stockage: {formatSize(storageByOrg.get(org.id) || 0)}</p>
            <p className="col-span-2 text-sm text-stone-600">Créé: {new Date(org.created_at).toLocaleDateString("fr-MA")}</p>
            <form action={setOrganizationBlockedAction} className="col-span-2 text-right"><input type="hidden" name="organization_id" value={org.id} /><input type="hidden" name="blocked" value={org.is_blocked ? "false" : "true"} /><button className={org.is_blocked ? "btn-secondary" : "rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"}>{org.is_blocked ? "Débloquer" : "Suspendre"}</button></form>
          </div>
        ))}
      </section>

      <section className="premium-card overflow-hidden">
        <div className="border-b border-stone-100 px-5 py-4"><h3 className="font-black text-ink">Utilisateurs</h3></div>
        {(profiles || []).length === 0 ? <div className="p-8 text-center text-sm text-stone-500">Aucun utilisateur.</div> : profiles?.map((user) => {
          const org = Array.isArray(user.organizations) ? user.organizations[0] : user.organizations;
          return (
            <div key={user.id} className="grid grid-cols-12 items-center gap-3 border-b border-stone-100 px-5 py-4 last:border-b-0">
              <div className="col-span-4"><p className="font-bold text-ink">{user.full_name}</p><p className="text-xs text-stone-500">{org?.name || "SaaS"}</p></div>
              <p className="col-span-2 text-sm font-semibold text-stone-700">{user.role}</p><div className="col-span-2"><StatusBadge status={user.is_blocked ? "blocked" : "active"} /></div>
              <p className="col-span-2 text-sm text-stone-600">Créé: {new Date(user.created_at).toLocaleDateString("fr-MA")}</p>
              <form action={setProfileBlockedAction} className="col-span-2 text-right"><input type="hidden" name="profile_id" value={user.id} /><input type="hidden" name="organization_id" value={user.organization_id || ""} /><input type="hidden" name="blocked" value={user.is_blocked ? "false" : "true"} /><button className={user.is_blocked ? "btn-secondary" : "rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"}>{user.is_blocked ? "Débloquer" : "Bloquer"}</button></form>
            </div>
          );
        })}
      </section>
    </div>
  );
}
