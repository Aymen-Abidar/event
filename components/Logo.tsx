import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-lg font-black text-gold shadow-lg">
        K
      </span>
      <span className="leading-tight">
        <span className="block text-base font-black tracking-tight text-ink">KERVIQO</span>
        <span className="block text-xs font-medium text-stone-500">Event Rental SaaS</span>
      </span>
    </Link>
  );
}
