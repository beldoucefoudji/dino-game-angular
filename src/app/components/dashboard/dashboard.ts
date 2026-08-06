import { Component, OnInit } from '@angular/core';
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
  isConnecting = false;
  connectError = '';
  joinCode = '';
  unreadCount = 0;
  username = 'Player';
  activeSection: 'dashboard' | 'profile' | 'settings' = 'dashboard';

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
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    if (!this.nakama.isAuthenticated()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.loadSettings();
    this.syncProfileFromService();
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
    this.profileSavedMessage = '';
  }

  saveProfile() {
    const nextUsername = this.editableProfile.username.trim() || 'Player';
    const nextEmail = this.editableProfile.email.trim() || 'player@example.com';
    const nextBio = this.editableProfile.bio.trim() || 'No bio yet.';
    const nextMembership = this.editableProfile.membership.trim() || 'Rookie Runner';

    this.nakama.updateProfile({
      username: nextUsername,
      email: nextEmail,
      bio: nextBio,
      membership: nextMembership
    });

    this.username = nextUsername;
    this.profileEmail = nextEmail;
    this.profileBio = nextBio;
    this.membership = nextMembership;

    this.isProfileEditing = false;
    this.profileSavedMessage = 'Profile updated successfully.';
  }

  onProfileImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const avatar = reader.result as string;
      this.profileImagePreview = avatar;
      this.nakama.updateProfile({ avatar });
      this.profileSavedMessage = '';
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