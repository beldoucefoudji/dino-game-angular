import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NakamaService } from '../../services/nakama';
import { SoundService } from '../../services/sound';

@Component({
  selector: 'app-results',
  imports: [],
  templateUrl: './results.html',
  styleUrl: './results.css'
})
export class Results implements OnInit {
  mode: 'solo' | 'multiplayer' = 'solo';
  score = 0;
  highScore = 0;
  standings: { rank: number; username: string; score: number; isLocal: boolean }[] = [];
  myRank = 1;

  constructor(private router: Router, private nakama: NakamaService, private sound: SoundService) {}

  ngOnInit() {
    const result = this.nakama.lastResult;
    if (!result) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.mode = result.mode;
    this.score = Math.floor(result.score);
    this.highScore = Math.floor(result.highScore);

    if (result.standings) {
      const sorted = [...result.standings].sort((a, b) => b.score - a.score);
      this.standings = sorted.map((s, i) => ({ rank: i + 1, username: s.username, score: Math.floor(s.score), isLocal: s.isLocal }));
      this.myRank = this.standings.find(s => s.isLocal)?.rank ?? 1;
    }

    this.sound.play(this.mode === 'multiplayer' && this.myRank === 1 ? 700 : 350, 0.2);
  }

  playAgain() {
    this.router.navigate([this.mode === 'solo' ? '/solo-game' : '/mode-select']);
  }

  backToLobby() {
    this.router.navigate(['/mode-select']);
  }
}