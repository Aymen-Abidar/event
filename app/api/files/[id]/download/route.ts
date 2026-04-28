import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { organizationId } = await requireTenant();
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();

  const { data: file, error } = await supabase
    .from("files")
    .select("storage_path")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !file) {
    return NextResponse.json({ ok: false, error: "Fichier introuvable." }, { status: 404 });
  }

  const { data, error: signError } = await supabase.storage
    .from("tenant-files")
    .createSignedUrl(file.storage_path, 60);

  if (signError || !data?.signedUrl) {
    return NextResponse.json({ ok: false, error: "Impossible de générer le lien." }, { status: 400 });
  }

  return NextResponse.redirect(data.signedUrl);
}
