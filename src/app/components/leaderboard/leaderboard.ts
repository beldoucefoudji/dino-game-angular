import { SoundService } from '../../services/sound';
import { ChangeDetectorRef, inject, Component, OnInit } from '@angular/core';
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
  private readonly cdr = inject(ChangeDetectorRef);
  entries: any[] = [];
  loading = true;
  loadError = '';
  activeTab: 'global' | 'weekly' | 'friends' = 'global';
  myUserId: string | null = null;

  constructor(public sound: SoundService, private router: Router, private nakama: NakamaService) {}

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
      this.cdr.markForCheck();
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
      this.cdr.markForCheck();
    }
  }

  switchTab(tab: 'global' | 'weekly' | 'friends') {
    this.activeTab = tab;
  }
    goBack() {
    this.router.navigate(['/']);
  }
}