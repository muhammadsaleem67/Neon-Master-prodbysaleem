/**
 * Web Audio API procedural sound synthesizer.
 * No external audio files needed; crisp, punchy synthwave arcade SFX.
 */

class SoundController {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    const savedMute = localStorage.getItem('neon_master_muted');
    this.isMuted = savedMute === 'true';
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.65;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('neon_master_muted', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public playShoot(rapid = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = rapid ? 'triangle' : 'sawtooth';
    const startFreq = 880 + (Math.random() * 80 - 40);
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + (rapid ? 0.08 : 0.12));

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (rapid ? 0.08 : 0.12));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + (rapid ? 0.08 : 0.13));
  }

  public playEnemyShoot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.15);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playExplosion(isLarge = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const dur = isLarge ? 0.45 : 0.28;

    // Noise buffer
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isLarge ? 480 : 700, t);
    filter.frequency.exponentialRampToValueAtTime(40, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isLarge ? 0.45 : 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);

    // Sub-bass thud
    const osc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isLarge ? 120 : 160, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + dur);
    subGain.gain.setValueAtTime(0.4, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(subGain);
    subGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  public playDash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.18);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  public playPowerUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554, 659, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.17);
    });
  }

  public playWaveComplete() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chords.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.62);
    });
  }

  public playBossAlarm() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    for (let pulse = 0; pulse < 2; pulse++) {
      const pTime = t + pulse * 0.22;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, pTime);
      osc.frequency.linearRampToValueAtTime(330, pTime + 0.18);

      gain.gain.setValueAtTime(0.28, pTime);
      gain.gain.exponentialRampToValueAtTime(0.01, pTime + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(pTime);
      osc.stop(pTime + 0.21);
    }
  }

  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [330, 311, 293, 220]; // descending gloom
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + idx * 0.16;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.36);
    });
  }
}

export const sounds = new SoundController();
