import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "owner" | "admin" | "employee" | "saas_owner";

type OrganizationStatus = "trial" | "active" | "expired" | "blocked";

export type SessionProfile = {
  id: string;
  full_name: string;
  role: AppRole;
  organization_id: string | null;
  is_blocked: boolean;
  organizations?: {
    id: string;
    name: string;
    is_blocked: boolean;
    subscription_status: OrganizationStatus;
  } | null;
};

export async function getSessionProfile() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, organization_id, is_blocked, organizations(id, name, is_blocked, subscription_status)")
    .eq("id", user.id)
    .single<SessionProfile>();

  if (profileError || !profile) {
    return null;
  }

  return { user, profile };
}

export async function requireAuth() {
  const session = await getSessionProfile();

  if (!session) {
    redirect("/login");
  }

  const { profile } = session;

  if (profile.is_blocked) {
    redirect("/blocked?reason=user");
  }

  if (profile.role !== "saas_owner") {
    const org = profile.organizations;
    if (!org || org.is_blocked || org.subscription_status === "blocked" || org.subscription_status === "expired") {
      redirect("/blocked?reason=organization");
    }
  }

  return session;
}

export async function requireTenant() {
  const session = await requireAuth();

  if (!session.profile.organization_id) {
    redirect("/owner-admin");
  }

  return {
    ...session,
    organizationId: session.profile.organization_id
  };
}

export function canManage(role: AppRole) {
  return role === "owner" || role === "admin" || role === "saas_owner";
}

export function isSaasOwner(role: AppRole) {
  return role === "saas_owner";
}
