import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis, XAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { readNetWorth } from "@/lib/net-worth";
import { FX, formatMoney } from "@/lib/format";
import { lineValue } from "@/lib/pets/engine";
import { useTradeStore } from "@/lib/store";

export function NetWorthChart() {
  const currency = useTradeStore((s) => s.currency);
  const inventory = useTradeStore((s) => s.inventory);

  // Património atual em € a partir do inventário (usado para o ponto de hoje).
  const currentEur = useMemo(
    () =>
      inventory.reduce(
        (s, it) =>
          s +
          lineValue({
            id: it.id,
            petId: it.petId,
            variant: it.variant,
            qty: it.qty,
          }).usd * FX.EUR,
        0,
      ),
    [inventory],
  );

  const points = useMemo(() => {
    const hist = readNetWorth().map((p) => ({
      daysAgo: Math.round((Date.now() - p.t) / (24 * 60 * 60 * 1000)),
      eur: p.usd * FX.EUR,
    }));
    if (hist.length === 0) {
      return currentEur > 0 ? [{ daysAgo: 0, eur: currentEur }] : [];
    }
    // O ponto de hoje reflete o inventário atual.
    hist[hist.length - 1] = { ...hist[hist.length - 1], daysAgo: 0, eur: currentEur };
    return hist;
  }, [currentEur]);

  if (points.length === 0) return null;

  const first = points[0].eur;
  const last = points[points.length - 1].eur;
  const delta = last - first;
  const growing = delta >= 0;

  return (
    <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-accent" />
          <h3 className="text-sm font-semibold">O teu património (€)</h3>
        </div>
        <span
          className={
            growing ? "font-mono text-xs text-accent" : "font-mono text-xs text-loss"
          }
        >
          {growing ? "▲" : "▼"} {formatMoney(Math.abs(delta), currency)} desde o 1º registo
        </span>
      </div>
      <p className="mb-2 text-[11px] text-faint">
        Valor total do teu inventário em dinheiro, registado automaticamente
        cada dia. {points.length} ponto(s).
      </p>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis
              dataKey="daysAgo"
              reversed
              tick={{ fill: "var(--color-faint)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickFormatter={(d) => (d === 0 ? "hoje" : `-${d}d`)}
              minTickGap={30}
            />
            <YAxis
              tick={{ fill: "var(--color-faint)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickFormatter={(v) => `€${Math.round(v)}`}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-line)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [formatMoney(v / FX.EUR, currency), "Património"]}
              labelFormatter={(d) => (d === 0 ? "hoje" : `há ${d} dias`)}
            />
            <Line
              type="monotone"
              dataKey="eur"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={points.length < 8 ? { r: 2, fill: "var(--color-accent)" } : false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
