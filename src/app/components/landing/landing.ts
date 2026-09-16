import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NakamaService } from '../../services/nakama';
import { LanguageService } from '../../services/language';
import { SoundService } from '../../services/sound';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing implements OnInit {
  username: string | null = null;
  showHowToPlay = false;
  @ViewChild('guideDialog') guideDialog!: ElementRef<HTMLDialogElement>;

  constructor(
    private router: Router,
    private nakama: NakamaService,
    public language: LanguageService,
    public sound: SoundService
  ) {}

  ngOnInit() {
    this.username = this.nakama.isAuthenticated() ? this.nakama.getUsername() : null;
  }

  // Delegates string lookup to LanguageService cleanly (no emojis)
  t(key: string): string {
    return this.language.t(key);
  }

  onStartGame() {
    this.sound.play(500);
    this.router.navigate(['/mode-select']);
  }

  onLeaderboard() {
    this.sound.play(500);
    this.router.navigate(['/leaderboard']);
  }

  toggleHowToPlay() {
    this.sound.play(400);
    const dialog = this.guideDialog.nativeElement;
    if (dialog.open) {
      dialog.close();
      this.showHowToPlay = false;
    } else {
      dialog.showModal();
      this.showHowToPlay = true;
    }
  }
}