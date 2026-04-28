import { requireTenant } from "@/lib/auth";
import { auditLog, errorLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/utils";
import { materialSchema } from "@/lib/validators";

export async function GET() {
  const { organizationId } = await requireTenant();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk(data || []);
}

export async function POST(req: Request) {
  const rate = await checkRateLimit(req, "materials");
  if (!rate.ok) return rate.response!;

  const { profile, organizationId } = await requireTenant();
  const supabase = await createSupabaseServerClient();

  try {
    const parsed = materialSchema.safeParse(await req.json());
    if (!parsed.success) return jsonError("Données invalides.", 422);

    const quantityTotal = parsed.data.quantity_total;
    const { data, error } = await supabase
      .from("materials")
      .insert({
        ...parsed.data,
        organization_id: organizationId,
        quantity_available: quantityTotal,
        quantity_reserved: 0,
        created_by: profile.id,
        updated_by: profile.id
      })
      .select("*")
      .single();

    if (error) return jsonError(error.message, 400);

    await auditLog({ organization_id: organizationId, action: "created", entity_type: "material", entity_id: data.id, metadata: { name: data.name } });
    return jsonOk(data, 201);
  } catch (err) {
    await errorLog({ organization_id: organizationId, source: "api/materials", message: err instanceof Error ? err.message : "Unknown error" });
    return jsonError("Erreur serveur.", 500);
  }
}
