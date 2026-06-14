"use client";

import { Heart } from "lucide-react";
import * as React from "react";
import { useFavouritesStore } from "@/lib/store/favourites";

/** Heart toggle to favourite the current platform (E1). */
export function FavouriteButton({ profileId, label }: { profileId: string; label: string }) {
  const isFav = useFavouritesStore((s) => s.favourites.includes(profileId));
  const toggle = useFavouritesStore((s) => s.toggleFavourite);
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);

  const active = hydrated && isFav;
  return (
    <button
      type="button"
      onClick={() => toggle(profileId)}
      aria-pressed={active}
      aria-label={active ? `Favourited: ${label} (tap to remove)` : `Favourite ${label}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-brand-via"
    >
      <Heart className={`h-3.5 w-3.5 ${active ? "fill-[var(--brand-via)] text-brand-via" : ""}`} />
      {active ? "Favourited" : "Favourite"}
    </button>
  );
}
