import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { NakamaService } from '../services/nakama';
import { SoundService } from '../services/sound';
export function testProviders() {
  let profile = { username: 'Runner', email: 'runner@example.com', bio: '', membership: 'Rookie Runner', avatar: '/dino.avif' };
  let selectedColor = '#4ade80';
  return [provideRouter([]),
    { provide: SoundService, useValue: { muted: true, play: vi.fn(), startMusic: vi.fn(), stopMusic: vi.fn(), toggleMute: vi.fn() } },
    { provide: NakamaService, useValue: {
      isAuthenticated: () => true, getUsername: () => profile.username, getUserId: () => 'local',
      getSelectedColor: () => selectedColor, setSelectedColor: (color: string) => { selectedColor = color; },
      sendDinoColor: vi.fn(async () => {}), requestDinoColors: vi.fn(async () => {}),
      getSocket: () => null, ensureSocketConnected: async () => {},
      getProfile: () => ({ ...profile }), loadProfile: async () => {},
      saveProfile: vi.fn(async (next: Partial<typeof profile>) => { profile = { ...profile, ...next }; }),
      fetchPendingNotifications: async () => [], onIncomingNotification: vi.fn(),
      getLeaderboard: async () => [], lastResult: { mode: 'solo', score: 5, highScore: 10 }
    } }
  ];
}
