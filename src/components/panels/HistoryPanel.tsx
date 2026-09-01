import { RotateCcw, Trash2 } from "lucide-react";
import { formatPct, formatPoints } from "@/lib/format";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function kindClass(kind: string) {
  if (kind === "massive" || kind === "gain") return "text-accent";
  if (kind === "loss" || kind === "heavy") return "text-loss";
  return "text-muted";
}

export function HistoryPanel() {
  const history = useTradeStore((s) => s.history);
  const restoreHistory = useTradeStore((s) => s.restoreHistory);
  const deleteHistory = useTradeStore((s) => s.deleteHistory);

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
