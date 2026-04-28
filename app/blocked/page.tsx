import { Logo } from "@/components/Logo";

export default function BlockedPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="premium-card p-8 text-center">
          <p className="text-sm font-semibold text-gold">Accès suspendu</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Votre compte ou entreprise est bloqué.</h1>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            L’accès aux pages protégées est coupé immédiatement. Contactez l’administrateur SaaS pour réactiver le compte ou l’abonnement.
          </p>
          <form action="/auth/signout" method="post" className="mt-6">
            <button className="btn-primary w-full">Déconnexion</button>
          </form>
        </div>
      </div>
    </main>
  );
}
