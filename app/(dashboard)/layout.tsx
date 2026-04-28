import { Shell } from "@/components/Shell";
import { requireAuth } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth();

  return (
    <Shell userName={profile.full_name || "Utilisateur"}>
      {children}
    </Shell>
  );
}
