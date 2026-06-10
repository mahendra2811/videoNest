import { Gift, type LucideIcon, Monitor, ShieldCheck, WifiOff } from "lucide-react";
import type { IconType } from "react-icons";
import { SiAndroid, SiApple } from "react-icons/si";
import { InstallButton } from "@/components/pwa/InstallButton";
import { NotificationOptIn } from "@/components/pwa/NotificationOptIn";

const TARGETS: { Icon: IconType | LucideIcon; name: string; note: string }[] = [
  { Icon: SiAndroid, name: "Android", note: "Install from Chrome" },
  { Icon: SiApple, name: "iPhone & iPad", note: "Add to Home Screen in Safari" },
  { Icon: SiApple, name: "Mac", note: "Add to Dock in Safari" },
  { Icon: Monitor, name: "Windows & Linux", note: "Install from Chrome or Edge" },
];

const PERKS = [
  { Icon: WifiOff, label: "Works offline" },
  { Icon: Monitor, label: "Full-screen app" },
  { Icon: ShieldCheck, label: "On-device & private" },
  { Icon: Gift, label: "Free, no account" },
];

export function GetApp() {
  return (
    <section className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-surface p-6 text-center shadow-warm sm:p-10">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Install the VideoNest app</h2>
        <p className="max-w-md text-sm text-muted">
          Add VideoNest to your phone or computer — it launches full-screen, works offline, and your
          videos still never leave your device.
        </p>
      </div>

      <InstallButton />

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {TARGETS.map((t) => (
          <div
            key={t.name}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface-2 p-3"
          >
            <t.Icon className="h-6 w-6 text-foreground" aria-hidden />
            <span className="text-sm font-semibold">{t.name}</span>
            <span className="text-xs text-muted">{t.note}</span>
          </div>
        ))}
      </div>

      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {PERKS.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5 text-sm text-muted">
            <p.Icon className="h-4 w-4 text-brand-via" />
            {p.label}
          </li>
        ))}
      </ul>

      <NotificationOptIn />
    </section>
  );
}
