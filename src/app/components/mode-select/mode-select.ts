import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NakamaService } from '../../services/nakama';
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

  showMultiplayerModal = false;
  matchUsername = '';
  maxPlayers = 4;

  private translations = {
    en: {
      heading: 'CHOOSE YOUR MODE', sub: 'Pick a mode to start your adventure',
      solo: 'SOLO RUN', soloDesc: 'Run alone and beat your high score',
      multi: 'MULTIPLAYER', multiDesc: 'Race against other real players',
      join: 'Join with code', go: 'Go',
      modalTitle: 'Set up your race', username: 'Your name', players: 'Number of players',
      validate: 'VALIDATE', cancel: 'CANCEL', loginNeeded: 'Please log in to play multiplayer.'
    },
    fr: {
      heading: 'CHOISIS TON MODE', sub: 'Choisis un mode pour commencer',
      solo: 'SOLO', soloDesc: 'Cours seul et bats ton meilleur score',
      multi: 'MULTIJOUEUR', multiDesc: "Affronte d'autres joueurs réels",
      join: 'Rejoindre avec un code', go: 'Aller',
      modalTitle: 'Configure ta course', username: 'Ton nom', players: 'Nombre de joueurs',
      validate: 'VALIDER', cancel: 'ANNULER', loginNeeded: 'Connecte-toi pour jouer en multijoueur.'
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

  openMultiplayerSetup() {
    if (!this.nakama.isAuthenticated()) {
      this.connectError = this.t('loginNeeded');
      this.sound.play(200, 0.15);
      setTimeout(() => this.router.navigate(['/auth']), 900);
      return;
    }
    this.sound.play(500);
    this.matchUsername = this.nakama.getUsername() ?? '';
    this.showMultiplayerModal = true;
  }

  cancelMultiplayerSetup() {
    this.sound.play(300);
    this.showMultiplayerModal = false;
  }

  async confirmMultiplayerSetup() {
    this.sound.play(600, 0.12);
    this.showMultiplayerModal = false;
    this.isConnecting = true;
    this.connectError = '';
    try {
      await this.nakama.ensureSocketConnected();
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
    if (!this.nakama.isAuthenticated()) {
      this.connectError = this.t('loginNeeded');
      setTimeout(() => this.router.navigate(['/auth']), 900);
      return;
    }
    this.sound.play(500);
    this.isConnecting = true;
    this.connectError = '';
    try {
      await this.nakama.ensureSocketConnected();
      const matchId = await this.nakama.joinMatch(this.joinCode.trim());
      this.router.navigate(['/lobby', matchId]);
    } catch (error) {
      console.error('Failed to join match:', error);
      this.connectError = 'Could not join. Check the code and try again.';
    } finally {
      this.isConnecting = false;
    }
  }
}