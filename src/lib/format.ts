import type { Currency, Variant } from "@/lib/pets/types";

export const FX: Record<Currency, number> = {
  USD: 1,
  BRL: 5.45,
  EUR: 0.86,
};

export const FX_LABEL: Record<Currency, string> = {
  USD: "USD",
  BRL: "BRL",
  EUR: "EUR",
};

export const CURRENCY_PREFIX: Record<Currency, string> = {
  USD: "$",
  BRL: "R$",
  EUR: "€",
};

export function toCurrency(usd: number, currency: Currency) {
  return usd * FX[currency];
}

export function formatMoney(usd: number, currency: Currency, digits = 2) {
  const value = toCurrency(usd, currency);
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  const prefix = CURRENCY_PREFIX[currency];
  if (abs >= 1000) {
    return `${sign}${prefix}${abs.toLocaleString("pt-PT", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`;
  }
  return `${sign}${prefix}${abs.toFixed(digits)}`;
}

export function formatPoints(points: number, digits = 1) {
  const abs = Math.abs(points);
  const sign = points < 0 ? "−" : "";
  if (abs >= 100) {
    return `${sign}${abs.toLocaleString("pt-PT", { maximumFractionDigits: 0 })}`;
  }
  return `${sign}${abs.toFixed(abs >= 10 ? 1 : digits)}`;
}

export function formatPct(pct: number) {
  const value = pct * 100;
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

export const VARIANT_LABEL: Record<Variant, string> = {
  regular: "Regular",
  fly: "Fly",
  ride: "Ride",
  fr: "Fly-Ride",
  nfr: "Neon NFR",
  mfr: "Mega MFR",
};

export const VARIANT_SHORT: Record<Variant, string> = {
  regular: "REG",
  fly: "F",
  ride: "R",
  fr: "FR",
  nfr: "NFR",
  mfr: "MFR",
};

export const VARIANT_ORDER: Variant[] = [
  "regular",
  "fly",
  "ride",
  "fr",
  "nfr",
  "mfr",
];
