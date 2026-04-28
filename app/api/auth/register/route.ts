import { registerSchema } from "@/lib/validators";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Données invalides.", 422);
    }

    const { companyName, fullName, email, password } = parsed.data;
    const supabase = createSupabaseAdminClient();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError || !authData.user) {
      return jsonError(authError?.message || "Impossible de créer l'utilisateur.", 400);
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: companyName,
        subscription_status: "trial"
      })
      .select("id")
      .single();

    if (orgError || !org) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return jsonError("Impossible de créer l'entreprise.", 400);
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      organization_id: org.id,
      full_name: fullName,
      role: "owner"
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return jsonError("Impossible de créer le profil.", 400);
    }

    const { data: basicPlan } = await supabase
      .from("plans")
      .select("id")
      .eq("name", "Basic")
      .single();

    if (basicPlan) {
      await supabase.from("subscriptions").insert({
        organization_id: org.id,
        plan_id: basicPlan.id,
        status: "trial",
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return jsonOk({ organization_id: org.id }, 201);
  } catch {
    return jsonError("Erreur serveur.", 500);
  }
}
