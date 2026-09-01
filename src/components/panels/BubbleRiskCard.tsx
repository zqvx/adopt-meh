import { AlertTriangle, PieChart, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { bubbleRisk } from "@/lib/bubble-risk";
import { formatMoney } from "@/lib/format";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BubbleRiskCard() {
  const inventory = useTradeStore((s) => s.inventory);
  const currency = useTradeStore((s) => s.currency);

  const risk = useMemo(() => bubbleRisk(inventory), [inventory]);

  if (risk.totalUsd <= 0) return null;

  const tone =
    risk.level === "high"
      ? "border-loss/40 bg-loss-dim/30"
      : risk.level === "watch"
        ? "border-warn/40 bg-warn-dim/20"
        : "border-accent/30 bg-accent-dim/20";

  return (
    <div className={cn("rounded-xl border p-3 shadow-[var(--shadow-border)] sm:p-4", tone)}>
      <div className="mb-1 flex items-center gap-2">
        {risk.level === "safe" ? (
          <ShieldCheck className="size-4 text-accent" />
        ) : (
          <AlertTriangle className={cn("size-4", risk.level === "high" ? "text-loss" : "text-warn")} />
        )}
        <h3 className="text-sm font-semibold">
          Risco de bolha — concentração do portfólio
        </h3>
      </div>

      {risk.level === "safe" ? (
        <p className="text-[12px] text-muted">
          Capital bem diversificado: nenhuma classe de pet ultrapassa 50% do
          teu património. Estás protegido de uma quebra de valor por evento.
        </p>
      ) : (
        <p className={cn("text-[12px]", risk.level === "high" ? "text-loss" : "text-warn")}>
          <strong>
            {risk.level === "high" ? "⚠️ RISCO ALTO: " : "⚠️ Atenção: "}
          </strong>
          {risk.tip}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-1.5">
        {risk.slices.slice(0, 5).map((s) => (
          <div key={s.theme} className="flex items-center gap-2">
            <span className="w-36 shrink-0 truncate text-[11px] text-muted">
              {s.label.charAt(0).toUpperCase() + s.label.slice(1)}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className={cn(
                  "h-full rounded-full",
                  s.theme === "halloween"
                    ? "bg-loss"
                    : s.theme === "christmas"
                      ? "bg-fair"
                      : s.share > 0.5
                        ? "bg-warn"
                        : "bg-accent",
                )}
                style={{ width: `${Math.round(s.share * 100)}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-right font-mono text-[11px] tabular-nums text-faint">
              {Math.round(s.share * 100)}%
            </span>
            <span className="w-16 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted">
              {formatMoney(s.usd, currency)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2 flex items-center gap-1 font-mono text-[10px] text-faint">
        <PieChart className="size-3" />
        Poções contam como dinheiro (líquido) e não entram na concentração.
        Património total: {formatMoney(risk.totalUsd, currency)}.
      </p>
    </div>
  );
}
