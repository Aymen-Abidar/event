"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, CalendarDays } from "lucide-react";
import { createBookingAction } from "@/app/(dashboard)/_actions";
import { moneyMAD } from "@/lib/utils";

type ClientOption = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type MaterialOption = {
  id: string;
  name: string | null;
  rental_price: number | string | null;
  quantity_available: number | null;
  quantity_total: number | null;
};

type BookingFormProps = {
  clients: ClientOption[];
  materials: MaterialOption[];
};

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function BookingForm({ clients, materials }: BookingFormProps) {
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [servicePrice, setServicePrice] = useState(0);
  const [avancePaid, setAvancePaid] = useState(0);

  const selectedMaterial = useMemo(
    () => materials.find((material) => material.id === materialId),
    [materialId, materials]
  );

  useEffect(() => {
    if (selectedMaterial) {
      setUnitPrice(toNumber(selectedMaterial.rental_price));
    }
  }, [selectedMaterial]);

  const materialTotal = Math.max(quantity, 0) * Math.max(unitPrice, 0);
  const totalAmount = materialTotal + Math.max(servicePrice, 0);
  const resteAmount = Math.max(totalAmount - Math.max(avancePaid, 0), 0);

  return (
    <form action={createBookingAction} className="premium-card space-y-6 p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-gold">Nouvelle réservation</p>
          <h3 className="mt-1 text-xl font-black text-ink">Créer une réservation claire</h3>
          <p className="mt-1 text-sm text-stone-500">
            Le prix est calculé automatiquement: quantité × prix du matériel. Vous pouvez modifier le prix unitaire si besoin.
          </p>
        </div>
        <div className="rounded-2xl bg-champagne/50 px-4 py-3 text-sm text-stone-600">
          <CalendarDays className="mr-2 inline h-4 w-4 text-gold" />
          Date événement = jour de la fête. Livraison = jour d’arrivée. Retour = jour de récupération.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <label className="md:col-span-2">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Client</span>
          <select className="input" name="client_id" required defaultValue="">
            <option value="" disabled>Choisir un client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.full_name} — {client.phone}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Type d’événement</span>
          <select className="input" name="event_type" defaultValue="wedding">
            <option value="wedding">Mariage</option>
            <option value="engagement">Fiançailles</option>
            <option value="birthday">Anniversaire</option>
            <option value="corporate">Entreprise</option>
            <option value="party">Fête</option>
            <option value="other">Autre</option>
          </select>
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Date événement</span>
          <input className="input" name="event_date" type="date" required />
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Date livraison</span>
          <input className="input" name="delivery_date" type="date" required />
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Date retour</span>
          <input className="input" name="return_date" type="date" required />
        </label>

        <label className="md:col-span-3">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Adresse de livraison / événement</span>
          <input className="input" name="location_address" placeholder="Ex: Salle des fêtes, domicile, hôtel..." required />
        </label>

        <label className="md:col-span-2">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Matériel</span>
          <select
            className="input"
            name="material_id"
            required
            value={materialId}
            onChange={(event) => setMaterialId(event.target.value)}
          >
            <option value="" disabled>Choisir le matériel</option>
            {materials.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {moneyMAD(toNumber(item.rental_price))} — dispo: {item.quantity_available ?? item.quantity_total ?? 0}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Quantité</span>
          <input
            className="input"
            name="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(Math.max(Number(event.target.value || 1), 1))}
            required
          />
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Prix unitaire auto</span>
          <input
            className="input"
            name="unit_price"
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(event) => setUnitPrice(toNumber(event.target.value))}
            required
          />
          <span className="mt-1 block text-xs text-stone-400">Modifiable si vous faites un prix spécial.</span>
        </label>

        <label className="md:col-span-2">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Service optionnel</span>
          <input className="input" name="service_name" placeholder="Ex: livraison, montage, décoration..." />
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Prix service</span>
          <input
            className="input"
            name="service_price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            onChange={(event) => setServicePrice(toNumber(event.target.value))}
          />
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Avance payée</span>
          <input
            className="input"
            name="avance_paid"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            onChange={(event) => setAvancePaid(toNumber(event.target.value))}
          />
        </label>

        <label>
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-stone-500">Statut</span>
          <select className="input" name="status" defaultValue="pending">
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmée</option>
            <option value="delivered">Livrée</option>
            <option value="returned">Retournée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-stone-100 bg-white p-4 text-sm">
          <p className="font-bold text-ink">Calcul matériel</p>
          <p className="mt-2 text-stone-500">{quantity || 0} × {moneyMAD(unitPrice)} = <span className="font-bold text-ink">{moneyMAD(materialTotal)}</span></p>
        </div>
        <div className="rounded-2xl border border-stone-100 bg-white p-4 text-sm">
          <p className="font-bold text-ink">Total réservation</p>
          <p className="mt-2 text-stone-500">Matériel + service = <span className="font-bold text-ink">{moneyMAD(totalAmount)}</span></p>
        </div>
        <div className="rounded-2xl border border-stone-100 bg-white p-4 text-sm">
          <p className="font-bold text-ink">Reste à payer</p>
          <p className="mt-2 text-stone-500">Total - avance = <span className="font-bold text-ink">{moneyMAD(resteAmount)}</span></p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <textarea className="input md:col-span-5" name="notes" rows={2} placeholder="Notes sur la réservation" />
        <button className="btn-primary gap-2">
          <Calculator className="h-4 w-4" />
          Créer
        </button>
      </div>
    </form>
  );
}
