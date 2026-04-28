import { RegisterForm } from "./register-form";
import { Logo } from "@/components/Logo";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="premium-card p-7">
          <h1 className="text-2xl font-black text-ink">Créer un espace entreprise</h1>
          <p className="mt-2 text-sm text-stone-500">Compte propriétaire pour tester le SaaS.</p>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
