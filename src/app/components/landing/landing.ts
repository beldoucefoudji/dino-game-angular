import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { getDeviceId } from '../../services/device-id';
import { NakamaService } from '../../services/nakama';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class Landing implements OnInit {
  personalBest = 18422;
  username = '';
  isLoggingIn = false;
  isDarkMode = false;
  isGalleryOpen = false;
  selectedGalleryImage = '/g2.JPG';

  galleryImages = [
    { src: '/g1.JPG', alt: 'Dino Runner character in a prehistoric landscape' },
    { src: '/g2.JPG', alt: 'Dino Runner environment preview' },
    { src: '/hero-placeholder.JPG', alt: 'Dino Runner race atmosphere' }
  ];

  topPlayers = [
    { rank: 1, name: 'beldouce', score: 61250 },
    { rank: 2, name: 'elmine', score: 54270 },
    { rank: 3, name: 'bella', score: 38480 }
  ];

  constructor(
    private router: Router,
    private nakama: NakamaService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.themeService.initializeTheme();
    this.isDarkMode = this.themeService.isDarkMode;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.isDarkMode = this.themeService.isDarkMode;
  }

  onStartGame() {
    this.router.navigate(['/solo-game']);
  }

  onJoinMatch() {
    this.router.navigate(['/auth']);
  }

  openGallery() {
    this.selectedGalleryImage = this.galleryImages[0].src;
    this.isGalleryOpen = true;
  }

  closeGallery() {
    this.isGalleryOpen = false;
  }

  selectGalleryImage(image: { src: string; alt: string }) {
    this.selectedGalleryImage = image.src;
  }

  async onLogin() {
    this.isLoggingIn = true;
    try {
      const deviceId = getDeviceId();
      const session = await this.nakama.authenticate(deviceId);
      this.nakama.updateProfile({
        username: session.username ?? 'Player',
        email: ''
      });
      this.username = this.nakama.getProfile().username;
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      this.isLoggingIn = false;
    }
  }
}