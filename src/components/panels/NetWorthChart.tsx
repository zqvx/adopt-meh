import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Target, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  projectGoal,
  readGoalUsd,
  readNetWorth,
  writeGoalUsd,
} from "@/lib/net-worth";
import { FX, formatMoney } from "@/lib/format";
import { lineValue } from "@/lib/pets/engine";
import { useTradeStore } from "@/lib/store";

export function NetWorthChart() {
  const currency = useTradeStore((s) => s.currency);
  const inventory = useTradeStore((s) => s.inventory);
  const [goalEur, setGoalEur] = useState<number | null>(() => {
    const g = readGoalUsd();
    return g ? g * FX.EUR : null;
  });
  const [editing, setEditing] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  // Património atual em € a partir do inventário.
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

  const { points, raw } = useMemo(() => {
    const hist = readNetWorth();
    const mapped = hist.map((p) => ({
      daysAgo: Math.round((Date.now() - p.t) / (24 * 60 * 60 * 1000)),
      eur: p.usd * FX.EUR,
    }));
    if (mapped.length === 0) {
      return {
        points: currentEur > 0 ? [{ daysAgo: 0, eur: currentEur }] : [],
        raw: hist,
      };
    }
    // O ponto de hoje reflete o inventário atual.
    mapped[mapped.length - 1] = {
      ...mapped[mapped.length - 1],
      daysAgo: 0,
      eur: currentEur,
    };
    return { points: mapped, raw: hist };
  }, [currentEur]);

  const goalUsd = goalEur !== null ? goalEur / FX.EUR : null;
  const projection = useMemo(
    () => projectGoal(raw, currentEur / FX.EUR, goalUsd),
    [raw, currentEur, goalUsd],
  );

  function saveGoal() {
    const n = Number.parseFloat(goalInput.replace(",", "."));
    if (Number.isFinite(n) && n > 0) {
      writeGoalUsd(n / FX.EUR);
      setGoalEur(n);
    }
    setEditing(false);
    setGoalInput("");
  }

  function clearGoal() {
    writeGoalUsd(null);
    setGoalEur(null);
    setEditing(false);
  }

  if (points.length === 0 && goalEur === null) return null;

  const yMax = Math.max(
    ...points.map((p) => p.eur),
    goalEur ?? 0,
    1,
  );
  const pctToGoal =
    goalEur && goalEur > 0 ? Math.min(1, currentEur / goalEur) : 0;

  return (
    <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-accent" />
          <h3 className="text-sm font-semibold">O teu património (€)</h3>
        </div>
        {goalEur !== null ? (
          <button
            type="button"
            onClick={() => {
              setGoalInput(goalEur.toFixed(0));
              setEditing(true);
            }}
            className="flex items-center gap-1 rounded-full bg-warn-dim px-2.5 py-1 font-mono text-[11px] text-warn"
            title="Editar meta"
          >
            <Target className="size-3" />
            Meta {goalEur.toFixed(0)}€ · {Math.round(pctToGoal * 100)}%
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setGoalInput((currentEur * 1.5 || 100).toFixed(0));
              setEditing(true);
            }}
            className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-muted hover:text-fg"
          >
            <Target className="size-3" />
            Definir meta
          </button>
        )}
      </div>

      {editing ? (
        <div className="mb-2 flex items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-sm text-faint">
              €
            </span>
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveGoal()}
              placeholder="ex.: 500"
              className="h-9 w-32 rounded-sm bg-surface-2 pl-6 pr-2 text-sm outline-none focus-visible:shadow-[0_0_0_1px_var(--color-warn)]"
            />
          </div>
          <button
            type="button"
            onClick={saveGoal}
            className="h-9 rounded-sm bg-accent px-3 font-mono text-xs text-accent-fg"
          >
            Gravar
          </button>
          {goalEur !== null ? (
            <button
              type="button"
              onClick={clearGoal}
              className="h-9 rounded-sm bg-surface-2 px-3 font-mono text-xs text-muted hover:text-loss"
            >
              Remover
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="h-9 px-2 font-mono text-xs text-faint"
          >
            Cancelar
          </button>
        </div>
      ) : null}

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis
              dataKey="daysAgo"
              reversed
              tick={{
                fill: "var(--color-faint)",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
              tickFormatter={(d) => (d === 0 ? "hoje" : `-${d}d`)}
              minTickGap={30}
            />
            <YAxis
              domain={[0, yMax * 1.12]}
              tick={{
                fill: "var(--color-faint)",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
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
            {goalEur !== null ? (
              <ReferenceLine
                y={goalEur}
                stroke="var(--color-warn)"
                strokeDasharray="6 4"
                strokeWidth={2}
                label={{
                  value: `META ${goalEur.toFixed(0)}€`,
                  position: "insideTopRight",
                  fill: "var(--color-warn)",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                }}
              />
            ) : null}
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

      {goalEur !== null ? (
        <div className="mt-2 rounded-lg bg-warn-dim/40 px-3 py-2 text-[12px]">
          {projection?.reached ? (
            <p className="font-medium text-accent">
              🎉 Meta atingida! Já passaste os {goalEur.toFixed(0)}€ — define uma
              nova maior.
            </p>
          ) : projection?.daysToGoal === null ? (
            <p className="text-muted">
              Sem velocidade positiva nos últimos dias — está na hora de ir caçar
              negócios mais agressivamente para arrancar rumo aos {goalEur.toFixed(0)}€.
            </p>
          ) : (
            <p className="text-muted">
              À velocidade atual (
              <strong className="text-accent">
                +{(projection!.perDayUsd * FX.EUR).toFixed(2)}€/dia
              </strong>
              ), chegas aos {goalEur.toFixed(0)}€ em{" "}
              <strong className="text-warn">{projection!.daysToGoal} dias</strong>
              {projection!.eta
                ? ` (≈ ${new Date(projection!.eta).toLocaleDateString("pt-PT", {
                    day: "2-digit",
                    month: "short",
                  })})`
                : ""}
              .
            </p>
          )}
        </div>
      ) : (
        <p className="mt-1 text-[11px] text-faint">
          Património registado automaticamente cada dia · {points.length} ponto(s).
        </p>
      )}
    </div>
  );
}
