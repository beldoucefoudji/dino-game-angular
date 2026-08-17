import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SoundService {
  muted = localStorage.getItem('dino_muted') === 'true';
  private ctx: AudioContext | null = null;
  private music = new Audio();
  private musicStarted = false;
  private gestureListenerAdded = false;

  constructor() {
    // Automatically attach fallback listeners if unmuted on app startup
    if (!this.muted) {
      this.addGestureListeners();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.music.muted = this.muted;
    localStorage.setItem('dino_muted', String(this.muted));

    if (!this.muted && this.music.src && this.music.paused) {
      this.attemptPlayMusic();
    } else if (this.muted && !this.music.paused) {
      this.music.pause();
    }
  }

  // Synthesized Sound Effects (SFX)
  playJump() {
    this.playFrequencyRamp(150, 600, 0.1, 'square');
  }

  playCoin() {
    this.play(987.77, 0.08); // B5 note
    setTimeout(() => this.play(1318.51, 0.15), 80); // E6 note
  }

  playHit() {
    this.playFrequencyRamp(300, 80, 0.2, 'sawtooth');
  }

  play(freq = 440, duration = 0.08) {
    if (this.muted) return;
    this.ensureAudioContext();

    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start();
    osc.stop(this.ctx!.currentTime + duration);
  }

  private playFrequencyRamp(startFreq: number, endFreq: number, duration: number, type: OscillatorType = 'square') {
    if (this.muted) return;
    this.ensureAudioContext();

    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx!.currentTime + duration);

    gain.gain.setValueAtTime(0.08, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx!.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start();
    osc.stop(this.ctx!.currentTime + duration);
  }

  // Background Music
  startMusic(src: string) {
    if (this.musicStarted && this.music.src.endsWith(src)) return;

    this.music.src = src;
    this.music.loop = true;
    this.music.volume = 0.3;
    this.music.muted = this.muted;

    this.attemptPlayMusic();
  }

  stopMusic() {
    this.music.pause();
    this.music.currentTime = 0;
    this.musicStarted = false;
  }

  private ensureAudioContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private attemptPlayMusic() {
    if (this.muted || !this.music.src) return;

    this.ensureAudioContext();

    this.music.play()
      .then(() => {
        this.musicStarted = true;
        this.removeGestureListeners();
      })
      .catch(() => {
        // Autoplay policy blocked play() - waiting for user interaction
        this.addGestureListeners();
      });
  }

  private handleUserGesture = () => {
    this.ensureAudioContext();

    if (!this.muted && this.music.src && this.music.paused) {
      this.music.play()
        .then(() => {
          this.musicStarted = true;
          this.removeGestureListeners();
        })
        .catch(() => {});
    }
  };

  private addGestureListeners() {
    if (this.gestureListenerAdded) return;
    this.gestureListenerAdded = true;
    window.addEventListener('click', this.handleUserGesture, { once: false });
    window.addEventListener('keydown', this.handleUserGesture, { once: false });
    window.addEventListener('touchstart', this.handleUserGesture, { once: false });
  }

  private removeGestureListeners() {
    if (!this.gestureListenerAdded) return;
    this.gestureListenerAdded = false;
    window.removeEventListener('click', this.handleUserGesture);
    window.removeEventListener('keydown', this.handleUserGesture);
    window.removeEventListener('touchstart', this.handleUserGesture);
  }
}