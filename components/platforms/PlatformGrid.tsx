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

/** Four brand cards, each with big tappable format buttons. */
export function PlatformGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {BRANDS.map(({ brand, name, Icon, color }) => {
        const formats = PLATFORM_PROFILES.filter((p) => p.brand === brand && p.status === "live");
        if (formats.length === 0) return null;
        return (
          <div
            key={brand}
            className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 shadow-warm"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2">
                <Icon className="h-5 w-5" style={{ color }} aria-hidden />
              </span>
              <span className="font-bold tracking-tight">{name}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {formats.map((p) => (
                <Link
                  key={p.id}
                  href={`/${p.slug}`}
                  className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-border bg-surface-2 px-3 text-sm font-semibold text-foreground transition-colors hover:border-transparent hover:bg-sunset hover:text-white"
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
