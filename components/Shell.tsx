import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  FileText,
  Home,
  Package,
  ReceiptText,
  Settings,
  Users,
  Warehouse,
  ShieldCheck
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/materials", label: "Matériel", icon: Warehouse },
  { href: "/bookings", label: "Réservations", icon: CalendarDays },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/payments", label: "Paiements", icon: CreditCard },
  { href: "/invoices", label: "Factures", icon: ReceiptText },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/reports", label: "Rapports", icon: BarChart3 },
  { href: "/owner-admin", label: "Admin SaaS", icon: ShieldCheck }
];

export function Shell({
  children,
  userName
}: {
  children: React.ReactNode;
  userName: string;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-stone-200/80 bg-white/80 p-5 backdrop-blur-xl lg:block">
        <Logo />
        <nav className="mt-8 space-y-1">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-stone-600 transition hover:bg-ink hover:text-white"
            >
              <item.icon className="h-4 w-4 text-stone-400 transition group-hover:text-gold" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-3xl bg-ink p-5 text-white shadow-premium">
          <p className="text-xs text-white/60">Compte connecté</p>
          <p className="mt-1 font-semibold">{userName}</p>
          <form action="/auth/signout" method="post" className="mt-4">
            <button className="w-full rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15">
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-cream/80 px-5 py-4 backdrop-blur-xl lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Morocco Event SaaS</p>
              <h1 className="text-xl font-black text-ink">Gestion premium des événements</h1>
            </div>
            <Link href="/bookings" className="btn-primary hidden sm:inline-flex">
              Nouvelle réservation
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
