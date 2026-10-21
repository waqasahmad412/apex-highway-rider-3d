/**
 * Procedural Web Audio API sound synthesizer for Motorcycle Highway Simulator.
 * 100% code-synthesized: zero external mp3/audio files needed!
 */

export class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine nodes
  private oscLow: OscillatorNode | null = null;
  private oscMid: OscillatorNode | null = null;
  private oscHigh: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private distortion: WaveShaperNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineMasterGain: GainNode | null = null;

  // Wind nodes
  private windSource: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Music state
  private musicInterval: number | null = null;
  private musicStep: number = 0;
  private isMusicPlaying: boolean = false;

  private currentRpmRatio: number = 0.1; // 0 to 1
  private currentSpeedKmh: number = 0;

  constructor() {
    // AudioContext will be lazily created on user interaction
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Busses
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.8;
      this.engineGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.85;
      this.sfxGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.ctx.destination);

      this.setupEngineSynth();
      this.setupWindSynth();
      this.startMusic();
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(engine: number, sfx: number, music: number): void {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(engine, this.ctx.currentTime, 0.05);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(music, this.ctx.currentTime, 0.05);
    }
  }

  private makeDistortionCurve(amount: number = 25): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private setupEngineSynth(): void {
    if (!this.ctx || !this.engineGain) return;

    // Distortion
    this.distortion = this.ctx.createWaveShaper();
    this.distortion.curve = this.makeDistortionCurve(18) as unknown as Float32Array<ArrayBuffer>;
    this.distortion.oversample = '2x';

    // Filter
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 600;
    this.engineFilter.Q.value = 3;

    // Engine Gain
    this.engineMasterGain = this.ctx.createGain();
    this.engineMasterGain.gain.value = 0.0;

    // Cylinder pulses
    this.oscSub = this.ctx.createOscillator();
    this.oscSub.type = 'triangle';
    this.oscSub.frequency.value = 45; // idle rumble

    this.oscLow = this.ctx.createOscillator();
    this.oscLow.type = 'sawtooth';
    this.oscLow.frequency.value = 90;

    this.oscMid = this.ctx.createOscillator();
    this.oscMid.type = 'sawtooth';
    this.oscMid.frequency.value = 180;

    this.oscHigh = this.ctx.createOscillator();
    this.oscHigh.type = 'square';
    this.oscHigh.frequency.value = 360;

    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.5;
    this.oscSub.connect(subGain);

    const lowGain = this.ctx.createGain();
    lowGain.gain.value = 0.45;
    this.oscLow.connect(lowGain);

    const midGain = this.ctx.createGain();
    midGain.gain.value = 0.35;
    this.oscMid.connect(midGain);

    const highGain = this.ctx.createGain();
    highGain.gain.value = 0.2;
    this.oscHigh.connect(highGain);

    subGain.connect(this.distortion);
    lowGain.connect(this.distortion);
    midGain.connect(this.distortion);
    highGain.connect(this.distortion);

    this.distortion.connect(this.engineFilter);
    this.engineFilter.connect(this.engineMasterGain);
    this.engineMasterGain.connect(this.engineGain);

    this.oscSub.start();
    this.oscLow.start();
    this.oscMid.start();
    this.oscHigh.start();
  }

  private setupWindSynth(): void {
    if (!this.ctx || !this.engineGain) return;

    // Create 2 seconds of pink/white noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.12;
    }

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 500;
    this.windFilter.Q.value = 1.2;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.0;

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.engineGain);

    this.windSource.start();
  }

  /**
   * Update engine pitch and sound based on bike telemetry
   */
  public updateBikeSound(
    rpmRatio: number, // 0 (idle) to 1 (redline)
    speedKmh: number,
    throttle: number,
    isBraking: boolean,
    isCrashed: boolean
  ): void {
    if (!this.ctx || !this.engineMasterGain || !this.oscLow || !this.oscMid || !this.oscHigh || !this.oscSub) return;

    this.currentRpmRatio = rpmRatio;
    this.currentSpeedKmh = speedKmh;

    const now = this.ctx.currentTime;

    if (isCrashed) {
      this.engineMasterGain.gain.setTargetAtTime(0, now, 0.05);
      if (this.windGain) this.windGain.gain.setTargetAtTime(0, now, 0.05);
      return;
    }

    // Engine volume ramp
    const targetEngineGain = 0.35 + throttle * 0.45;
    this.engineMasterGain.gain.setTargetAtTime(targetEngineGain, now, 0.05);

    // Fundamental frequencies
    // Idle around 45Hz, redline around 280Hz
    const baseFreq = 42 + Math.pow(rpmRatio, 1.4) * 240;

    this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);
    this.oscLow.frequency.setTargetAtTime(baseFreq, now, 0.04);
    this.oscMid.frequency.setTargetAtTime(baseFreq * 2, now, 0.04);
    this.oscHigh.frequency.setTargetAtTime(baseFreq * 3.5, now, 0.04);

    if (this.engineFilter) {
      const filterCutoff = 450 + rpmRatio * 3200 + throttle * 800;
      this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.06);
    }

    // Wind sound scales with high speed
    if (this.windGain && this.windFilter) {
      const speedNorm = Math.min(speedKmh / 300, 1.0);
      const windTarget = Math.pow(speedNorm, 1.8) * 0.6;
      this.windGain.gain.setTargetAtTime(windTarget, now, 0.08);
      this.windFilter.frequency.setTargetAtTime(300 + speedNorm * 1800, now, 0.08);
    }

    // Occasional brake squeal when braking at high speed
    if (isBraking && speedKmh > 50 && Math.random() < 0.03) {
      this.playTireSqueal();
    }
  }

  /**
   * Sound effect: Near-miss whoosh + adrenaline chime
   */
  public playNearMiss(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // High swoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);

    // Reward sparkle bell
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(1320, now + 0.08); // E6
    chime.frequency.setValueAtTime(1760, now + 0.16); // A6

    chimeGain.gain.setValueAtTime(0.25, now + 0.08);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    chime.connect(chimeGain);
    chimeGain.connect(this.sfxGain);
    chime.start(now + 0.08);
    chime.stop(now + 0.55);
  }

  /**
   * Sound effect: Passing traffic Doppler shift
   */
  public playPassingDoppler(isLeft: boolean): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.35); // Doppler drop

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    if (panner) {
      panner.pan.setValueAtTime(isLeft ? -0.8 : 0.8, now);
      panner.pan.linearRampToValueAtTime(isLeft ? -0.2 : 0.2, now + 0.35);
      osc.connect(panner);
      panner.connect(gain);
    } else {
      osc.connect(gain);
    }

    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * Sound effect: Tire screech
   */
  public playTireSqueal(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200 + Math.random() * 400, now);
    osc.frequency.linearRampToValueAtTime(1900, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Sound effect: Heavy Crash impact
   */
  public playCrash(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Sub bass punch
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.4);

    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.65);

    // Metal crunch noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.7);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1200;
    noiseFilter.Q.value = 1.5;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noiseSource.start(now);
  }

  /**
   * Motorcycle horn
   */
  public playHorn(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.value = 440; // A4
    osc2.frequency.value = 554.37; // C#5

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.38);
    osc2.stop(now + 0.38);
  }

  /**
   * UI Click / Select sound
   */
  public playUiClick(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Procedural synthwave racing beat
   */
  private startMusic(): void {
    if (this.musicInterval !== null || !this.ctx) return;
    this.isMusicPlaying = true;

    // 128 BPM = ~117ms per 16th note
    const tempoMs = 120;
    const bassNotes = [55, 55, 65.41, 55, 73.42, 65.41, 55, 82.41]; // A1, C2, D2, E2...
    const leadNotes = [220, 261.63, 329.63, 440, 392, 329.63, 261.63, 196];

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
      const now = this.ctx.currentTime;
      const step = this.musicStep % 16;

      // Kick drum on steps 0, 4, 8, 12 (four on the floor)
      if (step % 4 === 0) {
        const kick = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(140, now);
        kick.frequency.exponentialRampToValueAtTime(35, now + 0.09);
        kickGain.gain.setValueAtTime(0.35, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        kick.connect(kickGain);
        kickGain.connect(this.musicGain);
        kick.start(now);
        kick.stop(now + 0.11);
      }

      // Snare / clap on steps 4 and 12
      if (step === 4 || step === 12) {
        const snare = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snare.type = 'triangle';
        snare.frequency.setValueAtTime(240, now);
        snare.frequency.exponentialRampToValueAtTime(80, now + 0.08);
        snareGain.gain.setValueAtTime(0.2, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        snare.connect(snareGain);
        snareGain.connect(this.musicGain);
        snare.start(now);
        snare.stop(now + 0.1);
      }

      // Bass synth line on 8th notes
      if (step % 2 === 0) {
        const noteIdx = Math.floor(step / 2) % bassNotes.length;
        const noteFreq = bassNotes[noteIdx];
        const bass = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bass.type = 'sawtooth';
        bass.frequency.value = noteFreq;

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(450, now);
        bassFilter.frequency.exponentialRampToValueAtTime(120, now + 0.15);

        bassGain.gain.setValueAtTime(0.25, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        bass.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bass.start(now);
        bass.stop(now + 0.2);
      }

      // Synth Arpeggio on 16th notes
      if (step % 2 === 1) {
        const arpeggioIdx = step % leadNotes.length;
        const arpFreq = leadNotes[arpeggioIdx];
        const arp = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();

        arp.type = 'sine';
        arp.frequency.value = arpFreq;
        arpGain.gain.setValueAtTime(0.08, now);
        arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        arp.connect(arpGain);
        arpGain.connect(this.musicGain);

        arp.start(now);
        arp.stop(now + 0.09);
      }

      this.musicStep++;
    }, tempoMs);
  }

  public toggleMusic(enable?: boolean): boolean {
    if (enable !== undefined) {
      this.isMusicPlaying = enable;
    } else {
      this.isMusicPlaying = !this.isMusicPlaying;
    }
    return this.isMusicPlaying;
  }

  public dispose(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundManager = new SoundManager();
