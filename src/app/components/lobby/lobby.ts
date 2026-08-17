import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NakamaService } from '../../services/nakama';
import { LanguageService } from '../../services/language';
import { SoundService } from '../../services/sound';
import { SlicePipe } from '@angular/common';

interface LobbyPlayer {
  userId: string;
  username: string;
}

@Component({
  selector: 'app-lobby',
  imports: [FormsModule, SlicePipe],
  templateUrl: './lobby.html',
  styleUrl: './lobby.css'
})
export class Lobby implements OnInit, OnDestroy {
  matchId = '';
  players: LobbyPlayer[] = [];
  showLoadout = false;
  selectedColor = '#4ade80';
  dinoColors = ['#4ade80', '#4f9dff', '#ff5d6c', '#ffcb45', '#c084fc', '#f97316'];
  inviteUserId = '';
  inviteStatus = '';

  private translations = {
    en: {
      room: 'ROOM', copy: 'Copy', players: 'PLAYERS', waiting: 'Waiting for player...',
      ready: 'READY', settings: 'GAME SETTINGS', mode: 'MODE', obstacles: 'OBSTACLES',
      timeLimit: 'TIME LIMIT', race: 'RACE', normal: 'NORMAL', start: 'START GAME',
      loadout: 'Choose your color', done: 'Done', invitePlaceholder: "Friend's User ID", invite: 'Invite'
    },
    fr: {
      room: 'SALLE', copy: 'Copier', players: 'JOUEURS', waiting: "En attente d'un joueur...",
      ready: 'PRÊT', settings: 'PARAMÈTRES', mode: 'MODE', obstacles: 'OBSTACLES',
      timeLimit: 'DURÉE', race: 'COURSE', normal: 'NORMAL', start: 'COMMENCER',
      loadout: 'Choisis ta couleur', done: 'Terminé', invitePlaceholder: "ID de l'ami(e)", invite: 'Inviter'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nakama: NakamaService,
    public language: LanguageService,
    public sound: SoundService
  ) {}

  t(key: string): string {
    return (this.translations as any)[this.language.lang()][key];
  }

  async ngOnInit() {
    this.matchId = this.route.snapshot.paramMap.get('matchId') ?? '';
    const socket = this.nakama.getSocket();
    if (!socket) {
      this.router.navigate(['/dashboard']);
      return;
    }

    socket.onmatchpresence = (event) => {
      for (const joined of event.joins ?? []) {
        if (!this.players.some(p => p.userId === joined.user_id)) {
          this.players.push({ userId: joined.user_id, username: joined.username ?? 'Player' });
          this.sound.play(550);
        }
      }
      for (const left of event.leaves ?? []) {
        this.players = this.players.filter(p => p.userId !== left.user_id);
      }
    };

    socket.onmatchdata = (matchData) => {
      if (matchData.op_code === 1) {
        const payload = JSON.parse(new TextDecoder().decode(matchData.data));
        this.nakama.raceSeed = payload.seed;
        this.router.navigate(['/match', this.matchId]);
      }
    };

    try {
      const match = await socket.joinMatch(this.matchId);
      this.players = (match.presences ?? []).map(p => ({ userId: p.user_id, username: p.username ?? 'Player' }));
    } catch (error) {
      console.error('Failed to load current match state:', error);
    }
  }

  ngOnDestroy() {
    const socket = this.nakama.getSocket();
    if (socket) {
      socket.onmatchpresence = () => {};
      socket.onmatchdata = () => {};
    }
  }

  copyMatchId() {
    navigator.clipboard.writeText(this.matchId);
    this.sound.play(500);
  }

  onStartMatch() {
    this.sound.play(650, 0.15);
    const seed = Math.floor(Math.random() * 1_000_000);
    this.nakama.raceSeed = seed;
    this.nakama.sendMatchStart(this.matchId, seed);
    this.router.navigate(['/match', this.matchId]);
  }

  openLoadout() {
    this.sound.play(450);
    this.showLoadout = true;
  }
  closeLoadout() {
    this.showLoadout = false;
    this.nakama.setSelectedColor?.(this.selectedColor);
  }
  selectColor(color: string) {
    this.sound.play(500);
    this.selectedColor = color;
  }

  async sendInvite() {
    if (!this.inviteUserId.trim()) return;
    try {
      await this.nakama.sendMatchInvite(this.inviteUserId.trim(), this.matchId);
      this.inviteStatus = 'Invite sent!';
      this.sound.play(600);
    } catch (error) {
      console.error('Invite failed:', error);
      this.inviteStatus = 'Could not send invite.';
    }
  }
  shareMatch() {
    const shareText = `Join my Dino Runner race! Code: ${this.matchId}`;
    if (navigator.share) {
      navigator.share({ title: 'Dino Runner', text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      this.sound.play(500);
    }
  }

  shareViaEmail() {
    const subject = encodeURIComponent('Join my Dino Runner race!');
    const body = encodeURIComponent(`Come race me! Use this code to join: ${this.matchId}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }
}