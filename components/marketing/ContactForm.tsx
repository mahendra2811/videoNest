"use client";

import { Mail, Send } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { flags } from "@/lib/config/flags";
import { siteConfig } from "@/lib/config/site";

export function ContactForm() {
  const [submitting, setSubmitting] = React.useState(false);

  // mailto fallback when no Formspree id is configured.
  if (flags.contactProvider === "mailto") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-surface p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sunset text-white">
          <Mail className="h-7 w-7" />
        </div>
        <p className="text-muted">
          Drop us a line and we'll get back to you. Your email app will open with our address ready
          to go.
        </p>
        <Button asChild size="lg">
          <a href={`mailto:${siteConfig.contactEmail}`}>Email {siteConfig.contactEmail}</a>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    try {
      const res = await fetch(`https://formspree.io/f/${flags.formspreeId}`, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        toast.success("Thanks! Your message is on its way.");
        form.reset();
      } else {
        toast.error("Something went wrong. Please email us directly.");
      }
    } catch {
      toast.error("Couldn't send right now. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 sm:p-8"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required placeholder="Your name" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required placeholder="How can we help?" />
      </div>
      <Button type="submit" size="lg" disabled={submitting}>
        <Send className="h-5 w-5" />
        {submitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
