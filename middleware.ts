import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except API routes, Next internals, and files with an
  // extension (static assets, ffmpeg core, manifest, sw, icons, etc.).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
