/* ═══════════════════════════════════════════════════════════
   Procedural Audio Engine
   Generates glass/metal clink sounds using Web Audio API
   ═══════════════════════════════════════════════════════════ */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Glass clink sound — short high-frequency sine burst with fast exponential decay
 */
export function playGlassClink(volume: number = 0.3): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Primary tone
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(2800, now);
    osc1.frequency.exponentialRampToValueAtTime(1800, now + 0.15);

    // Harmonic overtone
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(4200, now);
    osc2.frequency.exponentialRampToValueAtTime(3000, now + 0.1);

    // Gain envelope — sharp attack, fast decay
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(volume * 0.4, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    // High-pass filter for glassy character
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1500, now);
    filter.Q.setValueAtTime(5, now);

    osc1.connect(gainNode);
    osc2.connect(gain2);
    gainNode.connect(filter);
    gain2.connect(filter);
    filter.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.2);
  } catch {
    // Silently fail if audio is unavailable
  }
}

/**
 * Metal clink sound — lower frequency with metallic harmonics & slight ring
 */
export function playMetalClink(volume: number = 0.25): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Primary metal tone
    const osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.3);

    // Metallic harmonic
    const osc2 = ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(2400, now);
    osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.2);

    // Ring resonance
    const osc3 = ctx.createOscillator();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(3600, now);
    osc3.frequency.exponentialRampToValueAtTime(2800, now + 0.4);

    // Gain envelopes
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(volume * 0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(volume * 0.08, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    // Band-pass for metallic resonance
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(8, now);

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain1.connect(filter);
    gain2.connect(filter);
    gain3.connect(ctx.destination);
    filter.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.25);
    osc3.stop(now + 0.6);
  } catch {
    // Silently fail
  }
}

/**
 * Snap sound — satisfying click when bangle locks into position
 */
export function playSnapSound(volume: number = 0.2): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    // Silently fail
  }
}

/**
 * Play appropriate sound based on material type
 */
export function playBangleSound(
  material: string,
  volume: number = 0.3
): void {
  switch (material) {
    case "glass":
    case "diamond":
      playGlassClink(volume);
      break;
    case "gold":
    case "brass":
    case "kundan":
      playMetalClink(volume);
      break;
    case "pearl":
      playSnapSound(volume);
      break;
    default:
      playSnapSound(volume);
  }
}
