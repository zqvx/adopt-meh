import {
  ArrowLeftRight,
  BookmarkPlus,
  CheckCircle2,
  Download,
  Handshake,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { evaluateTrade, toRidePots } from "@/lib/pets/engine";
import { getPet } from "@/lib/pets/catalog";
import { downloadReceipt, generateReceipt } from "@/lib/receipt";
import { formatMoney, formatPct, formatPoints, VARIANT_SHORT } from "@/lib/format";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PetGlyph } from "./PetGlyph";

const KIND_CLASS = {
  empty: "text-muted",
  massive: "text-accent",
  gain: "text-accent",
  fair: "text-fair",
  loss: "text-loss",
  heavy: "text-loss",
} as const;

const FILL_CLASS = {
  empty: "bg-faint",
  massive: "bg-accent",
  gain: "bg-accent",
  fair: "bg-fair",
  loss: "bg-loss",
  heavy: "bg-loss",
} as const;

export function ResultMeter() {
  const you = useTradeStore((s) => s.you);
  const them = useTradeStore((s) => s.them);
  const currency = useTradeStore((s) => s.currency);
  const swap = useTradeStore((s) => s.swap);
  const saveHistory = useTradeStore((s) => s.saveHistory);
  const addLine = useTradeStore((s) => s.addLine);
  const completeTrade = useTradeStore((s) => s.completeTrade);

  const handleReceipt = () => {
    if (verdict.kind === "empty") return;
    saveHistory();
    const { url } = generateReceipt(you, them);
    downloadReceipt(url, `adopt-me-trade-${Date.now()}.png`);
  };
  const handleComplete = () => {
    if (verdict.kind === "empty") return;
    saveHistory();
    completeTrade();
  };
  const verdict = evaluateTrade(you, them);
  const counterPet = verdict.counter ? getPet(verdict.counter.petId) : null;
  const clamped = Math.max(-0.5, Math.min(0.5, verdict.pct));
  const marker = 50 + clamped * 100;

  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
                Resultado em tempo real
              </p>
              <p
                className={cn(
                  "text-2xl font-medium tracking-tight",
                  KIND_CLASS[verdict.kind],
                )}
              >
                {verdict.label}
                {verdict.kind !== "empty" ? (
                  <span className="ml-2 font-mono text-lg tabular-nums">
                    {formatPct(verdict.pct)}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-sm text-muted">{verdict.hint}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={swap}>
                <ArrowLeftRight className="size-3.5" />
                Trocar lados
              </Button>
              <Button variant="outline" size="sm" onClick={saveHistory}>
                <BookmarkPlus className="size-3.5" />
                Guardar
              </Button>
            </div>
          </div>

          <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-surface-3">
            <div className="absolute top-0 left-1/2 h-full w-px bg-line-strong" />
            <div
              className={cn(
                "absolute top-0 h-full rounded-full transition-[left,width,background-color] duration-200 ease-out",
                FILL_CLASS[verdict.kind],
              )}
              style={
                verdict.pct >= 0
                  ? { left: "50%", width: `${Math.max(1, (marker - 50) * 0.92)}%` }
                  : {
                      left: `${marker}%`,
                      width: `${Math.max(1, 50 - marker)}%`,
                    }
              }
            />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px] tracking-wide text-faint uppercase">
            <span>Prejuízo</span>
            <span>Justa</span>
            <span>Lucro</span>
          </div>
        </div>

        <dl className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-bg-sunken px-4 py-3 sm:grid-cols-4 lg:w-[28rem] lg:shrink-0">
          <div>
            <dt className="text-[11px] text-faint">
              Δ pts <span className="text-accent">· decide W/F/L</span>
            </dt>
            <dd
              className={cn(
                "font-mono text-base font-semibold tabular-nums",
                verdict.deltaPoints > 0
                  ? "text-accent"
                  : verdict.deltaPoints < 0
                    ? "text-loss"
                    : "text-fg",
              )}
            >
              {verdict.deltaPoints > 0 ? "+" : ""}
              {formatPoints(verdict.deltaPoints)}
            </dd>
          </div>
          <div>
            <dt
              className="text-[11px] text-faint"
              title="Valor aproximado de revenda a dinheiro (marketplaces). É um mercado SEPARADO dos pontos — só informativo, NÃO decide o W/F/L. Vem do scraping quando disponível, senão é uma estimativa."
            >
              Δ dinheiro (aprox.)
            </dt>
            <dd className="font-mono text-sm tabular-nums text-muted">
              {verdict.deltaUsd > 0 ? "+" : verdict.deltaUsd < 0 ? "−" : ""}
              {formatMoney(Math.abs(verdict.deltaUsd), currency)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-faint">Em Ride Pots</dt>
            <dd className="font-mono text-sm tabular-nums">
              {toRidePots(verdict.them.points - verdict.you.points) > 0 ? "+" : ""}
              {toRidePots(verdict.them.points - verdict.you.points).toFixed(1)} RP
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-faint">Itens</dt>
            <dd className="font-mono text-sm tabular-nums">
              {verdict.you.count} → {verdict.them.count}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-2 font-mono text-[10px] leading-relaxed text-faint">
        O veredito W/F/L usa os <strong className="text-muted">pontos</strong>{" "}
        (valor de troca dentro do jogo). O valor em{" "}
        <strong className="text-muted">dinheiro</strong> é só uma referência de
        revenda (mercado separado, sujeito a oferta/procura e taxas) — não torna
        um bom trade em mau.
      </p>

      <div
        className={cn(
          "mt-4 flex items-start gap-3 rounded-lg px-3 py-3",
          verdict.risk === "danger"
            ? "bg-loss-dim"
            : verdict.risk === "watch"
              ? "bg-warn-dim"
              : "bg-accent-dim",
        )}
      >
        {verdict.risk === "clear" ? (
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
        ) : (
          <ShieldAlert
            className={cn(
              "mt-0.5 size-4 shrink-0",
              verdict.risk === "danger" ? "text-loss" : "text-warn",
            )}
          />
        )}
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              verdict.risk === "danger"
                ? "text-loss"
                : verdict.risk === "watch"
                  ? "text-warn"
                  : "text-accent",
            )}
          >
            {verdict.riskLabel}
            {verdict.them.trashCount > 0
              ? ` · ${verdict.them.trashCount} trash pet${verdict.them.trashCount === 1 ? "" : "s"}`
              : " · 0 trash pets"}
          </p>
          <p className="text-xs text-muted">{verdict.riskDetail}</p>
        </div>
      </div>

      {verdict.downgrade ? (
        <div className="mt-3 flex items-start gap-3 rounded-lg bg-warn-dim px-3 py-3">
          <TrendingDown className="mt-0.5 size-4 shrink-0 text-warn" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-warn">
              ⚠ Downgrade · armadilha de liquidez
            </p>
            <p className="text-xs text-muted">{verdict.downgradeDetail}</p>
          </div>
        </div>
      ) : null}

      {verdict.counter && counterPet ? (
        <div className="mt-3 flex items-start gap-3 rounded-lg bg-surface-2 px-3 py-3 shadow-[var(--shadow-border)]">
          <Handshake className="mt-0.5 size-4 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-accent">
              Contra-proposta sugerida
            </p>
            <p className="text-xs text-muted">{verdict.counter.reason}</p>
            <button
              type="button"
              onClick={() =>
                addLine("them", counterPet.id, verdict.counter!.variant)
              }
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:opacity-90"
            >
              <PetGlyph id={counterPet.id} glyph={counterPet.glyph} size="sm" />
              {counterPet.name} {VARIANT_SHORT[verdict.counter.variant]} +{formatPoints(verdict.counter.points)} pts
            </button>
          </div>
        </div>
      ) : null}

      {verdict.upgrade ? (
        <div className="mt-3 flex items-start gap-3 rounded-lg bg-surface-2 px-3 py-3 shadow-[var(--shadow-border)]">
          <TrendingUp className="mt-0.5 size-4 shrink-0 text-warn" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-warn">
              Upgrade · precisas de overpay
            </p>
            <p className="text-xs text-muted">{verdict.overpayDetail}</p>
          </div>
        </div>
      ) : null}

      {verdict.kind !== "empty" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={handleComplete}>
            <CheckCircle2 className="size-3.5" />
            Trade concluída (atualiza inventário)
          </Button>
          <Button variant="outline" size="sm" onClick={handleReceipt}>
            <Download className="size-3.5" />
            Gerar recibo W/F/L (PNG)
          </Button>
        </div>
      ) : null}
    </section>
  );
}
