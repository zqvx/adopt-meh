import { Backpack, Minus, Plus, Trash2 } from "lucide-react";
import { FEATURED_PETS, getPet, variantsFor } from "@/lib/pets/catalog";
import { lineValue } from "@/lib/pets/engine";
import { formatMoney, formatPoints, VARIANT_SHORT } from "@/lib/format";
import type { TradeLine, TradeSide } from "@/lib/pets/types";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PetGlyph } from "./PetGlyph";
import { PetSearch } from "./PetSearch";

function LineRow({ line, side }: { line: TradeLine; side: TradeSide }) {
  const pet = getPet(line.petId);
  const currency = useTradeStore((s) => s.currency);
  const setQty = useTradeStore((s) => s.setQty);
  const setVariant = useTradeStore((s) => s.setVariant);
  const removeLine = useTradeStore((s) => s.removeLine);
  if (!pet) return null;
  const value = lineValue(line);
  const trash = pet.liquidity === "trash";

  return (
    <li
      className={cn(
        "flex items-start gap-2.5 rounded-md bg-surface-2 p-2.5 shadow-[var(--shadow-border)]",
        trash && "shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-loss)_45%,transparent)]",
      )}
    >
      <PetGlyph id={pet.id} glyph={pet.glyph} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{pet.name}</p>
            <p className="font-mono text-[11px] text-muted tabular-nums">
              {formatPoints(value.points)} pts · {formatMoney(value.usd, currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeLine(side, line.id)}
            className="flex size-9 shrink-0 items-center justify-center rounded-sm text-faint hover:bg-loss-dim hover:text-loss"
            aria-label={`Remover ${pet.name}`}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {pet.hasVariants ? (
            <div className="flex flex-wrap gap-1">
              {variantsFor(pet).map((variant) => (
                <button
                  key={variant}
                  type="button"
                  onClick={() => setVariant(side, line.id, variant)}
                  className={cn(
                    "h-7 rounded-full px-2 font-mono text-[10px] tracking-wide transition-colors duration-150",
                    line.variant === variant
                      ? "bg-fg text-bg"
                      : "bg-surface-3 text-muted hover:text-fg",
                  )}
                >
                  {VARIANT_SHORT[variant]}
                </button>
              ))}
            </div>
          ) : (
            <Badge>{pet.category === "potion" ? "Poção" : "Item"}</Badge>
          )}
          {trash ? <Badge tone="loss">Trash</Badge> : null}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-sm bg-surface-3 text-muted hover:text-fg"
              onClick={() => setQty(side, line.id, line.qty - 1)}
              aria-label="Diminuir quantidade"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center font-mono text-sm tabular-nums">
              {line.qty}
            </span>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-sm bg-surface-3 text-muted hover:text-fg"
              onClick={() => setQty(side, line.id, line.qty + 1)}
              aria-label="Aumentar quantidade"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export function TradeColumn({
  side,
  title,
  hint,
}: {
  side: TradeSide;
  title: string;
  hint: string;
}) {
  const lines = useTradeStore((s) => (side === "you" ? s.you : s.them));
  const inventory = useTradeStore((s) => s.inventory);
  const setTab = useTradeStore((s) => s.setTab);
  const currency = useTradeStore((s) => s.currency);
  const addLine = useTradeStore((s) => s.addLine);
  const clear = useTradeStore((s) => s.clear);
  const points = lines.reduce((sum, line) => sum + lineValue(line).points, 0);
  const usd = lines.reduce((sum, line) => sum + lineValue(line).usd, 0);
  // No teu lado, mostra os pets do inventário para adicionar num clique.
  const myInventory = side === "you" ? inventory.slice(0, 12) : [];

  return (
    <section className="flex min-h-0 min-w-0 flex-col rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
            {side === "you" ? "A dar" : "A receber"}
          </p>
          <h2 className="text-lg font-medium tracking-tight">
            <span className="sm:hidden">
              {side === "you" ? "O Teu Lado" : "Oferta dele"}
            </span>
            <span className="hidden sm:inline">{title}</span>
          </h2>
          <p className="text-xs text-muted">{hint}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-medium tabular-nums">
            {formatPoints(points)}
            <span className="ml-1 text-xs text-muted">pts</span>
          </p>
          <p className="font-mono text-xs text-muted tabular-nums">
            {formatMoney(usd, currency)}
          </p>
        </div>
      </header>

      <PetSearch side={side} />

      {side === "you" ? (
        <div className="mt-3 rounded-lg bg-bg-sunken p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-faint uppercase">
              <Backpack className="size-3" />
              Meu inventário
            </p>
            <button
              type="button"
              onClick={() => setTab("inventory")}
              className="text-[11px] text-accent hover:underline"
            >
              Gerir →
            </button>
          </div>
          {myInventory.length === 0 ? (
            <p className="px-1 py-1.5 text-[11px] text-faint">
              Sem pets registados — abre o separador Inventário para adicionar.
            </p>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {myInventory.map((it) => {
                const pet = getPet(it.petId);
                if (!pet) return null;
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => addLine("you", pet.id, it.variant)}
                    title={`${pet.name} ${VARIANT_SHORT[it.variant]} ×${it.qty}`}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 text-xs text-muted shadow-[var(--shadow-border)] hover:text-fg"
                  >
                    <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
                    <span className="max-w-24 truncate">{pet.name}</span>
                    <span className="font-mono text-[10px] text-faint">
                      {VARIANT_SHORT[it.variant]}×{it.qty}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-3 max-w-full min-w-0 overflow-x-auto pb-1">
        <div className="flex w-max gap-1.5">
        {FEATURED_PETS.map((pet) => (
          <button
            key={pet.id}
            type="button"
            onClick={() => addLine(side, pet.id, pet.hasVariants ? "fr" : "regular")}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 text-xs text-muted shadow-[var(--shadow-border)] hover:text-fg"
          >
            <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
            <span className="max-w-28 truncate">{pet.name}</span>
          </button>
        ))}
        </div>
      </div>

      <ul className="mt-3 flex flex-1 flex-col gap-2">
        {lines.length === 0 ? (
          <li className="flex flex-1 items-center justify-center rounded-lg bg-bg-sunken px-4 py-10 text-center">
            <p className="max-w-[16rem] text-sm text-muted">
              Pesquisa um pet e escolhe Regular, Fly, Ride, FR, NFR ou MFR.
            </p>
          </li>
        ) : (
          lines.map((line) => <LineRow key={line.id} line={line} side={side} />)
        )}
      </ul>

      {lines.length > 0 ? (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => clear(side)}>
            Limpar lado
          </Button>
        </div>
      ) : null}
    </section>
  );
}
