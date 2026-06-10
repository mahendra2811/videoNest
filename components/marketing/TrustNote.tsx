import { Gift, ShieldCheck, Smartphone, UploadCloud } from "lucide-react";

const ITEMS = [
  { icon: Smartphone, label: "100% on-device" },
  { icon: UploadCloud, label: "No upload" },
  { icon: ShieldCheck, label: "No sign-up" },
  { icon: Gift, label: "Free" },
];

export function TrustNote() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-surface/60 px-5 py-3 text-sm">
      {ITEMS.map(({ icon: Icon, label }) => (
        <span key={label} className="flex items-center gap-2 text-muted">
          <Icon className="h-4 w-4 text-brand-via" />
          <span className="font-medium text-foreground">{label}</span>
        </span>
      ))}
    </div>
  );
}
