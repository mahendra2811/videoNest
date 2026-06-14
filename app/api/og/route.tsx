import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { siteConfig } from "@/lib/config/site";

export const runtime = "nodejs";

/**
 * Dynamic Open Graph image. Per-platform / per-page social cards via
 * `?title=...&subtitle=...` so each tool and guide shares a tailored image
 * (higher social/CTR), instead of one generic card.
 */
export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? "Stay sharp after the upload.").slice(0, 120);
  const subtitle = (
    searchParams.get("subtitle") ??
    "Free, private, on-device video optimization. Nothing ever leaves your phone."
  ).slice(0, 160);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 28,
        padding: 80,
        background: "#FFF9F5",
        backgroundImage:
          "radial-gradient(circle at 100% 0%, rgba(255,46,147,0.18), transparent 45%), radial-gradient(circle at 0% 100%, rgba(255,140,66,0.18), transparent 45%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#FF8C42,#FF5E78,#FF2E93)",
            color: "white",
            fontSize: 52,
            fontWeight: 800,
          }}
        >
          VN
        </div>
        <span style={{ fontSize: 44, fontWeight: 800, color: "#1A1416" }}>{siteConfig.name}</span>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 68,
          fontWeight: 800,
          lineHeight: 1.1,
          color: "#1A1416",
          maxWidth: 1000,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", fontSize: 30, color: "#6B5B60", maxWidth: 920 }}>
        {subtitle}
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
