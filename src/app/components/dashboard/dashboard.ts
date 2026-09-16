import { SoundService } from '../../services/sound';
import { ChangeDetectorRef, inject, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NakamaService } from '../../services/nakama';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  isConnecting = false;
  isSavingProfile = false;
  profileError = "";
  connectError = '';
  joinCode = '';
  unreadCount = 0;
  username = 'Player';
  activeSection: 'dashboard' | 'profile' | 'settings' = 'dashboard';
  isMobileMenuOpen = false;

  profileEmail = 'player@example.com';
  profileBio = 'Loves hitting new top speeds and collecting dino badges.';
  membership = 'Rookie Runner';
  profileImagePreview = '/dino.avif';
  isProfileEditing = false;
  profileSavedMessage = '';
  editableProfile = {
    username: this.username,
    email: this.profileEmail,
    bio: this.profileBio,
    membership: this.membership
  };

  notificationsEnabled = true;
  preferredTheme: 'light' | 'dark' = 'light';
  settingsSavedMessage = '';

  constructor(
    private router: Router,
    private nakama: NakamaService,
    public sound: SoundService,
    private themeService: ThemeService
  ) {}

 async ngOnInit() {
    if (!this.nakama.isAuthenticated()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.loadSettings();
    try {
      await this.nakama.loadProfile();
      this.syncProfileFromService();
    } catch { this.profileError = 'Could not load your profile. Please try again.'; }
    try {
    await this.nakama.ensureSocketConnected();
    const pending = await this.nakama.fetchPendingNotifications();
    this.unreadCount = pending.length;

    this.nakama.onIncomingNotification((notification) => {
      if (this.notificationsEnabled) this.unreadCount += 1;
      console.log('New invite received:', notification.content);
      // notification.content.match_id is available here for a "Join" action later
    });
    } catch { this.connectError = 'Notifications are temporarily unavailable.'; }
    this.cdr.markForCheck();
  }
  private syncProfileFromService() {
    const profile = this.nakama.getProfile();
    this.username = profile.username;
    this.profileEmail = profile.email;
    this.profileBio = profile.bio;
    this.membership = profile.membership;
    this.profileImagePreview = profile.avatar;
    this.editableProfile = {
      username: this.username,
      email: this.profileEmail,
      bio: this.profileBio,
      membership: this.membership
    };
  }

  private loadSettings() {
    const storedTheme = localStorage.getItem('dino-theme');
    this.preferredTheme = storedTheme === 'dark' ? 'dark' : 'light';
    this.themeService.setTheme(this.preferredTheme);

    const storedNotifications = localStorage.getItem('dino-notifications');
    this.notificationsEnabled = storedNotifications !== 'false';
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  onLeaderboard() { this.router.navigate(['/leaderboard']); }

  onSoloRun() {
    this.router.navigate(['/solo-game']);
  }

  async onCreateMatch() {
    this.isConnecting = true;
    this.connectError = '';
    try {
      await this.nakama.ensureSocketConnected();
      const matchId = await this.nakama.createMatch();
      this.router.navigate(['/lobby', matchId]);
    } catch (error) {
      console.error('Failed to create match:', error);
      this.connectError = 'Could not connect.';
    } finally {
      this.isConnecting = false;
      this.cdr.markForCheck();
    }
  }

  async onJoinMatch() {
    if (!this.joinCode.trim()) return;
    this.isConnecting = true;
    this.connectError = '';
    try {
      await this.nakama.ensureSocketConnected();
      const matchId = await this.nakama.joinMatch(this.joinCode.trim());
      this.router.navigate(['/lobby', matchId]);
    } catch (error) {
      console.error('Failed to join match:', error);
      this.connectError = 'Could not join. Check the code.';
    } finally {
      this.isConnecting = false;
      this.cdr.markForCheck();
    }
  }

  onNotificationsClick() {
    this.activeSection = 'settings';
    this.unreadCount = 0;
  }

  onLogout() {
    this.nakama.logout();
    this.router.navigate(['/auth']);
  }

  showSection(section: 'dashboard' | 'profile' | 'settings') {
    this.activeSection = section;
    this.settingsSavedMessage = '';
    this.closeMobileMenu();
    if (section === 'profile') {
      this.syncProfileFromService();
    }
  }

  toggleProfileEdit() {
    if (this.isProfileEditing) {
      this.cancelProfileEdit();
      return;
    }

    this.syncProfileFromService();
    this.isProfileEditing = true;
    this.profileSavedMessage = '';
  }

  cancelProfileEdit() {
    this.isProfileEditing = false;
    this.syncProfileFromService();
    this.profileSavedMessage = '';
  }

  async saveProfile() {
    if (this.isSavingProfile) return;
    this.isSavingProfile = true;
    this.profileError = "";
    try {
    const nextUsername = this.editableProfile.username.trim() || 'Player';
    const nextBio = this.editableProfile.bio.trim() || 'No bio yet.';
    const nextMembership = this.editableProfile.membership.trim() || 'Rookie Runner';

    await this.nakama.saveProfile({
      username: nextUsername,
      email: this.profileEmail,
      avatar: this.profileImagePreview,
      bio: nextBio,
      membership: nextMembership
    });

    this.username = nextUsername;
    this.profileBio = nextBio;
    this.membership = nextMembership;

    this.isProfileEditing = false;
    this.profileSavedMessage = 'Profile updated successfully.';
    } catch { this.profileError = 'Could not save your profile. Please retry.'; }
    finally { this.isSavingProfile = false; this.cdr.markForCheck(); }
  }

  onProfileImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/') || file.size > 256 * 1024) {
      this.profileError = 'Choose an image smaller than 256 KB.';
      return;
    }
    this.profileError = '';
    const reader = new FileReader();
    reader.onload = () => {
      const avatar = reader.result as string;
      this.profileImagePreview = avatar;
      // Persist the preview only when Save profile is pressed.
      this.profileSavedMessage = '';
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  onThemeChange(theme: 'light' | 'dark') {
    this.preferredTheme = theme;
    this.themeService.setTheme(this.preferredTheme);
    localStorage.setItem('dino-theme', this.preferredTheme);
  }

  saveSettings() {
    localStorage.setItem('dino-notifications', String(this.notificationsEnabled));
    localStorage.setItem('dino-theme', this.preferredTheme);
    this.themeService.setTheme(this.preferredTheme);

    this.settingsSavedMessage = 'Settings saved successfully.';
    console.log('Settings updated:', {
      notificationsEnabled: this.notificationsEnabled,
      preferredTheme: this.preferredTheme
    });
  }
}