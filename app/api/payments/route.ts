import { requireTenant } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { paymentSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/lib/utils";

export async function GET() {
  const { organizationId } = await requireTenant();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("payments")
    .select("*, bookings(event_type, event_date, clients(full_name))")
    .eq("organization_id", organizationId)
    .order("payment_date", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk(data || []);
}

export async function POST(req: Request) {
  const rate = await checkRateLimit(req, "payments");
  if (!rate.ok) return rate.response!;

  const { profile, organizationId } = await requireTenant();
  const supabase = await createSupabaseServerClient();

  const parsed = paymentSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError("Données invalides.", 422);

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({ ...parsed.data, organization_id: organizationId, created_by: profile.id })
    .select("*")
    .single();

  if (error || !payment) return jsonError(error?.message || "Erreur paiement.", 400);

  const [{ data: booking }, { data: payments }] = await Promise.all([
    supabase.from("bookings").select("id, total_amount").eq("id", parsed.data.booking_id).eq("organization_id", organizationId).single(),
    supabase.from("payments").select("amount").eq("booking_id", parsed.data.booking_id).eq("organization_id", organizationId)
  ]);

  if (booking) {
    const paid = (payments || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
    await supabase.from("bookings").update({ avance_paid: paid, reste_amount: Math.max(Number(booking.total_amount || 0) - paid, 0), updated_by: profile.id }).eq("id", booking.id).eq("organization_id", organizationId);
  }

  await auditLog({ organization_id: organizationId, action: "created", entity_type: "payment", entity_id: payment.id, metadata: { amount: payment.amount } });
  return jsonOk(payment, 201);
}
