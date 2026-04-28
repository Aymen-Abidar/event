"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auditLog, errorLog } from "@/lib/audit";
import { canManage, requireAuth, requireTenant } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cleanFileName } from "@/lib/utils";
import { bookingSchema, clientSchema, materialSchema, paymentSchema } from "@/lib/validators";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text.length ? text : null;
}

function text(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

async function getTenantContext() {
  const { profile, organizationId } = await requireTenant();
  const supabase = await createSupabaseServerClient();
  return { profile, organizationId, supabase };
}

export async function createMaterialAction(formData: FormData) {
  const { profile, organizationId, supabase } = await getTenantContext();

  const parsed = materialSchema.safeParse({
    name: text(formData.get("name")),
    category: text(formData.get("category")),
    quantity_total: text(formData.get("quantity_total")),
    rental_price: text(formData.get("rental_price")),
    condition_status: text(formData.get("condition_status")) || "good",
    notes: nullableText(formData.get("notes"))
  });

  if (!parsed.success) redirect("/materials?error=invalid");

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
    .select("id, name")
    .single();

  if (!error && data) {
    await auditLog({ organization_id: organizationId, action: "created", entity_type: "material", entity_id: data.id, metadata: { name: data.name } });
  } else {
    await errorLog({ organization_id: organizationId, source: "materials/action", message: error?.message || "Material create failed" });
  }

  revalidatePath("/materials");
}

export async function deleteMaterialAction(formData: FormData) {
  const { profile, organizationId, supabase } = await getTenantContext();
  if (!canManage(profile.role)) redirect("/materials?error=forbidden");

  const id = text(formData.get("id"));
  if (!id) redirect("/materials");

  const { error } = await supabase.from("materials").delete().eq("id", id).eq("organization_id", organizationId);
  if (!error) {
    await auditLog({ organization_id: organizationId, action: "deleted", entity_type: "material", entity_id: id });
  }
  revalidatePath("/materials");
}

export async function createClientAction(formData: FormData) {
  const { profile, organizationId, supabase } = await getTenantContext();

  const parsed = clientSchema.safeParse({
    full_name: text(formData.get("full_name")),
    phone: text(formData.get("phone")),
    whatsapp: nullableText(formData.get("whatsapp")),
    email: nullableText(formData.get("email")),
    cin_number: nullableText(formData.get("cin_number")),
    address: nullableText(formData.get("address")),
    notes: nullableText(formData.get("notes"))
  });

  if (!parsed.success) redirect("/clients?error=invalid");

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...parsed.data, organization_id: organizationId, created_by: profile.id, updated_by: profile.id })
    .select("id, full_name")
    .single();

  if (!error && data) {
    await auditLog({ organization_id: organizationId, action: "created", entity_type: "client", entity_id: data.id, metadata: { full_name: data.full_name } });
  } else {
    await errorLog({ organization_id: organizationId, source: "clients/action", message: error?.message || "Client create failed" });
  }

  revalidatePath("/clients");
}

export async function deleteClientAction(formData: FormData) {
  const { profile, organizationId, supabase } = await getTenantContext();
  if (!canManage(profile.role)) redirect("/clients?error=forbidden");

  const id = text(formData.get("id"));
  if (!id) redirect("/clients");

  await supabase.from("clients").delete().eq("id", id).eq("organization_id", organizationId);
  await auditLog({ organization_id: organizationId, action: "deleted", entity_type: "client", entity_id: id });
  revalidatePath("/clients");
}

export async function createBookingAction(formData: FormData) {
  const { profile, organizationId, supabase } = await getTenantContext();

  const serviceName = text(formData.get("service_name"));
  const servicePrice = text(formData.get("service_price"));
  const parsed = bookingSchema.safeParse({
    client_id: text(formData.get("client_id")),
    event_type: text(formData.get("event_type")) || "wedding",
    event_date: text(formData.get("event_date")),
    delivery_date: text(formData.get("delivery_date")),
    return_date: text(formData.get("return_date")),
    location_address: text(formData.get("location_address")),
    status: text(formData.get("status")) || "pending",
    notes: nullableText(formData.get("notes")),
    items: [
      {
        material_id: text(formData.get("material_id")),
        quantity: text(formData.get("quantity")),
        unit_price: text(formData.get("unit_price"))
      }
    ],
    services: serviceName ? [{ name: serviceName, price: servicePrice || "0" }] : [],
    avance_paid: text(formData.get("avance_paid")) || "0"
  });

  if (!parsed.success) redirect("/bookings?error=invalid");

  const input = parsed.data;
  for (const item of input.items) {
    const { data: available, error } = await supabase.rpc("check_material_availability", {
      p_organization_id: organizationId,
      p_material_id: item.material_id,
      p_start_date: input.delivery_date,
      p_end_date: input.return_date
    });

    if (error || Number(available) < item.quantity) {
      redirect("/bookings?error=stock");
    }
  }

  const totalItems = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const totalServices = input.services.reduce((sum, item) => sum + item.price, 0);
  const totalAmount = totalItems + totalServices;
  const resteAmount = Math.max(totalAmount - input.avance_paid, 0);

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      organization_id: organizationId,
      client_id: input.client_id,
      event_type: input.event_type,
      event_date: input.event_date,
      delivery_date: input.delivery_date,
      return_date: input.return_date,
      location_address: input.location_address,
      status: input.status,
      total_amount: totalAmount,
      avance_paid: input.avance_paid,
      reste_amount: resteAmount,
      notes: input.notes,
      created_by: profile.id,
      updated_by: profile.id
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    await errorLog({ organization_id: organizationId, source: "bookings/action", message: bookingError?.message || "Booking create failed" });
    redirect("/bookings?error=create");
  }

  const itemsToInsert = input.items.map((item) => ({
    organization_id: organizationId,
    booking_id: booking.id,
    material_id: item.material_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.quantity * item.unit_price
  }));

  const servicesToInsert = input.services.map((service) => ({
    organization_id: organizationId,
    booking_id: booking.id,
    name: service.name,
    price: service.price
  }));

  const { error: itemsError } = await supabase.from("booking_items").insert(itemsToInsert);
  const { error: servicesError } = servicesToInsert.length
    ? await supabase.from("booking_services").insert(servicesToInsert)
    : { error: null };

  if (itemsError || servicesError) {
    await supabase.from("bookings").delete().eq("id", booking.id).eq("organization_id", organizationId);
    await errorLog({ organization_id: organizationId, source: "bookings/action", message: itemsError?.message || servicesError?.message || "Booking child rows failed" });
    redirect("/bookings?error=create");
  }

  if (input.avance_paid > 0) {
    await supabase.from("payments").insert({
      organization_id: organizationId,
      booking_id: booking.id,
      amount: input.avance_paid,
      method: "cash",
      payment_date: new Date().toISOString().slice(0, 10),
      notes: "Avance initiale",
      created_by: profile.id
    });
  }

  await auditLog({ organization_id: organizationId, action: "created", entity_type: "booking", entity_id: booking.id, metadata: { totalAmount } });
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
}

export async function deleteBookingAction(formData: FormData) {
  const { profile, organizationId, supabase } = await getTenantContext();
  if (!canManage(profile.role)) redirect("/bookings?error=forbidden");
  const id = text(formData.get("id"));
  if (!id) redirect("/bookings");
  await supabase.from("bookings").delete().eq("id", id).eq("organization_id", organizationId);
  await auditLog({ organization_id: organizationId, action: "deleted", entity_type: "booking", entity_id: id });
  revalidatePath("/bookings");
}

export async function createPaymentAction(formData: FormData) {
  const { profile, organizationId, supabase } = await getTenantContext();

  const parsed = paymentSchema.safeParse({
    booking_id: text(formData.get("booking_id")),
    amount: text(formData.get("amount")),
    method: text(formData.get("method")) || "cash",
    payment_date: text(formData.get("payment_date")) || new Date().toISOString().slice(0, 10),
    notes: nullableText(formData.get("notes"))
  });

  if (!parsed.success) redirect("/payments?error=invalid");

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({ ...parsed.data, organization_id: organizationId, created_by: profile.id })
    .select("id, amount")
    .single();

  if (error || !payment) redirect("/payments?error=create");

  const [{ data: booking }, { data: payments }] = await Promise.all([
    supabase.from("bookings").select("id, total_amount").eq("id", parsed.data.booking_id).eq("organization_id", organizationId).single(),
    supabase.from("payments").select("amount").eq("booking_id", parsed.data.booking_id).eq("organization_id", organizationId)
  ]);

  if (booking) {
    const paid = (payments || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
    await supabase
      .from("bookings")
      .update({ avance_paid: paid, reste_amount: Math.max(Number(booking.total_amount || 0) - paid, 0), updated_by: profile.id })
      .eq("id", booking.id)
      .eq("organization_id", organizationId);
  }

  await auditLog({ organization_id: organizationId, action: "created", entity_type: "payment", entity_id: payment.id, metadata: { amount: payment.amount } });
  revalidatePath("/payments");
  revalidatePath("/bookings");
}

export async function deletePaymentAction(formData: FormData) {
  const { profile, organizationId, supabase } = await getTenantContext();
  if (!canManage(profile.role)) redirect("/payments?error=forbidden");
  const id = text(formData.get("id"));
  const bookingId = text(formData.get("booking_id"));
  if (!id) redirect("/payments");
  await supabase.from("payments").delete().eq("id", id).eq("organization_id", organizationId);

  if (bookingId) {
    const [{ data: booking }, { data: payments }] = await Promise.all([
      supabase.from("bookings").select("id, total_amount").eq("id", bookingId).eq("organization_id", organizationId).single(),
      supabase.from("payments").select("amount").eq("booking_id", bookingId).eq("organization_id", organizationId)
    ]);
    if (booking) {
      const paid = (payments || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
      await supabase.from("bookings").update({ avance_paid: paid, reste_amount: Math.max(Number(booking.total_amount || 0) - paid, 0) }).eq("id", booking.id);
    }
  }

  revalidatePath("/payments");
  revalidatePath("/bookings");
}

export async function createInvoiceAction(formData: FormData) {
  const { profile, organizationId, supabase } = await getTenantContext();
  const bookingId = text(formData.get("booking_id"));
  if (!bookingId) redirect("/invoices?error=invalid");

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, total_amount")
    .eq("id", bookingId)
    .eq("organization_id", organizationId)
    .single();

  if (!booking) redirect("/invoices?error=booking");

  const invoiceNumber = `FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: organizationId,
      booking_id: booking.id,
      invoice_number: invoiceNumber,
      total_amount: booking.total_amount,
      created_by: profile.id
    })
    .select("id")
    .single();

  if (!error && data) {
    await auditLog({ organization_id: organizationId, action: "created", entity_type: "invoice", entity_id: data.id, metadata: { invoiceNumber } });
  }
  revalidatePath("/invoices");
}

export async function deleteInvoiceAction(formData: FormData) {
  const { profile, organizationId, supabase } = await getTenantContext();
  if (!canManage(profile.role)) redirect("/invoices?error=forbidden");
  const id = text(formData.get("id"));
  if (!id) redirect("/invoices");
  await supabase.from("invoices").delete().eq("id", id).eq("organization_id", organizationId);
  revalidatePath("/invoices");
}

export async function uploadDocumentAction(formData: FormData) {
  const { profile, organizationId, supabase } = await getTenantContext();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size <= 0) redirect("/documents?error=file");
  if (!allowedMimeTypes.includes(file.type)) redirect("/documents?error=type");

  const module = text(formData.get("module")) || "general";
  const ownerType = text(formData.get("owner_type")) || "organization";
  const ownerId = text(formData.get("owner_id")) || organizationId;

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

  if (usedBytes + file.size > limitBytes) redirect("/documents?error=storage");

  const safeName = cleanFileName(file.name);
  const path = `${organizationId}/${module}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("tenant-files").upload(path, file, {
    contentType: file.type,
    upsert: false
  });

  if (uploadError) redirect("/documents?error=upload");

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
    .select("id")
    .single();

  if (!dbError && saved) {
    await auditLog({ organization_id: organizationId, action: "uploaded", entity_type: "file", entity_id: saved.id, metadata: { original_name: file.name, size_bytes: file.size } });
  }

  revalidatePath("/documents");
}

export async function deleteDocumentAction(formData: FormData) {
  const { profile, organizationId, supabase } = await getTenantContext();
  if (!canManage(profile.role)) redirect("/documents?error=forbidden");

  const id = text(formData.get("id"));
  const storagePath = text(formData.get("storage_path"));
  if (!id) redirect("/documents");

  if (storagePath) await supabase.storage.from("tenant-files").remove([storagePath]);
  await supabase.from("files").delete().eq("id", id).eq("organization_id", organizationId);
  revalidatePath("/documents");
}

export async function setOrganizationBlockedAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (profile.role !== "saas_owner") redirect("/owner-admin");

  const supabase = await createSupabaseServerClient();
  const orgId = text(formData.get("organization_id"));
  const blocked = text(formData.get("blocked")) === "true";
  if (!orgId) redirect("/owner-admin");

  await supabase
    .from("organizations")
    .update({ is_blocked: blocked, subscription_status: blocked ? "blocked" : "active" })
    .eq("id", orgId);

  await supabase.from("subscriptions").update({ status: blocked ? "blocked" : "active" }).eq("organization_id", orgId);
  await auditLog({ organization_id: orgId, action: blocked ? "blocked" : "unblocked", entity_type: "organization", entity_id: orgId });
  revalidatePath("/owner-admin");
}

export async function setProfileBlockedAction(formData: FormData) {
  const { profile } = await requireAuth();
  if (profile.role !== "saas_owner") redirect("/owner-admin");

  const supabase = await createSupabaseServerClient();
  const profileId = text(formData.get("profile_id"));
  const organizationId = text(formData.get("organization_id"));
  const blocked = text(formData.get("blocked")) === "true";
  if (!profileId) redirect("/owner-admin");

  await supabase.from("profiles").update({ is_blocked: blocked }).eq("id", profileId);
  if (organizationId) {
    await auditLog({ organization_id: organizationId, action: blocked ? "blocked" : "unblocked", entity_type: "profile", entity_id: profileId });
  }
  revalidatePath("/owner-admin");
}
