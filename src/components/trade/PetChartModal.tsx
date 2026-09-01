import { X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getPet } from "@/lib/pets/catalog";
import type { Variant } from "@/lib/pets/types";
import { FX, formatMoney } from "@/lib/format";
import { realPriceSeries, useMarketStore } from "@/lib/market-data";
import { useTradeStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PetGlyph } from "./PetGlyph";
import { RouteSuggester } from "./RouteSuggester";

interface Props {
  petId: string;
  variant: Variant;
  /** Preço de referência em USD (fair). */
  fairUsd: number;
  /** Preço atual em USD. */
  nowUsd: number;
  onClose: () => void;
}

/** Gera 30 dias de histórico determinístico em volta do preço de referência. */
function buildSimSeries(petId: string, fair: number, now: number) {
  let seed = 0;
  for (const ch of petId) seed = (seed * 31 + ch.charCodeAt(0)) % 1_000_003;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const days = 30;
  const out: { daysAgo: number; price: number; t: number }[] = [];
  let price = fair * (0.92 + rand() * 0.08);
  const nowT = Date.now();
  for (let i = days; i >= 0; i--) {
    const drift = (fair - price) * 0.08 + (rand() - 0.5) * fair * 0.05;
    price = Math.max(fair * 0.7, Math.min(fair * 1.25, price + drift));
    out.push({
      daysAgo: i,
      price: Math.round(price * 100) / 100,
      t: nowT - i * 24 * 60 * 60 * 1000,
    });
  }
  // O último ponto é o preço atual real.
  out[out.length - 1] = { daysAgo: 0, price: now, t: nowT };
  return out;
}

export function PetChartModal({ petId, variant, fairUsd, nowUsd, onClose }: Props) {
  const currency = useTradeStore((s) => s.currency);
  const addLine = useTradeStore((s) => s.addLine);
  const setTab = useTradeStore((s) => s.setTab);
  const history = useMarketStore((s) => s.history);
  const [unit, setUnit] = useState<"usd" | "eur">(
    currency === "BRL" ? "usd" : currency.toLowerCase() === "eur" ? "eur" : "usd",
  );
  const pet = getPet(petId);

  const { data, isReal } = useMemo(() => {
    const real = realPriceSeries(history, petId);
    if (real) return { data: real, isReal: true };
    return { data: buildSimSeries(petId, fairUsd, nowUsd), isReal: false };
  }, [history, petId, fairUsd, nowUsd]);

  if (!pet) return null;
  const mult = unit === "eur" ? FX.EUR : 1;
  const min = Math.min(...data.map((d) => d.price), fairUsd) * mult;
  const max = Math.max(...data.map((d) => d.price), fairUsd) * mult;

  const chart = data.map((d) => ({ ...d, p: +(d.price * mult).toFixed(2) }));
  const trend3 =
    chart.length > 3
      ? chart[chart.length - 1].p - chart[chart.length - 4].p
      : 0;
  const spanDays = data.length > 1 ? data[0].daysAgo : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2.5">
          <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {pet.name}{" "}
              <span className="font-mono text-xs text-muted">
                {pet.hasVariants ? variant.toUpperCase() : pet.category}
              </span>
            </p>
            <p className="font-mono text-[11px] text-muted">
              {spanDays > 0 ? `${spanDays} dias` : "30 dias"} · referência{" "}
              {formatMoney(fairUsd, currency)} · agora{" "}
              <span className={trend3 >= 0 ? "text-accent" : "text-loss"}>
                {formatMoney(nowUsd, currency)}
              </span>
              {trend3 !== 0 ? (
                <span className={trend3 >= 0 ? "text-accent" : "text-loss"}>
                  {" "}
                  ({trend3 >= 0 ? "▲" : "▼"} {Math.abs(trend3).toFixed(2)} em 3 recolhas)
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex rounded-md bg-surface-2 p-0.5">
            {(["eur", "usd"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`h-7 rounded-sm px-2 font-mono text-[11px] ${
                  unit === u ? "bg-fg text-bg" : "text-muted"
                }`}
              >
                {u === "eur" ? "€" : "$"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-sm text-muted hover:text-fg"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis
                dataKey="daysAgo"
                tick={{ fill: "var(--color-faint)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                tickFormatter={(d) => (d === 0 ? "hoje" : `-${d}d`)}
                reversed
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                domain={[min * 0.97, max * 1.03]}
                tick={{ fill: "var(--color-faint)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                tickFormatter={(v) => `${unit === "eur" ? "€" : "$"}${v}`}
                width={56}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-line)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--color-muted)" }}
                formatter={(v: number) => [formatMoney(v / mult, currency), "Preço"]}
                labelFormatter={(d) => (d === 0 ? "hoje" : `há ${d} dias`)}
              />
              <ReferenceLine
                y={fairUsd * mult}
                stroke="var(--color-faint)"
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="p"
                stroke="var(--color-accent)"
                strokeWidth={2}
                fill="url(#g)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 font-mono text-[10px] text-faint">
          {isReal
            ? `Linha a tracejado = valor de referência. Dados REAIS acumulados pelas recolhas automáticas (${data.length} pontos).`
            : "Linha a tracejado = valor de referência. Série simulada — o histórico real começa a acumular com as recolhas automáticas (a cada 6h)."}
        </p>

        <div className="mt-3">
          <RouteSuggester petId={petId} variant={variant} />
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              addLine("them", petId, variant);
              setTab("trade");
              onClose();
            }}
          >
            Adicionar à oferta dele
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              addLine("you", petId, variant);
              setTab("trade");
              onClose();
            }}
          >
            Adicionar ao meu lado
          </Button>
        </div>
      </div>
    </div>
  );
}
