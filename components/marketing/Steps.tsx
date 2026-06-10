import { Share2, Sparkles, Upload } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "Pick a video",
    body: "Drop in any clip — MP4, MOV, WebM and more.",
  },
  {
    icon: Sparkles,
    title: "We optimize it on your device",
    body: "Re-encoded right in your browser. Nothing is uploaded.",
  },
  {
    icon: Share2,
    title: "Share or download",
    body: "Post straight to the app, or save the optimized file.",
  },
];

export function Steps() {
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {STEPS.map((step, i) => (
        <li
          key={step.title}
          className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-6"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sunset font-mono text-sm font-bold text-white">
              {i + 1}
            </span>
            <step.icon className="h-5 w-5 text-brand-via" />
          </div>
          <h3 className="font-bold tracking-tight">{step.title}</h3>
          <p className="text-sm text-muted">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
