import { SPLASH_TARGETS, splashMedia } from "@/lib/pwa/splash";

/**
 * iOS launch images. Next.js metadata has no field for media-queried
 * apple-touch-startup-image, so we render the <link> tags directly — App Router
 * hoists link/meta tags into <head>.
 */
export function AppleSplashLinks() {
  return (
    <>
      {SPLASH_TARGETS.map((t) => (
        <link
          key={t.file}
          rel="apple-touch-startup-image"
          media={splashMedia(t)}
          href={`/${t.file}`}
        />
      ))}
    </>
  );
}
