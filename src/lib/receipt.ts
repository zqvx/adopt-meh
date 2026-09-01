import { getPet } from "./pets/catalog";
import { evaluateTrade } from "./pets/engine";
import { GLYPH_HEX, VERDICT_COLOR } from "./glyph-colors";
import type { TradeLine, Variant } from "./pets/types";

const W = 1080;
const H = 1350;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPetGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, hex: string) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  // Círculo de fundo.
  ctx.fillStyle = `${hex}22`;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  // Silhueta simples: cabeça + olhos.
  ctx.fillStyle = hex;
  roundRect(ctx, -size * 0.26, -size * 0.22, size * 0.52, size * 0.42, size * 0.18);
  ctx.fill();
  ctx.fillStyle = "#07080a";
  ctx.beginPath();
  ctx.arc(-size * 0.11, -size * 0.04, size * 0.055, 0, Math.PI * 2);
  ctx.arc(size * 0.11, -size * 0.04, size * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const VSHORT: Record<Variant, string> = {
  regular: "REG",
  fly: "F",
  ride: "R",
  fr: "FR",
  nfr: "NFR",
  mfr: "MFR",
};

function sideLines(lines: TradeLine[]): { name: string; variant: string; qty: number; hex: string }[] {
  return lines.map((l) => {
    const pet = getPet(l.petId);
    return {
      name: pet?.name ?? l.petId,
      variant: pet?.hasVariants ? VSHORT[l.variant] : (pet?.category ?? ""),
      qty: l.qty,
      hex: GLYPH_HEX[pet?.glyph ?? "ink"] ?? "#8a93a0",
    };
  });
}

/** Desenha o recibo W/F/L e devolve o URL de dados PNG (para download/partilha). */
export function generateReceipt(you: TradeLine[], them: TradeLine[]): { url: string; verdict: string } {
  const v = evaluateTrade(you, them);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Fundo.
  ctx.fillStyle = "#07080a";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#e8eaed14";
  ctx.lineWidth = 2;
  roundRect(ctx, 24, 24, W - 48, H - 48, 24);
  ctx.stroke();

  // Cabeçalho.
  ctx.fillStyle = "#3dcf9a";
  ctx.font = "700 44px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("NEXUS TRADE TERMINAL", 64, 96);
  ctx.fillStyle = "#5c6370";
  ctx.font = "22px 'Sora', sans-serif";
  ctx.fillText("Adopt Me · análise de troca", 64, 132);

  // Carimbo W/F/L.
  const color = VERDICT_COLOR[v.kind] ?? "#5c6370";
  const stamp =
    v.kind === "massive" || v.kind === "gain"
      ? "BIG WIN"
      : v.kind === "fair"
        ? "FAIR"
        : "LOSS";
  ctx.save();
  ctx.translate(W - 250, 130);
  ctx.rotate(-0.08);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 6;
  roundRect(ctx, 0, -48, 220, 86, 16);
  ctx.stroke();
  ctx.font = "800 52px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(stamp, 110, 14);
  ctx.restore();
  ctx.textAlign = "left";

  // Percentagem.
  ctx.fillStyle = color;
  ctx.font = "700 60px 'IBM Plex Mono', monospace";
  const pct = `${v.pct >= 0 ? "+" : ""}${(v.pct * 100).toFixed(1)}%`;
  ctx.fillText(pct, 64, 220);
  ctx.fillStyle = "#8b919a";
  ctx.font = "24px 'Sora', sans-serif";
  ctx.fillText(v.label, 64, 258);

  // Colunas.
  const drawColumn = (
    title: string,
    items: ReturnType<typeof sideLines>,
    yStart: number,
  ) => {
    ctx.fillStyle = "#e8eaed";
    ctx.font = "700 26px 'Sora', sans-serif";
    ctx.fillText(title, 64, yStart);
    let y = yStart + 44;
    const shown = items.slice(0, 7);
    for (const it of shown) {
      drawPetGlyph(ctx, 64, y - 34, 40, it.hex);
      ctx.fillStyle = "#e8eaed";
      ctx.font = "24px 'Sora', sans-serif";
      ctx.fillText(`${it.qty > 1 ? `${it.qty}× ` : ""}${it.name}`, 118, y);
      if (it.variant) {
        ctx.fillStyle = "#5c6370";
        ctx.font = "18px 'IBM Plex Mono', monospace";
        ctx.fillText(it.variant.toUpperCase(), 118, y + 26);
      }
      y += 64;
    }
    if (items.length > 7) {
      ctx.fillStyle = "#5c6370";
      ctx.font = "20px 'Sora', sans-serif";
      ctx.fillText(`+${items.length - 7} itens…`, 64, y);
    }
  };

  drawColumn("TU DÁS", sideLines(you), 330);
  drawColumn("TU RECEBES", sideLines(them), 760);

  // Rodapé.
  ctx.strokeStyle = "#e8eaed14";
  ctx.beginPath();
  ctx.moveTo(64, H - 150);
  ctx.lineTo(W - 64, H - 150);
  ctx.stroke();
  ctx.fillStyle = "#8b919a";
  ctx.font = "20px 'Sora', sans-serif";
  const delta =
    v.deltaPoints >= 0 ? `+${Math.round(v.deltaPoints)} pts` : `${Math.round(v.deltaPoints)} pts`;
  ctx.fillText(`Delta: ${delta} · ${v.downgrade ? "⚠ downgrade" : "liquidez OK"}`, 64, H - 100);
  ctx.fillStyle = "#5c6370";
  ctx.font = "18px 'Sora', sans-serif";
  ctx.fillText(
    new Date().toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" }),
    64,
    H - 64,
  );

  const url = canvas.toDataURL("image/png");
  return { url, verdict: v.kind };
}

/** Descarrega o recibo como PNG. */
export function downloadReceipt(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
