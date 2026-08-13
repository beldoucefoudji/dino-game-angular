import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NakamaService } from '../../services/nakama';
import { getDeviceId } from '../../services/device-id';

@Component({
  selector: 'app-leaderboard',
  imports: [],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css'
})
export class Leaderboard implements OnInit {
  entries: any[] = [];
  loading = true;

  constructor(private router: Router, private nakama: NakamaService) {}

  async ngOnInit() {
    if (!this.nakama.isAuthenticated()) {
      await this.nakama.authenticate(getDeviceId()); // silent, no form — guests can view
    }
    const records = await this.nakama.getLeaderboard('dino_solo', 10);
    this.entries = records.map((r: any) => ({
      username: r.username,
      score: r.score,
      rank: r.rank
    }));
    this.loading = false;
  }

  goBack() {
    this.router.navigate(['/']);
  }
}