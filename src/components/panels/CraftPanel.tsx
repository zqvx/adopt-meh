import { FlaskConical, Lightbulb, TriangleAlert, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { getPet, PETS, searchPets } from "@/lib/pets/catalog";
import { useLiveStore } from "@/lib/live-store";
import {
  craftEconomy,
  rankCrafts,
  rateCraft,
  readyFromInventory,
  type CraftKind,
} from "@/lib/pets/craft";
import { FX, formatMoney, VARIANT_SHORT } from "@/lib/format";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PetGlyph } from "@/components/trade/PetGlyph";

const TIPS = [
  "Compra/grinda 4 pets iguais, envelhece-os a Full Grown e crafta o Néon: o prémio de néon vale mais que as partes — é o flip mais seguro em dinheiro.",
  "Nunca faças Néon de 4 pets FR: pagas 8 poções à toa. Usa pets REGULARES full grown e só 1 Fly + 1 Ride no resultado.",
  "Os melhores flips são pets em ascensão (AWD, Balloon Uni, Giant Panda) — o prémio de néon é maior e a procura sobe.",
  "Vende o néon rápido: o prémio é maior nos primeiros dias após o hype, depois a oferta enche o mercado.",
  "Alguns pets PERDEM valor ao fazer néon — confere sempre aqui antes de combinar, não estragues um pet.",
];

function useOverrides() {
  return useLiveStore((s) => s.overrides);
}

function ratingTone(rating: "great" | "grind" | "hard") {
  if (rating === "great") return "accent" as const;
  if (rating === "grind") return "warn" as const;
  return "loss" as const;
}

function BestCrafts({ kind }: { kind: CraftKind }) {
  const currency = useTradeStore((s) => s.currency);
  const feePct = useTradeStore((s) => s.feePct);
  const overrides = useOverrides();

  // Candidatos: pets com variantes e liquidez média+ (não trash/low).
  const candidates = useMemo(
    () =>
      PETS.filter(
        (p) => p.hasVariants && p.liquidity !== "trash" && p.liquidity !== "low",
      ).map((p) => p.id),
    [],
  );
  const ranked = useMemo(
    () => rankCrafts(candidates, kind, feePct, overrides as never).slice(0, 6),
    [candidates, kind, feePct, overrides],
  );

  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
      <p className="border-b border-line px-4 py-2 font-mono text-[10px] tracking-wide text-faint uppercase">
        Melhores flips {kind === "nfr" ? "Néon (NFR)" : "Mega (MFR)"} · por teto de
        compra
      </p>
      {ranked.map((eco) => {
        const { rating, label } = rateCraft(eco);
        return (
          <div
            key={eco.pet.id}
            className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0 sm:px-4"
          >
            <PetGlyph id={eco.pet.id} glyph={eco.pet.glyph} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{eco.pet.name}</p>
              <p className="font-mono text-[11px] text-muted">
                vende {formatMoney(eco.netUsd, currency)} líq. · teto/pet{" "}
                <span className="text-accent">
                  {formatMoney(eco.breakEvenBaseUsd, currency)}
                </span>
              </p>
            </div>
            <Badge tone={ratingTone(rating)}>{label}</Badge>
          </div>
        );
      })}
    </div>
  );
}

function CraftReadySection() {
  const currency = useTradeStore((s) => s.currency);
  const feePct = useTradeStore((s) => s.feePct);
  const inventory = useTradeStore((s) => s.inventory);
  const craftPet = useTradeStore((s) => s.craftPet);
  const setTab = useTradeStore((s) => s.setTab);
  const overrides = useOverrides();

  const ready = useMemo(() => readyFromInventory(inventory), [inventory]);

  if (ready.length === 0) {
    return (
      <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Zap className="size-4 text-accent" />
          Prontos a craftar (teu inventário)
        </p>
        <p className="mt-1.5 text-xs text-muted">
          Ainda não tens 3+ cópias do mesmo pet. Regista os teus pets no separador{" "}
          <button
            type="button"
            onClick={() => setTab("inventory")}
            className="text-accent hover:underline"
          >
            Inventário
          </button>{" "}
          e aqui verás quando tiveres 4 (néon) ou 16 (mega).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <Zap className="size-4 text-accent" />
        Prontos a craftar (teu inventário)
      </p>
      <ul className="flex flex-col gap-2">
        {ready.map((r) => {
          const eco = craftEconomy(r.pet.id, "nfr", feePct, overrides as never);
          const rating = eco ? rateCraft(eco) : null;
          return (
            <li
              key={r.pet.id}
              className="flex items-center gap-2.5 rounded-lg bg-bg-sunken px-3 py-2"
            >
              <PetGlyph id={r.pet.id} glyph={r.pet.glyph} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.pet.name}</p>
                <p className="font-mono text-[11px] text-muted">
                  tens {r.qty}× ·{" "}
                  {r.canMega
                    ? `dá ${r.megas} mega${r.megas > 1 ? "s" : ""}${
                        r.neons - r.megas * 4 > 0
                          ? ` + ${r.neons - r.megas * 4} néon`
                          : ""
                      }`
                    : r.canNeon
                      ? `dá ${r.neons} néon${r.neons > 1 ? "s" : ""}`
                      : `faltam ${4 - r.qty} p/ néon`}
                </p>
              </div>
              {r.canNeon && rating ? (
                <Badge tone={ratingTone(rating.rating)}>{rating.label}</Badge>
              ) : null}
              {r.canNeon && eco ? (
                <span className="hidden font-mono text-[11px] text-faint md:block">
                  teto {formatMoney(eco.breakEvenBaseUsd, currency)}
                </span>
              ) : null}
              <div className="flex shrink-0 gap-1">
                {r.canMega ? (
                  <button
                    type="button"
                    onClick={() => craftPet(r.pet.id, "mfr")}
                    className="h-8 rounded-md bg-accent px-2.5 font-mono text-[11px] font-semibold text-accent-fg hover:opacity-90"
                    title="Gasta 16 pets base e junta 1 Mega (MFR) ao inventário"
                  >
                    Craftar MEGA
                  </button>
                ) : null}
                {r.canNeon ? (
                  <button
                    type="button"
                    onClick={() => craftPet(r.pet.id, "nfr")}
                    className="h-8 rounded-md bg-surface-3 px-2.5 font-mono text-[11px] font-medium hover:bg-accent hover:text-accent-fg"
                    title="Gasta 4 pets base e junta 1 Néon (NFR) ao inventário"
                  >
                    Craftar NÉON
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CraftPanel() {
  const currency = useTradeStore((s) => s.currency);
  const feePct = useTradeStore((s) => s.feePct);
  const addLine = useTradeStore((s) => s.addLine);
  const setTab = useTradeStore((s) => s.setTab);
  const overrides = useOverrides();

  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState("african-wild-dog");
  const [kind, setKind] = useState<CraftKind>("nfr");
  const [basePrice, setBasePrice] = useState("");

  const matches = useMemo(() => searchPets(query, 6), [query]);
  const picked = getPet(pickedId) ?? PETS[0];
  const eco = useMemo(
    () => craftEconomy(picked.id, kind, feePct, overrides as never),
    [picked.id, kind, feePct, overrides],
  );
  const rating = eco ? rateCraft(eco) : null;

  // Preço base que o utilizador diz conseguir (vazio = preço de mercado regular).
  const baseNum = Number.parseFloat(basePrice.replace(",", ".")) || 0;
  const myBaseUsd =
    baseNum > 0 ? baseNum / FX[currency] : (eco?.baseMarketUsd ?? 0);
  const myTotalCost = eco ? myBaseUsd * eco.baseCount + eco.potionUsd : 0;
  const myProfit = eco ? eco.netUsd - myTotalCost : 0;
  const myRoi = myTotalCost > 0 ? myProfit / myTotalCost : 0;
  const viable = myProfit > 0;

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
        <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
          Flip de criação · dinheiro real
        </p>
        <h2 className="flex items-center gap-2 text-lg font-medium tracking-tight">
          <FlaskConical className="size-5 text-accent" />
          Calculadora Néon / Mega
        </h2>
        <p className="text-sm text-muted">
          Diz-te o <strong>máximo a pagar por cada pet base</strong> para craftar um
          néon/mega e vender com lucro depois da taxa de {feePct.toFixed(0)}%. Tudo em
          dinheiro real (não robux).
        </p>
      </div>

      <CraftReadySection />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-3">
          <label className="text-xs text-muted">
            Pet a craftar
            <Input
              className="mt-1.5"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar pet…"
            />
          </label>
          {query ? (
            <ul className="-mt-1 overflow-hidden rounded-md bg-bg-sunken">
              {matches
                .filter((p) => p.hasVariants)
                .map((pet) => (
                  <li key={pet.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickedId(pet.id);
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2"
                    >
                      <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
                      {pet.name}
                    </button>
                  </li>
                ))}
            </ul>
          ) : null}

          <div className="flex gap-1.5">
            {(["nfr", "mfr"] as CraftKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "h-10 flex-1 rounded-md font-mono text-sm",
                  kind === k ? "bg-fg text-bg" : "bg-surface-2 text-muted",
                )}
              >
                {k === "nfr" ? "NÉON (4 pets)" : "MEGA (16 pets)"}
              </button>
            ))}
          </div>

          <div className="rounded-lg bg-bg-sunken p-4">
            <div className="flex items-center gap-3">
              <PetGlyph id={picked.id} glyph={picked.glyph} size="lg" />
              <div>
                <p className="font-medium">{picked.name}</p>
                <p className="font-mono text-xs text-muted">
                  Resultado: {VARIANT_SHORT[kind]} · {eco?.baseCount} pets base
                </p>
              </div>
            </div>

            {eco && rating ? (
              <>
                <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-sm">
                  <div>
                    <dt className="text-[11px] text-faint">Venda (ref.)</dt>
                    <dd className="tabular-nums">
                      {formatMoney(eco.sellUsd, currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-faint">Venda líq. após taxa</dt>
                    <dd className="tabular-nums text-accent">
                      {formatMoney(eco.netUsd, currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-faint">
                      Poções (F+R{eco.kind === "mfr" ? " × 4 néons" : ""})
                    </dt>
                    <dd className="tabular-nums">
                      {formatMoney(eco.potionUsd, currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-faint">Preço base de mercado</dt>
                    <dd className="tabular-nums">
                      {formatMoney(eco.baseMarketUsd, currency)}
                    </dd>
                  </div>
                </dl>

                <div
                  className={cn(
                    "mt-3 rounded-md px-3 py-3",
                    rating.rating === "great"
                      ? "bg-accent-dim"
                      : rating.rating === "grind"
                        ? "bg-warn-dim"
                        : "bg-loss-dim",
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      rating.rating === "great"
                        ? "text-accent"
                        : rating.rating === "grind"
                          ? "text-warn"
                          : "text-loss",
                    )}
                  >
                    Não pagues mais de{" "}
                    {formatMoney(eco.breakEvenBaseUsd, currency)} por cada pet base
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{rating.hint}</p>
                </div>

                <label className="mt-3 block text-xs text-muted">
                  Quanto consegues cada pet base? (opcional)
                  <Input
                    className="mt-1.5 font-mono"
                    inputMode="decimal"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder={`Ex.: ${formatMoney(eco.breakEvenBaseUsd, currency)}`}
                  />
                </label>

                <div
                  className={cn(
                    "mt-3 rounded-md px-3 py-3",
                    viable ? "bg-accent-dim" : "bg-loss-dim",
                  )}
                >
                  <p className="text-[11px] tracking-wide text-muted uppercase">
                    Lucro estimado do flip
                  </p>
                  <p
                    className={cn(
                      "font-mono text-2xl font-medium tabular-nums",
                      viable ? "text-accent" : "text-loss",
                    )}
                  >
                    {viable ? "+" : "−"}
                    {formatMoney(Math.abs(myProfit), currency)}
                  </p>
                  <p className="text-sm text-muted">
                    ROI {myRoi >= 0 ? "+" : "−"}
                    {Math.abs(myRoi * 100).toFixed(1)}% depois da taxa e poções.{" "}
                    {viable
                      ? "Flip viável a esse preço."
                      : "A esse preço perdes dinheiro — baixa o preço base ou grinda."}
                  </p>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      addLine("you", picked.id, kind);
                      setTab("trade");
                    }}
                  >
                    Enviar {VARIANT_SHORT[kind]} para a troca
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Este item não tem variantes de néon/mega.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <BestCrafts kind={kind} />

          <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Lightbulb className="size-4 text-warn" />
              Regras dos pros para o flip
            </p>
            <ul className="flex flex-col gap-2">
              {TIPS.map((tip, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted">
                  <span className="font-mono text-accent">{i + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-start gap-1.5 rounded-md bg-bg-sunken px-3 py-2 text-[11px] text-muted">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warn" />
              Valores de referência em dinheiro (BloxUltra/Eldorado set. 2026).
              Cross-trading por dinheiro real viola os Termos do Roblox.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
