/**
 * "Verificar na net" — vai à Game.Guide (via servidor local, que tem internet)
 * buscar os valores atuais de um pet e mostra-os ao lado dos da app, para o
 * utilizador conferir num relance. Se o servidor não tiver internet, mostra
 * as ligações para verificar à mão na mesma.
 */
import { ExternalLink, SearchCheck } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { Pet, Variant } from "@/lib/pets/types";
import { formatMoney } from "@/lib/format";
import { ageLabel, resolveMarketUsd, useMarketStore } from "@/lib/market-data";
import { GG_VARIANT_LABEL, VERIFY_LINKS, ggToUsd, type VerifyResponse } from "@/lib/verify";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const CORE_VARIANTS: Variant[] = ["regular", "fly", "ride", "fr", "nfr", "mfr"];

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center justify-between gap-2 rounded-md bg-bg-sunken px-2.5 py-1.5 text-[12px] transition-colors hover:bg-surface-2"
    >
      <span className="truncate font-medium">{label}</span>
      <ExternalLink className="size-3 shrink-0 text-faint group-hover:text-accent" />
    </a>
  );
}

export function VerifyPet({ pet, defaultOpen = false }: { pet: Pet; defaultOpen?: boolean }) {
  const currency = useTradeStore((s) => s.currency);
  const marketData = useMarketStore((s) => s.data);
  const [open, setOpen] = useState(defaultOpen);
  const [state, setState] = useState<"idle" | "loading" | "done" | "offline">("idle");
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const check = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (state === "loading" || state === "done") return;
    setState("loading");
    fetch(`/api/market/verify?name=${encodeURIComponent(pet.name)}`)
      .then((res) => res.json() as Promise<VerifyResponse>)
      .then((json) => {
        setResult(json);
        setState(json.ok && json.result ? "done" : "offline");
      })
      .catch(() => setState("offline"));
  }, [pet.name, state, open]);

  // Preço "da app" por variante: mercado (scraping) se existir, senão catálogo.
  const appPrices = useMemo(() => {
    const out: Partial<Record<Variant, { usd: number; live: boolean }>> = {};
    for (const v of CORE_VARIANTS) {
      const resolved = resolveMarketUsd(pet.id, v, marketData);
      out[v] = { usd: resolved.usd, live: resolved.fromMarket };
    }
    return out;
  }, [pet, marketData]);

  const gg = result?.ok ? result.result?.variants : undefined;
  const anchorFrUsd = appPrices.fr?.usd ?? 0;
  const scrapedAge = ageLabel(result?.ok ? result.result?.checkedAt : marketData?.meta?.scrapedAt);

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={check}
        className={cn(
          "flex items-center gap-1.5 rounded-full bg-surface-3 px-2.5 py-1 text-[11px] transition-colors",
          open ? "text-accent" : "text-muted hover:text-fg",
        )}
      >
        <SearchCheck className="size-3.5" />
        Verificar na net
      </button>

      {open ? (
        <div className="mt-2 rounded-lg border border-line bg-surface p-2.5">
          {state === "loading" ? (
            <p className="text-[12px] text-muted">A pesquisar valores na Game.Guide…</p>
          ) : null}

          {state === "done" && gg ? (
            <div>
              <p className="mb-1.5 text-[11px] text-muted">
                <span className="font-medium text-fg">Game.Guide</span> (comunidade, unidade AMV)
                {result?.result?.updatedLabel
                  ? ` — valores atualizados ${result.result.updatedLabel}`
                  : ""}
                {scrapedAge ? ` · verificado ${scrapedAge}` : ""}
              </p>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left font-mono text-[10px] text-faint uppercase">
                    <th className="py-0.5 pr-2 font-medium">Variante</th>
                    <th className="py-0.5 pr-2 text-right font-medium">GG (AMV)</th>
                    <th className="py-0.5 pr-2 text-right font-medium">≈ na net</th>
                    <th className="py-0.5 text-right font-medium">Na app</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {CORE_VARIANTS.map((v) => {
                    const webUsd = ggToUsd(gg, v, anchorFrUsd);
                    const app = appPrices[v];
                    if (!app) return null;
                    const drift =
                      webUsd && app.usd > 0
                        ? Math.abs(webUsd - app.usd) / Math.min(webUsd, app.usd)
                        : 0;
                    return (
                      <tr key={v} className="border-t border-line/60">
                        <td className="py-1 pr-2 text-muted">{GG_VARIANT_LABEL[v]}</td>
                        <td className="py-1 pr-2 text-right text-muted">{gg[v] ?? "—"}</td>
                        <td className="py-1 pr-2 text-right text-fg">
                          {webUsd ? formatMoney(webUsd, currency) : "—"}
                        </td>
                        <td
                          className={cn("py-1 text-right", drift > 0.15 ? "text-warn" : "text-fg")}
                        >
                          {formatMoney(app.usd, currency)}
                          {app.live ? "" : " *"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-1 text-[10px] text-faint">
                * catálogo local (sem scraping para este pet). "≈ na net" converte os pontos da
                comunidade para dinheiro usando o FR como âncora.
              </p>
            </div>
          ) : null}

          {state === "offline" ? (
            <p className="text-[12px] text-muted">
              {result?.error
                ? "A Game.Guide não respondeu (sem internet no servidor ou página inexistente)."
                : "Sem ligação ao servidor de preços."}{" "}
              Confirma à mão nas fontes:
            </p>
          ) : null}

          <div className="mt-2 grid gap-1 sm:grid-cols-2">
            <LinkRow label={`Game.Guide — ${pet.name}`} url={VERIFY_LINKS.gameGuide(pet.name)} />
            <LinkRow label="ElveBredd (pontos)" url={VERIFY_LINKS.elvebredd()} />
            <LinkRow label="Eldorado ($ reais)" url={VERIFY_LINKS.eldorado()} />
            <LinkRow label={`Google — "${pet.name} value"`} url={VERIFY_LINKS.google(pet.name)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Versão mínima: só as ligações de verificação (para linhas compactas). */
export function VerifyPetLinks({ name }: { name: string }) {
  return (
    <a
      href={VERIFY_LINKS.gameGuide(name)}
      target="_blank"
      rel="noreferrer"
      title={`Verificar "${name}" na Game.Guide`}
      className="flex items-center gap-1 rounded-full bg-surface-3 px-2 py-1 text-[10px] text-muted transition-colors hover:text-accent"
      onClick={(e) => e.stopPropagation()}
    >
      <SearchCheck className="size-3" />
      net
    </a>
  );
}
