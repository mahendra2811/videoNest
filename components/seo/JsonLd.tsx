/** Renders a JSON-LD script tag. Server component. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires raw injection
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
