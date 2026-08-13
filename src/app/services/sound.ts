import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SoundService {
  muted = localStorage.getItem('dino_muted') === 'true';
  private ctx: AudioContext | null = null;

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('dino_muted', String(this.muted));
  }

  play(freq = 440, duration = 0.08) {
    if (this.muted) return;
    if (!this.ctx) this.ctx = new AudioContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.value = 0.05;
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}