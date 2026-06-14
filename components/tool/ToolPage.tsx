import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { RelatedGuides } from "@/components/seo/RelatedGuides";
import { FavouriteButton } from "@/components/tool/FavouriteButton";
import { ToolScreen } from "@/components/tool/ToolScreen";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { lastVerifiedLabel, requireProfile } from "@/lib/config/profiles";
import { getPlatformContent } from "@/lib/content/platforms";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

/** Per-route metadata for a platform's tool page. */
export function buildToolMetadata(profileId: string): Metadata {
  const profile = requireProfile(profileId);
  const content = getPlatformContent(profileId);
  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: `/${profile.slug}`,
  });
}

/** Shared tool page rendered by every platform route — clean and focused. */
export function ToolPage({ profileId }: { profileId: string }) {
  const profile = requireProfile(profileId);
  const content = getPlatformContent(profileId);
  const verified = lastVerifiedLabel(profile);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 sm:px-6">
      <JsonLd
        data={softwareApplicationJsonLd({
          name: `${profile.label} video optimizer`,
          slug: profile.slug,
          description: content.metaDescription,
        })}
      />
      <JsonLd data={howToJsonLd({ platformLabel: profile.label, slug: profile.slug })} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: profile.label, path: `/${profile.slug}` },
        ])}
      />
      {content.faqs.length > 0 && <JsonLd data={faqJsonLd(content.faqs)} />}

      <header className="flex flex-col items-center gap-1.5 text-center">
        <p className="text-sm font-medium text-muted">Optimize for</p>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <span className="text-sunset">{content.highlight}</span>
          {profile.confidence === "low" && (
            <Badge variant="soon" className="align-middle text-[10px]">
              Beta
            </Badge>
          )}
        </h1>
        <p className="max-w-xs text-sm text-muted">
          Drop your video in and we'll make it look its best after you post.
        </p>
        <div className="mt-1">
          <FavouriteButton profileId={profile.id} label={profile.label} />
        </div>
      </header>

      <Card className="p-4 sm:p-6">
        <ToolScreen profileId={profile.id} />
      </Card>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <ShieldCheck className="h-4 w-4 text-brand-via" />
        100% on your device — your video never leaves it.
      </p>

      {verified && (
        <p className="text-center text-[11px] text-muted">
          {profile.label} profile last verified {verified}.
        </p>
      )}

      <RelatedGuides profileId={profile.id} />
    </div>
  );
}
