import type { Metadata } from "next";
import { Prose } from "@/components/marketing/Prose";
import { flags } from "@/lib/config/flags";
import { siteConfig } from "@/lib/config/site";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How VideoNest handles your data: your video never leaves your device, and every analytics or ad integration is optional.",
  path: "/privacy-policy",
});

const analyticsOn = flags.analyticsEnabled || flags.gtmEnabled;
const adsOn = flags.adsEnabled;
const usesFormspree = flags.contactProvider === "formspree";

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-14 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="text-sm text-muted">
          This is a plain-language template. Have it reviewed by a professional before relying on
          it.
        </p>
      </header>

      <Prose>
        <h2>Your videos never leave your device</h2>
        <p>
          {siteConfig.name} processes video entirely inside your web browser, on your own device. We
          do <strong>not</strong> upload, transmit, store, or have any access to the video files you
          optimize. There is no server that receives your media — the optimization happens locally
          and the result stays with you.
        </p>

        <h2>No accounts</h2>
        <p>
          We don't offer or require accounts, logins, or profiles. We don't ask for personal details
          to use the tool.
        </p>

        <h2>Analytics</h2>
        {analyticsOn ? (
          <p>
            We use privacy-respecting, aggregate analytics (Google Analytics / Google Tag Manager)
            to understand anonymous usage — for example, how many people optimized a video. This
            data is not tied to your identity and never includes your video content. These services
            may set cookies for measurement.
          </p>
        ) : (
          <p>
            This deployment of {siteConfig.name} does not load any analytics. No usage-tracking
            cookies are set.
          </p>
        )}

        <h2>Advertising</h2>
        {adsOn ? (
          <p>
            We display ads via Google AdSense, which may use cookies to serve and measure ads. Ads
            never have access to your video content. You can manage ad personalization through your
            Google account settings.
          </p>
        ) : (
          <p>This deployment does not show ads and does not load any advertising scripts.</p>
        )}

        <h2>Contact form</h2>
        {usesFormspree ? (
          <p>
            If you use our contact form, your name, email and message are sent to our form provider
            (Formspree) solely so we can reply. We don't use that information for anything else.
          </p>
        ) : (
          <p>
            Our contact page opens your own email client via a <code>mailto:</code> link. No form
            data is collected or processed by us.
          </p>
        )}

        <h2>Cookies</h2>
        {analyticsOn || adsOn ? (
          <p>
            Cookies on this site come only from the third-party services noted above (analytics
            and/or ads). {siteConfig.name} itself does not set tracking cookies.
          </p>
        ) : (
          <p>
            {siteConfig.name} does not set tracking cookies. Your browser may store small amounts of
            data locally (such as your light/dark theme preference), but this stays on your device.
          </p>
        )}

        <h2>Third-party links</h2>
        <p>
          Our site may link to third-party websites (such as WhatsApp). We're not responsible for
          their privacy practices; please review their policies.
        </p>

        <h2>Children</h2>
        <p>
          {siteConfig.name} is not directed at children under 13, and we do not knowingly collect
          personal information from them.
        </p>

        <h2>Changes</h2>
        <p>
          We may update this policy from time to time. Material changes will be reflected on this
          page.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about privacy? Email us at{" "}
          <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
        </p>
      </Prose>
    </article>
  );
}
