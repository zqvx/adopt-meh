import { useMemo, useState } from "react";
import { PETS } from "@/lib/pets/catalog";
import { liquidityScore } from "@/lib/pets/engine";
import { formatMoney, formatPoints, VARIANT_SHORT } from "@/lib/format";
import type { Tier } from "@/lib/pets/types";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PetGlyph } from "@/components/trade/PetGlyph";

const TIERS: Array<Tier | "ALL"> = ["ALL", "S", "A", "B", "C", "D"];

function LiqScore({ score }: { score: number }) {
  const color =
    score >= 7 ? "bg-accent" : score >= 4.5 ? "bg-warn" : "bg-loss";
  const label =
    score >= 7 ? "vende rápido" : score >= 4.5 ? "vende em dias" : "pode demorar semanas";
  return (
    <div className="flex items-center gap-2" title={`${score}/10 — ${label}`}>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-3">
        <div className={`h-full ${color}`} style={{ width: `${(score / 10) * 100}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted">{score.toFixed(0)}</span>
    </div>
  );
}

function Demand({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Procura ${n} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-2.5 rounded-full",
            i < n ? "bg-accent" : "bg-surface-3",
          )}
        />
      ))}
    </span>
  );
}

export function TierTable() {
  const currency = useTradeStore((s) => s.currency);
  const addLine = useTradeStore((s) => s.addLine);
  const setTab = useTradeStore((s) => s.setTab);
  const [tier, setTier] = useState<Tier | "ALL">("ALL");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PETS.filter((pet) => {
      if (tier !== "ALL" && pet.tier !== tier) return false;
      if (!query) return true;
      return (
        pet.name.toLowerCase().includes(query) ||
        pet.aliases.some((a) => a.toLowerCase().includes(query))
      );
    }).sort((a, b) => b.values.fr.usd - a.values.fr.usd);
  }, [tier, q]);

  return (
    <section className="min-w-0 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
            Referência rápida
          </p>
          <h2 className="text-lg font-medium tracking-tight">Tabela de preços</h2>
          <p className="text-sm text-muted">
            High-tiers e liquidez. Clica numa linha para adicionar FR ao teu lado.
          </p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar…"
          className="sm:max-w-56"
        />
      </header>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {TIERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTier(t)}
            className={cn(
              "h-9 rounded-full px-3 font-mono text-xs tracking-wide",
              tier === t ? "bg-fg text-bg" : "bg-surface-2 text-muted hover:text-fg",
            )}
          >
            {t === "ALL" ? "Todos" : `Tier ${t}`}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg bg-bg-sunken">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="font-mono text-[11px] tracking-wide text-faint uppercase">
            <tr className="border-b border-line">
              <th className="px-3 py-2.5 font-medium">Ativo</th>
              <th className="px-3 py-2.5 font-medium">Tier</th>
              <th className="px-3 py-2.5 font-medium">FR</th>
              <th className="px-3 py-2.5 font-medium">NFR</th>
              <th className="px-3 py-2.5 font-medium">MFR</th>
              <th className="px-3 py-2.5 font-medium">Procura</th>
              <th className="px-3 py-2.5 font-medium">Liquidez 1–10</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((pet) => (
              <tr
                key={pet.id}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-surface-2"
                onClick={() => {
                  addLine("you", pet.id, pet.hasVariants ? "fr" : "regular");
                  setTab("trade");
                }}
              >
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-2">
                    <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
                    <span>
                      <span className="block font-medium">{pet.name}</span>
                      <span className="font-mono text-[11px] text-muted">
                        {pet.hasVariants ? VARIANT_SHORT.fr : pet.category}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono text-muted">{pet.tier}</td>
                <td className="px-3 py-2.5 font-mono tabular-nums">
                  <span className="block">{formatPoints(pet.values.fr.points)}</span>
                  <span className="text-[11px] text-muted">
                    {formatMoney(pet.values.fr.usd, currency)}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono tabular-nums">
                  {pet.hasVariants ? (
                    <>
                      <span className="block">{formatPoints(pet.values.nfr.points)}</span>
                      <span className="text-[11px] text-muted">
                        {formatMoney(pet.values.nfr.usd, currency)}
                      </span>
                    </>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono tabular-nums">
                  {pet.hasVariants ? (
                    <>
                      <span className="block">{formatPoints(pet.values.mfr.points)}</span>
                      <span className="text-[11px] text-muted">
                        {formatMoney(pet.values.mfr.usd, currency)}
                      </span>
                    </>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <Demand n={pet.demand} />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <LiqScore score={liquidityScore(pet.liquidity, pet.demand, pet.tier)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-faint">
        Valores de referência comunitários (estilo Elvebredd / marketplaces). Não
        afiliado à Uplift Games.
      </p>
    </section>
  );
}
