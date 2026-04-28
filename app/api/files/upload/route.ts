import { requireTenant } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cleanFileName, jsonError, jsonOk } from "@/lib/utils";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(req: Request) {
  const rate = await checkRateLimit(req, "files");
  if (!rate.ok) return rate.response!;

  const { profile, organizationId } = await requireTenant();
  const supabase = await createSupabaseServerClient();

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) return jsonError("Aucun fichier reçu.", 400);
  if (!allowedMimeTypes.includes(file.type)) return jsonError("Type de fichier non autorisé.", 415);

  const module = String(formData.get("module") || "general");
  const ownerType = String(formData.get("owner_type") || "organization");
  const ownerId = String(formData.get("owner_id") || organizationId);

  const { data: usageRows } = await supabase.from("files").select("size_bytes").eq("organization_id", organizationId);
  const usedBytes = (usageRows || []).reduce((sum, row) => sum + Number(row.size_bytes || 0), 0);

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plans(storage_limit_mb)")
    .eq("organization_id", organizationId)
    .in("status", ["trial", "active"])
    .limit(1)
    .single();

  const plan = Array.isArray(sub?.plans) ? sub?.plans[0] : sub?.plans;
  const storageLimitMb = Number(plan?.storage_limit_mb || 512);
  const limitBytes = storageLimitMb * 1024 * 1024;

  if (usedBytes + file.size > limitBytes) return jsonError("Limite de stockage atteinte. Supprimez des fichiers ou changez de plan.", 403);

  const safeName = cleanFileName(file.name);
  const path = `${organizationId}/${module}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("tenant-files").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return jsonError(uploadError.message, 400);

  const { data: saved, error: dbError } = await supabase
    .from("files")
    .insert({
      organization_id: organizationId,
      owner_type: ownerType,
      owner_id: ownerId,
      module,
      original_name: file.name,
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
      created_by: profile.id
    })
    .select("*")
    .single();

  if (dbError) return jsonError(dbError.message, 400);

  await auditLog({ organization_id: organizationId, action: "uploaded", entity_type: "file", entity_id: saved.id, metadata: { original_name: file.name, size_bytes: file.size } });
  return jsonOk(saved, 201);
}
