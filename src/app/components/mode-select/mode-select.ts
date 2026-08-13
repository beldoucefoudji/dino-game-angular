import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NakamaService } from '../../services/nakama';
import { getDeviceId } from '../../services/device-id';
import { LanguageService } from '../../services/language';
import { SoundService } from '../../services/sound';

@Component({
  selector: 'app-mode-select',
  imports: [FormsModule, RouterLink],
  templateUrl: './mode-select.html',
  styleUrl: './mode-select.css'
})
export class ModeSelect {
  isConnecting = false;
  connectError = '';
  showJoinInput = false;
  joinCode = '';

  private translations = {
    en: {
      heading: 'CHOOSE YOUR MODE', sub: 'Pick a mode to start your adventure',
      solo: 'SOLO RUN', soloDesc: 'Run alone and beat your high score',
      multi: 'MULTIPLAYER', multiDesc: 'Race against other real players',
      join: 'Join with code', go: 'Go'
    },
    fr: {
      heading: 'CHOISIS TON MODE', sub: 'Choisis un mode pour commencer',
      solo: 'SOLO', soloDesc: 'Cours seul et bats ton meilleur score',
      multi: 'MULTIJOUEUR', multiDesc: "Affronte d'autres joueurs réels",
      join: 'Rejoindre avec un code', go: 'Aller'
    }
  };

  constructor(
    private router: Router,
    private nakama: NakamaService,
    public language: LanguageService,
    public sound: SoundService
  ) {}

  t(key: string): string {
    return (this.translations as any)[this.language.lang()][key];
  }

  playSolo() {
    this.sound.play(500);
    this.router.navigate(['/solo-game']);
  }

  async createMatch() {
    if (this.isConnecting) return;
    this.sound.play(500);
    this.isConnecting = true;
    this.connectError = '';
    try {
      await this.ensureConnected();
      const matchId = await this.nakama.createMatch();
      this.router.navigate(['/lobby', matchId]);
    } catch (error) {
      console.error('Failed to create match:', error);
      this.connectError = 'Could not connect. Is the Nakama server running?';
    } finally {
      this.isConnecting = false;
    }
  }

  async joinMatch() {
    if (!this.joinCode.trim()) return;
    this.sound.play(500);
    this.isConnecting = true;
    this.connectError = '';
    try {
      await this.ensureConnected();
      const matchId = await this.nakama.joinMatch(this.joinCode.trim());
      this.router.navigate(['/lobby', matchId]);
    } catch (error) {
      console.error('Failed to join match:', error);
      this.connectError = 'Could not join. Check the code and try again.';
    } finally {
      this.isConnecting = false;
    }
  }

  private async ensureConnected() {
    if (!this.nakama.isAuthenticated()) {
      const deviceId = getDeviceId();
      await this.nakama.authenticate(deviceId);
    }
    await this.nakama.ensureSocketConnected();
  }
}