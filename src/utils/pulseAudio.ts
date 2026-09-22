/**
 * Pulse Audio Synthesizer
 * Web Audio API-based medical monitor pulse sound synthesizer (clinical oximeter / ECG pulse beep)
 * Generates an authentic "bip / brap" arterial pulse tone on every heartbeat with zero external asset dependencies.
 */

class PulseAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 0.22;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  /**
   * Initialize or resume the Web Audio AudioContext
   */
  public init(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext initialization deferred:', e);
    }
  }

  /**
   * Set mute state
   */
  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /**
   * Check if sound is muted
   */
  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Toggle mute state
   */
  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (!this.muted) {
      this.init();
    }
    return this.muted;
  }

  /**
   * Play an authentic clinical pulse sound on heartbeat detection
   * Modulates pitch based on SpO2 (higher pitch for optimal saturation)
   * Timbre: Triangle wave with subtle downward pitch glide and exponential decay
   */
  public playBeat(spo2: number = 98): void {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Pitch modulation: 540 Hz (low SpO2) to 740 Hz (100% SpO2)
      const clampedSpo2 = Math.max(88, Math.min(100, spo2));
      const baseFreq = 540 + (clampedSpo2 - 88) * 16.5;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Triangle wave delivers warm clinical tone without harsh high-frequency harmonics
      osc.type = 'triangle';
      
      // Start slightly higher with fast micro-glide for authentic "brap/bip" acoustic transient
      osc.frequency.setValueAtTime(baseFreq * 1.08, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.025);

      // Fast 6ms attack followed by 75ms exponential decay envelope
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(this.volume, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.085);
    } catch {
      // Audio autoplay or hardware output restrictions handled safely
    }
  }

  /**
   * Clean up audio context
   */
  public close(): void {
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const pulseAudio = new PulseAudioSynthesizer();
