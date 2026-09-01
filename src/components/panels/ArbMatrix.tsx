import { ArrowLeftRight, Info } from "lucide-react";
import { useMemo } from "react";
import { arbitrageRows } from "@/lib/arb";
import { useMarketStore } from "@/lib/market-data";
import { FX, formatMoney } from "@/lib/format";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PetGlyph } from "@/components/trade/PetGlyph";

export function ArbMatrix() {
  const currency = useTradeStore((s) => s.currency);
  const feePct = useTradeStore((s) => s.feePct);
  const data = useMarketStore((s) => s.data);

  const rows = useMemo(() => arbitrageRows(data, feePct), [data, feePct]);
  const mult = FX.EUR;

  const sources = data?.meta?.sources ?? [];

  return (
    <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <div className="mb-1 flex items-center gap-2">
        <ArrowLeftRight className="size-4 text-accent" />
        <h2 className="text-lg font-medium tracking-tight">Arbitragem pura entre plataformas</h2>
      </div>
      <p className="mb-3 text-sm text-muted">
        Compra no site barato e vende no caro — sem abrir o Roblox. A margem
        líquida já desconta {feePct}% de taxas. Só aparecem oportunidades com
        lucro real.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-lg bg-bg-sunken px-4 py-8 text-center text-sm text-muted">
          <Info className="mx-auto mb-2 size-6 text-faint" />
          Sem spreads lucrativos nesta recolha.
          <p className="mt-1 text-[12px] text-faint">
            Para mais oportunidades, adiciona mais fontes ao scraper (Gameflip,
            Starpets) — o matriz cruza-as automaticamente.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-line">
          {rows.map((r) => (
            <li
              key={r.petId}
              className="flex items-center gap-3 border-b border-line bg-bg-sunken px-3 py-2.5 last:border-0"
            >
              <PetGlyph id={r.petId} glyph="void" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="font-mono text-[11px] text-muted">
                  {r.buyPlatform} → {r.sellPlatform} · liqu. {r.liqScore.toFixed(1)}/10
                </p>
              </div>
              <div className="hidden text-right font-mono text-[11px] text-muted sm:block">
                <p>
                  compra <span className="text-loss">{formatMoney(r.buyUsd, currency)}</span>
                </p>
                <p>
                  vende <span className="text-accent">{formatMoney(r.sellUsd, currency)}</span>
                </p>
              </div>
              <div className="w-20 text-right">
                <p
                  className={cn(
                    "font-mono text-sm font-bold tabular-nums",
                    r.roi >= 0.1 ? "text-accent" : "text-warn",
                  )}
                >
                  +{(r.netUsd * mult).toFixed(2)}€
                </p>
                <p className="font-mono text-[10px] text-faint">
                  +{(r.roi * 100).toFixed(0)}% ROI
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 font-mono text-[10px] text-faint">
        Fontes nesta recolha:{" "}
        {sources.length > 0
          ? sources.map((s) => s.name).join(" · ")
          : "nenhuma (usa faixas do catálogo)"}
        . Atenção: cross-trading viola os ToS da Roblox; confirma sempre a
        liquidez antes de mexer dinheiro.
      </p>
    </div>
  );
}
