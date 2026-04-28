import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ArrowRight, CalendarCheck, CreditCard, FileText, ShieldCheck, Sparkles, Warehouse } from "lucide-react";

const features = [
  { icon: CalendarCheck, title: "Réservations & dates", text: "Mariage, livraison, retour, statut et calendrier en un seul endroit." },
  { icon: Warehouse, title: "Stock intelligent", text: "Empêche la double réservation et montre la disponibilité du matériel." },
  { icon: CreditCard, title: "Avance / reste", text: "Suivi clair des paiements, impayés, reçus et historique client." },
  { icon: FileText, title: "Factures & contrats", text: "Documents professionnels liés à chaque client et réservation." },
  { icon: ShieldCheck, title: "Multi-client sécurisé", text: "Chaque entreprise garde ses propres données grâce à Supabase RLS." },
  { icon: Sparkles, title: "Design premium", text: "Interface moderne pour vendre un vrai produit SaaS aux entreprises marocaines." }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary">Connexion</Link>
          <Link href="/register" className="btn-primary">Commencer</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <span className="badge border-gold/30 bg-champagne/60 text-ink">SaaS pour événementiel au Maroc</span>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-ink md:text-7xl">
            Gérez votre location mariage comme une vraie entreprise moderne.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            Réservations, stock, avance, reste, factures, contrats, CIN, livraison et retour — tout dans un dashboard premium conçu pour les loueurs de chaises, tables, tentes, déco, sonorisation et salles des fêtes.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="btn-primary">
              Créer mon espace <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/login" className="btn-secondary">Voir la démo</Link>
          </div>
        </div>

        <div className="premium-card relative overflow-hidden p-5">
          <div className="absolute right-8 top-8 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
          <div className="rounded-3xl bg-ink p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Revenus ce mois</p>
                <p className="mt-2 text-4xl font-black">84 700 MAD</p>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-200">+18%</span>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Mariages", "Livraisons", "Retours"].map((label, i) => (
                <div key={label} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-white/50">{label}</p>
                  <p className="mt-2 text-2xl font-black">{[14, 8, 6][i]}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {["300 chaises réservées", "Tente 6x12 disponible", "Reste client: 2 500 MAD", "Contrat signé attaché"].map((item) => (
              <div key={item} className="rounded-2xl border border-stone-100 bg-white p-4 text-sm font-semibold text-stone-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="premium-card p-6">
              <feature.icon className="h-6 w-6 text-gold" />
              <h3 className="mt-5 text-lg font-black text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-500">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
