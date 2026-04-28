import { z } from "zod";

export const registerSchema = z.object({
  companyName: z.string().min(2),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export const materialSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  quantity_total: z.coerce.number().int().min(0),
  rental_price: z.coerce.number().min(0),
  condition_status: z.enum(["excellent", "good", "damaged", "maintenance"]).default("good"),
  notes: z.string().optional().nullable()
});

export const clientSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(8),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  cin_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export const bookingSchema = z.object({
  client_id: z.string().uuid(),
  event_type: z.enum(["wedding", "engagement", "birthday", "corporate", "party", "other"]),
  event_date: z.string(),
  delivery_date: z.string(),
  return_date: z.string(),
  location_address: z.string().min(3),
  status: z.enum(["pending", "confirmed", "delivered", "returned", "cancelled"]).default("pending"),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      material_id: z.string().uuid(),
      quantity: z.coerce.number().int().min(1),
      unit_price: z.coerce.number().min(0)
    })
  ).min(1),
  services: z.array(
    z.object({
      name: z.string().min(2),
      price: z.coerce.number().min(0)
    })
  ).optional().default([]),
  avance_paid: z.coerce.number().min(0).default(0)
});

export const paymentSchema = z.object({
  booking_id: z.string().uuid(),
  amount: z.coerce.number().min(1),
  method: z.enum(["cash", "bank_transfer", "check", "other"]),
  payment_date: z.string(),
  notes: z.string().optional().nullable()
});
