import type { SVGProps } from "react";

/**
 * The VideoNest "VN" sunset badge. A downward "V" play-stroke with a record
 * dot, on the brand gradient. Used in the wordmark, favicon, and PWA icons.
 */
export function Logo({
  title = "VideoNest",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      {...props}
    >
      <defs>
        <linearGradient id="vnSunset" x1="3" y1="3" x2="45" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF8C42" />
          <stop offset="0.5" stopColor="#FF5E78" />
          <stop offset="1" stopColor="#FF2E93" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="13" fill="url(#vnSunset)" />
      <path
        d="M15 16 L24 33 L33 16"
        stroke="#fff"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="19.5" r="2.3" fill="#fff" />
    </svg>
  );
}
