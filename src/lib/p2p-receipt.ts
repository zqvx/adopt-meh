import { getPet } from "./pets/catalog";
import { GLYPH_HEX } from "./glyph-colors";
import { VARIANT_LABEL } from "./format";
import type { Variant } from "./pets/types";

const W = 1080;
const H = 1080;

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

export interface P2PReceiptInput {
  petId?: string;
  variant?: Variant;
  /** Descrição livre quando não há petId (ex.: pacote de vários pets). */
  label?: string;
  /** Valor recebido em €. */
  eur: number;
  /** Nº do vouch (fica no carimbo). */
  vouch: number;
  buyer?: string;
  ts?: number;
}

/**
 * Recibo de venda P2P (PNG quadrado, pronto para o canal de vouches do
 * Discord). É isto que constrói reputação: prova pública de cada entrega.
 */
export function generateP2PReceipt(input: P2PReceiptInput): { url: string } {
  const ts = input.ts ?? Date.now();
  const pet = input.petId ? getPet(input.petId) : null;
  const accent = "#3dcf9a";
  const petHex = GLYPH_HEX[pet?.glyph ?? "mint"] ?? accent;
  const title =
    input.label ??
    (pet
      ? `${pet.name}${pet.hasVariants && input.variant ? ` · ${VARIANT_LABEL[input.variant]}` : ""}`
      : "Pet Adopt Me");

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Fundo + moldura.
  ctx.fillStyle = "#07080a";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#e8eaed14";
  ctx.lineWidth = 2;
  roundRect(ctx, 24, 24, W - 48, H - 48, 28);
  ctx.stroke();

  // Cabeçalho.
  ctx.fillStyle = accent;
  ctx.font = "700 40px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("NEXUS · P2P", 64, 96);
  ctx.fillStyle = "#5c6370";
  ctx.font = "22px 'Sora', sans-serif";
  ctx.fillText("Recibo de venda direta", 64, 130);

  // Carimbo de vouch.
  ctx.save();
  ctx.translate(W - 300, 118);
  ctx.rotate(-0.07);
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = 5;
  roundRect(ctx, 0, -46, 240, 82, 16);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "800 44px 'IBM Plex Mono', monospace";
  ctx.fillText(`VOUCH #${String(input.vouch).padStart(3, "0")}`, 120, 12);
  ctx.restore();
  ctx.textAlign = "left";

  // Faixa "SUCCESSFUL TRADE".
  ctx.fillStyle = "#3dcf9a1f";
  roundRect(ctx, 64, 200, W - 128, 110, 18);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.font = "800 46px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("SUCCESSFUL TRADE", W / 2, 252);
  ctx.fillStyle = "#8b919a";
  ctx.font = "22px 'Sora', sans-serif";
  ctx.fillText("PET ENTREGUE · PAGO VIA REVOLUT", W / 2, 288);
  ctx.textAlign = "left";

  // Bloco do pet.
  ctx.fillStyle = "#0e1014";
  roundRect(ctx, 64, 356, W - 128, 210, 20);
  ctx.fill();

  // Glifo.
  ctx.save();
  ctx.translate(150, 461);
  ctx.fillStyle = `${petHex}22`;
  ctx.beginPath();
  ctx.arc(0, 0, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = petHex;
  roundRect(ctx, -30, -26, 60, 48, 20);
  ctx.fill();
  ctx.fillStyle = "#07080a";
  ctx.beginPath();
  ctx.arc(-12, -5, 6.5, 0, Math.PI * 2);
  ctx.arc(12, -5, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#5c6370";
  ctx.font = "18px 'IBM Plex Mono', monospace";
  ctx.fillText("ITEM ENTREGUE", 236, 424);
  ctx.fillStyle = "#e8eaed";
  ctx.font = "700 40px 'Sora', sans-serif";
  ctx.fillText(title, 236, 474);
  ctx.fillStyle = "#8b919a";
  ctx.font = "22px 'Sora', sans-serif";
  ctx.fillText(
    input.buyer ? `Comprador: ${input.buyer}` : "Entrega confirmada em jogo",
    236,
    512,
  );

  // Valor.
  ctx.fillStyle = "#5c6370";
  ctx.font = "20px 'IBM Plex Mono', monospace";
  ctx.fillText("VALOR RECEBIDO", 64, 654);
  ctx.fillStyle = accent;
  ctx.font = "800 108px 'IBM Plex Mono', monospace";
  ctx.fillText(`${input.eur.toFixed(2).replace(".", ",")} €`, 64, 754);

  // Método de pagamento.
  ctx.fillStyle = "#0e1014";
  roundRect(ctx, 64, 800, W - 128, 96, 18);
  ctx.fill();
  ctx.fillStyle = "#8b919a";
  ctx.font = "24px 'Sora', sans-serif";
  ctx.fillText("Método", 96, 842);
  ctx.fillStyle = "#e8eaed";
  ctx.font = "700 28px 'Sora', sans-serif";
  ctx.fillText("Revolut · transferência instantânea (€)", 96, 878);

  // Rodapé.
  ctx.strokeStyle = "#e8eaed14";
  ctx.beginPath();
  ctx.moveTo(64, 940);
  ctx.lineTo(W - 64, 940);
  ctx.stroke();
  ctx.fillStyle = "#5c6370";
  ctx.font = "20px 'Sora', sans-serif";
  ctx.fillText(
    new Date(ts).toLocaleString("pt-PT", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    64,
    986,
  );
  ctx.textAlign = "right";
  ctx.fillText("gerado pelo NEXUS", W - 64, 986);
  ctx.textAlign = "left";

  return { url: canvas.toDataURL("image/png") };
}
