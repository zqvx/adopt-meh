import { BadgeEuro, RotateCcw, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { FX, formatPct, formatPoints } from "@/lib/format";
import { lineValue } from "@/lib/pets/engine";
import { generateP2PReceipt } from "@/lib/p2p-receipt";
import { useP2PStore } from "@/lib/p2p";
import { downloadReceipt } from "@/lib/receipt";
import { useTradeStore, type HistoryEntry } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function kindClass(kind: string) {
  if (kind === "massive" || kind === "gain") return "text-accent";
  if (kind === "loss" || kind === "heavy") return "text-loss";
  return "text-muted";
}

/** Valor em € do lado recebido — proxy do dinheiro cobrado numa venda P2P. */
function entryEur(entry: HistoryEntry) {
  const usd = entry.them.reduce((sum, line) => sum + lineValue(line).usd, 0);
  return Math.round(usd * FX.EUR * 100) / 100;
}

export function HistoryPanel() {
  const history = useTradeStore((s) => s.history);
  const restoreHistory = useTradeStore((s) => s.restoreHistory);
  const deleteHistory = useTradeStore((s) => s.deleteHistory);
  const hydrateP2P = useP2PStore((s) => s.hydrate);
  const addVouch = useP2PStore((s) => s.addVouch);

  useEffect(() => {
    hydrateP2P();
  }, [hydrateP2P]);

  if (history.length === 0) {
    return (
      <section className="rounded-xl bg-surface px-4 py-16 text-center shadow-[var(--shadow-border)]">
        <h2 className="text-lg font-medium">Sem histórico</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Calcula uma troca e toca em Guardar para arquivar o resultado neste
          dispositivo.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <header className="mb-4">
        <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
          Arquivo local
        </p>
        <h2 className="text-lg font-medium tracking-tight">Histórico de trocas</h2>
        <p className="mt-1 text-[11px] text-faint">
          Fechaste uma venda por Revolut? Toca no € para contar o vouch e
          descarregar o recibo de prova.
        </p>
      </header>
      <ul className="flex flex-col gap-2">
        {history.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-col gap-3 rounded-lg bg-bg-sunken p-3 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-faint">
                {new Date(entry.ts).toLocaleString("pt-PT", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="truncate text-sm">
                <span className="text-muted">Dás </span>
                {entry.youLabel}
              </p>
              <p className="truncate text-sm">
                <span className="text-muted">Recebes </span>
                {entry.themLabel}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p
                className={cn(
                  "font-mono text-sm tabular-nums",
                  kindClass(entry.kind),
                )}
              >
                {formatPct(entry.pct)} · {entry.deltaPoints > 0 ? "+" : ""}
                {formatPoints(entry.deltaPoints)} pts
              </p>
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={() => {
                  const amount = entryEur(entry);
                  const vouch = addVouch(amount);
                  const first = entry.them[0];
                  const { url } = generateP2PReceipt({
                    petId: first?.petId,
                    variant: first?.variant,
                    label: entry.them.length > 1 ? entry.themLabel : undefined,
                    eur: amount,
                    vouch,
                    ts: entry.ts,
                  });
                  downloadReceipt(
                    url,
                    `vouch-${String(vouch).padStart(3, "0")}.png`,
                  );
                }}
                aria-label="Registar venda P2P e descarregar recibo"
                title="Venda paga por Revolut: +1 vouch e recibo"
              >
                <BadgeEuro className="size-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={() => restoreHistory(entry.id)}
                aria-label="Reabrir troca"
              >
                <RotateCcw className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => deleteHistory(entry.id)}
                aria-label="Apagar"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
