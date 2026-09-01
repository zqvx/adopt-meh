import { Search, X, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchPets, variantsFor } from "@/lib/pets/catalog";
import { addCustomPet, useCustomPetsVersion, type CustomPetInput } from "@/lib/pets/custom";
import { VARIANT_SHORT } from "@/lib/format";
import type { Pet, TradeSide, Variant } from "@/lib/pets/types";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PetGlyph } from "./PetGlyph";
import { VerifyPetLinks } from "@/components/verify/VerifyPet";

function liquidityTone(pet: Pet) {
  if (pet.liquidity === "trash") return "loss" as const;
  if (pet.liquidity === "low") return "warn" as const;
  if (pet.liquidity === "high") return "accent" as const;
  return "neutral" as const;
}

const RARITIES: Array<{ label: string; tier: CustomPetInput["tier"] }> = [
  { label: "Lendário", tier: "A" },
  { label: "Ultra-raro", tier: "B" },
  { label: "Raro", tier: "C" },
  { label: "Incomum", tier: "D" },
  { label: "Comum", tier: "D" },
];

const VARIANT_OPTIONS: Variant[] = ["regular", "fly", "ride", "fr", "nfr", "mfr"];

function CustomPetForm({
  name,
  side,
  onDone,
}: {
  name: string;
  side: TradeSide;
  onDone: () => void;
}) {
  const addLine = useTradeStore((s) => s.addLine);
  const [tier, setTier] = useState<CustomPetInput["tier"]>("A");
  const [variant, setVariant] = useState<Variant>("fr");
  const [eur, setEur] = useState("");

  const eurValue = parseFloat(eur.replace(",", "."));
  const eurValid = Number.isFinite(eurValue) && eurValue > 0;

  function create() {
    if (!eurValid) return;
    const pet = addCustomPet({ name: name.trim(), tier, variant, eurValue });
    addLine(side, pet.id, variant);
    onDone();
  }

  return (
    <div className="border-t border-line px-3 py-3">
      <p className="mb-2 text-xs font-medium text-accent">
        “{name}” não está no catálogo — adiciona como pet personalizado:
      </p>
      <div className="mb-2">
        <p className="mb-1 font-mono text-[10px] text-faint uppercase">Raridade</p>
        <div className="flex flex-wrap gap-1">
          {RARITIES.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setTier(r.tier)}
              className={cn(
                "rounded-sm px-2 py-1 font-mono text-[11px]",
                tier === r.tier
                  ? "bg-accent text-accent-fg"
                  : "bg-surface-3 text-muted hover:text-fg",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-2">
        <p className="mb-1 font-mono text-[10px] text-faint uppercase">Estado</p>
        <div className="flex flex-wrap gap-1">
          {VARIANT_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariant(v)}
              className={cn(
                "rounded-sm px-2 py-1 font-mono text-[11px]",
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
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-faint">
            €
          </span>
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={eur}
            onChange={(e) => setEur(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") create();
            }}
            placeholder="valor em dinheiro (ex.: 12.50)"
            className="h-9 w-full rounded-sm bg-surface-3 pl-6 pr-2 text-sm outline-none focus-visible:shadow-[0_0_0_1px_var(--color-accent)]"
          />
        </div>
        <button
          type="button"
          onClick={create}
          disabled={!eurValid}
          className="flex h-9 items-center gap-1 rounded-sm bg-accent px-3 font-mono text-xs text-accent-fg disabled:opacity-40"
        >
          <Plus className="size-3.5" />
          Adicionar
        </button>
      </div>
      <p className="mt-1.5 font-mono text-[10px] text-faint">
        O valor em pontos calcula-se sozinho (~€ → pontos). O pet fica guardado para trocas,
        inventário e craft.
      </p>
    </div>
  );
}

export function PetSearch({ side }: { side: TradeSide }) {
  const addLine = useTradeStore((s) => s.addLine);
  useCustomPetsVersion(); // re-renderiza quando adicionas um pet personalizado
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Pet | null>(null);
  const [variant, setVariant] = useState<Variant>("fr");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchPets(query, 10), [query]);
  const showCustom = query.trim().length >= 2 && results.length === 0;

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
            <>
              <ul className="max-h-72 overflow-y-auto py-1">
                {results.map((pet) => (
                  <li key={pet.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => choosePet(pet)}
                      className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-3"
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
                    <span className="pr-2">
                      <VerifyPetLinks name={pet.name} />
                    </span>
                  </li>
                ))}
                {query && results.length === 0 ? (
                  <li className="px-3 py-3 text-center text-sm text-muted">
                    Sem resultados no catálogo.
                  </li>
                ) : null}
              </ul>
              {showCustom ? (
                <CustomPetForm
                  name={query.trim()}
                  side={side}
                  onDone={() => {
                    setQuery("");
                    setOpen(false);
                    setPicked(null);
                    inputRef.current?.focus();
                  }}
                />
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
