/**
 * Som de alarme "cha-ching" gerado por Web Audio (sem ficheiros externos).
 * Duas notas agudas em sequência, como uma caixa registadora.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  audio: AudioContext,
  freq: number,
  start: number,
  duration: number,
  gainPeak = 0.18,
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Toca o alarme de preço-alvo. Seguro para chamar sem interação prévia. */
export function playChaChing() {
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime;
  // Nota grave curta + nota aguda brilhante (caixa registadora).
  tone(audio, 880, t, 0.18, 0.16);
  tone(audio, 1320, t + 0.13, 0.3, 0.2);
  tone(audio, 1760, t + 0.13, 0.28, 0.08);
}

/** Bip simples para feedback de teste. */
export function playBlip() {
  const audio = getCtx();
  if (!audio) return;
  tone(audio, 660, audio.currentTime, 0.12, 0.12);
}
