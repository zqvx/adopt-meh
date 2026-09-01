import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchPets, variantsFor } from "@/lib/pets/catalog";
import { VARIANT_SHORT } from "@/lib/format";
import type { Pet, TradeSide, Variant } from "@/lib/pets/types";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PetGlyph } from "./PetGlyph";

function liquidityTone(pet: Pet) {
  if (pet.liquidity === "trash") return "loss" as const;
  if (pet.liquidity === "low") return "warn" as const;
  if (pet.liquidity === "high") return "accent" as const;
  return "neutral" as const;
}

export function PetSearch({ side }: { side: TradeSide }) {
  const addLine = useTradeStore((s) => s.addLine);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Pet | null>(null);
  const [variant, setVariant] = useState<Variant>("fr");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchPets(query, 10), [query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setPicked(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choosePet(pet: Pet) {
    if (!pet.hasVariants) {
      addLine(side, pet.id, "regular");
      setQuery("");
      setOpen(false);
      setPicked(null);
      return;
    }
    setPicked(pet);
    setVariant("fr");
  }

  function confirm(pet: Pet, nextVariant: Variant) {
    addLine(side, pet.id, nextVariant);
    setQuery("");
    setOpen(false);
    setPicked(null);
    inputRef.current?.focus();
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setPicked(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Pesquisar pet, poção ou ovo…"
          className="h-11 w-full rounded-md bg-surface-2 pr-10 pl-10 text-sm text-fg shadow-[var(--shadow-border)] outline-none transition-[box-shadow] duration-150 placeholder:text-faint focus-visible:shadow-[0_0_0_1px_var(--color-accent)]"
          autoComplete="off"
          spellCheck={false}
        />
        {query ? (
          <button
            type="button"
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted hover:text-fg"
            onClick={() => {
              setQuery("");
              setPicked(null);
              inputRef.current?.focus();
            }}
            aria-label="Limpar pesquisa"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg bg-surface-2 shadow-[var(--shadow-border)]">
          {picked ? (
            <div className="p-3">
              <div className="mb-3 flex items-center gap-2">
                <PetGlyph id={picked.id} glyph={picked.glyph} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{picked.name}</p>
                  <p className="font-mono text-[11px] text-muted">Escolhe o estado</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {variantsFor(picked).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => confirm(picked, v)}
                    onMouseEnter={() => setVariant(v)}
                    className={cn(
                      "h-10 rounded-sm font-mono text-xs tracking-wide transition-colors duration-150",
                      variant === v
                        ? "bg-accent text-accent-fg"
                        : "bg-surface-3 text-muted hover:text-fg",
                    )}
                  >
                    {VARIANT_SHORT[v]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((pet) => (
                <li key={pet.id}>
                  <button
                    type="button"
                    onClick={() => choosePet(pet)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-3"
                  >
                    <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{pet.name}</span>
                      <span className="font-mono text-[11px] text-muted">
                        {pet.values.fr.points} pts FR
                      </span>
                    </span>
                    <Badge tone={liquidityTone(pet)}>
                      {pet.liquidity === "trash" ? "Trash" : pet.tier}
                    </Badge>
                  </button>
                </li>
              ))}
              {query && results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">
                  Sem resultados para “{query}”
                </li>
              ) : null}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
