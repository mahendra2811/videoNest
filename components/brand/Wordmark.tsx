import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

/**
 * Badge + wordmark. The site name is split so a trailing "Nest" can render in
 * the sunset gradient; for custom names we gradient the second half if present.
 */
export function Wordmark({
  className,
  badgeClassName,
  showText = true,
}: {
  className?: string;
  badgeClassName?: string;
  showText?: boolean;
}) {
  const name = siteConfig.name;
  // Split "VideoNest" -> "Video" + "Nest"; fall back gracefully for any name.
  const match = name.match(/^(.*?)(Nest|[A-Z][a-z]*)$/);
  const head = match ? match[1] : name;
  const tail = match ? match[2] : "";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Logo className={cn("h-8 w-8 shrink-0", badgeClassName)} />
      {showText && (
        <span className="text-lg font-bold tracking-tight">
          <span>{head}</span>
          {tail && <span className="text-sunset">{tail}</span>}
        </span>
      )}
    </span>
  );
}
