import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NakamaService } from '../../services/nakama';
import { getDeviceId } from '../../services/device-id';

@Component({
  selector: 'app-leaderboard',
  imports: [RouterLink],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css'
})
export class Leaderboard implements OnInit {
  entries: any[] = [];
  loading = true;
  loadError = '';
  activeTab: 'global' | 'weekly' | 'friends' = 'global';
  myUserId: string | null = null;

  constructor(private router: Router, private nakama: NakamaService) {}

  async ngOnInit() {
    try {
      if (!this.nakama.isAuthenticated()) {
        await this.nakama.authenticate(getDeviceId());
      }
      this.myUserId = this.nakama.getUserId();
      await this.load();
    } catch (error) {
      console.error('Leaderboard init failed:', error);
      this.loadError = 'Could not connect. Is the Nakama server running?';
      this.loading = false;
    }
  }

  async load() {
    this.loading = true;
    this.loadError = '';
    try {
      const records = await this.nakama.getLeaderboard('dino_solo', 10);
      this.entries = records.map((r: any) => ({
        username: r.username, score: r.score, rank: r.rank, userId: r.owner_id
      }));
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      this.loadError = 'Could not load leaderboard. It may not exist on the server yet.';
    } finally {
      this.loading = false;
    }
  }

  switchTab(tab: 'global' | 'weekly' | 'friends') {
    this.activeTab = tab;
  }
    goBack() {
    this.router.navigate(['/']);
  }
}