"use client";

import { Clock, Heart } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { getProfile } from "@/lib/config/profiles";
import type { PlatformProfile } from "@/lib/engine/types";
import { useFavouritesStore } from "@/lib/store/favourites";

function Chip({ profile }: { profile: PlatformProfile }) {
  return (
    <Link
      href={`/${profile.slug}`}
      className="flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-sm font-medium shadow-warm transition-colors hover:border-brand-via"
    >
      {profile.label}
    </Link>
  );
}

/** Favourites + recently-used quick access on the home hub (E1). */
export function QuickAccess() {
  const favourites = useFavouritesStore((s) => s.favourites);
  const recents = useFavouritesStore((s) => s.recents);
  // Persisted store hydrates client-side; avoid an SSR/client mismatch.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;

  const favProfiles = favourites
    .map((id) => getProfile(id))
    .filter((p): p is PlatformProfile => Boolean(p));
  const recentProfiles = recents
    .map((r) => getProfile(r.id))
    .filter((p): p is PlatformProfile => Boolean(p) && !favourites.includes(p?.id ?? ""));

  if (favProfiles.length === 0 && recentProfiles.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      {favProfiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            <Heart className="h-4 w-4 text-brand-via" /> Favourites
          </h2>
          <div className="flex flex-wrap gap-2">
            {favProfiles.map((p) => (
              <Chip key={p.id} profile={p} />
            ))}
          </div>
        </div>
      )}
      {recentProfiles.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            <Clock className="h-4 w-4 text-brand-via" /> Recently used
          </h2>
          <div className="flex flex-wrap gap-2">
            {recentProfiles.map((p) => (
              <Chip key={p.id} profile={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
