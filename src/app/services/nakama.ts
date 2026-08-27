import { Injectable } from '@angular/core';
import { Client, Session, Socket } from '@heroiclabs/nakama-js';

export interface UserProfile {
  username: string;
  email: string;
  bio: string;
  membership: string;
  avatar: string;
}

@Injectable({
  providedIn: 'root'
})
export class NakamaService {
  private client: Client;
  private session: Session | null = null;
  private socket: Socket | null = null;
  private profile: UserProfile = {
    username: 'Player',
    email: 'player@example.com',
    bio: 'Loves hitting new top speeds and collecting dino badges.',
    membership: 'Rookie Runner',
    avatar: '/dino.avif'
  };
  private selectedColor = '#1D9E75';
  private lastEmail = '';
  private lastPassword = '';

  constructor() {
    this.client = new Client('defaultkey', 'nakama.nkulex.com', '443', true, 30000);
  }

  async authenticate(deviceId: string): Promise<Session> {
    this.session = await this.client.authenticateDevice(deviceId, true);
    return this.session;
  }

  async authenticateEmail(
    email: string,
    password: string,
    create: boolean,
    username?: string
  ): Promise<Session> {
    console.log('Nakama authentication started:', { email, create, username });

    try {
      const session = await this.client.authenticateEmail(email, password, create, username);

      console.log('Nakama authentication successful:', {
        userId: session.user_id,
        username: session.username
      });

      this.session = session;
      this.lastEmail = email;
      this.lastPassword = password;

      return session;

    } catch (error) {
      console.error('Nakama authenticateEmail failed:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return this.session !== null;
  }

  logout(): void {
    this.session = null;
    this.socket = null;
    this.lastEmail = '';
    this.lastPassword = '';
    this.profile = {
      username: 'Player',
      email: 'player@example.com',
      bio: 'Loves hitting new top speeds and collecting dino badges.',
      membership: 'Rookie Runner',
      avatar: '/dino.avif'
    };
    this.selectedColor = '#1D9E75';
  }

  updateProfile(profile: Partial<UserProfile>): void {
    this.profile = { ...this.profile, ...profile };
  }

  async updateUsername(username: string): Promise<void> {
    if (!this.session) return;
    await this.client.updateAccount(this.session, { username });
  }

  // For accounts whose username was set BEFORE this feature existed:
  // updateUsername() alone doesn't work because the current session
  // token still has the OLD username baked into it. Re-authenticating
  // gets a fresh token that reflects the change, then reconnects the socket.
  async updateUsernameAndRefresh(username: string): Promise<void> {
    if (!this.session) return;
    await this.client.updateAccount(this.session, { username });
    if (this.lastEmail && this.lastPassword) {
      this.session = await this.client.authenticateEmail(this.lastEmail, this.lastPassword, false);
    }
    this.socket = null;
    await this.connectSocket();
  }

  getProfile(): UserProfile {
    return { ...this.profile };
  }

  setSelectedColor(color: string): void {
    this.selectedColor = color;
  }

  getSelectedColor(): string {
    return this.selectedColor;
  }

  async connectSocket(): Promise<void> {
    if (!this.session) {
      throw new Error('Must authenticate before connecting the socket.');
    }
    const newSocket = this.client.createSocket(true);
    try {
      await newSocket.connect(this.session, true);
      this.socket = newSocket;
    } catch (error) {
      this.socket = null;
      throw error;
    }
  }

  async ensureSocketConnected(forceReconnect = false): Promise<void> {
    if (this.socket && forceReconnect) {
      this.socket = null;
    }
    if (!this.socket) {
      await this.connectSocket();
    }
  }

  async createMatch(): Promise<string> {
    if (!this.socket) throw new Error('Socket not connected.');
    const match = await this.socket.createMatch();
    return match.match_id;
  }

  async joinMatch(matchId: string): Promise<string> {
    if (!this.socket) throw new Error('Socket not connected.');
    const match = await this.socket.joinMatch(matchId);
    return match.match_id;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  raceSeed = 0;

  getUserId(): string | null {
    return this.session?.user_id ?? null;
  }

  sendMatchStart(matchId: string, seed: number) {
    const socket = this.socket;
    if (!socket) return;
    socket.sendMatchState(matchId, 1, JSON.stringify({ seed }));
  }

  sendPosition(matchId: string, state: object) {
    const socket = this.socket;
    if (!socket) return;
    socket.sendMatchState(matchId, 2, JSON.stringify(state));
  }

  sendElimination(matchId: string) {
    const socket = this.socket;
    if (!socket) return;
    socket.sendMatchState(matchId, 3, JSON.stringify({}));
  }

  sendHit(matchId: string, lives: number) {
    if (!this.socket) return;
    this.socket.sendMatchState(matchId, 4, JSON.stringify({ lives }));
  }

  async sendMatchInvite(targetUserId: string, matchId: string): Promise<void> {
    if (!this.session) throw new Error('Not authenticated.');
    await this.client.rpc(this.session, 'send_match_invite', { target_user_id: targetUserId, match_id: matchId });
  }

  onIncomingNotification(callback: (notification: any) => void) {
    if (!this.socket) return;
    this.socket.onnotification = callback;
  }

  async fetchPendingNotifications(): Promise<any[]> {
    if (!this.session) return [];
    const result = await this.client.listNotifications(this.session, 10);
    return result.notifications ?? [];
  }

  async submitScore(leaderboardId: string, score: number): Promise<void> {
    if (!this.session) return;
    await this.client.writeLeaderboardRecord(this.session, leaderboardId, { score: String(Math.floor(score)) });
  }

  async getLeaderboard(leaderboardId: string, limit = 5): Promise<any[]> {
    if (!this.session) return [];
    const result = await this.client.listLeaderboardRecords(this.session, leaderboardId, undefined, limit);
    return result.records ?? [];
  }

  async awardCoins(score: number, livesLeft: number, playerCount: number, won: boolean): Promise<number> {
    if (!this.session) return 0;
    const result = await this.client.rpc(this.session, 'award_match_coins', {
      score, lives_left: livesLeft, player_count: playerCount, won
    });
    const parsed = JSON.parse(result.payload as any);
    return parsed.coins_awarded;
  }

  getUsername(): string | null {
    return this.session?.username ?? null;
  }

  lastResult: {
    mode: 'solo' | 'multiplayer';
    score: number;
    highScore: number;
    standings?: { username: string; score: number; isLocal: boolean }[];
  } | null = null;
}