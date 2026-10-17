// Web Audio API Sound Synthesizer for Cyberpunk UI & Mechanical Keystrokes

class CyberSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sumit_sound_muted");
      this.isMuted = saved === "true";
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("sumit_sound_muted", String(this.isMuted));
    }
    if (this.isMuted && this.isAmbientPlaying) {
      this.stopAmbient();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Realistic mechanical keyboard switch click
  public playKeyClick() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      // High-frequency mechanical tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Randomize pitch slightly for organic typing feel
      const baseFreq = 1800 + Math.random() * 400;
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.025);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2200, t);
      filter.Q.setValueAtTime(3, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.035);
    } catch {
      // Audio context may be blocked before gesture
    }
  }

  // Cyber UI interaction blip
  public playCyberBlip(freq: number = 880) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.04);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {}
  }

  // Success 2-tone harmonic chime
  public playSuccessChirp() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      [587.33, 880, 1174.66].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t + i * 0.06);

        gain.gain.setValueAtTime(0, t);
        gain.gain.setValueAtTime(0.06, t + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.16);
      });
    } catch {}
  }

  // Error low saw wave
  public playErrorBuzz() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(90, t + 0.2);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    } catch {}
  }

  // Simulated alarm tone for kernel panic / lock down
  public playAlarmSound() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.linearRampToValueAtTime(900, t + 0.15);
      osc.frequency.linearRampToValueAtTime(600, t + 0.3);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    } catch {}
  }

  // Pad note player for ./jam
  public playNote(freq: number, type: OscillatorType = "sine", duration: number = 0.3) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(freq * 3, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + duration + 0.05);
    } catch {}
  }

  // Synthesized Cyber Ambient Soundscape Drone
  public toggleAmbient(): boolean {
    if (this.isAmbientPlaying) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  }

  public startAmbient() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      if (this.ambientOsc) {
        this.stopAmbient();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(55, ctx.currentTime); // Low A

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(240, ctx.currentTime);
      filter.Q.setValueAtTime(5, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      this.ambientOsc = osc;
      this.ambientGain = gain;
      this.isAmbientPlaying = true;
    } catch {}
  }

  public stopAmbient() {
    if (this.ambientOsc && this.ambientGain && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, t);
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        setTimeout(() => {
          if (this.ambientOsc) {
            this.ambientOsc.stop();
            this.ambientOsc.disconnect();
            this.ambientOsc = null;
          }
          this.isAmbientPlaying = false;
        }, 700);
      } catch {
        this.ambientOsc = null;
        this.isAmbientPlaying = false;
      }
    }
  }

  public getIsAmbientPlaying(): boolean {
    return this.isAmbientPlaying;
  }
}

export const soundEngine = new CyberSoundEngine();
