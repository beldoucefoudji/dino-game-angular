import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NakamaService } from '../../services/nakama';

interface LobbyPlayer {
  userId: string;
  username: string;
}

@Component({
  selector: 'app-lobby',
  imports: [],
  templateUrl: './lobby.html',
  styleUrl: './lobby.css'
})
export class Lobby implements OnInit, OnDestroy {
  matchId = '';
  players: LobbyPlayer[] = [];

  showLoadout = false;
  selectedColor = '#1D9E75'; // default teal, matches our original sprite tint
  dinoColors = ['#1D9E75', '#F0997B', '#5588cc', '#b5502e', '#8a6bbf', '#e0b13a'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nakama: NakamaService
  ) {}

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
          this.players.push({
            userId: joined.user_id,
            username: joined.username ?? 'Player'
          });
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
      this.players = (match.presences ?? []).map(p => ({
        userId: p.user_id,
        username: p.username ?? 'Player'
      }));
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
  }

  onStartMatch() {
    const seed = Math.floor(Math.random() * 1_000_000);
    this.nakama.raceSeed = seed;
    this.nakama.sendMatchStart(this.matchId, seed);
    this.router.navigate(['/match', this.matchId]);
  }

  openLoadout() {
    this.showLoadout = true;
  }

  closeLoadout() {
    this.showLoadout = false;
    // persist selectedColor once solo-game/match-game can read it
  }

  selectColor(color: string) {
    this.selectedColor = color;
  }
}