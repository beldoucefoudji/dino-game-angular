import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NakamaService } from '../../services/nakama';
import { getDeviceId } from '../../services/device-id';

@Component({
  selector: 'app-mode-select',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mode-select.html',
  styleUrls: ['./mode-select.css']
})
export class ModeSelect {
  isConnecting = false;
  connectError = '';
  showJoinInput = false;
  joinCode = '';

  constructor(
    private router: Router,
    private location: Location,
    private nakama: NakamaService
  ) {}

  playSolo() {
    this.router.navigate(['/solo-game']);
  }

  private requireAuth(action: string): boolean {
    if (this.nakama.isAuthenticated()) {
      return true;
    }

    this.connectError = `Please sign up or log in to ${action}.`;
    this.router.navigate(['/auth']);
    return false;
  }

  async createMatch() {
    if (!this.requireAuth('create a match')) {
      return;
    }
    if (this.isConnecting) return;
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
    if (!this.requireAuth('join a match')) {
      return;
    }
    if (!this.joinCode.trim()) return;
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
    const deviceId = getDeviceId();
    await this.nakama.authenticate(deviceId);
    await this.nakama.connectSocket();
  }

  goBack() {
    this.location.back();
  }
}