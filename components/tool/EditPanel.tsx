"use client";

import {
  ChevronDown,
  Crop,
  Music,
  Scissors,
  Settings2,
  Smile,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type EditState, isOffAspect, makeTextLayer } from "@/lib/edit/state";
import type { ImageLayer, PlatformProfile, TextLayer, VideoMeta } from "@/lib/engine/types";
import { formatDuration } from "@/lib/utils";

const FONTS = [
  { label: "Sans", value: "system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Mono", value: "ui-monospace, monospace" },
  { label: "Round", value: "'Trebuchet MS', sans-serif" },
];
const COLORS = ["#ffffff", "#000000", "#ff4d4f", "#ffd166", "#06d6a0", "#4dabf7", "#f06595"];
const STICKERS = ["❤️", "🔥", "✨", "😂", "👍", "🎉", "⭐", "💯"];

/** Render an emoji to a small PNG data URL so it composites as an image layer. */
function emojiToDataUrl(emoji: string): string {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.font = `${Math.round(size * 0.8)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.06);
  return c.toDataURL("image/png");
}

type SetState = React.Dispatch<React.SetStateAction<EditState>>;

function Section({
  icon,
  title,
  hint,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-brand-via">{icon}</span>
        <span className="flex-1">
          <span className="block text-sm font-medium">{title}</span>
          {hint && <span className="block text-xs text-muted">{hint}</span>}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-border border-t px-4 py-3">{children}</div>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-sunset" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

/** Live preview box at the target aspect, with draggable overlays. */
function PreviewStage({
  inputUrl,
  aspect,
  fill,
  state,
  setState,
  selected,
  setSelected,
}: {
  inputUrl: string | null;
  aspect: number; // width / height
  fill: boolean;
  state: EditState;
  setState: SetState;
  selected: string | null;
  setSelected: (id: string | null) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const dragId = React.useRef<string | null>(null);

  const onPointerDown = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragId.current = id;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setSelected(id);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    const id = dragId.current;
    setState((s) => ({
      ...s,
      overlays: s.overlays.map((o) => (o.id === id ? { ...o, x: px, y: py } : o)),
    }));
  };

  const endDrag = () => {
    dragId.current = null;
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      className="relative mx-auto w-full max-w-[240px] touch-none overflow-hidden rounded-2xl border border-border bg-black"
      style={{ aspectRatio: String(aspect) }}
    >
      {inputUrl && (
        <video
          src={inputUrl}
          muted
          loop
          autoPlay
          playsInline
          className="h-full w-full"
          style={{ objectFit: fill ? "cover" : "contain" }}
        />
      )}
      {state.overlays.map((o) => (
        <button
          type="button"
          key={o.id}
          onPointerDown={onPointerDown(o.id)}
          className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move whitespace-nowrap ${
            selected === o.id ? "outline outline-2 outline-brand-via" : ""
          }`}
          style={{ left: `${o.x * 100}%`, top: `${o.y * 100}%` }}
        >
          {o.type === "text" ? (
            <span
              style={{
                color: o.color,
                fontFamily: o.fontFamily,
                fontWeight: 700,
                fontSize: `${o.size * 240}px`,
                background: o.background ? "rgba(0,0,0,0.45)" : "transparent",
                padding: o.background ? "0.1em 0.3em" : 0,
                borderRadius: "0.3em",
                textShadow: o.shadow ? "0 1px 4px rgba(0,0,0,0.6)" : "none",
              }}
            >
              {o.text}
            </span>
          ) : (
            // biome-ignore lint/performance/noImgElement: tiny data-URL sticker in an editor preview
            <img
              src={o.src}
              alt=""
              draggable={false}
              style={{
                width: `${o.scale * 240}px`,
                transform: `rotate(${o.rotation}deg)`,
              }}
            />
          )}
        </button>
      ))}
      {fill && (
        <span className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white/90">
          Filled (centre crop)
        </span>
      )}
    </div>
  );
}

export function EditPanel({
  state,
  setState,
  profile,
  meta,
  inputUrl,
}: {
  state: EditState;
  setState: SetState;
  profile: PlatformProfile;
  meta: VideoMeta | null;
  inputUrl: string | null;
}) {
  const [selectedOverlay, setSelectedOverlay] = React.useState<string | null>(null);
  const offAspect = isOffAspect(profile, meta);
  const fill = offAspect && state.aspectMode === "fill";
  const aspect = profile.aspect === "16:9" ? 16 / 9 : profile.aspect === "9:16" ? 9 / 16 : 1;
  const duration = meta?.durationSec ?? 0;
  const maxDur = profile.maxDurationSec;

  const selected = state.overlays.find((o) => o.id === selectedOverlay) as TextLayer | undefined;

  const updateOverlay = (id: string, patch: Partial<TextLayer> & Partial<ImageLayer>) =>
    setState((s) => ({
      ...s,
      overlays: s.overlays.map((o) => (o.id === id ? ({ ...o, ...patch } as typeof o) : o)),
    }));

  const removeOverlay = (id: string) =>
    setState((s) => ({ ...s, overlays: s.overlays.filter((o) => o.id !== id) }));

  const trim = state.trim ?? { start: 0, end: Math.min(duration || maxDur, maxDur) };

  return (
    <div className="flex flex-col gap-3">
      <PreviewStage
        inputUrl={inputUrl}
        aspect={aspect}
        fill={fill}
        state={state}
        setState={setState}
        selected={selectedOverlay}
        setSelected={setSelectedOverlay}
      />

      {/* Trim (B1) */}
      {duration > 0 && (
        <Section icon={<Scissors className="h-4 w-4" />} title="Trim" hint="Pick start and end">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>{formatDuration(trim.start)}</span>
            <span>{formatDuration(trim.end)}</span>
          </div>
          <label className="text-xs text-muted">
            Start
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={trim.start}
              onChange={(e) => {
                const start = Math.min(Number(e.target.value), trim.end - 0.5);
                setState((s) => ({ ...s, trim: { start, end: trim.end } }));
              }}
              className="mt-1 w-full accent-[var(--brand-via)]"
            />
          </label>
          <label className="text-xs text-muted">
            End
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={trim.end}
              onChange={(e) => {
                const end = Math.max(Number(e.target.value), trim.start + 0.5);
                setState((s) => ({ ...s, trim: { start: trim.start, end } }));
              }}
              className="mt-1 w-full accent-[var(--brand-via)]"
            />
          </label>
          {state.trim && (
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, trim: null }))}
              className="self-start text-xs text-muted underline underline-offset-4"
            >
              Reset to full clip
            </button>
          )}
          {trim.end - trim.start > maxDur && (
            <p className="text-[11px] text-amber-600">
              Over {profile.label}'s {maxDur}s limit — it'll be trimmed to {maxDur}s.
            </p>
          )}
        </Section>
      )}

      {/* Frame: Fit / Fill (B1) */}
      {offAspect && (
        <Section
          icon={<Crop className="h-4 w-4" />}
          title="Frame"
          hint="Your video isn't this platform's shape"
          defaultOpen
        >
          <div className="grid grid-cols-2 gap-2">
            {(["fit", "fill"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    aspectMode: mode,
                    cropRect: mode === "fill" ? s.cropRect : null,
                  }))
                }
                className={`rounded-xl border p-3 text-left text-sm ${
                  state.aspectMode === mode ? "border-brand-via bg-brand-via/5" : "border-border"
                }`}
              >
                <span className="block font-medium capitalize">{mode}</span>
                <span className="block text-[11px] text-muted">
                  {mode === "fit" ? "Blurred bars, whole frame" : "Crop to fill, no bars"}
                </span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Text (B2) */}
      <Section icon={<Type className="h-4 w-4" />} title="Text" hint="Add captions or a title">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            const layer = makeTextLayer();
            setState((s) => ({ ...s, overlays: [...s.overlays, layer] }));
            setSelectedOverlay(layer.id);
          }}
        >
          Add text
        </Button>
        {state.overlays
          .filter((o): o is TextLayer => o.type === "text")
          .map((o) => (
            <div key={o.id} className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={o.text}
                  onChange={(e) => updateOverlay(o.id, { text: e.target.value })}
                  onFocus={() => setSelectedOverlay(o.id)}
                  className="h-9"
                />
                <button
                  type="button"
                  onClick={() => removeOverlay(o.id)}
                  aria-label="Remove text"
                  className="text-muted hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    onClick={() => updateOverlay(o.id, { color: c })}
                    className={`h-6 w-6 rounded-full border ${
                      o.color === c ? "ring-2 ring-brand-via ring-offset-1" : "border-border"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FONTS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => updateOverlay(o.id, { fontFamily: f.value })}
                    className={`rounded-lg border px-2 py-1 text-xs ${
                      o.fontFamily === f.value ? "border-brand-via" : "border-border"
                    }`}
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <label className="text-xs text-muted">
                Size
                <input
                  type="range"
                  min={0.03}
                  max={0.16}
                  step={0.005}
                  value={o.size}
                  onChange={(e) => updateOverlay(o.id, { size: Number(e.target.value) })}
                  className="mt-1 w-full accent-[var(--brand-via)]"
                />
              </label>
              <div className="flex gap-3">
                <Toggle
                  checked={o.background}
                  onChange={(v) => updateOverlay(o.id, { background: v })}
                  label="Pill"
                />
                <Toggle
                  checked={o.shadow}
                  onChange={(v) => updateOverlay(o.id, { shadow: v })}
                  label="Shadow"
                />
              </div>
            </div>
          ))}
        {selected && (
          <p className="text-[11px] text-muted">Drag text on the preview to position it.</p>
        )}
      </Section>

      {/* Stickers (B4) */}
      <Section icon={<Smile className="h-4 w-4" />} title="Stickers" hint="Tap to add an emoji">
        <div className="flex flex-wrap gap-2">
          {STICKERS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                const src = emojiToDataUrl(emoji);
                if (!src) return;
                const layer: ImageLayer = {
                  type: "image",
                  id: `s${Math.round(performance.now())}-${emoji.codePointAt(0)}`,
                  src,
                  x: 0.5,
                  y: 0.5,
                  scale: 0.18,
                  rotation: 0,
                };
                setState((s) => ({ ...s, overlays: [...s.overlays, layer] }));
                setSelectedOverlay(layer.id);
              }}
              className="rounded-lg border border-border p-1.5 text-2xl"
            >
              {emoji}
            </button>
          ))}
        </div>
        {state.overlays.some((o) => o.type === "image") && (
          <p className="text-[11px] text-muted">Drag stickers on the preview to position them.</p>
        )}
      </Section>

      {/* Music (B3) */}
      <Section icon={<Music className="h-4 w-4" />} title="Music" hint="Add or replace the audio">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f)
              setState((s) => ({
                ...s,
                music: { file: f, mode: "mix", volume: 0.8, duck: true },
              }));
          }}
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted/10 file:px-3 file:py-1.5 file:text-sm"
        />
        {state.music && (
          <div className="flex flex-col gap-2">
            <p className="truncate text-xs text-muted">{state.music.file.name}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["mix", "replace"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    setState((s) => (s.music ? { ...s, music: { ...s.music, mode } } : s))
                  }
                  className={`rounded-xl border p-2 text-sm capitalize ${
                    state.music?.mode === mode ? "border-brand-via bg-brand-via/5" : "border-border"
                  }`}
                >
                  {mode === "mix" ? "Mix under" : "Replace"}
                </button>
              ))}
            </div>
            <label className="text-xs text-muted">
              Music volume
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={state.music.volume}
                onChange={(e) =>
                  setState((s) =>
                    s.music ? { ...s, music: { ...s.music, volume: Number(e.target.value) } } : s,
                  )
                }
                className="mt-1 w-full accent-[var(--brand-via)]"
              />
            </label>
            {state.music.mode === "mix" && (
              <Toggle
                checked={state.music.duck}
                onChange={(v) =>
                  setState((s) => (s.music ? { ...s, music: { ...s.music, duck: v } } : s))
                }
                label="Lower original audio under music"
              />
            )}
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, music: null }))}
              className="self-start text-xs text-muted underline underline-offset-4"
            >
              Remove music
            </button>
          </div>
        )}
      </Section>

      {/* Quality options (A5/A6/A3) */}
      <Section icon={<Settings2 className="h-4 w-4" />} title="Quality options">
        <Toggle
          checked={state.sharpen}
          onChange={(v) => setState((s) => ({ ...s, sharpen: v }))}
          label="Light sharpen"
        />
        <p className="-mt-1 text-[11px] text-muted">
          Optional — can add artifacts after the platform recompresses.
        </p>
        <Toggle
          checked={state.normalizeLoudness}
          onChange={(v) => setState((s) => ({ ...s, normalizeLoudness: v }))}
          label="Normalize loudness (−14 LUFS)"
        />
        <p className="-mt-1 text-[11px] text-muted">
          Off by default — most platforms normalize loudness themselves.
        </p>

        {profile.brand === "youtube" && (
          <>
            <div className="mt-1">
              <span className="block text-sm">Quality</span>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(["1080p", "1440p", "4K"] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, youtubeQuality: q }))}
                    className={`rounded-xl border py-2 text-sm ${
                      state.youtubeQuality === q
                        ? "border-brand-via bg-brand-via/5"
                        : "border-border"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-muted">Capped to your source — never upscaled.</p>
            </div>
            <div className="mt-1">
              <span className="block text-sm">Codec</span>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(["avc", "av1", "hevc"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setState((s) => ({ ...s, videoCodec: c }))}
                    className={`rounded-xl border py-2 text-sm uppercase ${
                      state.videoCodec === c ? "border-brand-via bg-brand-via/5" : "border-border"
                    }`}
                  >
                    {c === "avc" ? "H.264" : c}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-muted">
                AV1/HEVC used only if your browser supports it, else H.264.
              </p>
            </div>
          </>
        )}
      </Section>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
        <Sparkles className="h-3.5 w-3.5 text-brand-via" />
        Editing is optional — skip it and we just optimize.
      </p>
    </div>
  );
}
