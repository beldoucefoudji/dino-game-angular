import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MusicService {
  private audio: HTMLAudioElement;
  private started = false;

  constructor() {
    this.audio = new Audio('/theme2.ogg');
    this.audio.loop = true;
    this.audio.volume = 0.4; // adjust to taste
  }

  /** Call this once, from the root component, as early as possible. */
  init(): void {
    if (this.started) return;

    this.audio.play()
      .then(() => {
        this.started = true;
      })
      .catch(() => {
        // Autoplay was blocked — wait for the first user interaction, then try again.
        const resume = () => {
          if (this.started) return;
          this.audio.play().then(() => { this.started = true; }).catch(() => {});
          document.removeEventListener('click', resume);
          document.removeEventListener('keydown', resume);
          document.removeEventListener('touchstart', resume);
        };
        document.addEventListener('click', resume, { once: true });
        document.addEventListener('keydown', resume, { once: true });
        document.addEventListener('touchstart', resume, { once: true });
      });
  }

  setVolume(v: number): void {
    this.audio.volume = Math.min(1, Math.max(0, v));
  }

  mute(): void {
    this.audio.muted = true;
  }

  unmute(): void {
    this.audio.muted = false;
  }

  toggleMute(): boolean {
    this.audio.muted = !this.audio.muted;
    return this.audio.muted;
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.started = false;
  }
}