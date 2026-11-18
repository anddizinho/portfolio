"use client";

import { useEffect, useRef, useState } from "react";

export type ColorKey = "titleColor" | "subtitleColor" | "background";
export const colorLabels: Record<ColorKey, string> = {
  titleColor: "Títulos", subtitleColor: "Subtítulos", background: "Fundo",
};
export const colorKeys = Object.keys(colorLabels) as ColorKey[];

const hexPattern = /^#[0-9a-f]{6}$/i;
const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

function toHsl(hex: string) {
  const [r, g, b] = (hex.slice(1).match(/../g) ?? ["00", "00", "00"]).map((part) => parseInt(part, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const spread = max - min, light = (max + min) / 2;
  const sat = spread ? spread / (1 - Math.abs(2 * light - 1)) : 0;
  let hue = 0;
  if (spread) hue = max === r ? (g - b) / spread : max === g ? (b - r) / spread + 2 : (r - g) / spread + 4;
  return [Math.round((hue * 60 + 360) % 360), Math.round(sat * 100), Math.round(light * 100)];
}

function toHex([h, s, l]: number[]) {
  const saturation = s / 100, light = l / 100;
  const range = saturation * Math.min(light, 1 - light);
  const channel = (offset: number) => {
    const k = (offset + h / 30) % 12;
    return Math.round(255 * (light - range * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange(value: string): void }) {
  const picker = useRef<HTMLDetailsElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [channelDraft, setChannelDraft] = useState<{ hex: string; channels: number[] } | null>(null);
  const hsl = channelDraft?.hex === value ? channelDraft.channels : toHsl(value);
  useEffect(() => {
    const details = picker.current;
    if (!details) return;
    const closeOutside = (event: PointerEvent | FocusEvent) => {
      if (event.target instanceof Node && !details.contains(event.target)) details.open = false;
    };
    const closeInPreview = () => {
      if (document.activeElement instanceof HTMLIFrameElement) details.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    window.addEventListener("blur", closeInPreview);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      window.removeEventListener("blur", closeInPreview);
    };
  }, []);
  return (
    <details ref={picker} className="dashboard-color" onKeyDown={(event) => {
      if (event.key !== "Escape" || !event.currentTarget.open) return;
      event.currentTarget.open = false;
      event.currentTarget.querySelector("summary")?.focus();
    }}>
      <summary><span className="color-sample" style={{ background: value }} /><span>{label}<small>{value.toUpperCase()}</small></span><span aria-hidden="true">⌄</span></summary>
      <div className="color-popover">
        <div className="color-popover-title">Escolher cor</div>
        <label className="color-native">Amostra<input type="color" value={value} onChange={(event) => { setDraft(null); setChannelDraft(null); onChange(event.target.value); }} /></label>
        <div className="color-channels">{["Matiz", "Saturação", "Luminosidade"].map((channel, index) => {
          const max = index === 0 ? 359 : 100;
          const update = (number: number) => {
            const next = [...hsl];
            next[index] = clamp(number, max);
            setDraft(null);
            const hex = toHex(next);
            setChannelDraft({ hex, channels: next });
            onChange(hex);
          };
          return <label key={channel}>{channel}
            <input type="range" aria-label={channel} min={0} max={max} value={hsl[index]} onChange={(event) => update(Number(event.target.value))} />
            <input type="number" aria-label={`${channel} em ${index === 0 ? "graus" : "porcentagem"}`} min={0} max={max} value={hsl[index]} onChange={(event) => update(Number(event.target.value))} />
          </label>;
        })}</div>
        <label>Hexadecimal<input value={draft ?? value.toUpperCase()} maxLength={7} onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          const hex = next.startsWith("#") ? next : `#${next}`;
          if (hexPattern.test(hex)) {
            setChannelDraft(null);
            onChange(hex.toLowerCase());
          }
        }} onBlur={() => setDraft(null)} spellCheck={false} /></label>
      </div>
    </details>
  );
}
