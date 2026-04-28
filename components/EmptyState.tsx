import { PackageOpen } from "lucide-react";

export function EmptyState({
  title,
  text,
  action
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="premium-card flex min-h-72 flex-col items-center justify-center p-10 text-center">
      <div className="rounded-3xl bg-champagne p-5">
        <PackageOpen className="h-8 w-8 text-ink" />
      </div>
      <h3 className="mt-5 text-xl font-black text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">{text}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
