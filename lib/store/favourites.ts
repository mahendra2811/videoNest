import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VideoCodecChoice } from "@/lib/engine/types";

/** Scalar, serializable subset of edit options we remember across sessions (E3). */
export type RememberedOptions = {
  sharpen: boolean;
  normalizeLoudness: boolean;
  aspectMode: "fit" | "fill";
  youtubeQuality: "1080p" | "1440p" | "4K";
  videoCodec: VideoCodecChoice;
};

export const defaultRememberedOptions: RememberedOptions = {
  sharpen: false,
  normalizeLoudness: false,
  aspectMode: "fit",
  youtubeQuality: "1080p",
  videoCodec: "avc",
};

type RecentEntry = { id: string; at: number };

type FavouritesState = {
  /** Favourited platform profile ids. */
  favourites: string[];
  /** Recently-used platforms, most-recent first. */
  recents: RecentEntry[];
  /** The platform the user last optimized for (E3). */
  lastPlatformId: string | null;
  /** Remembered scalar options (E3). */
  lastOptions: RememberedOptions;

  toggleFavourite: (id: string) => void;
  isFavourite: (id: string) => boolean;
  recordUse: (id: string) => void;
  setLastOptions: (opts: RememberedOptions) => void;
  clearAll: () => void;
};

const MAX_RECENTS = 6;

export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set, get) => ({
      favourites: [],
      recents: [],
      lastPlatformId: null,
      lastOptions: defaultRememberedOptions,

      toggleFavourite: (id) =>
        set((s) => ({
          favourites: s.favourites.includes(id)
            ? s.favourites.filter((f) => f !== id)
            : [...s.favourites, id],
        })),

      isFavourite: (id) => get().favourites.includes(id),

      recordUse: (id) =>
        set((s) => ({
          lastPlatformId: id,
          recents: [{ id, at: Date.now() }, ...s.recents.filter((r) => r.id !== id)].slice(
            0,
            MAX_RECENTS,
          ),
        })),

      setLastOptions: (lastOptions) => set({ lastOptions }),

      clearAll: () =>
        set({
          favourites: [],
          recents: [],
          lastPlatformId: null,
          lastOptions: defaultRememberedOptions,
        }),
    }),
    {
      name: "videonest-favourites",
      version: 1,
    },
  ),
);
