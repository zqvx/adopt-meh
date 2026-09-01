import { ExternalLink, Radio, ShieldCheck, Wallet } from "lucide-react";

const LINKS = [
  {
    name: "BloxUltra — valores em $ (loja)",
    url: "https://bloxultra.com/adopt-me-values",
    note: "Preços reais de compra em dinheiro, atualizados",
  },
  {
    name: "Eldorado — guia de valores 2026",
    url: "https://www.eldorado.gg/blog/adopt-me-trading-values/",
    note: "Intervalos FR/NFR/MFR em dinheiro real",
  },
  {
    name: "ElveBredd — valores em pontos",
    url: "https://elvebredd.com",
    note: "Lista comunitária de trocas in-game (referência)",
  },
  {
    name: "TikTok LIVE — procura ao vivo",
    url: "https://www.tiktok.com/search?q=adopt%20me%20trading%20live",
    note: "Vê streams de trading para sentir a procura real",
  },
];

const PAYOUTS = [
  { name: "Revolut", fee: "~0% entre €", note: "Melhor na UE: envia/recebe € instantâneo" },
  { name: "PayPal", fee: "~3–5%", note: "Universal, mas retém taxa e pode congelar fundos" },
  { name: "G2G", fee: "~10%", note: "Marketplace com proteção, público mundial" },
  { name: "Eldorado", fee: "~12%", note: "Marketplace, maior comissão" },
];

export function SourcesCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
      <div>
        <p className="font-mono text-[11px] tracking-[0.16em] text-faint uppercase">
          Método dos traders profissionais
        </p>
        <h3 className="text-base font-medium tracking-tight">
          Como confirmar que os valores são reais
        </h3>
      </div>

      <ol className="flex flex-col gap-2 text-sm text-muted">
        <li className="flex gap-2.5">
          <Radio className="mt-0.5 size-4 shrink-0 text-accent" />
          <span>
            <strong className="text-fg">1 · TikTok LIVE.</strong> Vê streams de
            trading Adopt Me em direto — o que as pessoas oferecem e pedem mostra a
            procura real, não números inflacionados de listas.
          </span>
        </li>
        <li className="flex gap-2.5">
          <ExternalLink className="mt-0.5 size-4 shrink-0 text-accent" />
          <span>
            <strong className="text-fg">2 · Site de valores em dinheiro.</strong>{" "}
            Confirma o valor equivalente em $ nos sites de preços reais (abaixo). Se
            várias fontes batem certo, o valor é de verdade.
          </span>
        </li>
        <li className="flex gap-2.5">
          <Wallet className="mt-0.5 size-4 shrink-0 text-accent" />
          <span>
            <strong className="text-fg">3 · Recebe na UE.</strong> Em Portugal usa{" "}
            <strong className="text-fg">Revolut</strong> ou PayPal (não há Pix).
            Negocia só com contas verificadas e nunca pagues primeiro.
          </span>
        </li>
      </ol>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {LINKS.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between gap-2 rounded-md bg-bg-sunken px-3 py-2 text-sm transition-colors hover:bg-surface-2"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{link.name}</span>
              <span className="block truncate text-[11px] text-faint">{link.note}</span>
            </span>
            <ExternalLink className="size-3.5 shrink-0 text-faint transition-colors group-hover:text-accent" />
          </a>
        ))}
      </div>

      <div className="rounded-lg bg-bg-sunken p-3">
        <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-faint uppercase">
          <ShieldCheck className="size-3.5 text-accent" />
          Taxas de recebimento na UE
        </p>
        <ul className="grid gap-1.5 text-xs sm:grid-cols-2">
          {PAYOUTS.map((p) => (
            <li key={p.name} className="flex items-center justify-between gap-2">
              <span>
                <span className="font-medium text-fg">{p.name}</span>
                <span className="block text-[11px] text-faint">{p.note}</span>
              </span>
              <span className="shrink-0 font-mono text-accent">{p.fee}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-faint">
        Os preços de referência do terminal seguem as listas públicas de valores em
        dinheiro (BloxUltra/Eldorado, set. 2026). Cross-trading por dinheiro real
        viola os Termos do Roblox — fá-lo por tua conta e risco.
      </p>
    </div>
  );
}
