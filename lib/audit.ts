import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function auditLog(input: {
  organization_id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("audit_logs").insert({
    organization_id: input.organization_id,
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? null,
    metadata: input.metadata ?? {}
  });
}

export async function errorLog(input: {
  organization_id?: string | null;
  message: string;
  source: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("error_logs").insert({
    organization_id: input.organization_id ?? null,
    message: input.message,
    source: input.source,
    metadata: input.metadata ?? {}
  });
}
