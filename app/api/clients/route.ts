import { requireTenant } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET() {
  const { organizationId } = await requireTenant();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk(data || []);
}

export async function POST(req: Request) {
  const rate = await checkRateLimit(req, "clients");
  if (!rate.ok) return rate.response!;

  const { profile, organizationId } = await requireTenant();
  const supabase = await createSupabaseServerClient();

  const parsed = clientSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError("Données invalides.", 422);

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...parsed.data, organization_id: organizationId, email: parsed.data.email || null, created_by: profile.id, updated_by: profile.id })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 400);

  await auditLog({ organization_id: organizationId, action: "created", entity_type: "client", entity_id: data.id });
  return jsonOk(data, 201);
}
