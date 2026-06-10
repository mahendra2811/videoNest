import Link from "next/link";
import type { IconType } from "react-icons";
import { SiFacebook, SiInstagram, SiWhatsapp, SiYoutube } from "react-icons/si";
import { PLATFORM_PROFILES } from "@/lib/config/profiles";
import type { PlatformProfile } from "@/lib/engine/types";

type Brand = PlatformProfile["brand"];

const BRANDS: { brand: Brand; name: string; Icon: IconType; color: string }[] = [
  { brand: "whatsapp", name: "WhatsApp", Icon: SiWhatsapp, color: "#25D366" },
  { brand: "instagram", name: "Instagram", Icon: SiInstagram, color: "#E4405F" },
  { brand: "youtube", name: "YouTube", Icon: SiYoutube, color: "#FF0000" },
  { brand: "facebook", name: "Facebook", Icon: SiFacebook, color: "#1877F2" },
];

/** Four brand cards, each linking to its formats (Status / Reels / Shorts…). */
export function PlatformGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {BRANDS.map(({ brand, name, Icon, color }) => {
        const formats = PLATFORM_PROFILES.filter((p) => p.brand === brand && p.status === "live");
        if (formats.length === 0) return null;
        return (
          <div
            key={brand}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 shadow-warm sm:p-4"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 shrink-0" style={{ color }} aria-hidden />
              <span className="text-sm font-bold tracking-tight">{name}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {formats.map((p) => (
                <Link
                  key={p.id}
                  href={`/${p.slug}`}
                  className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-transparent hover:bg-sunset hover:text-white"
                >
                  {p.format}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
