import type { Glyph } from "@/lib/pets/types";
import { cn } from "@/lib/utils";

const GLYPH_CLASS: Record<Glyph, string> = {
  night: "text-glyph-night",
  ember: "text-glyph-ember",
  frost: "text-glyph-frost",
  moss: "text-glyph-moss",
  sand: "text-glyph-sand",
  ink: "text-glyph-ink",
  copper: "text-glyph-copper",
  teal: "text-glyph-teal",
  bone: "text-glyph-bone",
  blood: "text-glyph-blood",
  pearl: "text-glyph-pearl",
  forest: "text-glyph-forest",
  storm: "text-glyph-storm",
  sun: "text-glyph-sun",
  void: "text-glyph-void",
  mint: "text-glyph-mint",
  clay: "text-glyph-clay",
  steel: "text-glyph-steel",
  ocean: "text-glyph-ocean",
  wine: "text-glyph-wine",
};

function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function Shape({ kind }: { kind: number }) {
  switch (kind % 6) {
    case 0:
      return (
        <polygon
          points="16,3 28,10 28,22 16,29 4,22 4,10"
          fill="currentColor"
          fillOpacity="0.92"
        />
      );
    case 1:
      return (
        <polygon
          points="16,4 28,16 16,28 4,16"
          fill="currentColor"
          fillOpacity="0.92"
        />
      );
    case 2:
      return (
        <>
          <circle cx="16" cy="16" r="11" fill="currentColor" fillOpacity="0.92" />
          <circle cx="16" cy="16" r="4" fill="var(--color-surface)" />
        </>
      );
    case 3:
      return (
        <polygon
          points="16,5 27,26 5,26"
          fill="currentColor"
          fillOpacity="0.92"
        />
      );
    case 4:
      return (
        <rect
          x="6"
          y="6"
          width="20"
          height="20"
          rx="4"
          fill="currentColor"
          fillOpacity="0.92"
        />
      );
    default:
      return (
        <path
          d="M16 4 L20 12 L28 16 L20 20 L16 28 L12 20 L4 16 L12 12 Z"
          fill="currentColor"
          fillOpacity="0.92"
        />
      );
  }
}

export function PetGlyph({
  id,
  glyph,
  size = "md",
}: {
  id: string;
  glyph: Glyph;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "size-8" : size === "lg" ? "size-12" : "size-10";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm bg-surface-3",
        dim,
        GLYPH_CLASS[glyph],
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="size-[70%]">
        <Shape kind={hash(id)} />
      </svg>
    </span>
  );
}
