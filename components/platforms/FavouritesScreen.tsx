"use client";

import { Clock, Heart } from "lucide-react";
import * as React from "react";
import { Link } from "@/i18n/navigation";
import { getProfile } from "@/lib/config/profiles";
import type { PlatformProfile } from "@/lib/engine/types";
import { useFavouritesStore } from "@/lib/store/favourites";

function Chip({ profile }: { profile: PlatformProfile }) {
  return (
    <Link
      href={`/${profile.slug}`}
      className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium shadow-warm transition-colors hover:border-brand-via"
    >
      <span>{profile.label}</span>
      <span className="text-xs text-muted">{profile.format}</span>
    </Link>
  );
}

export function FavouritesScreen() {
  const favourites = useFavouritesStore((s) => s.favourites);
  const recents = useFavouritesStore((s) => s.recents);
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;

  const favProfiles = favourites
    .map((id) => getProfile(id))
    .filter((p): p is PlatformProfile => Boolean(p));
  const recentProfiles = recents
    .map((r) => getProfile(r.id))
    .filter((p): p is PlatformProfile => Boolean(p) && !favourites.includes(p?.id ?? ""));

  if (favProfiles.length === 0 && recentProfiles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-surface p-8 text-center">
        <Heart className="h-8 w-8 text-muted" />
        <p className="font-medium">No favourites yet</p>
        <p className="max-w-xs text-sm text-muted">
          Tap the heart on any optimizer to pin it here. Tools you use will show up too.
        </p>
        <Link
          href="/tools"
          className="rounded-full bg-sunset px-5 py-2.5 text-sm font-semibold text-white"
        >
          Browse tools
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {favProfiles.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            <Heart className="h-4 w-4 text-brand-via" /> Favourites
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {favProfiles.map((p) => (
              <Chip key={p.id} profile={p} />
            ))}
          </div>
        </section>
      )}
      {recentProfiles.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            <Clock className="h-4 w-4 text-brand-via" /> Recently used
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {recentProfiles.map((p) => (
              <Chip key={p.id} profile={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
