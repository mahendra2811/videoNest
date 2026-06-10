import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/ContactForm";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "Get in touch with the VideoNest team.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-14 sm:px-6">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Get in touch</h1>
        <p className="text-muted">
          Feedback, a bug, or a platform you'd like us to support next? We'd love to hear it.
        </p>
      </header>
      <ContactForm />
    </div>
  );
}
