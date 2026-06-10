import { PLATFORM_PROFILES } from "@/lib/config/profiles";
import { PlatformTile } from "./PlatformTile";

export function PlatformGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {PLATFORM_PROFILES.map((profile) => (
        <PlatformTile key={profile.id} profile={profile} />
      ))}
    </div>
  );
}
