import { Route, Footprints, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { suggestRoute } from "@/lib/pets/route";
import { useTradeStore } from "@/lib/store";
import { formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PetGlyph } from "./PetGlyph";

export function RouteSuggester({
  petId,
  variant,
}: {
  petId: string;
  variant: import("@/lib/pets/types").Variant;
}) {
  const inventory = useTradeStore((s) => s.inventory);
  const addLine = useTradeStore((s) => s.addLine);
  const setTab = useTradeStore((s) => s.setTab);

  const result = useMemo(
    () => suggestRoute(petId, variant, inventory),
    [petId, variant, inventory],
  );

  if (!result) return null;

  return (
    <div className="rounded-lg border border-line bg-bg-sunken p-3">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <Route className="size-4 text-accent" />
        Como chegar aqui?
      </p>

      <div className="mb-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
          <div
            className={cn(
              "h-full rounded-full",
              result.coverage >= 1 ? "bg-accent" : "bg-warn",
            )}
            style={{ width: `${Math.round(result.coverage * 100)}%` }}
          />
        </div>
        <p className="mt-1 font-mono text-[10px] text-faint">
          Cobres {Math.round(result.coverage * 100)}% do valor (+overpay)
          {result.feasible
            ? " — rota viável ✅"
            : ` · faltam ~${Math.round(result.gapPts)} pts`}
        </p>
      </div>

      <ol className="flex flex-col gap-2">
        {result.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-3 font-mono text-[10px] text-muted">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[13px] font-medium">
                {step.kind === "ladder" && step.petId ? (
                  <PetGlyph id={step.petId} glyph="void" size="sm" />
                ) : null}
                {step.text}
              </p>
              {step.detail ? (
                <p className="text-[11px] text-muted">{step.detail}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            // Leva só os pets sugeridos (givers) para o teu lado da troca.
            for (const g of result.givers) addLine("you", g.petId, g.variant);
            addLine("them", petId, variant);
            setTab("trade");
          }}
          className="flex items-center gap-1 rounded-sm bg-accent px-3 py-1.5 font-mono text-[11px] text-accent-fg"
        >
          <CheckCircle2 className="size-3.5" /> Montar esta troca
        </button>
        <span className="flex items-center gap-1 font-mono text-[10px] text-faint">
          <Footprints className="size-3" />
          alvo {formatPoints(result.targetPts)} pts
        </span>
      </div>
    </div>
  );
}
