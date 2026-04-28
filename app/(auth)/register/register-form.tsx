"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const payload = {
      companyName: String(formData.get("companyName") || ""),
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || "")
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || "Erreur pendant la création du compte.");
      return;
    }

    setMessage("Compte créé. Connectez-vous maintenant.");
    setTimeout(() => router.push("/login"), 800);
  }

  return (
    <form action={onSubmit} className="mt-6 space-y-4">
      <input className="input" name="companyName" placeholder="Nom de l'entreprise" required />
      <input className="input" name="fullName" placeholder="Nom complet" required />
      <input className="input" name="email" type="email" placeholder="Email" required />
      <input className="input" name="password" type="password" placeholder="Mot de passe minimum 8 caractères" required />
      {message ? <p className="rounded-2xl bg-champagne/50 px-4 py-3 text-sm text-ink">{message}</p> : null}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Création..." : "Créer mon espace"}
      </button>
    </form>
  );
}
