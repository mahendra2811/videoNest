import type { Metadata } from "next";
import { Prose } from "@/components/marketing/Prose";
import { siteConfig } from "@/lib/config/site";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: "The terms for using VideoNest, a free, on-device video optimization tool.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-14 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="text-sm text-muted">
          This is a plain-language template. Have it reviewed by a professional before relying on
          it.
        </p>
      </header>

      <Prose>
        <h2>Acceptance</h2>
        <p>
          By using {siteConfig.name}, you agree to these terms. If you don't agree, please don't use
          the service.
        </p>

        <h2>The service</h2>
        <p>
          {siteConfig.name} is a free tool that re-encodes videos in your browser to prepare them
          for social platforms such as WhatsApp Status. All processing happens on your device; we
          don't receive or store your files.
        </p>

        <h2>Provided "as is"</h2>
        <p>
          The service is provided "as is" and "as available", without warranties of any kind. In
          particular, we do <strong>not</strong> control how WhatsApp or any other platform
          compresses, re-encodes, or displays your video after you upload it, and we make no
          guarantee about the final appearance on those platforms. Results depend on your source
          file, your browser, and your device.
        </p>

        <h2>Acceptable use</h2>
        <p>
          You agree to use {siteConfig.name} only for lawful purposes and only with content you have
          the right to use. You must not use it to process material that is illegal or that
          infringes others' rights.
        </p>

        <h2>Intellectual property</h2>
        <p>
          You keep all rights to the videos you process — we never see them, so we claim nothing.
          The {siteConfig.name} name, brand, and software are owned by us and may not be copied
          without permission.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, {siteConfig.name} and its creators are not liable
          for any indirect, incidental, or consequential damages arising from your use of the
          service, including any loss of data or differences in video quality after a platform's own
          processing.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms from time to time. Continued use after changes means you accept
          the updated terms.
        </p>

        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of the applicable jurisdiction of the operator.
          [Specify governing law before publishing.]
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms? Email{" "}
          <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
        </p>
      </Prose>
    </article>
  );
}
