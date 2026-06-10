"use client";

import type { LucideIcon } from "lucide-react";
import { Share2, Sparkles, Upload } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Upload,
    title: "Pick a video",
    body: "Drop in any clip — MP4, MOV, WebM, MKV and more. Nothing uploads; it's read straight from your device.",
  },
  {
    icon: Sparkles,
    title: "We optimize it on your device",
    body: "VideoNest re-encodes it right in your browser into the cleanest file for your chosen platform — correct size, aspect and bitrate. Your video never leaves your device.",
  },
  {
    icon: Share2,
    title: "Share or download",
    body: "Post it straight to the app, or download the optimized file. WhatsApp clips over 30s are split into parts you can post in order.",
  },
];

export function Steps() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Accordion type="single" collapsible defaultValue="step-0" className="w-full">
        {STEPS.map((step, i) => (
          <AccordionItem key={step.title} value={`step-${i}`}>
            <AccordionTrigger>
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sunset font-mono text-xs font-bold text-white">
                  {i + 1}
                </span>
                <step.icon className="h-4 w-4 shrink-0 text-brand-via" />
                <span className="text-sm font-semibold sm:text-base">{step.title}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <span className="block pl-11">{step.body}</span>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
