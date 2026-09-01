import { Bell, BellRing, Volume2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getPet } from "@/lib/pets/catalog";
import { useLiveStore } from "@/lib/live-store";
import { FX, formatMoney, VARIANT_SHORT } from "@/lib/format";
import { useSniperStore, type SniperDirection } from "@/lib/sniper";
import { playBlip, playChaChing } from "@/lib/sound";
import { useTradeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PetGlyph } from "@/components/trade/PetGlyph";
import type { Variant } from "@/lib/pets/types";

/**
 * Vigilante: corre em silêncio (montado no AppShell) e dispara o som quando
 * um alerta de preço é atingido.
 */
export function SniperWatcher() {
  const quotes = useLiveStore((s) => s.quotes);
  const alerts = useSniperStore((s) => s.alerts);
  const markTriggered = useSniperStore((s) => s.markTriggered);

  useEffect(() => {
    for (const alert of alerts) {
      if (alert.triggered) continue;
      const q = quotes.find(
        (x) => x.petId === alert.petId && x.variant === alert.variant,
      );
      if (!q) continue;
      const priceEur = q.priceUsd * FX.EUR;
      const hit =
        alert.direction === "below"
          ? priceEur <= alert.eurTarget
          : priceEur >= alert.eurTarget;
      if (hit) {
        markTriggered(alert.id, priceEur);
        playChaChing();
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          const pet = getPet(alert.petId);
          new Notification("🎯 Alvo atingido!", {
            body: `${pet?.name ?? "Pet"} está a ${formatMoney(q.priceUsd, "EUR")}`,
          });
        }
      }
    }
  }, [quotes, alerts, markTriggered]);

  return null;
}

export function SniperCard({ quickPet }: { quickPet?: { petId: string; variant: Variant } | null }) {
  const currency = useTradeStore((s) => s.currency);
  const alerts = useSniperStore((s) => s.alerts);
  const addAlert = useSniperStore((s) => s.addAlert);
  const removeAlert = useSniperStore((s) => s.removeAlert);
  const resetAlert = useSniperStore((s) => s.resetAlert);
  const quotes = useLiveStore((s) => s.quotes);

  const watchPets = useMemo(
    () =>
      quotes
        .map((q) => ({ q, pet: getPet(q.petId) }))
        .filter((x) => x.pet),
    [quotes],
  );

  const [petKey, setPetKey] = useState<string>(
    quickPet ? `${quickPet.petId}|${quickPet.variant}` : watchPets[0]?.q.key ?? "",
  );
  const [direction, setDirection] = useState<SniperDirection>("below");
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (quickPet) setPetKey(`${quickPet.petId}|${quickPet.variant}`);
  }, [quickPet]);

  function liveEur(key: string) {
    const q = quotes.find((x) => x.key === key);
    if (!q) return 0;
    return q.priceUsd * FX.EUR;
  }

  function create() {
    const [petId, variant] = petKey.split("|") as [string, Variant];
    const eur = parseFloat(target.replace(",", "."));
    if (!petId || !Number.isFinite(eur) || eur <= 0) return;
    addAlert({ petId, variant, eurTarget: eur, direction });
    setTarget("");
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }

  const selectedKey = petKey || watchPets[0]?.q.key;
  const currentEur = selectedKey ? liveEur(selectedKey) : 0;

  return (
    <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <div className="mb-2 flex items-center gap-2">
        <Bell className="size-4 text-accent" />
        <h3 className="text-sm font-semibold">Sniper — alarme de preço</h3>
      </div>
      <p className="mb-3 text-[12px] text-muted">
        Define um preço-alvo. Quando o mercado o atingir, ouves um{" "}
        <strong>cha-ching</strong> 💰 mesmo com o jogo aberto — é a tua deixa para
        ir comprar/vender.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-[10rem] text-[11px] text-muted">
          Pet
          <select
            value={selectedKey}
            onChange={(e) => setPetKey(e.target.value)}
            className="mt-1 h-9 w-full rounded-sm bg-surface-2 px-2 text-sm text-fg outline-none focus-visible:shadow-[0_0_0_1px_var(--color-accent)]"
          >
            {watchPets.map(({ q, pet }) => (
              <option key={q.key} value={q.key}>
                {pet!.name} {VARIANT_SHORT[q.variant]} · agora{" "}
                {(q.priceUsd * FX.EUR).toFixed(2)}€
              </option>
            ))}
          </select>
        </label>
        <div className="flex rounded-md bg-surface-2 p-0.5">
          {(["below", "above"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={cn(
                "h-9 rounded-sm px-3 font-mono text-xs",
                direction === d ? "bg-accent text-accent-fg" : "text-muted",
              )}
            >
              {d === "below" ? "≤ cair a" : "≥ subir a"}
            </button>
          ))}
        </div>
        <label className="w-28 text-[11px] text-muted">
          Alvo (€)
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-sm text-faint">
              €
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={target}
              placeholder={(currentEur * 0.9).toFixed(0)}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              className="mt-1 h-9 w-full rounded-sm bg-surface-2 pl-6 pr-2 text-sm outline-none focus-visible:shadow-[0_0_0_1px_var(--color-accent)]"
            />
          </div>
        </label>
        <Button size="sm" onClick={create} disabled={!target}>
          <BellRing className="size-4" /> Armar
        </Button>
      </div>

      {alerts.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {alerts.map((a) => {
            const pet = getPet(a.petId);
            if (!pet) return null;
            return (
              <li
                key={a.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2",
                  a.triggered ? "bg-accent-dim" : "bg-surface-2",
                )}
              >
                <PetGlyph id={pet.id} glyph={pet.glyph} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {pet.name}{" "}
                    <span className="font-mono text-[11px] text-muted">
                      {VARIANT_SHORT[a.variant]}
                    </span>
                  </p>
                  <p className="font-mono text-[11px] text-muted">
                    {a.direction === "below" ? "≤" : "≥"} {a.eurTarget.toFixed(2)}€
                    {a.triggered ? (
                      <span className="ml-1.5 text-accent">
                        · ATINGIDO ({a.firedPriceEur?.toFixed(2)}€) 🎯
                      </span>
                    ) : null}
                  </p>
                </div>
                {a.triggered ? (
                  <button
                    type="button"
                    onClick={() => resetAlert(a.id)}
                    className="rounded-sm px-2 py-1 font-mono text-[11px] text-muted hover:text-fg"
                  >
                    Rearmar
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeAlert(a.id)}
                  className="flex size-7 items-center justify-center rounded-sm text-faint hover:text-loss"
                  aria-label="Remover alerta"
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => {
          playBlip();
          if (typeof Notification !== "undefined" && Notification.permission === "default") {
            void Notification.requestPermission();
          }
        }}
        className="mt-2 flex items-center gap-1 font-mono text-[10px] text-faint hover:text-muted"
      >
        <Volume2 className="size-3" /> Testar som
      </button>
      <p className="mt-1 font-mono text-[10px] text-faint">
        Moeda do painel: {currency} · os alarmes são em €.
      </p>
    </div>
  );
}
