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

  constructor() {
    this.client = new Client('defaultkey', '127.0.0.1', '7350', false);
  }

  async authenticate(deviceId: string): Promise<Session> {
    this.session = await this.client.authenticateDevice(deviceId, true);
    return this.session;
  }

  async authenticateEmail(email: string, password: string, create: boolean): Promise<Session> {
    this.session = await this.client.authenticateEmail(email, password, create);
    return this.session;
  }

  isAuthenticated(): boolean {
    return this.session !== null;
  }

  logout(): void {
    this.session = null;
    this.socket = null;
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
    const newSocket = this.client.createSocket(false);
    try {
      await newSocket.connect(this.session, true);
      this.socket = newSocket;
    } catch (error) {
      this.socket = null; // don't leave a half-connected socket lying around
      throw error;
    }
  }
  async ensureSocketConnected(): Promise<void> {
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
}