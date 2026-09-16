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
  private selectedColor = '#4ade80';

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


      return session;

    } catch (error) {
      console.error('Nakama authenticateEmail failed:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return this.session !== null && !this.session.isexpired(Date.now() / 1000);
  }

  logout(): void {
    this.socket?.disconnect(false);
    this.session = null;
    this.socket = null;

    this.profile = {
      username: 'Player',
      email: 'player@example.com',
      bio: 'Loves hitting new top speeds and collecting dino badges.',
      membership: 'Rookie Runner',
      avatar: '/dino.avif'
    };
    this.selectedColor = '#4ade80';
  }

  updateProfile(profile: Partial<UserProfile>): void {
    this.profile = { ...this.profile, ...profile };
  }

  async updateUsername(username: string): Promise<void> {
    if (!this.session) return;
    await this.client.updateAccount(this.session, { username });
  }

  async updateUsernameAndRefresh(username: string): Promise<void> {
    if (!this.session) throw new Error('Not authenticated.');
    await this.client.updateAccount(this.session, { username });
    this.session = await this.client.sessionRefresh(this.session);
    this.profile.username = username;
    await this.ensureSocketConnected(true);
  }

  async loadProfile(): Promise<void> {
    if (!this.session) throw new Error('Not authenticated.');
    const account = await this.client.getAccount(this.session);
    let metadata: Record<string, any> = {};
    try { metadata = JSON.parse(account.user?.metadata || '{}'); } catch { /* Empty profile. */ }
    const stored = await this.client.readStorageObjects(this.session, { object_ids: [{ collection: 'profiles', key: 'details', user_id: this.session.user_id }] });
    const details = stored.objects?.[0]?.value as Record<string, unknown> | undefined;
    metadata = { ...metadata, ...details };
    this.profile = {
      username: account.user?.username || 'Player',
      email: account.email || '',
      bio: typeof metadata['bio'] === 'string' ? metadata['bio'] : '',
      membership: typeof metadata['membership'] === 'string' ? metadata['membership'] : 'Rookie Runner',
      avatar: account.user?.avatar_url || '/dino.avif'
    };
  }

  async saveProfile(profile: Partial<UserProfile>): Promise<void> {
    if (!this.session) throw new Error('Not authenticated.');
    const next = { ...this.profile, ...profile };
    await this.client.writeStorageObjects(this.session, [{
      collection: 'profiles', key: 'details', value: { bio: next.bio, membership: next.membership },
      permission_read: 1, permission_write: 1
    }]);
    await this.client.updateAccount(this.session, { username: next.username, avatar_url: next.avatar });
    this.session = await this.client.sessionRefresh(this.session);
    this.profile = next;
    this.socket?.disconnect(false);
    this.socket = null;
  }

  getProfile(): UserProfile {
    return { ...this.profile };
  }

  setSelectedColor(color: string): void {
    if (/^#[0-9a-f]{6}$/i.test(color)) this.selectedColor = color.toLowerCase();
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
      this.socket.disconnect(false);
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

  async sendDinoColor(matchId: string): Promise<void> {
    if (this.socket) await this.socket.sendMatchState(matchId, 5, JSON.stringify({ color: this.selectedColor }));
  }

  async requestDinoColors(matchId: string): Promise<void> {
    if (this.socket) await this.socket.sendMatchState(matchId, 6, JSON.stringify({}));
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