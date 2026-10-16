/** Short original blips. Not the SNES soundtrack. */
export class AudioBus {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastExplode = 0;
    this.musicTime = 0;
    this.step = 0;
    this.enabled = false;
  }

  unlock() {
    const ctx = this.context();
    if (ctx && ctx.state === "suspended") ctx.resume();
    this.enabled = true;
  }

  context() {
    if (this.muted) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) this.ctx = new AC();
    return this.ctx;
  }

  tone(freq, dur, type, gain, slideTo) {
    const ctx = this.context();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur, gain) {
    const ctx = this.context();
    if (!ctx) return;
    const length = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    const amp = ctx.createGain();
    amp.gain.value = gain;
    src.connect(filter);
    filter.connect(amp);
    amp.connect(ctx.destination);
    src.start();
  }

  play(name) {
    if (this.muted) return;
    if (name === "explode") {
      const ctx = this.context();
      if (!ctx) return;
      if (ctx.currentTime - this.lastExplode < 0.07) return;
      this.lastExplode = ctx.currentTime;
      this.noise(0.22, 0.35);
      this.tone(160, 0.22, "square", 0.08, 50);
      return;
    }
    const bank = {
      place: () => this.tone(520, 0.07, "square", 0.05, 240),
      kick: () => this.tone(220, 0.08, "square", 0.05, 140),
      pickup: () => {
        this.tone(523, 0.08, "square", 0.05);
        this.tone(659, 0.08, "square", 0.05);
        this.tone(784, 0.12, "square", 0.05);
      },
      die: () => this.tone(440, 0.28, "sawtooth", 0.05, 80),
      clear: () => {
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => this.tone(f, 0.12, "square", 0.05), i * 90);
        });
      },
      start: () => this.tone(392, 0.12, "square", 0.05, 784),
      stage: () => this.tone(660, 0.1, "square", 0.04, 880),
      open: () => this.tone(880, 0.14, "square", 0.05, 1320),
      hurry: () => this.tone(880, 0.06, "square", 0.04),
      win: () => {
        [523, 659, 784, 1046, 784, 1046].forEach((f, i) => {
          setTimeout(() => this.tone(f, 0.14, "square", 0.05), i * 110);
        });
      },
      pause: () => this.tone(300, 0.06, "square", 0.04),
    };
    bank[name]?.();
  }

  tick(dt, active) {
    if (!active || this.muted || !this.enabled) return;
    this.musicTime += dt;
    const tempo = 0.17;
    if (this.musicTime < tempo) return;
    this.musicTime = 0;
    const lead = [523, 587, 659, 784, 659, 587, 523, 392, 440, 523, 587, 659, 784, 698, 659, 523];
    const bass = [131, 131, 165, 165, 196, 175, 165, 131];
    const i = this.step % lead.length;
    this.tone(lead[i], 0.14, "square", 0.018);
    if (i % 2 === 0) this.tone(bass[(i / 2) % bass.length], 0.16, "triangle", 0.03);
    this.step++;
  }
}
