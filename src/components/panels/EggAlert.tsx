import { Egg } from "lucide-react";
import { useEffect, useState } from "react";

interface EggEvent {
  id: string;
  egg: string;
  date: string;
  petIds: string[];
  note?: string;
}

interface EggData {
  events: EggEvent[];
}

export function EggAlert() {
  const [events, setEvents] = useState<EggEvent[]>([]);

  useEffect(() => {
    fetch("/data/egg-events.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: EggData | null) => {
        if (!d?.events) return;
        const now = Date.now();
        // Só os próximos 30 dias.
        const soon = d.events
          .filter((e) => {
            const t = Date.parse(e.date);
            return t >= now && t - now <= 30 * 24 * 3600 * 1000;
          })
          .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
        setEvents(soon);
      })
      .catch(() => {});
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="rounded-xl bg-warn-dim px-4 py-3">
      {events.map((e) => {
        const days = Math.ceil((Date.parse(e.date) - Date.now()) / 86400000);
        return (
          <div key={e.id} className="flex items-start gap-3">
            <Egg className="mt-0.5 size-5 shrink-0 text-warn" />
            <div>
              <p className="text-sm font-medium text-warn">
                🚨 {e.egg} sai em {days} dia{days === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-muted">
                {e.note} Sinal de possível compra/acumulação — os pets do ovo
                podem valorizar quando a oferta fechar. Confirma a data no jogo.
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
